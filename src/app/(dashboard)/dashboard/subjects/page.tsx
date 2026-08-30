'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface Subject {
  id: string
  name: string
  code: string
  classId: string
  teacherId?: string
  class: { id: string; name: string; section?: string } | null
  teacher: { id: string; name: string } | null
  _count: { grades: number; assignments: number }
}

interface Class { id: string; name: string; section?: string }
interface Teacher { id: string; teacherRecordId?: string; name: string }

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700', 'bg-pink-100 text-pink-700',
]

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Mathematics: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  Science: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  English: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  History: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  'Physical Education': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
  Art: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' },
  Music: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
  'Computer Science': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
}

function getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?' }
function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0]
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function getSubjectColor(name: string) {
  return SUBJECT_COLORS[name] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' }
}

export default function SubjectsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const adminName = user?.name?.split(' ')[0] || 'Admin'

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [formData, setFormData] = useState({ name: '', code: '', classId: '', teacherId: '' })
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchSubjects = useCallback(async (q: string, classId: string) => {
    setLoading(true); setError(false)
    try {
      const params = new URLSearchParams()
      if (q) params.append('search', q)
      if (classId) params.append('classId', classId)
      const res = await fetch(`/api/subjects?${params}`)
      if (!res.ok) throw new Error()
      setSubjects(await res.json())
    } catch { setError(true) } finally { setLoading(false) }
  }, [])

  const fetchClasses = useCallback(async () => {
    try { const r = await fetch('/api/classes'); if (r.ok) setClasses(await r.json()) } catch {}
  }, [])

  const fetchTeachers = useCallback(async () => {
    try {
      const r = await fetch('/api/users?role=TEACHER')
      if (r.ok) {
        const d = await r.json()
        setTeachers(d.map((t: any) => ({ id: t.id, teacherRecordId: t.teacher?.teacherRecordId || null, name: t.name })))
      }
    } catch {}
  }, [])

  useEffect(() => { fetchClasses(); fetchTeachers() }, [fetchClasses, fetchTeachers])
  useEffect(() => { fetchSubjects(search, classFilter) }, [search, classFilter, fetchSubjects])

  const handleSearch = (v: string) => {
    setSearchInput(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(v), 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/subjects', {
        method: editingSubject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSubject ? { id: editingSubject.id, ...formData } : formData),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Failed to save subject'); return }
      setShowModal(false); setEditingSubject(null); resetForm(); fetchSubjects(search, classFilter)
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' })
      if (res.ok) { setDeletingId(null); fetchSubjects(search, classFilter) } else { alert('Failed to delete subject') }
    } catch {}
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    const matched = teachers.find(t => t.teacherRecordId === subject.teacherId)
    setFormData({ name: subject.name, code: subject.code, classId: subject.classId, teacherId: matched?.teacherRecordId || subject.teacherId || '' })
    setShowModal(true)
  }

  const resetForm = () => setFormData({ name: '', code: '', classId: '', teacherId: '' })

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const assignedCount = subjects.filter(s => s.teacherId).length
  const totalGrades = subjects.reduce((sum, s) => sum + s._count.grades, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <span className="mdi mdi-book-open-page-variant text-violet-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {adminName}</h1>
              <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')} &middot; {subjects.length} subject{subjects.length === 1 ? '' : 's'} total</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setEditingSubject(null); setShowModal(true) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
            <span className="mdi mdi-plus text-lg" /> Add Subject
          </button>
        </div>

        {/* Summary stats */}
        {!loading && subjects.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-book-open-variant text-gray-400 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-account-check text-emerald-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Assigned</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{assignedCount}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-account-off text-amber-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Unassigned</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{subjects.length - assignedCount}</p>
            </div>
            <div className="col-span-2 lg:col-span-1 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-scoreboard text-blue-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Grades</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{totalGrades}</p>
            </div>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input type="text" placeholder="Search by name or code..." value={searchInput} onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors" />
            {searchInput && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><span className="mdi mdi-close text-lg" /></button>}
          </div>
          <div className="relative">
            <span className="mdi mdi-filter-variant absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors appearance-none cursor-pointer">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
            </select>
            <span className="mdi mdi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setViewMode('table')} className={cn('px-3 py-2.5 transition-colors', viewMode === 'table' ? 'bg-violet-50 text-violet-700' : 'text-gray-400 hover:text-gray-600')}>
              <span className="mdi mdi-view-list text-lg" />
            </button>
            <div className="w-px bg-gray-200" />
            <button onClick={() => setViewMode('card')} className={cn('px-3 py-2.5 transition-colors', viewMode === 'card' ? 'bg-violet-50 text-violet-700' : 'text-gray-400 hover:text-gray-600')}>
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
                    <div className="h-5 bg-gray-200 rounded w-16" />
                    <div className="h-5 bg-gray-200 rounded w-20" />
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
                  <div className="flex items-center gap-3 mb-3"><div className="h-5 bg-gray-200 rounded w-1/3" /><div className="h-4 bg-gray-100 rounded w-16" /></div>
                  <div className="grid grid-cols-2 gap-2"><div className="h-3 bg-gray-100 rounded" /><div className="h-3 bg-gray-100 rounded" /></div>
                </div>
              ))}
            </div>
          )
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center"><span className="mdi mdi-alert-circle-outline text-3xl text-red-400" /></div>
              <div><p className="font-medium text-gray-700">Failed to load subjects</p><p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p></div>
              <button onClick={() => fetchSubjects(search, classFilter)} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"><span className="mdi mdi-refresh" /> Retry</button>
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><span className="mdi mdi-book-off-outline text-3xl text-gray-300" /></div>
              <div><p className="font-medium text-gray-700">{search || classFilter ? 'No subjects match your filters' : 'No subjects yet'}</p><p className="text-sm text-gray-500 mt-1">{search || classFilter ? 'Try adjusting your search or filter' : 'Create your first subject to get started'}</p></div>
              {(search || classFilter) && <button onClick={() => { handleSearch(''); setClassFilter('') }} className="mt-1 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors">Clear filters</button>}
            </div>
          </div>
        ) : viewMode === 'card' ? (
          /* Mobile cards */
          <div className="md:hidden space-y-3">
            {subjects.map(s => {
              const sc = getSubjectColor(s.name)
              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={cn('h-1', sc.bg)} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border mt-1', sc.bg, sc.text, sc.border)}>{s.code}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><span className="mdi mdi-pencil text-lg" /></button>
                        {deletingId === s.id ? (
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => handleDelete(s.id)} className="px-2 py-1 text-[11px] font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">Yes</button>
                            <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-[11px] font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><span className="mdi mdi-trash-can-outline text-lg" /></button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-domain text-gray-400 text-sm" />
                        <span className="text-gray-600">{s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ''}` : 'No class'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-account text-gray-400 text-sm" />
                        <span className={cn(s.teacher ? 'text-gray-900' : 'text-amber-600')}>{s.teacher?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-scoreboard text-gray-400 text-sm" />
                        <span className="text-gray-600">{s._count.grades} grades</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="mdi mdi-clipboard-text-outline text-gray-400 text-sm" />
                        <span className="text-gray-600">{s._count.assignments} tasks</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-gray-500 text-center pt-1">Showing {subjects.length} subject{subjects.length === 1 ? '' : 's'}</p>
          </div>
        ) : (
          /* Desktop table */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Subject</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Code</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Class</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Teacher</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden lg:table-cell">Stats</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {subjects.map(s => {
                    const sc = getSubjectColor(s.name)
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border', sc.bg, sc.text, sc.border)}>
                              <span className="mdi mdi-book-open-variant text-sm" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                              <p className="text-xs font-mono text-gray-400 sm:hidden">{s.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border', sc.bg, sc.text, sc.border)}>{s.code}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {s.class ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                              <span className="mdi mdi-domain text-sm" /> {s.class.name}{s.class.section ? ` - ${s.class.section}` : ''}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          {s.teacher ? (
                            <div className="flex items-center gap-2">
                              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold', getAvatarColor(s.teacher.name))}>{getInitials(s.teacher.name)}</div>
                              <span className="text-sm text-gray-700 truncate max-w-[120px]">{s.teacher.name}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium">
                              <span className="mdi mdi-account-off text-sm" /> Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1"><span className="mdi mdi-scoreboard text-gray-400" /> {s._count.grades}</span>
                            <span className="inline-flex items-center gap-1"><span className="mdi mdi-clipboard-text-outline text-gray-400" /> {s._count.assignments}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <span className="mdi mdi-pencil text-lg" />
                            </button>
                            {deletingId === s.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDelete(s.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">Delete</button>
                                <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeletingId(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
              <p className="text-xs text-gray-500">Showing {subjects.length} subject{subjects.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', editingSubject ? 'bg-blue-100' : 'bg-violet-100')}>
                  <span className={cn('mdi text-xl', editingSubject ? 'mdi-pencil text-blue-600' : 'mdi-plus text-violet-600')} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{editingSubject ? 'Edit Subject' : 'Create New Subject'}</h2>
                  <p className="text-xs text-gray-500">{editingSubject ? 'Update subject details' : 'Fill in the subject information'}</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingSubject(null); resetForm() }} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><span className="mdi mdi-close text-lg" /></button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-book text-gray-400" /> Subject Name
                  </label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                    placeholder="e.g., Mathematics" required />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-identifier text-gray-400" /> Subject Code
                  </label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                    placeholder="e.g., MATH101" required />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-domain text-gray-400" /> Class
                  </label>
                  <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors appearance-none" required>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-account text-gray-400" /> Teacher
                  </label>
                  <select value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors appearance-none">
                    <option value="">No Teacher</option>
                    {teachers.map(t => <option key={t.teacherRecordId || t.id} value={t.teacherRecordId || ''}>{t.name}</option>)}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); setEditingSubject(null); resetForm() }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving}
                    className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors', editingSubject ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-violet-600 text-white hover:bg-violet-700', saving && 'opacity-50 cursor-not-allowed')}>
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className={cn('mdi', editingSubject ? 'mdi-check' : 'mdi-plus')} />}
                    {editingSubject ? 'Update' : 'Create'}
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
