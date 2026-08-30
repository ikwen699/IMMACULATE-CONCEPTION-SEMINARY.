'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn, getInitials } from '@/lib/utils'

interface TimetableEntry {
  id: string
  day: string
  startTime: string
  endTime: string
  subjectId: string
  teacherId: string
  classId: string
  subject: { name: string; code: string } | null
  teacher: { id: string; name: string } | null
  class: { name: string; section?: string } | null
}

interface Class { id: string; name: string; section?: string }
interface Subject { id: string; name: string; code: string }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const DAY_ABBR: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
}

const SUBJECT_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500',
]

const SUBJECT_TEXT_COLORS: Record<string, string> = {
  'bg-blue-500': 'text-blue-700 bg-blue-50 border-blue-200',
  'bg-emerald-500': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'bg-purple-500': 'text-purple-700 bg-purple-50 border-purple-200',
  'bg-amber-500': 'text-amber-700 bg-amber-50 border-amber-200',
  'bg-rose-500': 'text-rose-700 bg-rose-50 border-rose-200',
  'bg-cyan-500': 'text-cyan-700 bg-cyan-50 border-cyan-200',
  'bg-indigo-500': 'text-indigo-700 bg-indigo-50 border-indigo-200',
  'bg-pink-500': 'text-pink-700 bg-pink-50 border-pink-200',
  'bg-teal-500': 'text-teal-700 bg-teal-50 border-teal-200',
  'bg-orange-500': 'text-orange-700 bg-orange-50 border-orange-200',
}

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-purple-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
]

function getColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length]
}

