import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')

    let query = supabase.from('Attendance').select('*').order('date', { ascending: false })
    if (classId) query = query.eq('classId', classId)
    if (studentId) query = query.eq('studentId', studentId)
    if (date) {
      const dateObj = new Date(date)
      const start = new Date(dateObj.setHours(0, 0, 0, 0)).toISOString()
      const end = new Date(dateObj.setHours(23, 59, 59, 999)).toISOString()
      query = query.gte('date', start).lte('date', end)
    }

    const { data: attendance, error } = await query
    if (error) throw error
    if (!attendance) return NextResponse.json([])

    const studentIds = [...new Set(attendance.map(a => a.studentId))]
    const { data: students } = studentIds.length > 0
      ? await supabase.from('Student').select('id, admissionNo, userId').in('id', studentIds)
      : { data: [] }
    const userIds = (students || []).map(s => s.userId).filter(Boolean)
    const { data: users } = userIds.length > 0
      ? await supabase.from('User').select('id, name').in('id', userIds)
      : { data: [] }

    const studentMap = new Map((students || []).map(s => [s.id, s]))
    const userMap = new Map((users || []).map(u => [u.id, u]))

    const enriched = attendance.map(a => {
      const student = studentMap.get(a.studentId)
      const user = student ? userMap.get(student.userId) : null
      return { ...a, student: student ? { ...student, user } : null }
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

    const body = await request.json()
    const { records, classId, date } = body

    for (const record of records) {
      const { data: existing } = await supabase
        .from('Attendance')
        .select('id')
        .eq('studentId', record.studentId)
        .eq('date', new Date(date).toISOString())
        .single()

      if (existing) {
        await supabase.from('Attendance').update({ status: record.status, remarks: record.remarks }).eq('id', existing.id)
      } else {
        await supabase.from('Attendance').insert({
          studentId: record.studentId, classId, date: new Date(date).toISOString(), status: record.status, remarks: record.remarks,
        })
      }
    }

    return NextResponse.json({ message: 'Attendance recorded successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
