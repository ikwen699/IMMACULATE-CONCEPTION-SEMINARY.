import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { calculateGrade } from '@/lib/utils'
import { notifyGradePosted } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const subjectId = searchParams.get('subjectId')
    const termId = searchParams.get('termId')

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

    const sUserIds = (studentsRes.data || []).map(s => s.userId).filter(Boolean)
    const { data: sUsers } = sUserIds.length > 0 ? await supabase.from('User').select('id, name').in('id', sUserIds) : { data: [] }
    const classIds = [...new Set((studentsRes.data || []).map(s => s.classId).filter(Boolean))]
    const { data: classes } = classIds.length > 0 ? await supabase.from('Class').select('id, name, section').in('id', classIds) : { data: [] }
    const sessionIds = [...new Set((termsRes.data || []).map(t => t.sessionId).filter(Boolean))]
    const { data: sessions } = sessionIds.length > 0 ? await supabase.from('AcademicSession').select('id, name').in('id', sessionIds) : { data: [] }

    const sMap = new Map((studentsRes.data || []).map(s => [s.id, s]))
    const uMap = new Map((sUsers || []).map(u => [u.id, u]))
    const cMap = new Map((classes || []).map(c => [c.id, c]))
    const subMap = new Map((subjectsRes.data || []).map(s => [s.id, s]))
    const tMap = new Map((termsRes.data || []).map(t => [t.id, t]))
    const sessMap = new Map((sessions || []).map(s => [s.id, s]))

    const enriched = grades.map(g => {
      const student = sMap.get(g.studentId)
      const user = student ? uMap.get(student.userId) : null
      const cls = student ? cMap.get(student.classId) : null
      const term = tMap.get(g.termId)
      const sess = term ? sessMap.get(term.sessionId) : null
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

    for (const grade of grades) {
      const calculatedGrade = calculateGrade(grade.score)
      const { data: existing } = await supabase
        .from('Grade')
        .select('id')
        .eq('studentId', grade.studentId)
        .eq('subjectId', grade.subjectId)
        .eq('termId', grade.termId)
        .eq('type', grade.type)
        .single()

      if (existing) {
        await supabase.from('Grade').update({ score: grade.score, grade: calculatedGrade, comments: grade.comments }).eq('id', existing.id)
      } else {
        await supabase.from('Grade').insert({
          studentId: grade.studentId, subjectId: grade.subjectId, termId: grade.termId,
          score: grade.score, grade: calculatedGrade, type: grade.type, comments: grade.comments,
        })
      }

      const { data: subject } = await supabase.from('Subject').select('name').eq('id', grade.subjectId).single()
      notifyGradePosted(grade.studentId, subject?.name || 'Unknown', calculatedGrade, grade.score).catch(() => {})
    }

    return NextResponse.json({ message: 'Grades saved successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
