import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


interface SessionUser {
  role: string
}

interface Subject {
  id: string
  name: string
  code: string
  classId?: string
  teacherId?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    if (!session?.user || !['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'PRINCIPAL'].includes(role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const search = searchParams.get('search')

    let ownClassId: string | null = null
    if (role === 'STUDENT') {
      const { data: student } = await supabase.from('Student').select('classId').eq('userId', userId).single()
      ownClassId = student?.classId || null
    }

    if (role === 'STUDENT' && classId && classId !== ownClassId) {
      return NextResponse.json({ error: 'You can only view subjects for your own class' }, { status: 403 })
    }

    let query = supabase.from('Subject').select('*').order('name', { ascending: true })
    if (classId) {
      query = query.eq('classId', classId)
    } else if (role === 'STUDENT') {
      query = query.eq('classId', ownClassId || '')
    }
    if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    const { data: subjects, error } = await query
    if (error) throw error
    if (!subjects) return NextResponse.json([])

    const classIds = [...new Set(subjects.map(s => s.classId).filter(Boolean))]
    const teacherIds = [...new Set(subjects.map(s => s.teacherId).filter(Boolean))]

    const [classesResult, teachersResult] = await Promise.all([
      classIds.length > 0 ? supabase.from('Class').select('id, name, section').in('id', classIds) : { data: [] },
      teacherIds.length > 0 ? supabase.from('Teacher').select('id, userId').in('id', teacherIds) : { data: [] },
    ])

    const classMap = new Map((classesResult.data || []).map(c => [c.id, c]))
    const teacherUserIds = (teachersResult.data || []).map(t => t.userId).filter(Boolean)
    const { data: teacherUsers } = teacherUserIds.length > 0
      ? await supabase.from('User').select('id, name').in('id', teacherUserIds)
      : { data: [] }
    const userMap = new Map((teacherUsers || []).map(u => [u.id, u]))
    const teacherMap = new Map((teachersResult.data || []).map(t => [t.id, { id: t.id, name: userMap.get(t.userId)?.name || null }]))

    const subjectIds = subjects.map(s => s.id)
    const [gradeCounts, assignmentCounts] = await Promise.all([
      subjectIds.length > 0 ? supabase.from('Grade').select('subjectId').in('subjectId', subjectIds) : { data: [] },
      subjectIds.length > 0 ? supabase.from('Assignment').select('subjectId').in('subjectId', subjectIds) : { data: [] },
    ])

    const gMap = new Map<string, number>()
    const aMap = new Map<string, number>()
    ;(gradeCounts.data || []).forEach((g) => { gMap.set(g.subjectId, (gMap.get(g.subjectId) || 0) + 1) })
    ;(assignmentCounts.data || []).forEach((a) => { aMap.set(a.subjectId, (aMap.get(a.subjectId) || 0) + 1) })

    const enriched = subjects.map(s => ({
      ...s,
      class: classMap.get(s.classId) || null,
      teacher: teacherMap.get(s.teacherId) || null,
      _count: { grades: gMap.get(s.id) || 0, assignments: aMap.get(s.id) || 0 },
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as SessionUser).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, code, classId, teacherId } = body

    if (!name || typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
    }
    if (!code || typeof code !== 'string' || !code.trim() || code.trim().length > 20) {
      return NextResponse.json({ error: 'Subject code is required' }, { status: 400 })
    }

    const { data: existingSubject } = await supabase.from('Subject').select('id').eq('code', code.trim()).single()
    if (existingSubject) return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 })

    if (teacherId) {
      const { data: teacherExists } = await supabase.from('Teacher').select('id').eq('id', teacherId).single()
      if (!teacherExists) return NextResponse.json({ error: 'Invalid teacher' }, { status: 400 })
    }

    const insertData: any = { name: name.trim(), code: code.trim(), classId }
    if (teacherId) insertData.teacherId = teacherId

    const { data: subject, error } = await supabase.from('Subject').insert(insertData).select('id, name, code, classId, teacherId').single()
    if (error) throw error
    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error('Error creating subject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as SessionUser).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updateData } = body
    if (!id) return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })

    const ALLOWED_SUBJECT_FIELDS = ['name', 'code', 'classId', 'teacherId']
    const cleanedData: Record<string, unknown> = {}
    for (const key of Object.keys(updateData)) {
      if (ALLOWED_SUBJECT_FIELDS.includes(key)) cleanedData[key] = updateData[key]
    }

    if (cleanedData.name !== undefined && (typeof cleanedData.name !== 'string' || !cleanedData.name.trim() || cleanedData.name.trim().length > 100)) {
      return NextResponse.json({ error: 'Invalid subject name' }, { status: 400 })
    }
    if (cleanedData.name !== undefined) cleanedData.name = (cleanedData.name as string).trim()

    if (cleanedData.code !== undefined) {
      if (typeof cleanedData.code !== 'string' || !cleanedData.code.trim() || (cleanedData.code as string).trim().length > 20) {
        return NextResponse.json({ error: 'Invalid subject code' }, { status: 400 })
      }
      cleanedData.code = (cleanedData.code as string).trim()
      const { data: existingCode } = await supabase.from('Subject').select('id').eq('code', cleanedData.code).not('id', 'eq', id).single()
      if (existingCode) return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 })
    }

    if (cleanedData.teacherId === '') delete cleanedData.teacherId

    if (cleanedData.teacherId) {
      const { data: teacherExists } = await supabase.from('Teacher').select('id').eq('id', cleanedData.teacherId).single()
      if (!teacherExists) return NextResponse.json({ error: 'Invalid teacher' }, { status: 400 })
    }

    const { data: subject, error } = await supabase.from('Subject').update(cleanedData).eq('id', id).select('id, name, code, classId, teacherId').single()
    if (error) throw error
    return NextResponse.json(subject)
  } catch (error) {
    console.error('Error updating subject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as SessionUser).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })

    const [{ count: gradeCount }, { count: assignmentCount }, { count: timetableCount }] = await Promise.all([
      supabase.from('Grade').select('*', { count: 'exact', head: true }).eq('subjectId', id),
      supabase.from('Assignment').select('*', { count: 'exact', head: true }).eq('subjectId', id),
      supabase.from('Timetable').select('*', { count: 'exact', head: true }).eq('subjectId', id),
    ])

    if ((gradeCount ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete subject: it has existing grades.' }, { status: 400 })
    if ((assignmentCount ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete subject: it has assignments.' }, { status: 400 })
    if ((timetableCount ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete subject: it has timetable entries.' }, { status: 400 })

    const { error } = await supabase.from('Subject').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Subject deleted' })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
