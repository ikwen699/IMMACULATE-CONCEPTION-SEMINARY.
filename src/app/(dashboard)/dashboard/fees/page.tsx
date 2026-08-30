'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format, isPast, isToday } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface Fee {
  id: string
  name: string
  amount: number
  class?: { id: string; name: string; section?: string }
  session: { id: string; name: string }
  term?: { id: string; name: string }
  description?: string
  dueDate?: string
  _count: { payments: number }
}

interface Class { id: string; name: string; section?: string }
interface Session { id: string; name: string; terms: { id: string; name: string }[] }

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

function getDueDateStatus(dueDate?: string): { label: string; color: string; bg: string } | null {
  if (!dueDate) return null
  const d = new Date(dueDate)
  if (isToday(d)) return { label: 'Due today', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
  if (isPast(d)) return { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
  return { label: format(d, 'MMM d'), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
}

export default function FeesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const adminName = user?.name?.split(' ')[0] || 'Admin'

  const [fees, setFees] = useState<Fee[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [role, setRole] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [formData, setFormData] = useState({ name: '', amount: 0, classId: '', sessionId: '', termId: '', description: '', dueDate: '' })
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchFees = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const res = await fetch('/api/fees')
      if (!res.ok) throw new Error()
      setFees(Array.isArray(await res.json()) ? await res.json() : [])
    } catch { setError(true) } finally { setLoading(false) }
  }, [])

  const fetchClasses = useCallback(async () => {
    try { const r = await fetch('/api/classes'); if (r.ok) setClasses(Array.isArray(await r.json()) ? await r.json() : []) } catch {}
  }, [])

  const fetchSessions = useCallback(async () => {
    try { const r = await fetch('/api/sessions'); if (r.ok) setSessions(await r.json()) } catch {}
  }, [])

  useEffect(() => {
    fetchFees(); fetchClasses(); fetchSessions()
    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(d => setRole(d?.role || '')).catch(() => {})
  }, [fetchFees, fetchClasses, fetchSessions])

  const handleSearch = (v: string) => {
    setSearchInput(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(v), 300)
  }

  const filteredFees = fees.filter(f => {
    const q = search.toLowerCase()
    const matchesSearch = !q || f.name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
    const matchesClass = !classFilter || f.class?.id === classFilter
    return matchesSearch && matchesClass
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/fees', {
        method: editingFee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFee ? { id: editingFee.id, ...formData } : formData),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed to save fee'); return }
      setShowModal(false); setEditingFee(null); resetForm(); fetchFees()
    } catch { alert('Failed to save fee. Please try again.'); } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/fees?id=${id}`, { method: 'DELETE' })
      if (res.ok) { setDeletingId(null); fetchFees() } else { alert('Failed to delete fee') }
    } catch { alert('Failed to delete fee. Please try again.'); }
  }

  const handleEdit = (fee: Fee) => {
    setEditingFee(fee)
    setFormData({
      name: fee.name, amount: fee.amount, classId: fee.class?.id || '',
      sessionId: fee.session?.id || '', termId: fee.term?.id || '',
      description: fee.description || '',
      dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : ''
    })
    setShowModal(true)
  }

  const resetForm = () => setFormData({ name: '', amount: 0, classId: '', sessionId: '', termId: '', description: '', dueDate: '' })

  const selectedSession = sessions.find(s => s.id === formData.sessionId)
  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0)
  const totalPayments = fees.reduce((sum, f) => sum + f._count.payments, 0)
  const overdueCount = fees.filter(f => f.dueDate && isPast(new Date(f.dueDate)) && !isToday(new Date(f.dueDate))).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <span className="mdi mdi-cash-multiple text-cyan-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {adminName}</h1>
              <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')} &middot; {fees.length} fee structure{fees.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          {role !== 'STUDENT' && (
            <button onClick={() => { resetForm(); setEditingFee(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 transition-colors shadow-sm">
              <span className="mdi mdi-plus text-lg" /> Add Fee
            </button>
          )}
        </div>

        {/* Summary stats */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-receipt-text text-gray-400 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Fees</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{fees.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-cash text-emerald-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Amount</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-check-circle text-blue-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Payments</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{totalPayments}</p>
            </div>
            <div className="col-span-2 lg:col-span-1 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-alert-circle text-red-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input type="text" placeholder="Search by name or description..." value={searchInput} onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors" />
            {searchInput && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><span className="mdi mdi-close text-lg" /></button>}
          </div>
          <div className="relative">
            <span className="mdi mdi-filter-variant absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors appearance-none cursor-pointer">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
            </select>
            <span className="mdi mdi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setViewMode('table')} className={cn('px-3 py-2.5 transition-colors', viewMode === 'table' ? 'bg-cyan-50 text-cyan-700' : 'text-gray-400 hover:text-gray-600')}>
              <span className="mdi mdi-view-list text-lg" />
            </button>
            <div className="w-px bg-gray-200" />
            <button onClick={() => setViewMode('card')} className={cn('px-3 py-2.5 transition-colors', viewMode === 'card' ? 'bg-cyan-50 text-cyan-700' : 'text-gray-400 hover:text-gray-600')}>
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
                    <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-3 bg-gray-100 rounded w-1/6" /></div>
                    <div className="h-5 bg-gray-200 rounded w-20" />
                    <div className="h-5 bg-gray-200 rounded w-16" />
                    <div className="h-5 bg-gray-200 rounded w-24" />
                    <div className="h-8 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3"><div className="h-5 bg-gray-200 rounded w-1/3" /><div className="h-6 bg-gray-200 rounded w-20" /></div>
                  <div className="grid grid-cols-2 gap-2"><div className="h-3 bg-gray-100 rounded" /><div className="h-3 bg-gray-100 rounded" /></div>
                </div>
              ))}
            </div>
          )
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center"><span className="mdi mdi-alert-circle-outline text-3xl text-red-400" /></div>
              <div><p className="font-medium text-gray-700">Failed to load fees</p><p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p></div>
              <button onClick={fetchFees} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"><span className="mdi mdi-refresh" /> Retry</button>
            </div>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><span className="mdi mdi-receipt-text-check text-3xl text-gray-300" /></div>
              <div><p className="font-medium text-gray-700">{search || classFilter ? 'No fees match your filters' : 'No fee structures yet'}</p><p className="text-sm text-gray-500 mt-1">{search || classFilter ? 'Try adjusting your search or filter' : 'Create your first fee structure to get started'}</p></div>
              {(search || classFilter) && <button onClick={() => { handleSearch(''); setClassFilter('') }} className="mt-1 text-sm font-medium text-cyan-600 hover:text-cyan-800 transition-colors">Clear filters</button>}
            </div>
          </div>
        ) : viewMode === 'card' ? (
          /* Mobile cards */
          <div className="md:hidden space-y-3">
            {filteredFees.map(f => {
              const dueStatus = getDueDateStatus(f.dueDate)
              return (
                <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{f.name}</p>
                        {f.description && <p className="text-xs text-gray-500 truncate mt-0.5">{f.description}</p>}
                      </div>
                      <p className="text-lg font-bold text-gray-900 shrink-0 ml-3">{formatCurrency(f.amount)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-domain text-gray-400 text-sm" />
                        <span className={cn(f.class ? 'text-gray-900' : 'text-cyan-600', 'font-medium')}>{f.class ? `${f.class.name}${f.class.section ? ` - ${f.class.section}` : ''}` : 'All Classes'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-calendar text-gray-400 text-sm" />
                        <span className="text-gray-600">{f.session?.name || 'N/A'}{f.term ? ` - ${f.term.name}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-clock-outline text-gray-400 text-sm" />
                        <span className="text-gray-600">{f.dueDate ? format(new Date(f.dueDate), 'MMM d, yyyy') : 'No due date'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-cash-check text-gray-400 text-sm" />
                        <span className="text-gray-600">{f._count.payments} payment{f._count.payments === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    {dueStatus && (
                      <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border mb-3', dueStatus.bg, dueStatus.color)}>
                        <span className="mdi mdi-clock-outline" /> {dueStatus.label}
                      </div>
                    )}
{(role === 'ADMIN' || role === 'ACCOUNTANT') && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(f)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          <span className="mdi mdi-pencil" /> Edit
                        </button>
                        {deletingId === f.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDelete(f.id)} className="px-3 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Delete</button>
                            <button onClick={() => setDeletingId(null)} className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(f.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                            <span className="mdi mdi-trash-can-outline" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-gray-500 text-center pt-1">Showing {filteredFees.length} fee{filteredFees.length === 1 ? '' : 's'}</p>
          </div>
        ) : (
          /* Desktop table */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Fee</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Class</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Session</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Due Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Payments</th>
                  {role !== 'STUDENT' && <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredFees.map(f => {
                    const dueStatus = getDueDateStatus(f.dueDate)
                    return (
                      <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                              <span className="mdi mdi-receipt-text text-cyan-600 text-sm" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                              {f.description && <p className="text-xs text-gray-500 truncate max-w-[180px]">{f.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(f.amount)}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          {f.class ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                              <span className="mdi mdi-domain text-sm" /> {f.class.name}{f.class.section ? ` - ${f.class.section}` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-600 text-xs font-medium">
                              <span className="mdi mdi-account-group text-sm" /> All Classes
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div>
                            <p className="text-sm text-gray-700">{f.session?.name || 'N/A'}</p>
                            {f.term && <p className="text-[11px] text-gray-400">{f.term.name}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          {dueStatus ? (
                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border', dueStatus.bg, dueStatus.color)}>
                              <span className="mdi mdi-clock-outline" /> {dueStatus.label}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="mdi mdi-cash-check text-gray-400 text-sm" />
                            <span className="text-sm text-gray-700">{f._count.payments}</span>
                          </div>
                        </td>
{role === 'ADMIN' || role === 'ACCOUNTANT' && (
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleEdit(f)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <span className="mdi mdi-pencil text-lg" />
                              </button>
                              {deletingId === f.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDelete(f.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">Delete</button>
                                  <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeletingId(f.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                  <span className="mdi mdi-trash-can-outline text-lg" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
              <p className="text-xs text-gray-500">Showing {filteredFees.length} fee{filteredFees.length === 1 ? '' : 's'} &middot; Total: {formatCurrency(filteredFees.reduce((s, f) => s + f.amount, 0))}</p>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', editingFee ? 'bg-blue-100' : 'bg-cyan-100')}>
                  <span className={cn('mdi text-xl', editingFee ? 'mdi-pencil text-blue-600' : 'mdi-plus text-cyan-600')} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{editingFee ? 'Edit Fee' : 'Create New Fee'}</h2>
                  <p className="text-xs text-gray-500">{editingFee ? 'Update fee details' : 'Set up a new fee structure'}</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingFee(null); resetForm() }} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><span className="mdi mdi-close text-lg" /></button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-receipt text-gray-400" /> Fee Name
                  </label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors"
                    placeholder="e.g., Tuition Fee" required />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-cash text-gray-400" /> Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₦</span>
                    <input type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors"
                      min="0" placeholder="0" required />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-domain text-gray-400" /> Class <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors appearance-none">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-calendar-range text-gray-400" /> Session
                  </label>
                  <select value={formData.sessionId} onChange={(e) => setFormData({ ...formData, sessionId: e.target.value, termId: '' })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors appearance-none" required>
                    <option value="">Select Session</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {selectedSession && selectedSession.terms.length > 0 && (
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                      <span className="mdi mdi-calendar-clock text-gray-400" /> Term <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <select value={formData.termId} onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors appearance-none">
                      <option value="">All Terms</option>
                      {selectedSession.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-text-box-outline text-gray-400" /> Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors resize-none"
                    rows={2} placeholder="Brief description of this fee..." />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-calendar-clock text-gray-400" /> Due Date <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-colors" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); setEditingFee(null); resetForm() }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving}
                    className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors', editingFee ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-cyan-600 text-white hover:bg-cyan-700', saving && 'opacity-50 cursor-not-allowed')}>
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className={cn('mdi', editingFee ? 'mdi-check' : 'mdi-plus')} />}
                    {editingFee ? 'Update' : 'Create'}
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
