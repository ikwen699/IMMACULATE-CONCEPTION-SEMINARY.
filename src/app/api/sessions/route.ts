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

    if (!name || typeof name !== 'string' || !name.trim() || name.trim().length > 200) {
      return NextResponse.json({ error: 'Session name is required' }, { status: 400 })
    }
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Valid start and end dates are required' }, { status: 400 })
    }
    if (end <= start) return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })

    // Unset all other sessions' isCurrent flag when creating/updating
    await supabase.from('AcademicSession').update({ isCurrent: false }).eq('isCurrent', true)

    const { data: academicSession, error: sessionErr } = await supabase
      .from('AcademicSession')
      .insert({ name: name.trim(), startDate: start.toISOString(), endDate: end.toISOString(), isCurrent: isCurrent || false })
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
      for (const t of termInserts) {
        if (!t.name || typeof t.name !== 'string' || !t.name.trim() || t.name.trim().length > 100) {
          return NextResponse.json({ error: 'Each term needs a valid name' }, { status: 400 })
        }
        if (isNaN(new Date(t.startDate).getTime()) || isNaN(new Date(t.endDate).getTime())) {
          return NextResponse.json({ error: 'Each term needs valid dates' }, { status: 400 })
        }
        t.name = t.name.trim()
      }
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

    const ALLOWED_SESSION_FIELDS = ['name', 'startDate', 'endDate', 'isCurrent']
    const cleanedData: Record<string, unknown> = {}
    for (const key of Object.keys(updateData)) {
      if (ALLOWED_SESSION_FIELDS.includes(key)) cleanedData[key] = updateData[key]
    }

    if (cleanedData.name !== undefined && (typeof cleanedData.name !== 'string' || !cleanedData.name.trim() || cleanedData.name.trim().length > 200)) {
      return NextResponse.json({ error: 'Invalid session name' }, { status: 400 })
    }
    if (cleanedData.name !== undefined) cleanedData.name = (cleanedData.name as string).trim()

    if (cleanedData.startDate) {
      const d = new Date(cleanedData.startDate as string)
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid start date' }, { status: 400 })
      cleanedData.startDate = d.toISOString()
    }
    if (cleanedData.endDate) {
      const d = new Date(cleanedData.endDate as string)
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid end date' }, { status: 400 })
      cleanedData.endDate = d.toISOString()
    }
    if (cleanedData.startDate && cleanedData.endDate && new Date(cleanedData.endDate as string) <= new Date(cleanedData.startDate as string)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    if (cleanedData.isCurrent) {
      await supabase.from('AcademicSession').update({ isCurrent: false }).eq('isCurrent', true).neq('id', id)
    }

    const { data: academicSession, error } = await supabase.from('AcademicSession').update(cleanedData).eq('id', id).select('*').single()
    if (error) throw error

    if (terms && Array.isArray(terms)) {
      const { data: existingTerms } = await supabase.from('Term').select('id').eq('sessionId', id)
      const existingIds = new Set((existingTerms || []).map((t: any) => t.id))
      const incomingIds = new Set(terms.map((t: any) => t.id).filter(Boolean))

      const toDelete = [...existingIds].filter(tid => !incomingIds.has(tid))
      if (toDelete.length > 0) {
        const { count: gradeCount } = await supabase.from('Grade').select('*', { count: 'exact', head: true }).in('termId', toDelete)
        if ((gradeCount ?? 0) > 0) {
          return NextResponse.json({ error: 'Cannot remove terms that already have grades.' }, { status: 400 })
        }
        const { error: delErr } = await supabase.from('Term').delete().in('id', toDelete)
        if (delErr) throw delErr
      }

      for (const term of terms) {
        const startDate = term.startDate ? new Date(term.startDate) : new Date()
        const endDate = term.endDate ? new Date(term.endDate) : new Date()
        if (!term.name || typeof term.name !== 'string' || !term.name.trim() || term.name.trim().length > 100) {
          return NextResponse.json({ error: 'Each term needs a valid name' }, { status: 400 })
        }
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return NextResponse.json({ error: 'Each term needs valid dates' }, { status: 400 })
        }

        const termData = {
          name: term.name.trim(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isCurrent: term.isCurrent || false,
        }

        if (term.id && existingIds.has(term.id)) {
          const { error: updErr } = await supabase.from('Term').update(termData).eq('id', term.id)
          if (updErr) throw updErr
        } else {
          const { error: insErr } = await supabase.from('Term').insert({ ...termData, sessionId: id })
          if (insErr) throw insErr
        }
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

    const { data: terms } = await supabase.from('Term').select('id').eq('sessionId', id)
    const termIds = (terms || []).map((t: any) => t.id)

    if (termIds.length > 0) {
      const [{ count: gradeCount }, { count: feeCount }] = await Promise.all([
        supabase.from('Grade').select('*', { count: 'exact', head: true }).in('termId', termIds),
        supabase.from('Fee').select('*', { count: 'exact', head: true }).eq('sessionId', id),
      ])

      if ((gradeCount ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete session: its terms have existing grades.' }, { status: 400 })
      if ((feeCount ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete session: it has associated fees.' }, { status: 400 })
    } else {
      const { count: feeCount } = await supabase.from('Fee').select('*', { count: 'exact', head: true }).eq('sessionId', id)
      if ((feeCount ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete session: it has associated fees.' }, { status: 400 })
    }

    const { error } = await supabase.from('AcademicSession').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Session deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
