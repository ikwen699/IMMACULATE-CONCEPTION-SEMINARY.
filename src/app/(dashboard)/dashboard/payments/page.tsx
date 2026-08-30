'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow, isToday } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  amount: number
  paymentDate: string
  receiptNo: string
  paymentMethod?: string
  status: string
  notes?: string
  student: { id: string; admissionNo: string; user: { name: string } }
  fee: { id: string; name: string; amount: number }
  accountant?: { id: string; user: { name: string } }
}

interface Student { id: string; admissionNo: string; user: { name: string } }
interface Fee { id: string; name: string; amount: number }

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  COMPLETED: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', label: 'Completed' },
  PENDING: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', label: 'Pending' },
  FAILED: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-600', label: 'Failed' },
  REFUNDED: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700', label: 'Refunded' },
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
  if (!name) return AVATAR_COLORS[0]
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const adminName = user?.name?.split(' ')[0] || 'Admin'

  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [formData, setFormData] = useState({ studentId: '', feeId: '', amount: 0, paymentMethod: 'CASH', reference: '', notes: '' })
  const [role, setRole] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchPayments = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true); setError(false)
    try {
      const res = await fetch('/api/payments', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setPayments(await res.json())
    } catch { setError(true) } finally { setLoading(false) }
  }, [status])

  const fetchStudents = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const r = await fetch('/api/users?role=STUDENT', { cache: 'no-store' })
      if (r.ok) {
        const data = await r.json()
        setStudents(data.filter((u: any) => u.student).map((u: any) => ({
          id: u.id, admissionNo: u.student.admissionNo, user: { name: u.name }
        })))
      }
    } catch {}
  }, [status])

  const fetchFees = useCallback(async () => {
    if (status !== 'authenticated') return;
    try { const r = await fetch('/api/fees', { cache: 'no-store' }); if (r.ok) setFees(await r.json()) } catch {}
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchPayments(); fetchStudents(); fetchFees()
    fetch('/api/profile', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => setRole(d?.role || '')).catch(() => {})
  }, [fetchPayments, fetchStudents, fetchFees, status])

  const handleSearch = (v: string) => {
    setSearchInput(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(v), 300)
  }

  const filteredPayments = payments.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = !q || p.student.user?.name?.toLowerCase().includes(q) || p.receiptNo.toLowerCase().includes(q) || p.student.admissionNo.toLowerCase().includes(q)
    const matchesStatus = !statusFilter || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed to record payment'); return }
      setShowModal(false); resetForm(); fetchPayments()
    } catch { alert('Error recording payment') } finally { setSaving(false) }
  }

  const resetForm = () => setFormData({ studentId: '', feeId: '', amount: 0, paymentMethod: 'CASH', reference: '', notes: '' })

  const selectedFee = fees.find(f => f.id === formData.feeId)

  if (role !== '' && !['ADMIN', 'ACCOUNTANT'].includes(role)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center">
            <span className="mdi mdi-shield-lock text-4xl text-red-300" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-700">Access Denied</h2>
            <p className="text-sm text-gray-500 mt-1">Only administrators and accountants can manage payments</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const totalCollected = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0)
  const todayCollections = payments.filter(p => p.status === 'COMPLETED' && isToday(new Date(p.paymentDate))).reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length
  const pendingFeesTotal = fees.filter(f => !payments.some(p => p.fee.id === f.id && p.status === 'COMPLETED')).reduce((sum, f) => sum + f.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-cash-multiple text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {adminName}</h1>
              <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')} &middot; {payments.length} payment{payments.length === 1 ? '' : 's'} recorded</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            <span className="mdi mdi-plus text-lg" /> Record Payment
          </button>
        </div>

        {/* Summary stats */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-cash-check text-gray-400 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Collected</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-calendar-today text-indigo-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Today</span>
              </div>
              <p className="text-2xl font-bold text-indigo-700">{formatCurrency(todayCollections)}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-clock-outline text-amber-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pending</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{pendingPayments}</p>
            </div>
            <div className="col-span-2 lg:col-span-1 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-alert-circle text-red-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Unpaid Fees</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(pendingFeesTotal)}</p>
            </div>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input type="text" placeholder="Search by student, receipt, or admission no..." value={searchInput} onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" />
            {searchInput && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><span className="mdi mdi-close text-lg" /></button>}
          </div>
          <div className="relative">
            <span className="mdi mdi-filter-variant absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors appearance-none cursor-pointer">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="mdi mdi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setViewMode('table')} className={cn('px-3 py-2.5 transition-colors', viewMode === 'table' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:text-gray-600')}>
              <span className="mdi mdi-view-list text-lg" />
            </button>
            <div className="w-px bg-gray-200" />
            <button onClick={() => setViewMode('card')} className={cn('px-3 py-2.5 transition-colors', viewMode === 'card' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:text-gray-600')}>
              <span className="mdi mdi-view-grid text-lg" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          viewMode === 'table' ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-3 bg-gray-100 rounded w-1/6" /></div>
                    <div className="h-5 bg-gray-200 rounded w-20" />
                    <div className="h-5 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded-full w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/4" /></div></div>
                  <div className="grid grid-cols-2 gap-2"><div className="h-3 bg-gray-100 rounded" /><div className="h-3 bg-gray-100 rounded" /></div>
                </div>
              ))}
            </div>
          )
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
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><span className="mdi mdi-cash-off text-3xl text-gray-300" /></div>
              <div><p className="font-medium text-gray-700">{search || statusFilter ? 'No payments match your filters' : 'No payments yet'}</p><p className="text-sm text-gray-500 mt-1">{search || statusFilter ? 'Try adjusting your search or filter' : 'Record your first payment to get started'}</p></div>
              {(search || statusFilter) && <button onClick={() => { handleSearch(''); setStatusFilter('') }} className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Clear filters</button>}
            </div>
          </div>
        ) : viewMode === 'card' ? (
          /* Mobile cards */
          <div className="md:hidden space-y-3">
            {filteredPayments.map(p => {
              const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING
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
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0', statusCfg.badge)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} /> {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100')}>
                        <span className={cn('mdi text-sm', method.icon)} /> {method.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-receipt text-gray-400 text-sm" />
                        <span className="font-mono text-gray-700">{p.receiptNo}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-book-open-variant text-gray-400 text-sm" />
                        <span className="text-gray-600">{p.fee.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-calendar text-gray-400 text-sm" />
                        <span className="text-gray-600">{format(new Date(p.paymentDate), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-clock-outline text-gray-400 text-sm" />
                        <span className="text-gray-500">{formatDistanceToNow(new Date(p.paymentDate), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-gray-500 text-center pt-1">Showing {filteredPayments.length} payment{filteredPayments.length === 1 ? '' : 's'} &middot; {formatCurrency(filteredPayments.reduce((s, p) => s + p.amount, 0))}</p>
          </div>
        ) : (
          /* Desktop table */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Receipt</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Fee</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Method</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPayments.map(p => {
                    const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING
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
                          <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{p.receiptNo}</span>
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
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100')}>
                            <span className={cn('mdi text-sm', method.icon)} /> {method.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div>
                            <p className="text-sm text-gray-700">{format(new Date(p.paymentDate), 'MMM d, yyyy')}</p>
                            <p className="text-[11px] text-gray-400">{formatDistanceToNow(new Date(p.paymentDate), { addSuffix: true })}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium', statusCfg.badge)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} /> {statusCfg.label}
                          </span>
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
        )}

        {/* Record Payment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <span className="mdi mdi-cash-plus text-indigo-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
                  <p className="text-xs text-gray-500">Log a new student payment</p>
                </div>
                <button onClick={() => { setShowModal(false); resetForm() }} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><span className="mdi mdi-close text-lg" /></button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-account text-gray-400" /> Student
                  </label>
                  <select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors appearance-none" required>
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.user.name} ({s.admissionNo})</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-receipt text-gray-400" /> Fee
                  </label>
                  <select value={formData.feeId} onChange={(e) => setFormData({ ...formData, feeId: e.target.value, amount: fees.find(f => f.id === e.target.value)?.amount || 0 })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors appearance-none" required>
                    <option value="">Select Fee</option>
                    {fees.map(f => <option key={f.id} value={f.id}>{f.name} — {formatCurrency(f.amount)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-cash text-gray-400" /> Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₦</span>
                    <input type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                      min="0" placeholder="0" required />
                  </div>
                  {selectedFee && formData.amount > 0 && formData.amount !== selectedFee.amount && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <span className="mdi mdi-alert-circle" /> Amount differs from fee total ({formatCurrency(selectedFee.amount)})
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-credit-card text-gray-400" /> Payment Method
                  </label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors appearance-none">
                    {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-identifier text-gray-400" /> Reference <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                    placeholder="Transaction reference" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-text-box-outline text-gray-400" /> Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none"
                    rows={2} placeholder="Additional notes..." />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); resetForm() }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving}
                    className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors', saving && 'opacity-50 cursor-not-allowed')}>
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="mdi mdi-cash-check" />} Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
