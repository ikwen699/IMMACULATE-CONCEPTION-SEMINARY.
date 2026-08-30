'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn, getInitials } from '@/lib/utils'

interface ClassData {
  id: string
  name: string
  section?: string
  capacity: number
  _teacherName?: string | null
  _count: { students: number; subjects: number }
}

interface Subject {
  id: string
  name: string
  code: string
  teacher?: { id: string; name: string } | null
}

interface TimetableEntry {
  id: string
  day: string
  startTime: string
  endTime: string
  subject?: { name: string; code: string } | null
  teacher?: { id: string; name: string } | null
}

interface Classmate {
  id: string
  name: string
  email: string
  student?: { admissionNo: string; gender?: string }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

const SUBJECT_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
]

function getSubjectColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-purple-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
]

function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatTime(time: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

type Tab = 'overview' | 'subjects' | 'timetable' | 'classmates'

export default function MyClassesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true)
    setError(false)
    try {
      const profileRes = await fetch('/api/profile', { cache: 'no-store' })
      if (!profileRes.ok) { setError(true); return }
      const profile = await profileRes.json()
      const classId = profile?.student?.classId
      if (!classId) { setLoading(false); return }

      const [classesRes, subjectsRes, timetableRes, studentsRes] = await Promise.all([
        fetch('/api/classes', { cache: 'no-store' }),
        fetch(`/api/subjects?classId=${classId}`, { cache: 'no-store' }),
        fetch(`/api/timetable?classId=${classId}`, { cache: 'no-store' }),
        fetch(`/api/users?role=STUDENT&classId=${classId}`, { cache: 'no-store' }),
      ])

      if (classesRes.ok) {
        const allClasses = await classesRes.json()
        setClassData(Array.isArray(allClasses) ? allClasses.find((c: ClassData) => c.id === classId) : null)
      }
      if (subjectsRes.ok) setSubjects(Array.isArray(await subjectsRes.json()) ? await subjectsRes.json() : [])
      if (timetableRes.ok) setTimetable(Array.isArray(await timetableRes.json()) ? await timetableRes.json() : [])
      if (studentsRes.ok) {
        const data = await studentsRes.json()
        setClassmates(Array.isArray(data) ? data.filter((u: Classmate) => u.id !== profile.id) : [])
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { if (status !== 'authenticated') return;
    fetchData() }, [fetchData, status])

  const today = new Date()
  const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1
  const dayName = dayIndex >= 0 && dayIndex < DAYS.length ? DAYS[dayIndex] : 'Monday'
  const todaySchedule = timetable
    .filter(t => t.day === dayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: 'mdi-information-outline' },
    { key: 'subjects', label: 'Subjects', icon: 'mdi-book-open-variant', count: subjects.length },
    { key: 'timetable', label: 'Timetable', icon: 'mdi-calendar' },
    { key: 'classmates', label: 'Classmates', icon: 'mdi-account-group', count: classmates.length },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <span className="mdi mdi-door-open text-blue-600 text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Class</h1>
            <p className="text-sm text-gray-500">
              {classData
                ? `${classData.name}${classData.section ? ` - ${classData.section}` : ''}`
                : 'Your class information'}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading class data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load class data</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button
                onClick={fetchData}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mdi mdi-refresh" />
                Retry
              </button>
            </div>
          </div>
        ) : !classData ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="mdi mdi-door-open-lock text-3xl text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">No class assigned</p>
                <p className="text-sm text-gray-500 mt-1">You are not currently assigned to any class. Contact your school admin.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-1 overflow-x-auto -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
                      activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <span className={cn('mdi text-lg', tab.icon)} />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full',
                        activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Class hero card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm font-medium">Your Class</p>
                      <h2 className="text-3xl font-bold mt-1">
                        {classData.name}
                        {classData.section && <span className="text-blue-200"> - {classData.section}</span>}
                      </h2>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <span className="mdi mdi-door-open text-3xl text-white" />
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    {[
                      { label: 'Students', value: classData._count.students, icon: 'mdi-account-group' },
                      { label: 'Subjects', value: classData._count.subjects, icon: 'mdi-book-open-variant' },
                      { label: 'Capacity', value: classData.capacity, icon: 'mdi-chair-rolling' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
                        <span className={cn('mdi text-xl text-blue-200', stat.icon)} />
                        <p className="text-xl font-bold mt-1">{stat.value}</p>
                        <p className="text-[11px] text-blue-200">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info + today's schedule row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Class info */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="mdi mdi-information text-blue-500 text-lg" />
                      <h3 className="font-semibold text-gray-900">Class Details</h3>
                    </div>
                    <div className="space-y-3">
                      {classData._teacherName && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(classData._teacherName))}>
                            {getInitials(classData._teacherName)}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Class Teacher</p>
                            <p className="text-sm font-medium text-gray-800">{classData._teacherName}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <span className="mdi mdi-account-group text-gray-400" /> Classmates
                        </span>
                        <span className="font-medium text-gray-800">{classData._count.students} students</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <span className="mdi mdi-book-open-variant text-gray-400" /> Subjects
                        </span>
                        <span className="font-medium text-gray-800">{classData._count.subjects} subjects</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-2">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <span className="mdi mdi-chair-rolling text-gray-400" /> Capacity
                        </span>
                        <span className="font-medium text-gray-800">{classData._count.students}/{classData.capacity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Today's schedule */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="mdi mdi-calendar-today text-purple-500 text-lg" />
                      <h3 className="font-semibold text-gray-900">Today&apos;s Schedule</h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{dayName}</span>
                    </div>
                    {todaySchedule.length === 0 ? (
                      <div className="py-8 text-center">
                        <span className="mdi mdi-calendar-blank-outline text-3xl text-gray-300 block mb-2" />
                        <p className="text-sm text-gray-500">No classes scheduled for today</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {todaySchedule.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                            <div className={cn('w-1 h-10 rounded-full shrink-0', getSubjectColor(entry.subject?.name || ''))} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{entry.subject?.name || 'Unknown'}</p>
                              <p className="text-[11px] text-gray-500">{entry.teacher?.name || ''}</p>
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0 font-mono">
                              {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {subjects.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="mdi mdi-book-off-outline text-3xl text-gray-300 block mb-2" />
                    <p className="text-sm text-gray-500">No subjects found for your class</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {subjects.map((subject, i) => (
                      <div key={subject.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0', getSubjectColor(subject.name))}>
                          {subject.code?.slice(0, 2).toUpperCase() || subject.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{subject.name}</p>
                          <p className="text-xs text-gray-500">{subject.code}</p>
                        </div>
                        {subject.teacher && (
                          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 shrink-0">
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold', getAvatarColor(subject.teacher.name))}>
                              {getInitials(subject.teacher.name)}
                            </div>
                            {subject.teacher.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timetable' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-24">Time</th>
                        {DAYS.map((day) => (
                          <th
                            key={day}
                            className={cn(
                              'px-3 py-3 text-center text-xs font-semibold uppercase',
                              day === dayName ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                            )}
                          >
                            {day.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const times = [...new Set(timetable.map(t => t.startTime))].sort()
                        if (times.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                <span className="mdi mdi-calendar-blank-outline text-3xl text-gray-300 block mb-2" />
                                No timetable entries yet
                              </td>
                            </tr>
                          )
                        }
                        return times.map((time) => (
                          <tr key={time}>
                            <td className="px-4 py-3 text-xs font-mono text-gray-500 align-top pt-4">
                              {formatTime(time)}
                            </td>
                            {DAYS.map((day) => {
                              const entry = timetable.find(t => t.day === day && t.startTime === time)
                              return (
                                <td key={day} className={cn('px-2 py-2 align-top', day === dayName ? 'bg-blue-50/30' : '')}>
                                  {entry ? (
                                    <div className="rounded-lg p-2 bg-gray-50 border border-gray-100">
                                      <div className="flex items-center gap-1.5">
                                        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', getSubjectColor(entry.subject?.name || ''))} />
                                        <p className="text-xs font-semibold text-gray-800 truncate">{entry.subject?.name || '—'}</p>
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{entry.teacher?.name || ''}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{formatTime(entry.startTime)}-{formatTime(entry.endTime)}</p>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg p-2 bg-gray-50/50 text-center">
                                      <span className="text-gray-300 text-xs">—</span>
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'classmates' && (
              <div>
                {classmates.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <span className="mdi mdi-account-off-outline text-3xl text-gray-300 block mb-2" />
                    <p className="text-sm text-gray-500">No classmates found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {classmates.map((mate) => (
                      <div key={mate.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0', getAvatarColor(mate.name))}>
                            {getInitials(mate.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{mate.name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{mate.student?.admissionNo || ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
