import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { generateReceiptNo } from '@/lib/utils'
import { notifyPaymentSubmitted, notifyPaymentReviewed, notifyPaymentApproved } from '@/lib/notifications'
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const role = (session.user as any).role

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const feeId = searchParams.get('feeId')
    const status = searchParams.get('status')
    const childId = searchParams.get('childId')

    let query = supabase.from('Payment').select('*').order('createdAt', { ascending: false })

    if (role === 'PARENT') {
      const { data: parent, error: parentErr } = await supabase.from('Parent').select('id').eq('userId', userId).single()
      if (parentErr) {
        console.error('Database error fetching parent:', parentErr)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
      if (parent) query = query.eq('parentId', parent.id)
    } else if (role === 'STUDENT') {
      const { data: student, error: studentErr } = await supabase.from('Student').select('id').eq('userId', userId).single()
      if (studentErr) {
        console.error('Database error fetching student:', studentErr)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
      if (student) query = query.eq('studentId', student.id)
    }

    if (studentId) query = query.eq('studentId', studentId)
    if (feeId) query = query.eq('feeId', feeId)
    if (status) query = query.eq('status', status)
    if (childId) query = query.eq('studentId', childId)

    const { data: payments, error } = await query
    if (error) {
      console.error('Database error fetching payments:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    if (!payments) return NextResponse.json([])

    const allStudentIds = [...new Set(payments.map(p => p.studentId))]
    const allFeeIds = [...new Set(payments.map(p => p.feeId))]
    const allAccountantIds = [...new Set(payments.map(p => p.accountantId).filter(Boolean))]
    const allPrincipalIds = [...new Set(payments.map(p => p.principalId).filter(Boolean))]
    const allParentIds = [...new Set(payments.map(p => p.parentId).filter(Boolean))]

    const [studentsRes, feesRes, accRes, princRes, parentRes] = await Promise.all([
      allStudentIds.length > 0 ? supabase.from('Student').select('id, admissionNo, userId').in('id', allStudentIds) : { data: [] },
      allFeeIds.length > 0 ? supabase.from('Fee').select('id, name, amount').in('id', allFeeIds) : { data: [] },
      allAccountantIds.length > 0 ? supabase.from('Accountant').select('id, userId').in('id', allAccountantIds) : { data: [] },
      allPrincipalIds.length > 0 ? supabase.from('Principal').select('id, userId').in('id', allPrincipalIds) : { data: [] },
      allParentIds.length > 0 ? supabase.from('Parent').select('id, userId').in('id', allParentIds) : { data: [] },
    ])

    const allUserIds = [
      ...(studentsRes.data || []).map(s => s.userId),
      ...(accRes.data || []).map(a => a.userId),
      ...(princRes.data || []).map(p => p.userId),
      ...(parentRes.data || []).map(p => p.userId),
    ].filter(Boolean)

    const { data: users } = allUserIds.length > 0
      ? await supabase.from('User').select('id, name').in('id', [...new Set(allUserIds)])
      : { data: [] }

    const uMap = new Map((users || []).map(u => [u.id, u]))
    const sMap = new Map((studentsRes.data || []).map(s => [s.id, s]))
    const fMap = new Map((feesRes.data || []).map(f => [f.id, f]))
    const aMap = new Map((accRes.data || []).map(a => [a.id, a]))
    const pMap = new Map((princRes.data || []).map(p => [p.id, p]))
    const parMap = new Map((parentRes.data || []).map(p => [p.id, p]))

    const enriched = payments.map(p => {
      const student = sMap.get(p.studentId)
      const fee = fMap.get(p.feeId)
      const acc = p.accountantId ? aMap.get(p.accountantId) || null : null
      const princ = p.principalId ? pMap.get(p.principalId) || null : null
      const par = p.parentId ? parMap.get(p.parentId) || null : null
      return {
        ...p,
        student: student ? { ...student, user: uMap.get(student.userId) || null } : null,
        fee: fee || null,
        accountant: acc ? { ...acc, user: uMap.get(acc.userId) || null } : null,
        principal: princ ? { ...princ, user: uMap.get(princ.userId) || null } : null,
        parent: par ? { ...par, user: uMap.get(par.userId) || null } : null,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const role = (session.user as any).role
    const body = await request.json()
    let { studentId, feeId, amount, paymentMethod, reference, notes, receiptImageUrl } = body

    let parentId: string | undefined
    let accountantId: string | undefined

    if (role === 'PARENT') {
      const { data: parent } = await supabase.from('Parent').select('id').eq('userId', userId).single()
      if (!parent) return NextResponse.json({ error: 'Parent profile not found' }, { status: 400 })
      parentId = parent.id
      if (!studentId) {
        const { data: children } = await supabase.from('Student').select('id').eq('parentId', parent.id)
        if (children && children.length === 1) studentId = children[0].id
        else return NextResponse.json({ error: 'Please specify which child this payment is for' }, { status: 400 })
      }
    }

    if (role === 'ACCOUNTANT') {
      const { data: accountant } = await supabase.from('Accountant').select('id').eq('userId', userId).single()
      accountantId = accountant?.id
    }

    const { data: payment, error: payErr } = await supabase
      .from('Payment')
      .insert({
        studentId, feeId, amount, receiptNo: generateReceiptNo(), paymentMethod, reference, notes, receiptImageUrl,
        parentId, accountantId, status: role === 'PARENT' ? 'SUBMITTED' : 'COMPLETED', submittedAt: new Date().toISOString(),
      })
      .select('*, student(id, admissionNo, userId), fee(id, name, amount)')
      .single()

    if (payErr) {
      console.error('Database error creating payment:', payErr)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!payment) return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })

    if (role === 'PARENT') {
      const { data: sUser } = await supabase.from('Student').select('userId').eq('id', studentId).single()
      const { data: sName } = sUser ? await supabase.from('User').select('name').eq('id', sUser.userId).single() : { data: null }
      await notifyPaymentSubmitted(payment.id, sName?.name || 'Student', amount)
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).userId || (session.user as any).id
    const role = (session.user as any).role
    if (!['ADMIN', 'ACCOUNTANT'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const body = await request.json()
    const { id, status, accountantRemarks, principalRemarks } = body

    if (!id) return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })

    const updateData: any = { status: status || 'PENDING' }

    if (role === 'ACCOUNTANT' && status === 'ACCOUNTANT_REVIEWED') {
      const { data: accountant } = await supabase.from('Accountant').select('id').eq('userId', userId).single()
      updateData.accountantId = accountant?.id
      updateData.accountantRemarks = accountantRemarks
    }

    if (role === 'PRINCIPAL') {
      const { data: principal } = await supabase.from('Principal').select('id').eq('userId', userId).single()
      updateData.principalId = principal?.id
      updateData.principalRemarks = principalRemarks
      if (status === 'PRINCIPAL_APPROVED') updateData.principalApprovedAt = new Date().toISOString()
    }

    const { data: payment, error } = await supabase.from('Payment').update(updateData).eq('id', id).select('*')

    if (error) {
      console.error('Database error updating payment:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (role === 'PRINCIPAL' && status === 'REJECTED') {
      await notifyPaymentApproved(id, false, principalRemarks)
    } else if (status === 'ACCOUNTANT_REVIEWED' || status === 'REJECTED') {
      await notifyPaymentReviewed(id, status, accountantRemarks)
    } else if (status === 'PRINCIPAL_APPROVED' || (status === 'REJECTED' && role === 'PRINCIPAL')) {
      await notifyPaymentApproved(id, status === 'PRINCIPAL_APPROVED', principalRemarks)
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
