import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const teacherId = searchParams.get('teacherId')

    let query = supabase.from('Class').select('*').order('name', { ascending: true })
    if (search) query = query.or(`name.ilike.%${search}%,section.ilike.%${search}%`)
    if (teacherId) query = query.eq('classTeacherId', teacherId)
    const { data: classes, error } = await query
    if (error) throw error
    if (!classes) return NextResponse.json([])

    const classIds = classes.map(c => c.id)
    const teacherIds = classes.map(c => c.classTeacherId).filter(Boolean)

    const [{ data: studentCounts }, { data: subjectCounts }] = await Promise.all([
      classIds.length > 0
        ? supabase.from('Student').select('classId').in('classId', classIds)
        : { data: [] },
      classIds.length > 0
        ? supabase.from('Subject').select('classId').in('classId', classIds)
        : { data: [] },
    ])

    const sMap = new Map<string, number>()
    const subMap = new Map<string, number>()
    ;(studentCounts || []).forEach(s => { sMap.set(s.classId, (sMap.get(s.classId) || 0) + 1) })
    ;(subjectCounts || []).forEach(s => { subMap.set(s.classId, (subMap.get(s.classId) || 0) + 1) })

    let teacherNameMap = new Map<string, string>()
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase.from('Teacher').select('id, userId').in('id', teacherIds)
      const userIds = (teachers || []).map(t => t.userId)
      const { data: users } = userIds.length > 0
        ? await supabase.from('User').select('id, name').in('id', userIds)
        : { data: [] }
      const uMap = new Map((users || []).map(u => [u.id, u.name]))
      ;(teachers || []).forEach(t => {
        if (t.userId) {
          const name = uMap.get(t.userId) || null
          if (name) teacherNameMap.set(t.id, name)
        }
      })
    }

    const enriched = classes.map(c => ({
      ...c,
      _count: { students: sMap.get(c.id) || 0, subjects: subMap.get(c.id) || 0 },
      _teacherName: teacherNameMap.get(c.classTeacherId) || null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, section, classTeacherId, capacity } = body
    const insertData: any = { name, section, capacity: capacity || 40 }
    if (classTeacherId) insertData.classTeacherId = classTeacherId
    const { data: newClass, error } = await supabase.from('Class').insert(insertData).select().single()
    if (error) throw error
    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updateData } = body
    if (!id) return NextResponse.json({ error: 'Class ID required' }, { status: 400 })

    if (updateData.classTeacherId === '') delete updateData.classTeacherId
    const { data: updatedClass, error } = await supabase.from('Class').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error('Error updating class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Class ID required' }, { status: 400 })

    const { error } = await supabase.from('Class').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Class deleted' })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
