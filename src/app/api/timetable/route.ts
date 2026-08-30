import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const teacherId = searchParams.get('teacherId')

    let query = supabase.from('Timetable').select('*').order('startTime', { ascending: true })
    if (classId) query = query.eq('classId', classId)
    if (teacherId) query = query.eq('teacherId', teacherId)

    const { data: timetable, error } = await query
    if (error) throw error
    if (!timetable) return NextResponse.json([])

    const subIds = [...new Set(timetable.map(t => t.subjectId))]
    const tchIds = [...new Set(timetable.map(t => t.teacherId))]
    const clsIds = [...new Set(timetable.map(t => t.classId))]

    const [subRes, tchRes, clsRes] = await Promise.all([
      subIds.length > 0 ? supabase.from('Subject').select('id, name, code').in('id', subIds) : { data: [] },
      tchIds.length > 0 ? supabase.from('Teacher').select('id, userId').in('id', tchIds) : { data: [] },
      clsIds.length > 0 ? supabase.from('Class').select('id, name, section').in('id', clsIds) : { data: [] },
    ])

    const tchUserIds = (tchRes.data || []).map(t => t.userId).filter(Boolean)
    const { data: tchUsers } = tchUserIds.length > 0 ? await supabase.from('User').select('id, name').in('id', tchUserIds) : { data: [] }
    const uMap = new Map((tchUsers || []).map(u => [u.id, u]))
    const tMap = new Map((tchRes.data || []).map(t => [t.id, { id: t.id, name: uMap.get(t.userId)?.name || null }]))
    const sMap = new Map((subRes.data || []).map(s => [s.id, s]))
    const cMap = new Map((clsRes.data || []).map(c => [c.id, c]))

    const enriched = timetable.map(t => ({
      ...t,
      subject: sMap.get(t.subjectId) || null,
      teacher: tMap.get(t.teacherId) || null,
      class: cMap.get(t.classId) || null,
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
    const userId = (session.user as any).userId || (session.user as any).id

    const body = await request.json()
    const { classId, subjectId, day, startTime, endTime } = body

    let teacherId = body.teacherId

    if (role === 'TEACHER') {
      const { data: teacher } = await supabase.from('Teacher').select('id').eq('userId', userId).single()
      if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 400 })
      teacherId = teacher.id
    } else if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!classId || !subjectId || !teacherId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const { data: entry, error } = await supabase
      .from('Timetable')
      .insert({ classId, subjectId, teacherId, day, startTime, endTime })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating timetable entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    const userId = (session.user as any).userId || (session.user as any).id

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    if (role === 'TEACHER') {
      const { data: teacher } = await supabase.from('Teacher').select('id').eq('userId', userId).single()
      if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 400 })

      const { data: entry } = await supabase.from('Timetable').select('teacherId').eq('id', id).single()
      if (!entry || entry.teacherId !== teacher.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase.from('Timetable').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
