'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface UserWithTeacher {
  id: string
  name: string
  email: string
  phone?: string
  status?: string
  createdAt?: string
  teacher?: {
    id: string
    employeeId: string
    department?: string
    qualification?: string
    teacherRecordId?: string
  }
}

interface Class {
  id: string
  name: string
  section?: string
}

interface Subject {
  id: string
  name: string
  code: string
  teacherId?: string
  teacher?: { id: string; name: string } | null
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700', 'bg-pink-100 text-pink-700',
]

const DEPT_COLORS: Record<string, string> = {
  Science: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Mathematics: 'bg-blue-50 text-blue-700 border-blue-100',
  English: 'bg-purple-50 text-purple-700 border-purple-100',
  'Social Studies': 'bg-amber-50 text-amber-700 border-amber-100',
  'Physical Education': 'bg-rose-50 text-rose-700 border-rose-100',
  Arts: 'bg-pink-50 text-pink-700 border-pink-100',
  Languages: 'bg-cyan-50 text-cyan-700 border-cyan-100',
}

function getInitials(name: string) { return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?' }
function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0]
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function getDeptColor(dept: string) {
  return DEPT_COLORS[dept] || 'bg-gray-50 text-gray-600 border-gray-100'
}

export default function TeachersPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const adminName = user?.name?.split(' ')[0] || 'Admin'

  const [teachers, setTeachers] = useState<UserWithTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<UserWithTeacher | null>(null)
  const [assignClasses, setAssignClasses] = useState<Class[]>([])
  const [assignSubjects, setAssignSubjects] = useState<Subject[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchTeachers = useCallback(async (q: string) => {
    setLoading(true); setError(false)
    try {
      const params = new URLSearchParams()
      params.append('role', 'TEACHER')
      if (q) params.append('search', q)
      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error()
      setTeachers(await res.json())
    } catch { setError(true) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchTeachers(search)
    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(d => setRole(d?.role || '')).catch(() => {})
  }, [search, fetchTeachers])

  const handleSearch = (v: string) => {
    setSearchInput(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(v), 300)
  }

  const openAssignModal = async (teacher: UserWithTeacher) => {
    setSelectedTeacher(teacher); setShowAssignModal(true)
    try {
      const res = await fetch('/api/classes')
      if (!res.ok) { setAssignClasses([]); return }
      const data = await res.json()
      const classList = Array.isArray(data) ? data : []
      setAssignClasses(classList)
      if (classList.length > 0) { setSelectedClassId(classList[0].id); fetchSubjects(classList[0].id) }
    } catch {}
  }

  const fetchSubjects = async (classId: string) => {
    try {
      const res = await fetch(`/api/subjects?classId=${classId}`)
      if (!res.ok) { setAssignSubjects([]); return }
      const data = await res.json()
      setAssignSubjects(Array.isArray(data) ? data : [])
    } catch {}
  }

  const handleClassChange = (classId: string) => { setSelectedClassId(classId); fetchSubjects(classId) }

  const handleAssign = async (subjectId: string, currentlyAssigned: boolean) => {
    if (!selectedTeacher) return
    setSaving(true)
    try {
      const res = await fetch('/api/subjects', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subjectId, teacherId: currentlyAssigned ? '' : selectedTeacher.teacher?.teacherRecordId || '' }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed to update'); return }
      fetchSubjects(selectedClassId)
    } catch {} finally { setSaving(false) }
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const departments = [...new Set(teachers.map(t => t.teacher?.department).filter(Boolean))]
  const withQualification = teachers.filter(t => t.teacher?.qualification).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="mdi mdi-account-school text-blue-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {adminName}</h1>
              <p className="text-sm text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')} &middot; {teachers.length} teacher{teachers.length === 1 ? '' : 's'} on staff</p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {!loading && teachers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-account-group text-gray-400 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Teachers</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-domain text-blue-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Departments</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{departments.length}</p>
            </div>
            <div className="col-span-2 lg:col-span-1 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="mdi mdi-certificate text-emerald-500 text-lg" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Qualified</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{withQualification}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input type="text" placeholder="Search by name, email, or department..." value={searchInput} onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors" />
          {searchInput && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><span className="mdi mdi-close text-lg" /></button>}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-2/3" /><div className="h-3 bg-gray-100 rounded w-1/3" /></div>
                </div>
                <div className="space-y-2"><div className="h-3 bg-gray-100 rounded w-full" /><div className="h-3 bg-gray-100 rounded w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center"><span className="mdi mdi-alert-circle-outline text-3xl text-red-400" /></div>
              <div><p className="font-medium text-gray-700">Failed to load teachers</p><p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p></div>
              <button onClick={() => fetchTeachers(search)} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"><span className="mdi mdi-refresh" /> Retry</button>
            </div>
          </div>
        ) : teachers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><span className="mdi mdi-account-off-outline text-3xl text-gray-300" /></div>
              <div><p className="font-medium text-gray-700">{search ? 'No teachers match your search' : 'No teachers yet'}</p><p className="text-sm text-gray-500 mt-1">{search ? 'Try a different search term' : 'Teachers will appear here once added'}</p></div>
              {search && <button onClick={() => handleSearch('')} className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Clear search</button>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map(t => {
              const dept = t.teacher?.department
              const qual = t.teacher?.qualification
              return (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200 group">
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', getAvatarColor(t.name))}>{getInitials(t.name)}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{t.email}</p>
                      {t.teacher?.employeeId && <p className="text-[11px] font-mono text-gray-400 mt-0.5">{t.teacher.employeeId}</p>}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {dept && (
                      <div className="flex items-center gap-2">
                        <span className="mdi mdi-domain text-gray-400 text-sm w-5 text-center shrink-0" />
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border', getDeptColor(dept))}>{dept}</span>
                      </div>
                    )}
                    {qual && (
                      <div className="flex items-center gap-2">
                        <span className="mdi mdi-certificate text-gray-400 text-sm w-5 text-center shrink-0" />
                        <span className="text-sm text-gray-600">{qual}</span>
                      </div>
                    )}
                    {t.phone && (
                      <div className="flex items-center gap-2">
                        <span className="mdi mdi-phone text-gray-400 text-sm w-5 text-center shrink-0" />
                        <span className="text-sm text-gray-600">{t.phone}</span>
                      </div>
                    )}
                    {!dept && !qual && !t.phone && (
                      <p className="text-sm text-gray-400 italic">No additional details</p>
                    )}
                  </div>

                  {role === 'ADMIN' && t.teacher && (
                    <button onClick={() => openAssignModal(t)}
                      className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      <span className="mdi mdi-book-open-variant" /> Assign Subjects
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedTeacher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold', getAvatarColor(selectedTeacher.name))}>{getInitials(selectedTeacher.name)}</div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">{selectedTeacher.name}</h2>
                    <p className="text-xs text-gray-500">Assign subjects to this teacher</p>
                  </div>
                  <button onClick={() => { setShowAssignModal(false); setSelectedTeacher(null) }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><span className="mdi mdi-close text-lg" /></button>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-domain text-gray-400" /> Select Class
                  </label>
                  <select value={selectedClassId} onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors appearance-none cursor-pointer">
                    {assignClasses.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                  </select>
                </div>
              </div>

              {/* Subject list */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {assignSubjects.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <span className="mdi mdi-book-open-outline text-3xl text-gray-300" />
                    <p className="text-sm text-gray-500">No subjects in this class</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignSubjects.map(s => {
                      const isAssigned = s.teacherId === selectedTeacher.teacher?.teacherRecordId
                      return (
                        <div key={s.id} className={cn('flex items-center justify-between p-3.5 rounded-xl border transition-all',
                          isAssigned ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200')}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn('mdi text-lg', isAssigned ? 'mdi-check-circle text-emerald-500' : 'mdi-book-outline text-gray-400')} />
                              <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-7 mt-0.5">
                              <span className="text-xs font-mono text-gray-400">{s.code}</span>
                              {s.teacher && !isAssigned && (
                                <span className="text-xs text-gray-400">&middot; {s.teacher.name}</span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => handleAssign(s.id, isAssigned)} disabled={saving}
                            className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 shrink-0 ml-3',
                              isAssigned
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-600'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200')}>
                            {isAssigned ? 'Assigned' : 'Assign'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
