'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  createdAt: string
  student?: { admissionNo: string; classId?: string; class?: { name: string; section: string }; parentId?: string }
  teacher?: { employeeId: string; department?: string; qualification?: string }
  parent?: { occupation?: string }
}

interface ParentOption {
  id: string
  userId: string
  user: { name: string; email: string }
}

const ROLE_CONFIG: Record<string, { icon: string; color: string; badge: string }> = {
  ADMIN: { icon: 'mdi-shield-crown', color: 'bg-red-100 text-red-600', badge: 'bg-red-100 text-red-700' },
  PRINCIPAL: { icon: 'mdi-account-star', color: 'bg-purple-100 text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  TEACHER: { icon: 'mdi-account-school', color: 'bg-blue-100 text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  STUDENT: { icon: 'mdi-school', color: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  PARENT: { icon: 'mdi-account-group', color: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  ACCOUNTANT: { icon: 'mdi-calculator', color: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
}

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  ACTIVE: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', label: 'Active' },
  INACTIVE: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500', label: 'Inactive' },
  SUSPENDED: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-600', label: 'Suspended' },
  PENDING: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600', label: 'Pending' },
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

export default function UsersPage() {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const adminName = user?.name?.split(' ')[0] || 'Admin'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [parentsList, setParentsList] = useState<ParentOption[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'STUDENT', phone: '', address: '',
    department: '', qualification: '', occupation: '', dateOfBirth: '', gender: 'MALE',
    classId: '', parentId: '', admissionNo: '',
  })

  const fetchUsers = useCallback(async (q: string, role: string) => {
    if (status !== 'authenticated') return;
    setLoading(true); setError(false)
    try {
      const params = new URLSearchParams()
      if (role) params.append('role', role)
      if (q) params.append('search', q)
      const res = await fetch(`/api/users?${params}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch { setError(true) } finally { setLoading(false) }
  }, [status])

  const fetchParents = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const res = await fetch('/api/users?role=PARENT', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setParentsList(data.filter((u: any) => u.parent).map((u: any) => ({
          id: u.parent.id, userId: u.id, user: { name: u.name, email: u.email },
        })))
      }
    } catch {}
  }, [status])

  useEffect(() => { if (status !== 'authenticated') return;
    fetchUsers(search, roleFilter) }, [fetchUsers, search, roleFilter, status])
  useEffect(() => { if (status !== 'authenticated') return;
    if (showModal && formData.role === 'STUDENT') fetchParents() }, [showModal, formData.role, fetchParents, status])

  const handleSearch = (v: string) => {
    setSearchInput(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(v), 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const method = editingUser ? 'PUT' : 'POST'
      const body = editingUser ? { id: editingUser.id, ...formData, email: formData.email.toLowerCase() } : { ...formData, email: formData.email.toLowerCase() }
      const res = await fetch('/api/users', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed to save user'); return }
      setShowModal(false); setEditingUser(null); resetForm(); fetchUsers(search, roleFilter)
    } catch (err) { console.error('Failed to save user:', err); alert('An unexpected error occurred. Please try again.') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      if (res.ok) { setDeletingId(null); fetchUsers(search, roleFilter) } else { alert('Failed to delete user') }
    } catch {}
  }

  const handleEdit = (u: User) => {
    setEditingUser(u)
    setFormData({
      name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', address: '',
      department: u.teacher?.department || '', qualification: '', occupation: '',
      dateOfBirth: '', gender: 'MALE', classId: u.student?.classId || '',
      parentId: u.student?.parentId || '', admissionNo: u.student?.admissionNo || '',
    })
    setShowModal(true)
  }

  const resetForm = () => setFormData({
    name: '', email: '', password: '', role: 'STUDENT', phone: '', address: '',
    department: '', qualification: '', occupation: '', dateOfBirth: '', gender: 'MALE',
    classId: '', parentId: '', admissionNo: '',
  })

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc }, {} as Record<string, number>)
  const activeCount = users.filter(u => u.status === 'ACTIVE').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-account-group text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {adminName}</h1>
              <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')} &middot; User management</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); fetchParents() }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            <span className="mdi mdi-plus text-lg" /> Add User
          </button>
        </div>

        {/* Summary stats */}
        {!loading && users.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
              <button key={role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
                className={cn('p-3 rounded-xl border transition-all duration-200 text-left',
                  roleFilter === role ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200' : 'border-gray-100 bg-white hover:bg-gray-50')}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('mdi text-lg', config.icon, roleFilter === role ? 'text-indigo-600' : 'text-gray-400')} />
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">{role}</span>
                </div>
                <p className={cn('text-xl font-bold', roleFilter === role ? 'text-indigo-700' : 'text-gray-900')}>{roleCounts[role] || 0}</p>
              </button>
            ))}
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input type="text" placeholder="Search by name or email..." value={searchInput} onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" />
            {searchInput && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><span className="mdi mdi-close text-lg" /></button>}
          </div>
          <div className="relative">
            <span className="mdi mdi-filter-variant absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors appearance-none cursor-pointer">
              <option value="">All Roles</option>
              {Object.keys(ROLE_CONFIG).map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
            </select>
            <span className="mdi mdi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-3 bg-gray-100 rounded w-1/6" /></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                  <div className="h-6 bg-gray-200 rounded-full w-14" />
                  <div className="h-8 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center"><span className="mdi mdi-alert-circle-outline text-3xl text-red-400" /></div>
              <div><p className="font-medium text-gray-700">Failed to load users</p><p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p></div>
              <button onClick={() => fetchUsers(search, roleFilter)} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"><span className="mdi mdi-refresh" /> Retry</button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><span className="mdi mdi-account-off-outline text-3xl text-gray-300" /></div>
              <div><p className="font-medium text-gray-700">{search || roleFilter ? 'No users match your filters' : 'No users yet'}</p><p className="text-sm text-gray-500 mt-1">{search || roleFilter ? 'Try adjusting your search or filter' : 'Create your first user to get started'}</p></div>
              {(search || roleFilter) && <button onClick={() => { handleSearch(''); setRoleFilter('') }} className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Clear filters</button>}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Details</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Joined</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => {
                    const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.STUDENT
                    const statusCfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.ACTIVE
                    const detail = u.student ? `Adm: ${u.student.admissionNo}` : u.teacher ? `Emp: ${u.teacher.employeeId}` : ''
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
                          {detail ? <span className="text-sm text-gray-600">{detail}</span> : <span className="text-sm text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className="text-sm text-gray-600">{format(new Date(u.createdAt), 'MMM d, yyyy')}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <span className="mdi mdi-pencil text-lg" />
                            </button>
                            {deletingId === u.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDelete(u.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">Delete</button>
                                <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeletingId(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <span className="mdi mdi-trash-can-outline text-lg" />
                              </button>
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
              <p className="text-xs text-gray-500">Showing {users.length} user{users.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', editingUser ? 'bg-blue-100' : 'bg-indigo-100')}>
                  <span className={cn('mdi text-xl', editingUser ? 'mdi-pencil text-blue-600' : 'mdi-account-plus text-indigo-600')} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{editingUser ? 'Edit User' : 'Create New User'}</h2>
                  <p className="text-xs text-gray-500">{editingUser ? 'Update user details' : 'Fill in the user information'}</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingUser(null); resetForm() }} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><span className="mdi mdi-close text-lg" /></button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-account text-gray-400" /> Full Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" placeholder="e.g., John Doe" required />
                </div>
                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-email text-gray-400" /> Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" placeholder="john@example.com" required />
                </div>
                {/* Password */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-lock text-gray-400" /> Password
                    {editingUser && <span className="text-xs text-gray-400 font-normal">(leave blank to keep current)</span>}
                  </label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" placeholder="••••••••" required={!editingUser} />
                </div>
                {/* Role */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-shield-account text-gray-400" /> Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors">
                    {Object.keys(ROLE_CONFIG).map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                {/* Phone */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-phone text-gray-400" /> Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" placeholder="+1 (555) 000-0000" />
                </div>

                {/* Teacher fields */}
                {formData.role === 'TEACHER' && (
                  <>
                    <div><label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-domain text-gray-400" /> Department</label>
                      <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" placeholder="e.g., Science" /></div>
                    <div><label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-certificate text-gray-400" /> Qualification</label>
                      <input type="text" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" placeholder="e.g., B.Ed" /></div>
                  </>
                )}

                {/* Student fields */}
                {formData.role === 'STUDENT' && (
                  <>
                    <div><label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-identifier text-gray-400" /> Admission Number</label>
                      <input type="text" value={formData.admissionNo} onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" placeholder="e.g. ICS/2026/0001" /></div>
                    <div><label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-cake-variant text-gray-400" /> Date of Birth</label>
                      <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" /></div>
                    <div><label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-gender-male-female text-gray-400" /> Gender</label>
                      <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors">
                        <option value="MALE">Male</option><option value="FEMALE">Female</option>
                      </select></div>
                    <div><label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-account-link text-gray-400" /> Link Parent</label>
                      <select value={formData.parentId} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors">
                        <option value="">No Parent</option>
                        {parentsList.map(p => <option key={p.id} value={p.id}>{p.user.name} ({p.user.email})</option>)}
                      </select></div>
                  </>
                )}

                {/* Parent fields */}
                {formData.role === 'PARENT' && (
                  <div><label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><span className="mdi mdi-briefcase text-gray-400" /> Occupation</label>
                    <input type="text" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" placeholder="e.g., Engineer" /></div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); setEditingUser(null); resetForm() }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors', editingUser ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-indigo-600 text-white hover:bg-indigo-700', saving && 'opacity-50 cursor-not-allowed')}>
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className={cn('mdi', editingUser ? 'mdi-check' : 'mdi-plus')} />}
                    {editingUser ? 'Update' : 'Create'}
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