function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function formatTime12(time: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function getCurrentDayIndex() {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

function getCurrentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

type ViewMode = 'grid' | 'cards'

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [role, setRole] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ subjectId: '', day: 'Monday', startTime: '08:00', endTime: '09:00' })

  const fetchProfile = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' })
      const profile = await res.json()
      setRole(profile.role || '')
      if (profile.role === 'TEACHER') {
        const tId = profile.teacher?.id
        if (tId) {
          setTeacherId(tId)
          const classRes = await fetch('/api/classes', { cache: 'no-store' })
          const classData = await classRes.json()
          setClasses(classData)
          if (classData.length > 0) setSelectedClass(classData[0].id)
        }
      } else if (profile.role === 'STUDENT') {
        setSelectedClass(profile.student?.classId || '')
      } else {
        const classRes = await fetch('/api/classes', { cache: 'no-store' })
        if (classRes.ok) setClasses(Array.isArray(await classRes.json()) ? await classRes.json() : [])
      }
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [status])

  useEffect(() => { if (status !== 'authenticated') return;
    fetchProfile() }, [fetchProfile, status])

  const fetchTimetable = useCallback(async () => {
    if (status !== 'authenticated') return;
    if (!selectedClass) return
    try {
      const res = await fetch(`/api/timetable?classId=${selectedClass}`, { cache: 'no-store' })
      if (res.ok) setTimetable(Array.isArray(await res.json()) ? await res.json() : [])
    } catch { setError(true) }
  }, [selectedClass, status])

  const fetchSubjects = useCallback(async (classId: string) => {
    if (status !== 'authenticated') return;
    try {
      const res = await fetch(`/api/subjects?classId=${classId}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSubjects(role === 'TEACHER' ? data.filter((s: any) => s.teacherId === teacherId) : data)
      }
    } catch { /* ignore */ }
  }, [role, teacherId, status])

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (selectedClass) {
      fetchTimetable()
      if (role === 'TEACHER' || role === 'ADMIN') fetchSubjects(selectedClass)
    }
  }, [selectedClass, role, fetchTimetable, fetchSubjects, status])

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass, ...formData }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed'); return }
      setShowForm(false)
      setFormData({ subjectId: '', day: 'Monday', startTime: '08:00', endTime: '09:00' })
      fetchTimetable()
    } catch { /* ignore */ }
  }

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null)
    try { await fetch(`/api/timetable?id=${id}`, { method: 'DELETE' }); fetchTimetable() }
    catch { /* ignore */ }
  }

  const getEntriesForDay = (day: string) =>
    timetable.filter(e => e.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))

  const allTimes = [...new Set(timetable.map(t => t.startTime))].sort()
  const todayIdx = getCurrentDayIndex()
  const currentMinutes = getCurrentMinutes()
  const canManage = (role === 'TEACHER' || role === 'ADMIN') && selectedClass
  const canAdd = role === 'ADMIN' && selectedClass
  const classInfo = classes.find(c => c.id === selectedClass)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-calendar text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
              <p className="text-sm text-gray-500">
                {role === 'STUDENT'
                  ? classInfo ? `${classInfo.name}${classInfo.section ? ` - ${classInfo.section}` : ''} schedule` : 'Your class schedule'
                  : 'Manage class schedules'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role !== 'STUDENT' && timetable.length > 0 && (
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600')}
                  title="Grid view"
                >
                  <span className="mdi mdi-view-grid text-lg" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={cn('p-2 transition-colors', viewMode === 'cards' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600')}
                  title="List view"
                >
                  <span className="mdi mdi-view-list text-lg" />
                </button>
              </div>
            )}
            {canAdd && (
              <button
                onClick={() => setShowForm(!showForm)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm',
                  showForm ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                )}
              >
                <span className={cn('mdi text-lg', showForm ? 'mdi-close' : 'mdi-plus')} />
                {showForm ? 'Cancel' : 'Add Entry'}
              </button>
            )}
          </div>
        </div>

        {/* Class selector for non-students */}
        {role !== 'STUDENT' && classes.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  selectedClass === cls.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {cls.name}{cls.section ? ` - ${cls.section}` : ''}
              </button>
            ))}
          </div>
        )}

        {/* Create form modal */}
        {showForm && canAdd && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-scale-in">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <span className="mdi mdi-plus-circle text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">New Timetable Entry</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-white transition-shadow"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Day</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-white transition-shadow"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 transition-shadow"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowForm(false); setFormData({ subjectId: '', day: 'Monday', startTime: '08:00', endTime: '09:00' }) }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.subjectId}
                className={cn(
                  'inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm',
                  formData.subjectId ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-300 text-white cursor-not-allowed'
                )}
              >
                <span className="mdi mdi-plus" />
                Add to Timetable
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        {!selectedClass && !loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="mdi mdi-calendar-blank text-3xl text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">
                {role === 'STUDENT' ? 'No class assigned' : 'Select a class'}
              </p>
              <p className="text-sm text-gray-500">
                {role === 'STUDENT' ? 'You are not assigned to any class yet.' : 'Choose a class above to view the timetable.'}
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading timetable...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load timetable</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong.</p>
              </div>
              <button onClick={fetchTimetable} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <span className="mdi mdi-refresh" /> Retry
              </button>
            </div>
          </div>
        ) : timetable.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="mdi mdi-calendar-blank-outline text-3xl text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">No timetable entries</p>
                <p className="text-sm text-gray-500 mt-1">
                  {role === 'STUDENT' ? 'No schedule has been set for your class yet.' : 'Add an entry to get started.'}
                </p>
              </div>
            </div>
          </div>
        ) : viewMode === 'cards' && role !== 'STUDENT' ? (
          /* Card/list view for teachers/admins */
          <div className="space-y-4">
            {DAYS.map(day => {
              const dayEntries = getEntriesForDay(day)
              if (dayEntries.length === 0) return null
              const isToday = DAYS[todayIdx] === day
              return (
                <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={cn(
                    'px-5 py-3 flex items-center gap-2',
                    isToday ? 'bg-indigo-600 text-white' : 'bg-gray-50'
                  )}>
                    <span className={cn('mdi mdi-calendar', isToday ? 'text-indigo-200' : 'text-gray-400')} />
                    <h3 className={cn('text-sm font-semibold', isToday ? 'text-white' : 'text-gray-700')}>{day}</h3>
                    {isToday && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-indigo-100 font-medium">Today</span>}
                    <span className={cn('text-xs ml-auto', isToday ? 'text-indigo-200' : 'text-gray-400')}>{dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {dayEntries.map(entry => {
                      const color = getColor(entry.subject?.name || '')
                      return (
                        <div key={entry.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                          <div className={cn('w-1 h-12 rounded-full shrink-0', color)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{entry.subject?.name || 'Unknown'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {entry.teacher && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <span className="mdi mdi-account text-sm" /> {entry.teacher.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-mono text-gray-400 shrink-0">
                            {formatTime12(entry.startTime)} – {formatTime12(entry.endTime)}
                          </span>
{canManage && (role === 'ADMIN' || entry.teacherId === teacherId) && (
                                  <div className="shrink-0">
                                {deleteConfirmId === entry.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                  <button onClick={() => handleDelete(entry.id)} className="text-xs font-medium text-red-700 hover:text-red-900 px-2 py-0.5 rounded hover:bg-red-100 transition-colors">Delete</button>
                                  <button onClick={() => setDeleteConfirmId(null)} className="text-xs font-medium text-gray-600 hover:text-gray-800 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors">Cancel</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(entry.id)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete"
                                >
                                  <span className="mdi mdi-delete-outline text-lg" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Grid view */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-24">Time</th>
                    {DAYS.map((day, i) => {
                      const isToday = i === todayIdx
                      return (
                        <th
                          key={day}
                          className={cn(
                            'px-3 py-3 text-center text-xs font-semibold uppercase',
                            isToday ? 'bg-indigo-600 text-white' : 'text-gray-500'
                          )}
                        >
                          <span className="hidden sm:inline">{day}</span>
                          <span className="sm:hidden">{DAY_ABBR[day]}</span>
                          {isToday && <span className="block text-[10px] font-normal mt-0.5 text-indigo-200">Today</span>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allTimes.map(time => {
                    const mins = timeToMinutes(time)
                    const isCurrentHour = currentMinutes >= mins && currentMinutes < mins + 60
                    return (
                      <tr key={time} className={cn(isCurrentHour && 'bg-indigo-50/30')}>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500 bg-gray-50/80 align-top pt-4">
                          <div className="flex items-center gap-1.5">
                            {isCurrentHour && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shrink-0" />}
                            {formatTime12(time)}
                          </div>
                        </td>
                        {DAYS.map((day, dayIdx) => {
                          const entry = timetable.find(e => e.day === day && e.startTime === time)
                          const isToday = dayIdx === todayIdx
                          return (
                            <td
                              key={day}
                              className={cn(
                                'px-2 py-2 align-top',
                                isToday ? 'bg-indigo-50/20' : ''
                              )}
                            >
                              {entry ? (
                                <div className={cn(
                                  'rounded-xl p-3 border transition-shadow hover:shadow-sm relative group',
                                  SUBJECT_TEXT_COLORS[getColor(entry.subject?.name || '')] || 'text-gray-700 bg-gray-50 border-gray-200'
                                )}>
                                  <p className="text-sm font-semibold leading-tight">{entry.subject?.name || '—'}</p>
                                  {entry.teacher && (
                                    <p className="text-[11px] opacity-70 mt-1 flex items-center gap-1">
                                      <span className="mdi mdi-account text-xs" />
                                      {entry.teacher.name}
                                    </p>
                                  )}
                                  <p className="text-[10px] opacity-50 mt-1 font-mono">{formatTime12(entry.startTime)} – {formatTime12(entry.endTime)}</p>
                                  {canManage && (role === 'ADMIN' || entry.teacherId === teacherId) && (
                                    <div className="absolute top-1.5 right-1.5">
                                      {deleteConfirmId === entry.id ? (
                                        <div className="flex items-center gap-0.5 bg-white/90 border border-red-200 rounded-md px-1 py-0.5 shadow-sm">
                                          <button onClick={() => handleDelete(entry.id)} className="text-[10px] font-medium text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors">Del</button>
                                          <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] font-medium text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-50 transition-colors">X</button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setDeleteConfirmId(entry.id)}
                                          className="p-1 text-gray-300 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                        >
                                          <span className="mdi mdi-close text-sm" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-xl p-3 bg-gray-50/50 text-center min-h-[60px] flex items-center justify-center">
                                  <span className="text-gray-200 text-xs">—</span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
