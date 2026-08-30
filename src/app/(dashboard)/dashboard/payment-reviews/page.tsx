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
  submittedAt: string
  status: string
  student: { admissionNo: string; user: { name: string } }
  fee: { name: string; amount: number }
  parent?: { user: { name: string; email: string } }
}

const PAYMENT_METHODS: Record<string, { icon: string; label: string }> = {
  CASH: { icon: 'mdi-cash', label: 'Cash' },
  BANK_TRANSFER: { icon: 'mdi-bank', label: 'Bank Transfer' },
  CARD: { icon: 'mdi-credit-card', label: 'Card' },
  MOBILE: { icon: 'mdi-cellphone', label: 'Mobile' },
  CHECK: { icon: 'mdi-checkbook', label: 'Check' },
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700', 'bg-pink-100 text-pink-700',
]

function getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?' }
function getAvatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)
}

export default function PaymentReviewsPage() {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const adminName = user?.name?.split(' ')[0] || 'Admin'

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [remarks, setRemarks] = useState('')
  const [remarksError, setRemarksError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [role, setRole] = useState('')
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true); setError(false)
    try {
      const res = await fetch('/api/payments?status=SUBMITTED', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setPayments(await res.json())
    } catch { setError(true) } finally { setLoading(false) }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchPayments()
    fetch('/api/profile', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => setRole(d?.role || '')).catch(() => {})
  }, [fetchPayments, status])

  const filteredPayments = payments.filter(p => {
    const q = searchInput.toLowerCase()
    return !q || p.student.user?.name?.toLowerCase().includes(q) || p.receiptNo.toLowerCase().includes(q) || p.student.admissionNo.toLowerCase().includes(q) || p.fee.name.toLowerCase().includes(q)
  })

  const handleForward = async (paymentId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, status: 'ACCOUNTANT_REVIEWED', accountantRemarks: remarks }),
      })
      if (res.ok) { setSelectedPayment(null); setRemarks(''); setRemarksError(''); fetchPayments() }
    } catch {} finally { setActionLoading(false) }
  }

  const handleReject = async (paymentId: string) => {
    if (!remarks.trim()) { setRemarksError('Remarks are required for rejection'); return }
    setRemarksError(''); setActionLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, status: 'REJECTED', accountantRemarks: remarks }),
      })
      if (res.ok) { setSelectedPayment(null); setRemarks(''); setRemarksError(''); fetchPayments() }
    } catch {} finally { setActionLoading(false) }
  }

  if (role !== '' && !['ACCOUNTANT'].includes(role)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center">
            <span className="mdi mdi-shield-lock text-4xl text-red-300" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-700">Access Denied</h2>
            <p className="text-sm text-gray-500 mt-1">Only accountants can review payments</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const totalPending = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="mdi mdi-file-document-check text-amber-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {adminName}</h1>
              <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')} &middot; {payments.length} payment{payments.length === 1 ? '' : 's'} awaiting review</p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-white col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-clock-outline text-amber-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pending Reviews</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-cash text-indigo-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Amount</span>
              </div>
              <p className="text-2xl font-bold text-indigo-700">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input type="text" placeholder="Search by student, receipt, or fee..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors" />
          {searchInput && <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><span className="mdi mdi-close text-lg" /></button>}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-3 bg-gray-100 rounded w-1/6" /></div>
                  <div className="h-5 bg-gray-200 rounded w-20" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center"><span className="mdi mdi-alert-circle-outline text-3xl text-red-400" /></div>
              <div><p className="font-medium text-gray-700">Failed to load payments</p><p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p></div>
              <button onClick={fetchPayments} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"><span className="mdi mdi-refresh" /> Retry</button>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center"><span className="mdi mdi-clipboard-check-outline text-3xl text-emerald-400" /></div>
              <div><p className="font-medium text-gray-700">{searchInput ? 'No payments match your search' : 'All caught up!'}</p><p className="text-sm text-gray-500 mt-1">{searchInput ? 'Try a different search term' : 'No pending payments to review'}</p></div>
              {searchInput && <button onClick={() => setSearchInput('')} className="mt-1 text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors">Clear search</button>}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Student</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Receipt</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Fee</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Submitted By</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Date</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPayments.map(p => {
                      const method = PAYMENT_METHODS[p.paymentMethod || 'CASH'] || PAYMENT_METHODS.CASH
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', getAvatarColor(p.student.user?.name || ''))}>{getInitials(p.student.user?.name || '')}</div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{p.student.user?.name}</p>
                                <p className="text-xs text-gray-500">{p.student.admissionNo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{p.receiptNo}</span>
                              {p.receiptImageUrl && <span className="mdi mdi-image text-gray-400 text-sm" title="Has receipt" />}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-medium">
                              <span className="mdi mdi-book-open-variant text-sm" /> {p.fee.name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</span>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            {p.parent ? (
                              <div className="flex items-center gap-2">
                                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold', getAvatarColor(p.parent?.user?.name || ''))}>{getInitials(p.parent?.user?.name || '')}</div>
                                <span className="text-sm text-gray-700 truncate max-w-[100px]">{p.parent?.user?.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <div>
                              <p className="text-sm text-gray-700">{format(new Date(p.submittedAt), 'MMM d, yyyy')}</p>
                              <p className="text-[11px] text-gray-400">{formatDistanceToNow(new Date(p.submittedAt), { addSuffix: true })}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => setSelectedPayment(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors border border-amber-200">
                              <span className="mdi mdi-eye" /> Review
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">Showing {filteredPayments.length} payment{filteredPayments.length === 1 ? '' : 's'} &middot; Total: {formatCurrency(filteredPayments.reduce((s, p) => s + p.amount, 0))}</p>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredPayments.map(p => {
                const method = PAYMENT_METHODS[p.paymentMethod || 'CASH'] || PAYMENT_METHODS.CASH
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', getAvatarColor(p.student.user?.name || ''))}>{getInitials(p.student.user?.name || '')}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.student.user?.name}</p>
                          <p className="text-xs text-gray-500">{p.student.admissionNo}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100')}>
                          <span className={cn('mdi text-sm', method.icon)} /> {method.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="mdi mdi-receipt text-gray-400 text-sm" />
                          <span className="font-mono text-gray-700">{p.receiptNo}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="mdi mdi-book-open-variant text-gray-400 text-sm" />
                          <span className="text-gray-600">{p.fee.name}</span>
                        </div>
                        {p.parent && (
                          <div className="flex items-center gap-1.5 col-span-2">
                            <span className="mdi mdi-account text-gray-400 text-sm" />
                            <span className="text-gray-600">Submitted by {p.parent?.user?.name}</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setSelectedPayment(p)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors border border-amber-200">
                        <span className="mdi mdi-eye" /> Review Payment
                      </button>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-gray-500 text-center pt-1">Showing {filteredPayments.length} payment{filteredPayments.length === 1 ? '' : 's'}</p>
            </div>
          </>
        )}

        {/* Review Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold', getAvatarColor(selectedPayment.student.user?.name || ''))}>{getInitials(selectedPayment.student.user?.name || '')}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{selectedPayment.student.user?.name}</h2>
                  <p className="text-xs text-gray-500">{selectedPayment.student.admissionNo} &middot; Review payment</p>
                </div>
                <button onClick={() => { setSelectedPayment(null); setRemarks(''); setRemarksError('') }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><span className="mdi mdi-close text-lg" /></button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Payment details grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-receipt text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Receipt</span></div>
                    <p className="text-sm font-mono font-medium text-gray-900">{selectedPayment.receiptNo}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-cash text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Amount</span></div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-book-open-variant text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Fee</span></div>
                    <p className="text-sm font-medium text-gray-900">{selectedPayment.fee.name}</p>
                    <p className="text-[11px] text-gray-400">{formatCurrency(selectedPayment.fee.amount)} total</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-credit-card text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Method</span></div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('mdi text-sm', PAYMENT_METHODS[selectedPayment.paymentMethod || 'CASH']?.icon || 'mdi-cash')} />
                      <p className="text-sm font-medium text-gray-900">{PAYMENT_METHODS[selectedPayment.paymentMethod || 'CASH']?.label || selectedPayment.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {selectedPayment.reference && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-identifier text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Reference</span></div>
                    <p className="text-sm font-mono text-gray-700">{selectedPayment.reference}</p>
                  </div>
                )}

                {/* Receipt image */}
                {selectedPayment.receiptImageUrl && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2"><span className="mdi mdi-image text-gray-400 text-sm" /><span className="text-[11px] font-semibold text-gray-500 uppercase">Proof of Payment</span></div>
                    <button onClick={() => setFullscreenImage(selectedPayment.receiptImageUrl!)}
                      className="w-full relative group cursor-pointer rounded-xl overflow-hidden border border-gray-200">
                      <img src={selectedPayment.receiptImageUrl} alt="Receipt" className="w-full max-h-48 object-cover group-hover:opacity-90 transition-opacity" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="mdi mdi-fullscreen text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </button>
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-text-box-outline text-gray-400" /> Remarks
                  </label>
                  <textarea value={remarks} onChange={(e) => { setRemarks(e.target.value); setRemarksError('') }}
                    className={cn('w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none',
                      remarksError ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200 focus:ring-amber-500/20 focus:border-amber-400')}
                    rows={3} placeholder="Add remarks (required for rejection)" />
                  {remarksError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span className="mdi mdi-alert-circle" /> {remarksError}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl sticky bottom-0">
                <button onClick={() => { setSelectedPayment(null); setRemarks(''); setRemarksError('') }}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Close</button>
                <button onClick={() => handleReject(selectedPayment.id)} disabled={actionLoading}
                  className={cn('inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border border-red-200 text-red-600 hover:bg-red-50', actionLoading && 'opacity-50 cursor-not-allowed')}>
                  {actionLoading ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <span className="mdi mdi-close-circle" />} Reject
                </button>
                <button onClick={() => handleForward(selectedPayment.id)} disabled={actionLoading}
                  className={cn('inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors', actionLoading && 'opacity-50 cursor-not-allowed')}>
                  {actionLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="mdi mdi-send-check" />} Forward
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen image viewer */}
        {fullscreenImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setFullscreenImage(null)}>
            <button onClick={() => setFullscreenImage(null)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-lg transition-colors z-10">
              <span className="mdi mdi-close text-2xl" />
            </button>
            <img src={fullscreenImage} alt="Receipt" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
