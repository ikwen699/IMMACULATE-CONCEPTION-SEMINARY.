import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const role = (session.user as any).role

    let children: any[] = []

    if (role === 'PARENT') {
      const { data: parent } = await supabase.from('Parent').select('id').eq('userId', userId).single()
      if (!parent) return NextResponse.json([])

      const { data: students } = await supabase.from('Student').select('*').eq('parentId', parent.id)
      if (!students || students.length === 0) return NextResponse.json([])

      children = await enrichStudents(students)
    } else if (role === 'STUDENT') {
      const { data: student } = await supabase.from('Student').select('*').eq('userId', userId).single()
      if (!student) return NextResponse.json([])
      children = await enrichStudents([student])
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(children)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function enrichStudents(students: any[]) {
  const userIds = students.map(s => s.userId).filter(Boolean)
  const classIds = students.map(s => s.classId).filter(Boolean)
  const studentIds = students.map(s => s.id).filter(Boolean)

  const [usersRes, classesRes, gradesRes, attendanceRes] = await Promise.all([
    userIds.length > 0 ? supabase.from('User').select('id, name, email').in('id', userIds) : { data: [] },
    classIds.length > 0 ? supabase.from('Class').select('id, name, section').in('id', classIds) : { data: [] },
    studentIds.length > 0 ? supabase.from('Grade').select('*').in('studentId', studentIds) : { data: [] },
    studentIds.length > 0 ? supabase.from('Attendance').select('id, date, status').in('studentId', studentIds) : { data: [] },
  ])

  const uMap = new Map((usersRes.data || []).map(u => [u.id, u]))
  const cMap = new Map((classesRes.data || []).map(c => [c.id, c]))

  const allGrades = gradesRes.data || []
  const subIds = [...new Set(allGrades.map((g: any) => g.subjectId).filter(Boolean))]
  const termIds = [...new Set(allGrades.map((g: any) => g.termId).filter(Boolean))]

  const [subjectsRes, termsRes] = await Promise.all([
    subIds.length > 0 ? supabase.from('Subject').select('id, name').in('id', subIds) : { data: [] },
    termIds.length > 0 ? supabase.from('Term').select('id, name').in('id', termIds) : { data: [] },
  ])

  const subMap = new Map((subjectsRes.data || []).map(s => [s.id, s]))
  const tMap = new Map((termsRes.data || []).map(t => [t.id, t]))

  const gradesByStudent = new Map<string, any[]>()
  allGrades.forEach((g: any) => {
    if (!gradesByStudent.has(g.studentId)) gradesByStudent.set(g.studentId, [])
    gradesByStudent.get(g.studentId)!.push({
      ...g,
      subject: subMap.get(g.subjectId) || null,
      term: tMap.get(g.termId) || null,
    })
  })

  const attendanceByStudent = new Map<string, any[]>()
  ;(attendanceRes.data || []).forEach((a: any) => {
    if (!attendanceByStudent.has(a.studentId)) attendanceByStudent.set(a.studentId, [])
    attendanceByStudent.get(a.studentId)!.push(a)
  })

  return students.map(s => ({
    ...s,
    user: uMap.get(s.userId) || null,
    class: cMap.get(s.classId) || null,
    grades: gradesByStudent.get(s.id) || [],
    attendance: attendanceByStudent.get(s.id) || [],
  }))
}
