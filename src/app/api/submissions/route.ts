import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { notifySubmissionCreated } from '@/lib/notifications'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const role = (session.user as any).role

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (role === 'STUDENT') {
      const { data: student } = await supabase.from('Student').select('id').eq('userId', userId).single()
      if (!student) {
        if (assignmentId) return NextResponse.json({ submitted: false, submission: null })
        return NextResponse.json([])
      }

      if (assignmentId) {
        const { data: submission } = await supabase
          .from('AssignmentSubmission')
          .select('*')
          .eq('assignmentId', assignmentId)
          .eq('studentId', student.id)
          .single()

        return NextResponse.json({ submitted: !!submission, submission: submission || null })
      }

      const { data: submissions } = await supabase
        .from('AssignmentSubmission')
        .select('*')
        .eq('studentId', student.id)

      return NextResponse.json(submissions || [])
    }

    if (role === 'TEACHER' || role === 'ADMIN') {
      let query = supabase.from('AssignmentSubmission').select('*').order('submittedAt', { ascending: false })
      if (assignmentId) query = query.eq('assignmentId', assignmentId)

      const { data: submissions, error } = await query
      if (error) throw error
      return NextResponse.json(submissions || [])
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'STUDENT') return NextResponse.json({ error: 'Only students can submit' }, { status: 403 })

    const userId = (session.user as any).userId || (session.user as any).id

    const body = await request.json()
    const { assignmentId, content, submissionUrl, studentName, className, admissionNo } = body

    if (!assignmentId) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    if (!studentName || !className || !admissionNo) return NextResponse.json({ error: 'Name, class and admission number are required' }, { status: 400 })
    if (!content && !submissionUrl) return NextResponse.json({ error: 'Content or submission URL required' }, { status: 400 })

    const { data: assignment } = await supabase.from('Assignment').select('id, classId, dueDate').eq('id', assignmentId).single()
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    if (new Date(assignment.dueDate) < new Date()) {
      return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 400 })
    }

    const { data: student } = await supabase.from('Student').select('id, classId').eq('userId', userId).single()

    if (student) {
      if (assignment.classId !== student.classId) {
        return NextResponse.json({ error: 'This assignment is not for your class' }, { status: 403 })
      }

      const { data: existing } = await supabase
        .from('AssignmentSubmission')
        .select('id')
        .eq('assignmentId', assignmentId)
        .eq('studentId', student.id)
        .single()

      if (existing) return NextResponse.json({ error: 'You have already submitted this assignment' }, { status: 400 })

      const { data: submission, error } = await supabase
        .from('AssignmentSubmission')
        .insert({
          assignmentId,
          studentId: student.id,
          content: content || null,
          submissionUrl: submissionUrl || null,
          studentName,
          className,
          admissionNo,
        })
        .select('*')
        .single()

      if (error) throw error

      const { data: assignmentWithTeacher } = await supabase
        .from('Assignment')
        .select('title, teacherId')
        .eq('id', assignmentId)
        .single()

      if (assignmentWithTeacher?.teacherId) {
        const { data: teacher } = await supabase
          .from('Teacher')
          .select('userId')
          .eq('id', assignmentWithTeacher.teacherId)
          .single()

        if (teacher?.userId) {
          notifySubmissionCreated(studentName, assignmentWithTeacher.title, teacher.userId).catch((err) => {
            console.error('Failed to send submission notification:', err)
          })
        }
      }

      return NextResponse.json(submission, { status: 201 })
    }

    return NextResponse.json({ error: 'Student profile not found' }, { status: 400 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
