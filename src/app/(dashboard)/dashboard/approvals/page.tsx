'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface PendingUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  createdAt: string
  student?: { admissionNo: string; dateOfBirth?: string; gender?: string; class?: { name: string; section: string } }
  teacher?: { employeeId: string; department?: string; qualification?: string }
  parent?: { occupation?: string }
}

const ROLE_CONFIG: Record<string, { icon: string; badge: string }> = {
  ADMIN: { icon: 'mdi-shield-crown', badge: 'bg-red-100 text-red-700' },
  PRINCIPAL: { icon: 'mdi-account-star', badge: 'bg-purple-100 text-purple-700' },
  TEACHER: { icon: 'mdi-account-school', badge: 'bg-blue-100 text-blue-700' },
  STUDENT: { icon: 'mdi-school', badge: 'bg-emerald-100 text-emerald-700' },
  PARENT: { icon: 'mdi-account-group', badge: 'bg-amber-100 text-amber-700' },
  ACCOUNTANT: { icon: 'mdi-calculator', badge: 'bg-cyan-100 text-cyan-700' },
}

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  PENDING: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', label: 'Pending' },
  ACTIVE: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', label: 'Approved' },
  INACTIVE: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-600', label: 'Rejected' },
  SUSPENDED: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500', label: 'Suspended' },
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

const STAT_CARDS = [
  { label: 'Pending', status: 'PENDING', icon: 'mdi-clock-outline', activeBg: 'bg-amber-50 border-amber-200 ring-amber-100', activeText: 'text-amber-700', iconActive: 'text-amber-500', countClass: 'text-amber-700' },
  { label: 'Approved', status: 'ACTIVE', icon: 'mdi-check-circle', activeBg: 'bg-emerald-50 border-emerald-200 ring-emerald-100', activeText: 'text-emerald-700', iconActive: 'text-emerald-500', countClass: 'text-emerald-700' },
  { label: 'Rejected', status: 'INACTIVE', icon: 'mdi-close-circle', activeBg: 'bg-red-50 border-red-200 ring-red-100', activeText: 'text-red-700', iconActive: 'text-red-500', countClass: 'text-red-700' },
] as const

