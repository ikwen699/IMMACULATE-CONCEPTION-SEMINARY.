'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface UserWithStudent {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  createdAt: string
  student?: {
    admissionNo: string
    classId?: string
    class?: { name: string; section?: string }
    parent?: { name: string; email: string } | null
  }
}

interface Class {
  id: string
  name: string
  section?: string
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

export default function StudentsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const adminName = user?.name?.split(' ')[0] || 'Admin'

  const [students, setStudents] = useState<UserWithStudent[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [role, setRole] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<UserWithStudent | null>(null)
  const [editClassId, setEditClassId] = useState('')
  const [editAdmissionNo, setEditAdmissionNo] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchStudents = useCallback(async (q: string, classId: string) => {
    setLoading(true); setError(false)
    try {
      const params = new URLSearchParams()
      params.append('role', 'STUDENT')
      if (q) params.append('search', q)
      if (classId) params.append('classId', classId)
      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error()
      setStudents(Array.isArray(await res.json()) ? await res.json() : [])
    } catch { setError(true) } finally { setLoading(false) }
  }, [])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      if (res.ok) { const data = await res.json(); setClasses(Array.isArray(data) ? data : []) }
    } catch {}
  }, [])

  useEffect(() => {
    fetchClasses()
    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(d => setRole(d?.role || '')).catch(() => {})
  }, [])

  useEffect(() => { fetchStudents(search, classFilter) }, [search, classFilter, fetchStudents])

  const handleSearch = (v: string) => {
    setSearchInput(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(v), 300)
  }

  const openEditModal = (student: UserWithStudent) => {
    setEditingStudent(student)
    setEditClassId(student.student?.classId || '')
    setEditAdmissionNo(student.student?.admissionNo || '')
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!editingStudent) return
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingStudent.id, classId: editClassId, admissionNo: editAdmissionNo }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Failed to update student'); return }
      setShowEditModal(false); setEditingStudent(null); fetchStudents(search, classFilter)
    } catch {} finally { setSaving(false) }
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const enrolledCount = students.filter(s => s.student?.classId).length
  const unassignedCount = students.filter(s => !s.student?.classId).length
  const activeCount = students.filter(s => s.status === 'ACTIVE').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <span className="mdi mdi-school text-emerald-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {adminName}</h1>
              <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')} &middot; {students.length} student{students.length === 1 ? '' : 's'} enrolled</p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {!loading && students.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-account-multiple text-gray-400 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Students</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-check-circle text-emerald-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Active</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
            </div>
            <div className="col-span-2 lg:col-span-1 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-alert-circle-outline text-amber-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Unassigned</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{unassignedCount}</p>
            </div>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input type="text" placeholder="Search by name, email, or admission no..." value={searchInput} onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors" />
            {searchInput && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><span className="mdi mdi-close text-lg" /></button>}
          </div>
          <div className="relative">
            <span className="mdi mdi-filter-variant absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors appearance-none cursor-pointer">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
            </select>
            <span className="mdi mdi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setViewMode('table')} className={cn('px-3 py-2.5 transition-colors', viewMode === 'table' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400 hover:text-gray-600')}>
              <span className="mdi mdi-view-list text-lg" />
            </button>
            <div className="w-px bg-gray-200" />
            <button onClick={() => setViewMode('card')} className={cn('px-3 py-2.5 transition-colors', viewMode === 'card' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400 hover:text-gray-600')}>
              <span className="mdi mdi-view-grid text-lg" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          viewMode === 'table' ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5 space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-3 bg-gray-100 rounded w-1/6" /></div>
                    <div className="h-5 bg-gray-200 rounded w-20" />
                    <div className="h-5 bg-gray-200 rounded w-16" />
                    <div className="h-5 bg-gray-200 rounded w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/4" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2"><div className="h-3 bg-gray-100 rounded" /><div className="h-3 bg-gray-100 rounded" /></div>
                </div>
              ))}
            </div>
          )
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center"><span className="mdi mdi-alert-circle-outline text-3xl text-red-400" /></div>
              <div><p className="font-medium text-gray-700">Failed to load students</p><p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p></div>
              <button onClick={() => fetchStudents(search, classFilter)} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"><span className="mdi mdi-refresh" /> Retry</button>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><span className="mdi mdi-school-outline text-3xl text-gray-300" /></div>
              <div><p className="font-medium text-gray-700">{search || classFilter ? 'No students match your filters' : 'No students yet'}</p><p className="text-sm text-gray-500 mt-1">{search || classFilter ? 'Try adjusting your search or filter' : 'Students will appear here once enrolled'}</p></div>
              {(search || classFilter) && <button onClick={() => { handleSearch(''); setClassFilter('') }} className="mt-1 text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors">Clear filters</button>}
            </div>
          </div>
        ) : viewMode === 'card' ? (
          /* Mobile cards */
          <div className="md:hidden space-y-3">
            {students.map(s => {
              const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.ACTIVE
              const className = s.student?.class ? `${s.student.class.name}${s.student.class.section ? ` - ${s.student.class.section}` : ''}` : null
              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', getAvatarColor(s.name))}>{getInitials(s.name)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                        <p className="text-xs text-gray-500 truncate">{s.email}</p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0', statusCfg.badge)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} /> {statusCfg.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-identifier text-gray-400 text-sm" />
                        <span className="text-gray-500">Adm:</span>
                        <span className="font-mono text-gray-900">{s.student?.admissionNo || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-domain text-gray-400 text-sm" />
                        <span className={cn(className ? 'text-gray-900' : 'text-amber-600', 'font-medium')}>{className || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-phone text-gray-400 text-sm" />
                        <span className="text-gray-600">{s.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-account-outline text-gray-400 text-sm" />
                        <span className="text-gray-600 truncate">{s.student?.parent?.name || 'No parent'}</span>
                      </div>
                    </div>
                    {role === 'ADMIN' && (
                      <button onClick={() => openEditModal(s)}
                        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="mdi mdi-pencil" /> Edit Student
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-gray-500 text-center pt-1">Showing {students.length} student{students.length === 1 ? '' : 's'}</p>
          </div>
        ) : (
          /* Desktop table */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Admission</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Class</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Parent</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Status</th>
                  {role === 'ADMIN' && <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map(s => {
                    const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.ACTIVE
                    const className = s.student?.class ? `${s.student.class.name}${s.student.class.section ? ` - ${s.student.class.section}` : ''}` : null
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', getAvatarColor(s.name))}>{getInitials(s.name)}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                              <p className="text-xs text-gray-500 truncate">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="font-mono text-sm text-gray-700">{s.student?.admissionNo || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {className ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                              <span className="mdi mdi-domain text-sm" /> {className}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium">
                              <span className="mdi mdi-alert-outline text-sm" /> Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            {s.student?.parent ? (
                              <>
                                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold', getAvatarColor(s.student.parent.name))}>{getInitials(s.student.parent.name)}</div>
                                <span className="text-sm text-gray-700 truncate max-w-[120px]">{s.student.parent.name}</span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">No parent</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className="text-sm text-gray-600">{s.phone || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium', statusCfg.badge)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} /> {statusCfg.label}
                          </span>
                        </td>
                        {role === 'ADMIN' && (
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => openEditModal(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit student">
                              <span className="mdi mdi-pencil text-lg" />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
              <p className="text-xs text-gray-500">Showing {students.length} student{students.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold', getAvatarColor(editingStudent.name))}>{getInitials(editingStudent.name)}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{editingStudent.name}</h2>
                  <p className="text-xs text-gray-500">Edit student record</p>
                </div>
                <button onClick={() => { setShowEditModal(false); setEditingStudent(null) }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><span className="mdi mdi-close text-lg" /></button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-identifier text-gray-400" /> Admission Number
                  </label>
                  <input type="text" value={editAdmissionNo} onChange={(e) => setEditAdmissionNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                    placeholder="e.g. ICS/2026/0001" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-domain text-gray-400" /> Assign to Class
                  </label>
                  <select value={editClassId} onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors appearance-none">
                    <option value="">No Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <button onClick={() => { setShowEditModal(false); setEditingStudent(null) }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors', saving && 'opacity-50 cursor-not-allowed')}>
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="mdi mdi-check" />} Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
