'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface Class {
  id: string
  name: string
  section?: string
  capacity: number
  classTeacherId?: string
  _teacherName?: string | null
  _count: { students: number; subjects: number }
}

interface Teacher {
  id: string
  teacherRecordId?: string
  name: string
  email: string
}

const CLASS_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500',
]

function getClassColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return CLASS_COLORS[Math.abs(hash) % CLASS_COLORS.length]
}

function getInitials(name: string, section?: string) {
  const base = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  return section ? `${base}${section[0]}`.slice(0, 3) : base
}

export default function ClassesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const principalName = user?.name?.split(' ')[0] || 'Principal'
  const isAdmin = user?.role === 'ADMIN'

  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', section: '', classTeacherId: '', capacity: 40 })

  const fetchClasses = useCallback(async (q: string) => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      if (q) params.append('search', q)
      const res = await fetch(`/api/classes?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setClasses(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=TEACHER')
      if (res.ok) {
        const data = await res.json()
        setTeachers(data.map((t: any) => ({
          id: t.id,
          teacherRecordId: t.teacher?.teacherRecordId || null,
          name: t.name,
          email: t.email,
        })))
      }
    } catch {}
  }, [])

  useEffect(() => { fetchClasses(search) }, [fetchClasses, search])
  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  const handleSearch = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(value), 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const method = editingClass ? 'PUT' : 'POST'
      const body = editingClass ? { id: editingClass.id, ...formData } : formData
      const res = await fetch('/api/classes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to save class')
        return
      }
      setShowModal(false)
      setEditingClass(null)
      resetForm()
      fetchClasses(search)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/classes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeletingId(null)
        fetchClasses(search)
      } else {
        alert('Failed to delete class')
      }
    } catch {}
  }

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      section: cls.section || '',
      classTeacherId: cls.classTeacherId || '',
      capacity: cls.capacity,
    })
    setShowModal(true)
  }

  const resetForm = () => setFormData({ name: '', section: '', classTeacherId: '', capacity: 40 })

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  const totalStudents = classes.reduce((sum, c) => sum + c._count.students, 0)
  const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0)
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-door-open text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {principalName}
              </h1>
              <p className="text-sm text-gray-500">
                {format(today, 'EEEE, MMMM d, yyyy')} &middot; Class management
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { resetForm(); setEditingClass(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <span className="mdi mdi-plus text-lg" />
              Add Class
            </button>
          )}
        </div>

        {/* Summary stats */}
        {!loading && classes.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Classes', value: classes.length, icon: 'mdi-door-open', color: 'bg-blue-100 text-blue-600' },
              { label: 'Total Students', value: totalStudents, icon: 'mdi-school', color: 'bg-emerald-100 text-emerald-600' },
              { label: 'Avg Occupancy', value: `${avgOccupancy}%`, icon: 'mdi-chart-donut', color: 'bg-purple-100 text-purple-600' },
              { label: 'With Teacher', value: classes.filter(c => c._teacherName).length, icon: 'mdi-account-check', color: 'bg-amber-100 text-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.color)}>
                    <span className={cn('mdi text-lg', stat.icon)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search classes by name or section..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          />
          {searchInput && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <span className="mdi mdi-close text-lg" />
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load classes</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button onClick={() => fetchClasses(search)} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <span className="mdi mdi-refresh" /> Retry
              </button>
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="mdi mdi-door-open-lock text-3xl text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {search ? 'No classes match your search' : 'No classes yet'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {search ? 'Try a different search term' : 'Create your first class to get started'}
                </p>
              </div>
              {search ? (
                <button onClick={() => handleSearch('')} className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                  Clear search
                </button>
              ) : isAdmin ? (
                <button onClick={() => { resetForm(); setEditingClass(null); setShowModal(true) }} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  <span className="mdi mdi-plus" /> Create Class
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {classes.map((cls) => {
              const occupancy = cls.capacity > 0 ? Math.round((cls._count.students / cls.capacity) * 100) : 0
              const isFull = occupancy >= 100
              const isHigh = occupancy >= 80 && !isFull
              const barColor = isFull ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
              const textColor = isFull ? 'text-red-600' : isHigh ? 'text-amber-600' : 'text-emerald-600'

              return (
                <div key={cls.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                  {/* Card top with color accent */}
                  <div className={cn('h-1.5 rounded-t-xl', getClassColor(cls.name))} />

                  <div className="p-5">
                    {/* Name + section */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm', getClassColor(cls.name))}>
                          {getInitials(cls.name, cls.section)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {cls.name}
                            {cls.section && <span className="text-gray-400 font-normal"> &middot; {cls.section}</span>}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {cls._count.subjects} subject{cls._count.subjects === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(cls)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <span className="mdi mdi-pencil text-lg" />
                          </button>
                          {deletingId === cls.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(cls.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">
                                Delete
                              </button>
                              <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeletingId(cls.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <span className="mdi mdi-trash-can-outline text-lg" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500">Capacity</span>
                        <span className={cn('text-xs font-bold', textColor)}>
                          {cls._count.students}/{cls.capacity}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', barColor)}
                          style={{ width: `${Math.min(occupancy, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Teacher + stats */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="mdi mdi-account-tie text-gray-400 text-base shrink-0" />
                        {cls._teacherName ? (
                          <span className="text-gray-700 font-medium truncate">{cls._teacherName}</span>
                        ) : (
                          <span className="text-gray-400 italic">No teacher assigned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="mdi mdi-account-group text-gray-400 text-base shrink-0" />
                        <span className="text-gray-700">
                          {cls._count.students} student{cls._count.students === 1 ? '' : 's'}
                        </span>
                        {isFull && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">
                            <span className="mdi mdi-alert-circle" /> FULL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
              {/* Modal header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', editingClass ? 'bg-blue-100' : 'bg-indigo-100')}>
                  <span className={cn('mdi text-xl', editingClass ? 'mdi-pencil text-blue-600' : 'mdi-plus text-indigo-600')} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingClass ? 'Edit Class' : 'Create New Class'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingClass ? 'Update class details' : 'Fill in the class information'}
                  </p>
                </div>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-door-open text-gray-400 mr-1" /> Class Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                    placeholder="e.g., Grade 10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-format-list-bulleted text-gray-400 mr-1" /> Section
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                    placeholder="e.g., A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-account-tie text-gray-400 mr-1" /> Class Teacher
                  </label>
                  <select
                    value={formData.classTeacherId}
                    onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t.teacherRecordId || t.id} value={t.teacherRecordId || ''}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="mdi mdi-account-multiple text-gray-400 mr-1" /> Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 40 })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                    min="1"
                    required
                  />
                </div>

                {/* Modal actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingClass(null); resetForm() }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                      'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors',
                      editingClass
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700',
                      saving && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className={cn('mdi', editingClass ? 'mdi-check' : 'mdi-plus')} />
                    )}
                    {editingClass ? 'Update' : 'Create'}
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
