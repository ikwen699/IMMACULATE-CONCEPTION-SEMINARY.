import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { calculateGrade } from '@/lib/utils'
import { notifyGradePosted } from '@/lib/notifications'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const subjectId = searchParams.get('subjectId')
    const termId = searchParams.get('termId')
    const classId = searchParams.get('classId')

    let query = supabase.from('Grade').select('*').order('createdAt', { ascending: false })
    if (studentId) query = query.eq('studentId', studentId)
    if (subjectId) query = query.eq('subjectId', subjectId)
    if (termId) query = query.eq('termId', termId)

    const { data: grades, error } = await query
    if (error) throw error
    if (!grades) return NextResponse.json([])

    const sIds = [...new Set(grades.map(g => g.studentId))]
    const subIds = [...new Set(grades.map(g => g.subjectId))]
    const tIds = [...new Set(grades.map(g => g.termId))]

    const [studentsRes, subjectsRes, termsRes] = await Promise.all([
      sIds.length > 0 ? supabase.from('Student').select('id, admissionNo, userId, classId').in('id', sIds) : { data: [] },
      subIds.length > 0 ? supabase.from('Subject').select('id, name, code').in('id', subIds) : { data: [] },
      tIds.length > 0 ? supabase.from('Term').select('id, name, sessionId').in('id', tIds) : { data: [] },
    ])

    let filteredStudents = studentsRes.data || []
    if (classId) {
      filteredStudents = filteredStudents.filter(s => s.classId === classId)
    }

    const filteredStudentIds = new Set(filteredStudents.map(s => s.id))
    const filteredGrades = classId ? grades.filter(g => filteredStudentIds.has(g.studentId)) : grades

    const sUserIds = filteredStudents.map(s => s.userId).filter(Boolean)
    const { data: sUsers } = sUserIds.length > 0 ? await supabase.from('User').select('id, name').in('id', sUserIds) : { data: [] }
    const classIds = [...new Set(filteredStudents.map(s => s.classId).filter(Boolean))]
    const { data: classes } = classIds.length > 0 ? await supabase.from('Class').select('id, name, section').in('id', classIds) : { data: [] }
    const sessionIds = [...new Set((termsRes.data || []).map(t => t.sessionId).filter(Boolean))]
    const { data: sessions } = sessionIds.length > 0 ? await supabase.from('AcademicSession').select('id, name').in('id', sessionIds) : { data: [] }

    const sMap = new Map(filteredStudents.map(s => [s.id, s]))
    const uMap = new Map((sUsers || []).map(u => [u.id, u]))
    const cMap = new Map((classes || []).map(c => [c.id, c]))
    const subMap = new Map((subjectsRes.data || []).map(s => [s.id, s]))
    const tMap = new Map((termsRes.data || []).map(t => [t.id, t]))
    const sessMap = new Map((sessions || []).map(s => [s.id, s]))

    const enriched = filteredGrades.map(g => {
      const student = sMap.get(g.studentId)
      const user = student ? uMap.get(student.userId) || null : null
      const cls = student ? cMap.get(student.classId) || null : null
      const term = tMap.get(g.termId)
      const sess = term ? sessMap.get(term.sessionId) || null : null
      return {
        ...g,
        student: student ? { ...student, user, class: cls } : null,
        subject: subMap.get(g.subjectId) || null,
        term: term ? { ...term, session: sess } : null,
      }
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

    const body = await request.json()
    const { grades } = body
    if (!Array.isArray(grades)) return NextResponse.json({ error: 'Invalid grades data' }, { status: 400 })

    for (const grade of grades) {
      const ca1 = Math.min(10, Math.max(0, parseFloat(grade.ca1) || 0))
      const ca2 = Math.min(10, Math.max(0, parseFloat(grade.ca2) || 0))
      const ca3 = Math.min(10, Math.max(0, parseFloat(grade.ca3) || 0))
      const exam = Math.min(70, Math.max(0, parseFloat(grade.exam) || 0))
      const total = ca1 + ca2 + ca3 + exam
      const letterGrade = calculateGrade(total)

      const { data: existing } = await supabase
        .from('Grade')
        .select('id')
        .eq('studentId', grade.studentId)
        .eq('subjectId', grade.subjectId)
        .eq('termId', grade.termId)
        .single()

      const gradeData = { ca1, ca2, ca3, exam, total, grade: letterGrade, comments: grade.comments }

      if (existing) {
        await supabase.from('Grade').update(gradeData).eq('id', existing.id)
      } else {
        await supabase.from('Grade').insert({
          studentId: grade.studentId, subjectId: grade.subjectId, termId: grade.termId,
          ...gradeData,
        })
      }

      const { data: subject } = await supabase.from('Subject').select('name').eq('id', grade.subjectId).single()
      notifyGradePosted(grade.studentId, subject?.name || 'Unknown', letterGrade, total).catch(() => {})
    }

    return NextResponse.json({ message: 'Grades saved successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
