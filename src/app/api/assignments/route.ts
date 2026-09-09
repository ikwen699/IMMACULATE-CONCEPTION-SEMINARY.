import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { notifyNewAssignment } from '@/lib/notifications'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const role = (session.user as any).role
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const teacherId = searchParams.get('teacherId')

    let effectiveClassId = classId
    let effectiveTeacherId = teacherId

    if (role === 'STUDENT') {
      const { data: student } = await supabase.from('Student').select('classId').eq('userId', userId).single()
      if (classId && classId !== student?.classId) {
        return NextResponse.json({ error: 'You can only view assignments for your own class' }, { status: 403 })
      }
      effectiveClassId = student?.classId || null
      effectiveTeacherId = null
    } else if (role === 'PARENT') {
      const { data: parentChildren } = await supabase.from('Parent').select('id').eq('userId', userId).single()
      if (parentChildren) {
        const { data: children } = await supabase.from('Student').select('classId').eq('parentId', parentChildren.id)
        const childClassIds = [...new Set((children || []).map((c: any) => c.classId).filter(Boolean))]
        if (classId && !childClassIds.includes(classId)) {
          return NextResponse.json({ error: 'You can only view assignments for your children\u2019s classes' }, { status: 403 })
        }
      }
    } else if (role === 'TEACHER') {
      const { data: teacher } = await supabase.from('Teacher').select('id').eq('userId', userId).single()
      if (teacherId && teacher?.id !== teacherId) {
        return NextResponse.json({ error: 'You can only view your own assignments' }, { status: 403 })
      }
      effectiveTeacherId = teacher?.id || null
    }

    let query = supabase.from('Assignment').select('*').order('dueDate', { ascending: false })
    if (effectiveClassId) query = query.eq('classId', effectiveClassId)
    if (subjectId) query = query.eq('subjectId', subjectId)
    if (effectiveTeacherId) query = query.eq('teacherId', effectiveTeacherId)

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
    const role = (session.user as any).role
    if (role !== 'TEACHER') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await request.json()
    const { title, description, subjectId, classId, dueDate, totalMarks } = body

    if (!title || typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return NextResponse.json({ error: 'Assignment title is required' }, { status: 400 })
    }
    if (!subjectId || !classId) {
      return NextResponse.json({ error: 'Subject and class are required' }, { status: 400 })
    }
    if (!dueDate || isNaN(new Date(dueDate).getTime())) {
      return NextResponse.json({ error: 'A valid due date is required' }, { status: 400 })
    }
    if (totalMarks !== undefined && (typeof totalMarks !== 'number' || !Number.isFinite(totalMarks) || totalMarks <= 0 || totalMarks > 1000)) {
      return NextResponse.json({ error: 'Invalid total marks' }, { status: 400 })
    }

    const { data: teacher } = await supabase.from('Teacher').select('id').eq('userId', (session.user as any).userId || (session.user as any).id).single()
    if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 400 })

    const { data: sub } = await supabase.from('Subject').select('id').eq('id', subjectId).eq('teacherId', teacher.id).single()
    if (!sub) return NextResponse.json({ error: 'You can only create assignments for subjects you teach' }, { status: 400 })
    const { data: cls } = await supabase.from('Class').select('id').eq('id', classId).single()
    if (!cls) return NextResponse.json({ error: 'Invalid class' }, { status: 400 })

    const { data: assignment, error } = await supabase
      .from('Assignment')
      .insert({ title: title.trim(), description, subjectId, classId, teacherId: teacher.id, dueDate: new Date(dueDate).toISOString(), totalMarks: totalMarks || 100 })
      .select('*')
      .single()

    if (error) throw error

    notifyNewAssignment(title, classId).catch((err) => {
      console.error('Failed to send assignment notifications:', err)
    })

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

    if (role === 'TEACHER') {
      const { data: teacher } = await supabase.from('Teacher').select('id').eq('userId', (session.user as any).userId || (session.user as any).id).single()
      if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 400 })

      const { data: assignment } = await supabase.from('Assignment').select('teacherId').eq('id', id).single()
      if (!assignment || assignment.teacherId !== teacher.id) {
        return NextResponse.json({ error: 'You can only delete your own assignments' }, { status: 403 })
      }
    }

    const { data: existing } = await supabase.from('Assignment').select('id').eq('id', id).single()
    if (!existing) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    const { count: submissionCount } = await supabase.from('AssignmentSubmission').select('*', { count: 'exact', head: true }).eq('assignmentId', id)
    if ((submissionCount ?? 0) > 0) {
      return NextResponse.json({ error: 'Cannot delete assignment: students have already submitted.' }, { status: 400 })
    }

    const { error } = await supabase.from('Assignment').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
