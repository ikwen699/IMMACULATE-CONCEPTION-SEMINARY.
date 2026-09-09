import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const role = (session.user as any).role

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')

    let query = supabase.from('Attendance').select('*').order('date', { ascending: false })

    if (role === 'STUDENT') {
      const { data: student } = await supabase.from('Student').select('id').eq('userId', userId).single()
      if (student) query = query.eq('studentId', student.id)
      else return NextResponse.json([])
    } else if (role === 'PARENT') {
      const { data: parent } = await supabase.from('Parent').select('id').eq('userId', userId).single()
      if (!parent) return NextResponse.json([])
      const { data: children } = await supabase.from('Student').select('id').eq('parentId', parent.id)
      const childIds = (children || []).map((c: any) => c.id)
      if (childIds.length === 0) return NextResponse.json([])
      query = query.in('studentId', childIds)
    } else if (role === 'TEACHER' && !studentId) {
      const { data: teacher } = await supabase.from('Teacher').select('id').eq('userId', userId).single()
      if (teacher) {
        const [{ data: teacherSubjects }, { data: teacherClasses }] = await Promise.all([
          supabase.from('Subject').select('classId').eq('teacherId', teacher.id),
          supabase.from('Class').select('id').eq('classTeacherId', teacher.id),
        ])
        const classIds = new Set<string>()
        ;(teacherSubjects || []).forEach((s: any) => { if (s.classId) classIds.add(s.classId) })
        ;(teacherClasses || []).forEach((c: any) => classIds.add(c.id))
        if (classIds.size === 0) return NextResponse.json([])
        const { data: classStudents } = await supabase.from('Student').select('id').in('classId', [...classIds])
        const studentIds = (classStudents || []).map((s: any) => s.id)
        if (studentIds.length === 0) return NextResponse.json([])
        query = query.in('studentId', studentIds)
      }
    }

    if (classId) query = query.eq('classId', classId)
    if (studentId) query = query.eq('studentId', studentId)
    if (date) {
      const dateObj = new Date(date)
      const start = new Date(dateObj.setHours(0, 0, 0, 0)).toISOString()
      const end = new Date(dateObj.setHours(23, 59, 59, 999)).toISOString()
      query = query.gte('date', start).lte('date', end)
    }

    const { data: attendance, error } = await query
    if (error) throw error
    if (!attendance) return NextResponse.json([])

    const studentIds = [...new Set(attendance.map(a => a.studentId))]
    const { data: students } = studentIds.length > 0
      ? await supabase.from('Student').select('id, admissionNo, userId').in('id', studentIds)
      : { data: [] }
    const userIds = (students || []).map(s => s.userId).filter(Boolean)
    const { data: users } = userIds.length > 0
      ? await supabase.from('User').select('id, name').in('id', userIds)
      : { data: [] }

    const studentMap = new Map((students || []).map(s => [s.id, s]))
    const userMap = new Map((users || []).map(u => [u.id, u]))

    const enriched = attendance.map(a => {
      const student = studentMap.get(a.studentId)
      const user = student ? userMap.get(student.userId) || null : null
      return { ...a, student: student ? { ...student, user } : null }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (!['TEACHER', 'ADMIN', 'PRINCIPAL'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userId = (session.user as any).userId || (session.user as any).id

    const body = await request.json()
    const { records, classId, date } = body
    if (!Array.isArray(records)) return NextResponse.json({ error: 'Invalid records data' }, { status: 400 })

    if (role === 'TEACHER') {
      const { data: teacher } = await supabase.from('Teacher').select('id').eq('userId', userId).single()
      if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 403 })

      const [{ data: teacherSubjects }, { data: teacherClasses }] = await Promise.all([
        supabase.from('Subject').select('classId').eq('teacherId', teacher.id),
        supabase.from('Class').select('id').eq('classTeacherId', teacher.id),
      ])
      const allowedClassIds = new Set<string>()
      ;(teacherSubjects || []).forEach((s: any) => { if (s.classId) allowedClassIds.add(s.classId) })
      ;(teacherClasses || []).forEach((c: any) => allowedClassIds.add(c.id))

      if (classId && !allowedClassIds.has(classId)) {
        return NextResponse.json({ error: 'You are not assigned to this class' }, { status: 403 })
      }

      const { data: classStudents } = await supabase.from('Student').select('id').in('classId', classId ? [classId] : [...allowedClassIds])
      const allowedStudentIds = new Set((classStudents || []).map((s: any) => s.id))

      for (const record of records) {
        if (!allowedStudentIds.has(record.studentId)) {
          return NextResponse.json({ error: `Student is not in your assigned class: ${record.studentId}` }, { status: 403 })
        }
      }
    }

    for (const record of records) {
      const { data: existing } = await supabase
        .from('Attendance')
        .select('id')
        .eq('studentId', record.studentId)
        .eq('date', new Date(date).toISOString())
        .maybeSingle()

      if (existing) {
        await supabase.from('Attendance').update({ status: record.status, remarks: record.remarks }).eq('id', existing.id)
      } else {
        await supabase.from('Attendance').insert({
          studentId: record.studentId, classId, date: new Date(date).toISOString(), status: record.status, remarks: record.remarks,
        })
      }
    }

    return NextResponse.json({ message: 'Attendance recorded successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