export default function ApprovalsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const adminName = user?.name?.split(' ')[0] || 'Admin'

  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('PENDING')
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [role, setRole] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; user: PendingUser } | null>(null)

  const fetchUsers = useCallback(async (status: string) => {
    setLoading(true); setError(false)
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch { setError(true) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchUsers(filter)
    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(d => setRole(d?.role || '')).catch(() => {})
  }, [filter, fetchUsers])

  const handleApprove = async (userId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status: 'ACTIVE' })
      })
      if (res.ok) { setSelectedUser(null); setConfirmAction(null); fetchUsers(filter) }
    } catch {} finally { setActionLoading(false) }
  }

  const handleReject = async (userId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status: 'INACTIVE' })
      })
      if (res.ok) { setSelectedUser(null); setConfirmAction(null); fetchUsers(filter) }
    } catch {} finally { setActionLoading(false) }
  }

  if (role !== '' && !['ADMIN'].includes(role)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center">
            <span className="mdi mdi-shield-lock text-4xl text-red-300" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-700">Access Denied</h2>
            <p className="text-sm text-gray-500 mt-1">Only administrators can manage registrations</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const allUsers = users
  const pendingCount = allUsers.filter(u => u.status === 'PENDING').length
  const approvedCount = allUsers.filter(u => u.status === 'ACTIVE').length
  const rejectedCount = allUsers.filter(u => u.status === 'INACTIVE').length
  const counts: Record<string, number> = { PENDING: pendingCount, ACTIVE: approvedCount, INACTIVE: rejectedCount }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="mdi mdi-clipboard-check text-amber-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {adminName}</h1>
              <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')} &middot; Registration approvals</p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3">
            {STAT_CARDS.map((s, i) => {
              const isActive = filter === s.status
              const count = counts[s.status] || 0
              return (
                <button key={s.status}
                  onClick={() => setFilter(isActive ? 'PENDING' : s.status)}
                  className={cn(
                    'p-4 rounded-xl border transition-all duration-200 text-left',
                    i === 0 ? 'col-span-2 sm:col-span-1' : '',
                    isActive
                      ? cn(s.activeBg, 'ring-1 shadow-sm')
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  )}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('mdi text-xl', s.icon, isActive ? s.iconActive : 'text-gray-400')} />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
                  </div>
                  <p className={cn('text-2xl font-bold', isActive ? s.countClass : 'text-gray-900')}>{count}</p>
                </button>
              )
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-3 bg-gray-100 rounded w-1/6" /></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                  <div className="h-6 bg-gray-200 rounded-full w-14" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center"><span className="mdi mdi-alert-circle-outline text-3xl text-red-400" /></div>
              <div><p className="font-medium text-gray-700">Failed to load registrations</p><p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p></div>
              <button onClick={() => fetchUsers(filter)} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"><span className="mdi mdi-refresh" /> Retry</button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><span className="mdi mdi-clipboard-check-outline text-3xl text-gray-300" /></div>
              <div>
                <p className="font-medium text-gray-700">{filter === 'PENDING' ? 'All caught up!' : 'No registrations found'}</p>
                <p className="text-sm text-gray-500 mt-1">{filter === 'PENDING' ? 'No pending registrations to review' : filter ? `No ${STATUS_CONFIG[filter]?.label?.toLowerCase()} registrations` : 'No registrations yet'}</p>
              </div>
              {filter && <button onClick={() => setFilter('PENDING')} className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Show pending</button>}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Role</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Registered</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => {
                      const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.STUDENT
                      const statusCfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.ACTIVE
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', getAvatarColor(u.name))}>{getInitials(u.name)}</div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold', roleCfg.badge)}>
                              <span className={cn('mdi text-sm', roleCfg.icon)} /> {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium', statusCfg.badge)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} /> {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <div>
                              <p className="text-sm text-gray-600">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</p>
                              <p className="text-[11px] text-gray-400">{format(new Date(u.createdAt), 'MMM d, yyyy')}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setSelectedUser(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View details">
                                <span className="mdi mdi-eye text-lg" />
                              </button>
                              {u.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleApprove(u.id)} disabled={actionLoading} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50" title="Approve">
                                    <span className="mdi mdi-check-circle text-lg" />
                                  </button>
                                  <button onClick={() => handleReject(u.id)} disabled={actionLoading} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Reject">
                                    <span className="mdi mdi-close-circle text-lg" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">Showing {users.length} registration{users.length === 1 ? '' : 's'}</p>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {users.map(u => {
                const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.STUDENT
                const statusCfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.ACTIVE
                const isPending = u.status === 'PENDING'
                return (
                  <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', getAvatarColor(u.name))}>{getInitials(u.name)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0', statusCfg.badge)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} /> {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', roleCfg.badge)}>
                          <span className={cn('mdi text-xs', roleCfg.icon)} /> {u.role}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span>
                      </div>
                      {isPending && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(u.id)} disabled={actionLoading}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                            <span className="mdi mdi-check-circle" /> Approve
                          </button>
                          <button onClick={() => handleReject(u.id)} disabled={actionLoading}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                            <span className="mdi mdi-close-circle" /> Reject
                          </button>
                        </div>
                      )}
                      {!isPending && (
                        <button onClick={() => setSelectedUser(u)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          <span className="mdi mdi-eye" /> View Details
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-gray-500 text-center pt-1">Showing {users.length} registration{users.length === 1 ? '' : 's'}</p>
            </div>
          </>
        )}

        {/* Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold', getAvatarColor(selectedUser.name))}>{getInitials(selectedUser.name)}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{selectedUser.name}</h2>
                  <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><span className="mdi mdi-close text-lg" /></button>
              </div>

              {/* Details */}
              <div className="px-6 py-5 space-y-4">
                {/* Meta row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-shield-account text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Role</span></div>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', ROLE_CONFIG[selectedUser.role]?.badge || 'bg-gray-100 text-gray-700')}>
                      <span className={cn('mdi text-sm', ROLE_CONFIG[selectedUser.role]?.icon || 'mdi-account')} /> {selectedUser.role}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-information text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Status</span></div>
                    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', STATUS_CONFIG[selectedUser.status]?.badge || 'bg-gray-100 text-gray-500')}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_CONFIG[selectedUser.status]?.dot || 'bg-gray-400')} /> {STATUS_CONFIG[selectedUser.status]?.label || selectedUser.status}
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-phone text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Phone</span></div>
                    <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1"><span className="mdi mdi-calendar text-gray-400 text-sm" /><span className="text-[11px] font-medium text-gray-500 uppercase">Registered</span></div>
                    <p className="text-sm text-gray-900">{format(new Date(selectedUser.createdAt), 'MMM d, yyyy')}</p>
                    <p className="text-[11px] text-gray-400">{formatDistanceToNow(new Date(selectedUser.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>

                {selectedUser.student && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-2"><span className="mdi mdi-school text-emerald-600 text-sm" /><span className="text-[11px] font-semibold text-emerald-700 uppercase">Student Info</span></div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-emerald-600">Admission:</span> <span className="font-medium text-gray-900">{selectedUser.student.admissionNo}</span></div>
                      {selectedUser.student.gender && <div><span className="text-emerald-600">Gender:</span> <span className="font-medium text-gray-900">{selectedUser.student.gender}</span></div>}
                      {selectedUser.student.dateOfBirth && <div><span className="text-emerald-600">DOB:</span> <span className="font-medium text-gray-900">{new Date(selectedUser.student.dateOfBirth).toLocaleDateString()}</span></div>}
                      {selectedUser.student.class && <div><span className="text-emerald-600">Class:</span> <span className="font-medium text-gray-900">{selectedUser.student.class.name} {selectedUser.student.class.section}</span></div>}
                    </div>
                  </div>
                )}

                {selectedUser.teacher && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-2"><span className="mdi mdi-account-school text-blue-600 text-sm" /><span className="text-[11px] font-semibold text-blue-700 uppercase">Teacher Info</span></div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-blue-600">Employee ID:</span> <span className="font-medium text-gray-900">{selectedUser.teacher.employeeId}</span></div>
                      {selectedUser.teacher.department && <div><span className="text-blue-600">Department:</span> <span className="font-medium text-gray-900">{selectedUser.teacher.department}</span></div>}
                      {selectedUser.teacher.qualification && <div className="col-span-2"><span className="text-blue-600">Qualification:</span> <span className="font-medium text-gray-900">{selectedUser.teacher.qualification}</span></div>}
                    </div>
                  </div>
                )}

                {selectedUser.parent && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-2"><span className="mdi mdi-account-group text-amber-600 text-sm" /><span className="text-[11px] font-semibold text-amber-700 uppercase">Parent Info</span></div>
                    <div className="text-sm">
                      {selectedUser.parent.occupation && <div><span className="text-amber-600">Occupation:</span> <span className="font-medium text-gray-900">{selectedUser.parent.occupation}</span></div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl sticky bottom-0">
                <button onClick={() => setSelectedUser(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Close</button>
                {selectedUser.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleReject(selectedUser.id)} disabled={actionLoading}
                      className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border border-red-200 text-red-600 hover:bg-red-50', actionLoading && 'opacity-50 cursor-not-allowed')}>
                      {actionLoading ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <span className="mdi mdi-close-circle" />} Reject
                    </button>
                    <button onClick={() => handleApprove(selectedUser.id)} disabled={actionLoading}
                      className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors bg-emerald-600 text-white hover:bg-emerald-700', actionLoading && 'opacity-50 cursor-not-allowed')}>
                      {actionLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="mdi mdi-check-circle" />} Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
