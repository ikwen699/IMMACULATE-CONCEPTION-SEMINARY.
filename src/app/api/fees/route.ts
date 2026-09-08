import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
export const dynamic = 'force-dynamic'


interface SessionUser {
  role: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const role = (session.user as any).role

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const sessionId = searchParams.get('sessionId')

    let query = supabase.from('Fee').select('*').order('createdAt', { ascending: false })
    if (sessionId) query = query.eq('sessionId', sessionId)

    let allowedFeeIds: string[] | null = null

    if (role === 'PARENT') {
      const { data: parent } = await supabase.from('Parent').select('id').eq('userId', userId).single()
      if (parent) {
        const { data: children } = await supabase.from('Student').select('classId').eq('parentId', parent.id)
        const childClassIds = [...new Set((children || []).map(c => c.classId).filter(Boolean))]

        if (childClassIds.length > 0) {
          const { data: feeClasses } = await supabase
            .from('FeeClass')
            .select('feeId')
            .in('classId', childClassIds)

          const matchingFeeIds = (feeClasses || []).map(fc => fc.feeId)
          const orFilter = `classId.is.null,id.in.(${matchingFeeIds.length > 0 ? matchingFeeIds.join(',') : 'no-match'})`
          query = query.or(orFilter)
        } else {
          query = query.is('classId', null)
        }
      } else {
        query = query.is('classId', null)
      }
    }

    if (classId) {
      const { data: feeClasses } = await supabase
        .from('FeeClass')
        .select('feeId')
        .eq('classId', classId)

      const fcFeeIds = (feeClasses || []).map(fc => fc.feeId)
      query = query.or(`classId.eq.${classId},id.in.(${fcFeeIds.length > 0 ? fcFeeIds.join(',') : 'no-match'})`)
    }

    const { data: fees, error } = await query
    if (error) throw error
    if (!fees) return NextResponse.json([])

    const feeIds = fees.map(f => f.id)

    const allClassIdsFromFees = fees.filter(f => f.classId).map(f => f.classId as string)
    const { data: feeClasses } = feeIds.length > 0
      ? await supabase.from('FeeClass').select('feeId, classId').in('feeId', feeIds)
      : { data: [] }

    const classesByFee = new Map<string, string[]>()
    ;(feeClasses || []).forEach(fc => {
      if (!classesByFee.has(fc.feeId)) classesByFee.set(fc.feeId, [])
      classesByFee.get(fc.feeId)!.push(fc.classId)
    })

    fees.forEach(f => {
      const junctionClasses = classesByFee.get(f.id) || []
      if (junctionClasses.length > 0) {
        if (!classesByFee.has(f.id)) classesByFee.set(f.id, junctionClasses)
      } else if (f.classId) {
        classesByFee.set(f.id, [f.classId])
      }
    })

    const classIdsSet = new Set(allClassIdsFromFees)
    ;(feeClasses || []).forEach(fc => classIdsSet.add(fc.classId))
    if (classId) classIdsSet.add(classId)

    const sessionIds = [...new Set(fees.map(f => f.sessionId).filter(Boolean))]
    const termIds = [...new Set(fees.map(f => f.termId).filter(Boolean))]

    const allClassIds = [...classIdsSet]
    const [clsRes, sessRes, termRes] = await Promise.all([
      allClassIds.length > 0 ? supabase.from('Class').select('id, name, section').in('id', allClassIds) : { data: [] },
      sessionIds.length > 0 ? supabase.from('AcademicSession').select('id, name').in('id', sessionIds) : { data: [] },
      termIds.length > 0 ? supabase.from('Term').select('id, name').in('id', termIds) : { data: [] },
    ])

    const clsMap = new Map((clsRes.data || []).map(c => [c.id, c]))
    const sessMap = new Map((sessRes.data || []).map(s => [s.id, s]))
    const termMap = new Map((termRes.data || []).map(t => [t.id, t]))

    const { data: paymentCounts } = feeIds.length > 0
      ? await supabase.from('Payment').select('feeId').in('feeId', feeIds)
      : { data: [] }

    const pMap = new Map<string, number>()
    ;(paymentCounts || []).forEach((p) => {
      pMap.set(p.feeId, (pMap.get(p.feeId) || 0) + 1)
    })

    const enriched = fees.map(f => {
      const feeClassIds = classesByFee.get(f.id) || (f.classId ? [f.classId] : [])
      return {
        ...f,
        classes: feeClassIds.map(cid => clsMap.get(cid)).filter(Boolean),
        class: feeClassIds.length === 1 ? clsMap.get(feeClassIds[0]) || null : null,
        classId: null,
        session: sessMap.get(f.sessionId) || null,
        term: termMap.get(f.termId) || null,
        _count: { payments: pMap.get(f.id) || 0 },
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as SessionUser).role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, amount, classIds, sessionId, termId, description, dueDate } = body

    if (!sessionId) return NextResponse.json({ error: 'Academic session is required' }, { status: 400 })

    const { data: fee, error } = await supabase
      .from('Fee')
      .insert({
        name, amount,
        classId: null,
        sessionId,
        termId: termId || null,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
      .select('*')
      .single()

    if (error) throw error

    if (classIds && Array.isArray(classIds) && classIds.length > 0) {
      const { error: fcErr } = await supabase
        .from('FeeClass')
        .insert(classIds.map((cid: string) => ({ feeId: fee.id, classId: cid })))

      if (fcErr) throw fcErr
    }

    return NextResponse.json(fee, { status: 201 })
  } catch (error: any) {
    console.error('Error creating fee:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as SessionUser).role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { id, classIds, ...updateData } = body
    if (!id) return NextResponse.json({ error: 'Fee ID required' }, { status: 400 })
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate).toISOString()
    if (updateData.classId === '') updateData.classId = null
    if (updateData.termId === '') updateData.termId = null

    updateData.classId = null

    const { data: fee, error } = await supabase.from('Fee').update(updateData).eq('id', id).select('*').single()
    if (error) throw error

    if (classIds && Array.isArray(classIds)) {
      await supabase.from('FeeClass').delete().eq('feeId', id)

      if (classIds.length > 0) {
        const { error: fcErr } = await supabase
          .from('FeeClass')
          .insert(classIds.map((cid: string) => ({ feeId: id, classId: cid })))

        if (fcErr) throw fcErr
      }
    }

    return NextResponse.json(fee)
  } catch (error: any) {
    console.error('Error updating fee:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as SessionUser).role !== 'ACCOUNTANT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Fee ID required' }, { status: 400 })

    const { error } = await supabase.from('Fee').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Fee deleted' })
  } catch (error: any) {
    console.error('Error deleting fee:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
