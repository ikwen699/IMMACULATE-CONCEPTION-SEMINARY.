import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const search = searchParams.get('search')

    let query = supabase.from('Subject').select('*').order('name', { ascending: true })
    if (classId) query = query.eq('classId', classId)
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
    ;(gradeCounts.data || []).forEach((g: any) => { gMap.set(g.subjectId, (gMap.get(g.subjectId) || 0) + 1) })
    ;(assignmentCounts.data || []).forEach((a: any) => { aMap.set(a.subjectId, (aMap.get(a.subjectId) || 0) + 1) })

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
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, code, classId, teacherId } = body

    const { data: existingSubject } = await supabase.from('Subject').select('id').eq('code', code).single()
    if (existingSubject) return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 })

    const insertData: any = { name, code, classId }
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
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updateData } = body
    if (!id) return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })

    if (updateData.teacherId === '') delete updateData.teacherId

    const { data: subject, error } = await supabase.from('Subject').update(updateData).eq('id', id).select('id, name, code, classId, teacherId').single()
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
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })

    const { error } = await supabase.from('Subject').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Subject deleted' })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
