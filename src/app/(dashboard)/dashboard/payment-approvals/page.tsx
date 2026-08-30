'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  amount: number
  receiptNo: string
  paymentMethod?: string
  reference?: string
  receiptImageUrl?: string
  accountantRemarks?: string
  principalRemarks?: string
  submittedAt: string
  status: string
  student: {
    admissionNo: string
    user: { name: string }
  }
  fee: {
    name: string
    amount: number
  }
  parent?: {
    user: { name: string; email: string }
  }
  accountant?: {
    user: { name: string }
  }
}

const PAYMENT_METHODS: Record<string, { icon: string; label: string }> = {
  bank_transfer: { icon: 'mdi-bank', label: 'Bank Transfer' },
  cash: { icon: 'mdi-cash', label: 'Cash' },
  card: { icon: 'mdi-credit-card', label: 'Card' },
  mobile: { icon: 'mdi-cellphone', label: 'Mobile' },
  online: { icon: 'mdi-web', label: 'Online' },
}

function getPaymentMethod(method?: string) {
  if (!method) return { icon: 'mdi-help-circle-outline', label: 'N/A' }
  return PAYMENT_METHODS[method.toLowerCase().replace(/\s+/g, '_')] || { icon: 'mdi-currency-usd', label: method }
}

export default function PaymentApprovalsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const principalName = user?.name?.split(' ')[0] || 'Principal'
  const role = user?.role || ''

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [remarks, setRemarks] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [remarksError, setRemarksError] = useState(false)
  const [viewReceipt, setViewReceipt] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/payments?status=ACCOUNTANT_REVIEWED')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPayments(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handleApprove = async (paymentId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, status: 'PRINCIPAL_APPROVED', principalRemarks: remarks }),
      })
      if (res.ok) {
        setSelectedPayment(null)
        setRemarks('')
        fetchPayments()
      }
    } catch {} finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (paymentId: string) => {
    if (!remarks.trim()) {
      setRemarksError(true)
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, status: 'REJECTED', principalRemarks: remarks }),
      })
      if (res.ok) {
        setSelectedPayment(null)
        setRemarks('')
        fetchPayments()
      }
    } catch {} finally {
      setActionLoading(false)
    }
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  if (role && role !== 'PRINCIPAL') {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl border border-gray-100 p-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
              <span className="mdi mdi-shield-lock-outline text-3xl text-red-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Access Denied</p>
              <p className="text-sm text-gray-500 mt-1">Only principals can access payment approvals</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-check-decagram text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {principalName}
              </h1>
              <p className="text-sm text-gray-500">
                {format(today, 'EEEE, MMMM d, yyyy')} &middot; Payment approvals
              </p>
            </div>
          </div>
          {!loading && payments.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg font-medium">
                <span className="mdi mdi-clock-outline text-base" />
                {payments.length} pending
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                <span className="mdi mdi-cash text-base" />
                ${totalAmount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/6" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load payments</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button onClick={fetchPayments} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <span className="mdi mdi-refresh" /> Retry
              </button>
            </div>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <span className="mdi mdi-check-circle-outline text-3xl text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">All caught up</p>
                <p className="text-sm text-gray-500 mt-1">No payments are awaiting your approval right now</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Receipt</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Student</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Fee</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Method</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Reviewed by</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Date</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((payment) => {
                    const method = getPaymentMethod(payment.paymentMethod)
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-mono font-medium">
                            <span className="mdi mdi-receipt-text text-gray-400" />
                            {payment.receiptNo}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">
                              {payment.student.user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{payment.student.user?.name}</p>
                              <p className="text-xs text-gray-500">{payment.student.admissionNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{payment.fee.name}</td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-gray-900">${payment.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <span className={cn('mdi text-base text-gray-400', method.icon)} />
                            {method.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {payment.accountant?.user?.name || 'N/A'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-600">{format(new Date(payment.submittedAt), 'MMM d, yyyy')}</span>
                          <span className="block text-[11px] text-gray-400">{formatDistanceToNow(new Date(payment.submittedAt), { addSuffix: true })}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            <span className="mdi mdi-eye text-sm" />
                            Review
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              {/* Modal header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <span className="mdi mdi-check-decagram text-indigo-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Review Payment</h2>
                  <p className="text-xs text-gray-500">{selectedPayment.receiptNo}</p>
                </div>
                <button onClick={() => { setSelectedPayment(null); setRemarks(''); setRemarksError(false) }} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <span className="mdi mdi-close text-lg" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Payment details grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Amount', value: `$${selectedPayment.amount.toLocaleString()}`, icon: 'mdi-cash', highlight: true },
                    { label: 'Student', value: selectedPayment.student.user?.name || '', icon: 'mdi-account' },
                    { label: 'Fee', value: selectedPayment.fee.name, icon: 'mdi-credit-card-outline' },
                    { label: 'Admission No', value: selectedPayment.student.admissionNo, icon: 'mdi-identifier' },
                    { label: 'Payment Method', value: getPaymentMethod(selectedPayment.paymentMethod).label, icon: getPaymentMethod(selectedPayment.paymentMethod).icon },
                    { label: 'Submitted By', value: selectedPayment.parent?.user?.name || 'N/A', icon: 'mdi-account-outline' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <span className={cn('mdi text-lg mt-0.5 shrink-0', item.icon, item.highlight ? 'text-emerald-500' : 'text-gray-400')} />
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{item.label}</p>
                        <p className={cn('text-sm', item.highlight ? 'font-bold text-emerald-600 text-lg' : 'font-medium text-gray-900')}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accountant remarks */}
                {selectedPayment.accountantRemarks && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="mdi mdi-account-tie text-blue-500 text-base" />
                      <span className="text-xs font-semibold text-blue-700 uppercase">Accountant Remarks</span>
                    </div>
                    <p className="text-sm text-blue-700">{selectedPayment.accountantRemarks}</p>
                  </div>
                )}

                {/* Receipt image */}
                {selectedPayment.receiptImageUrl && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="mdi mdi-image text-gray-400 text-base" />
                      <span className="text-xs font-semibold text-gray-500 uppercase">Proof of Payment</span>
                    </div>
                    <button
                      onClick={() => setViewReceipt(selectedPayment.receiptImageUrl!)}
                      className="w-full rounded-xl overflow-hidden border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer group"
                    >
                      <img
                        src={selectedPayment.receiptImageUrl}
                        alt="Receipt"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                    <p className="text-[11px] text-gray-400 mt-1.5 text-center">Click to view full size</p>
                  </div>
                )}

                {/* Remarks textarea */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-comment-text-outline text-gray-400" />
                    Your Remarks
                    <span className="text-xs text-gray-400 font-normal">(required for rejection)</span>
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => { setRemarks(e.target.value); setRemarksError(false) }}
                    className={cn(
                      'w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none',
                      remarksError
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                        : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-400'
                    )}
                    rows={3}
                    placeholder="Add remarks (required for rejection)"
                  />
                  {remarksError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span className="mdi mdi-alert-circle" /> Please provide a reason for rejection
                    </p>
                  )}
                </div>
              </div>

              {/* Modal actions */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                <button
                  onClick={() => { setSelectedPayment(null); setRemarks(''); setRemarksError(false) }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedPayment.id)}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 text-sm font-medium rounded-xl hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                  ) : (
                    <span className="mdi mdi-close-circle" />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedPayment.id)}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="mdi mdi-check-circle" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen receipt viewer */}
        {viewReceipt && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setViewReceipt(null)}>
            <button onClick={() => setViewReceipt(null)} className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors z-10">
              <span className="mdi mdi-close text-xl" />
            </button>
            <img
              src={viewReceipt}
              alt="Receipt full size"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
