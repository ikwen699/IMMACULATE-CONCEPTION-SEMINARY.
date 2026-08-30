import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: sessions, error } = await supabase.from('AcademicSession').select('*').order('startDate', { ascending: false })
    if (error) throw error
    if (!sessions) return NextResponse.json([])

    const sessIds = sessions.map(s => s.id)
    const { data: terms } = sessIds.length > 0 ? await supabase.from('Term').select('*').in('sessionId', sessIds) : { data: [] }

    const termMap = new Map<string, any[]>()
    ;(terms || []).forEach(t => {
      if (!termMap.has(t.sessionId)) termMap.set(t.sessionId, [])
      const arr = termMap.get(t.sessionId)
      if (arr) arr.push(t)
    })

    const { data: feeCounts } = sessIds.length > 0
      ? await supabase.from('Fee').select('sessionId').in('sessionId', sessIds)
      : { data: [] }

    const feeMap = new Map<string, number>()
    ;(feeCounts || []).forEach((f: any) => {
      feeMap.set(f.sessionId, (feeMap.get(f.sessionId) || 0) + 1)
    })

    const enriched = sessions.map(s => ({
      ...s,
      terms: termMap.get(s.id) || [],
      _count: { fees: feeMap.get(s.id) || 0 },
    }))
    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, startDate, endDate, isCurrent, terms } = body

    // Unset all other sessions' isCurrent flag when creating/updating
    await supabase.from('AcademicSession').update({ isCurrent: false }).eq('isCurrent', true)

    const { data: academicSession, error: sessionErr } = await supabase
      .from('AcademicSession')
      .insert({ name, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), isCurrent: isCurrent || false })
      .select()
      .single()

    if (sessionErr) throw sessionErr

    if (terms && terms.length > 0) {
      const termInserts = terms.map((term: any) => ({
        sessionId: academicSession.id, name: term.name,
        startDate: term.startDate ? new Date(term.startDate).toISOString() : new Date().toISOString(),
        endDate: term.endDate ? new Date(term.endDate).toISOString() : new Date().toISOString(),
        isCurrent: term.isCurrent || false,
      }))
      const { error: termErr } = await supabase.from('Term').insert(termInserts)
      if (termErr) throw termErr
    }

    const { data: result } = await supabase.from('Term').select('*').eq('sessionId', academicSession.id)
    return NextResponse.json({ ...academicSession, terms: result || [] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, terms, ...updateData } = body
    if (!id) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate).toISOString()
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate).toISOString()

    if (updateData.isCurrent) {
      await supabase.from('AcademicSession').update({ isCurrent: false }).eq('isCurrent', true).neq('id', id)
    }

    const { data: academicSession, error } = await supabase.from('AcademicSession').update(updateData).eq('id', id).select('*').single()
    if (error) throw error

    if (terms && Array.isArray(terms)) {
      await supabase.from('Term').delete().eq('sessionId', id)
      if (terms.length > 0) {
        const termInserts = terms.map((term: any) => ({
          sessionId: id,
          name: term.name,
          startDate: term.startDate ? new Date(term.startDate).toISOString() : new Date().toISOString(),
          endDate: term.endDate ? new Date(term.endDate).toISOString() : new Date().toISOString(),
          isCurrent: term.isCurrent || false,
        }))
        const { error: termErr } = await supabase.from('Term').insert(termInserts)
        if (termErr) throw termErr
      }
    }

    const { data: result } = await supabase.from('Term').select('*').eq('sessionId', id)
    return NextResponse.json({ ...academicSession, terms: result || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

    const { error } = await supabase.from('AcademicSession').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Session deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
