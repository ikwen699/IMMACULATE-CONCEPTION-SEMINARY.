import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const teacherId = searchParams.get('teacherId')

    let query = supabase.from('Assignment').select('*').order('dueDate', { ascending: false })
    if (classId) query = query.eq('classId', classId)
    if (subjectId) query = query.eq('subjectId', subjectId)
    if (teacherId) query = query.eq('teacherId', teacherId)

    const { data: assignments, error } = await query
    if (error) throw error
    if (!assignments) return NextResponse.json([])

    const subIds = [...new Set(assignments.map(a => a.subjectId))]
    const clsIds = [...new Set(assignments.map(a => a.classId))]
    const tchIds = [...new Set(assignments.map(a => a.teacherId))]

    const [subRes, clsRes, tchRes] = await Promise.all([
      subIds.length > 0 ? supabase.from('Subject').select('id, name, code').in('id', subIds) : { data: [] },
      clsIds.length > 0 ? supabase.from('Class').select('id, name, section').in('id', clsIds) : { data: [] },
      tchIds.length > 0 ? supabase.from('Teacher').select('id, userId').in('id', tchIds) : { data: [] },
    ])

    const tchUserIds = (tchRes.data || []).map(t => t.userId).filter(Boolean)
    const { data: tchUsers } = tchUserIds.length > 0 ? await supabase.from('User').select('id, name').in('id', tchUserIds) : { data: [] }
    const uMap = new Map((tchUsers || []).map(u => [u.id, u]))
    const tMap = new Map((tchRes.data || []).map(t => [t.id, { ...t, user: uMap.get(t.userId) || null }]))
    const sMap = new Map((subRes.data || []).map(s => [s.id, s]))
    const cMap = new Map((clsRes.data || []).map(c => [c.id, c]))

    const asgnIds = assignments.map(a => a.id)
    const { data: submissionRows } = asgnIds.length > 0
      ? await supabase.from('AssignmentSubmission').select('assignmentId').in('assignmentId', asgnIds)
      : { data: [] }

    const subCountMap = new Map<string, number>()
    ;(submissionRows || []).forEach((r: any) => {
      subCountMap.set(r.assignmentId, (subCountMap.get(r.assignmentId) || 0) + 1)
    })

    const enriched = assignments.map(a => ({
      ...a,
      subject: sMap.get(a.subjectId) || null,
      class: cMap.get(a.classId) || null,
      teacher: tMap.get(a.teacherId) || null,
      _count: { submissions: subCountMap.get(a.id) || 0 },
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, subjectId, classId, dueDate, totalMarks } = body

    const { data: teacher } = await supabase.from('Teacher').select('id').eq('userId', (session.user as any).userId || (session.user as any).id).single()
    if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 400 })

    const { data: assignment, error } = await supabase
      .from('Assignment')
      .insert({ title, description, subjectId, classId, teacherId: teacher.id, dueDate: new Date(dueDate).toISOString(), totalMarks: totalMarks || 100 })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = (session.user as any).role
    if (!['ADMIN', 'TEACHER', 'PRINCIPAL'].includes(role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase.from('Assignment').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
