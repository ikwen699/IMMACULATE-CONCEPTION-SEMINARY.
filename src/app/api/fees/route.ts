import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const sessionId = searchParams.get('sessionId')

    let query = supabase.from('Fee').select('*').order('createdAt', { ascending: false })
    if (classId) query = query.eq('classId', classId)
    if (sessionId) query = query.eq('sessionId', sessionId)

    const { data: fees, error } = await query
    if (error) throw error
    if (!fees) return NextResponse.json([])

    const classIds = [...new Set(fees.map(f => f.classId).filter(Boolean))]
    const sessionIds = [...new Set(fees.map(f => f.sessionId).filter(Boolean))]
    const termIds = [...new Set(fees.map(f => f.termId).filter(Boolean))]

    const [clsRes, sessRes, termRes] = await Promise.all([
      classIds.length > 0 ? supabase.from('Class').select('id, name, section').in('id', classIds) : { data: [] },
      sessionIds.length > 0 ? supabase.from('AcademicSession').select('id, name').in('id', sessionIds) : { data: [] },
      termIds.length > 0 ? supabase.from('Term').select('id, name').in('id', termIds) : { data: [] },
    ])

    const clsMap = new Map((clsRes.data || []).map(c => [c.id, c]))
    const sessMap = new Map((sessRes.data || []).map(s => [s.id, s]))
    const termMap = new Map((termRes.data || []).map(t => [t.id, t]))

    const feeIds = fees.map(f => f.id)
    const { data: paymentCounts } = feeIds.length > 0
      ? await supabase.from('Payment').select('feeId').in('feeId', feeIds)
      : { data: [] }

    const pMap = new Map<string, number>()
    ;(paymentCounts || []).forEach((p: any) => {
      pMap.set(p.feeId, (pMap.get(p.feeId) || 0) + 1)
    })

    const enriched = fees.map(f => ({
      ...f,
      class: clsMap.get(f.classId) || null,
      session: sessMap.get(f.sessionId) || null,
      term: termMap.get(f.termId) || null,
      _count: { payments: pMap.get(f.id) || 0 },
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
    const { name, amount, classId, sessionId, termId, description, dueDate } = body

    const { data: fee, error } = await supabase
      .from('Fee')
      .insert({ name, amount, classId, sessionId, termId, description, dueDate: dueDate ? new Date(dueDate).toISOString() : null })
      .select('*, class(id, name), session(id, name), term(id, name)')
      .single()

    if (error) throw error
    return NextResponse.json(fee, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updateData } = body
    if (!id) return NextResponse.json({ error: 'Fee ID required' }, { status: 400 })
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate).toISOString()

    const { data: fee, error } = await supabase.from('Fee').update(updateData).eq('id', id).select('*, class(id, name), session(id, name), term(id, name)').single()
    if (error) throw error
    return NextResponse.json(fee)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = (session.user as any).role
    if (!['ADMIN', 'ACCOUNTANT'].includes(role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Fee ID required' }, { status: 400 })

    const { error } = await supabase.from('Fee').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Fee deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
