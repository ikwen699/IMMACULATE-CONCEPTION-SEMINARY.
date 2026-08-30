'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn, getInitials } from '@/lib/utils'

interface Child {
  id: string
  admissionNo: string
  dateOfBirth?: string
  gender?: string
  user: { name: string; email: string }
  class?: { name: string; section?: string }
  grades: {
    id: string
    score: number
    grade: string
    type: string
    subject: { name: string }
    term?: { name: string } | null
    createdAt?: string
  }[]
  attendance: {
    id: string
    date: string
    status: string
  }[]
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

function getGradeLetter(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C+'
  if (score >= 40) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

function getGradeColor(score: number): string {
  if (score >= 70) return 'text-emerald-700 bg-emerald-50 ring-emerald-600/20'
  if (score >= 50) return 'text-amber-700 bg-amber-50 ring-amber-600/20'
  return 'text-red-700 bg-red-50 ring-red-600/20'
}

function getAttendanceColor(rate: number): string {
  if (rate >= 90) return 'bg-emerald-500'
  if (rate >= 75) return 'bg-amber-500'
  return 'bg-red-500'
}

function getAttendanceTextColor(rate: number): string {
  if (rate >= 90) return 'text-emerald-700'
  if (rate >= 75) return 'text-amber-700'
  return 'text-red-700'
}

const GRADE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  TEST: { label: 'Test', color: 'bg-blue-100 text-blue-700' },
  EXAM: { label: 'Exam', color: 'bg-purple-100 text-purple-700' },
  ASSIGNMENT: { label: 'Assignment', color: 'bg-teal-100 text-teal-700' },
  PROJECT: { label: 'Project', color: 'bg-orange-100 text-orange-700' },
}

const ATTENDANCE_STATUS_CONFIG: Record<string, { color: string; icon: string }> = {
  PRESENT: { color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20', icon: 'mdi-check-circle-outline' },
  ABSENT: { color: 'bg-red-100 text-red-700 ring-red-600/20', icon: 'mdi-close-circle-outline' },
  LATE: { color: 'bg-amber-100 text-amber-700 ring-amber-600/20', icon: 'mdi-clock-outline' },
  EXCUSED: { color: 'bg-blue-100 text-blue-700 ring-blue-600/20', icon: 'mdi-shield-check-outline' },
}

function formatDate(date: string) {
  try { return format(new Date(date), 'MMM d, yyyy') }
  catch { return date }
}

function timeAgo(date: string) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) }
  catch { return '' }
}

export default function ChildrenPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const parentName = user?.name?.split(' ')[0] || 'Parent'

  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/children')
      if (res.ok) {
        setChildren(await res.json())
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChildren() }, [fetchChildren])

  useEffect(() => {
    if (!selectedChild) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedChild(null)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedChild])

  const calcAttendance = (att: Child['attendance']) => {
    if (!att.length) return 0
    return Math.round((att.filter(a => a.status === 'PRESENT').length / att.length) * 100)
  }

  const calcAverage = (grades: Child['grades']) => {
    if (!grades.length) return 0
    return Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length)
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="mdi mdi-account-group text-purple-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {parentName}
              </h1>
              <p className="text-sm text-gray-500">
                {format(today, 'EEEE, MMMM d, yyyy')} &middot; {children.length} {children.length === 1 ? 'child' : 'children'} linked
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading your children...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load children</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button
                onClick={fetchChildren}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mdi mdi-refresh" />
                Retry
              </button>
            </div>
          </div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="mdi mdi-account-off-outline text-3xl text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">No children linked</p>
                <p className="text-sm text-gray-500 mt-1">
                  No children are currently linked to your account. Contact the school admin to link your children.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {children.map((child) => {
              const avg = calcAverage(child.grades)
              const att = calcAttendance(child.attendance)
              const isSelected = selectedChild?.id === child.id
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={cn(
                    'text-left bg-white rounded-xl border p-5 transition-all duration-200',
                    isSelected
                      ? 'border-purple-400 ring-2 ring-purple-100 shadow-md'
                      : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                  )}
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                      getAvatarColor(child.user?.name || '')
                    )}>
                      {getInitials(child.user?.name || '?')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{child.user?.name || 'Unknown'}</h3>
                        {child.gender && (
                          <span className={cn(
                            'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0',
                            child.gender === 'MALE' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                          )}>
                            {child.gender === 'MALE' ? 'M' : 'F'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {child.class ? `${child.class.name}${child.class.section ? ` - ${child.class.section}` : ''}` : 'No class assigned'}
                        <span className="mx-1.5 text-gray-300">&middot;</span>
                        {child.admissionNo}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 space-y-3">
                    {/* Attendance */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <span className="mdi mdi-check-circle-outline text-sm" />
                          Attendance
                        </span>
                        <span className={cn('text-xs font-bold', getAttendanceTextColor(att))}>
                          {att}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', getAttendanceColor(att))}
                          style={{ width: `${att}%` }}
                        />
                      </div>
                    </div>

                    {/* Average grade */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <span className="mdi mdi-school text-sm" />
                          Average
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          {avg > 0 ? `${avg}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            avg >= 70 ? 'bg-emerald-500' : avg >= 50 ? 'bg-amber-500' : avg > 0 ? 'bg-red-500' : 'bg-gray-200'
                          )}
                          style={{ width: avg > 0 ? `${avg}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick grade badges */}
                  {child.grades.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 overflow-hidden">
                      {child.grades.slice(0, 3).map((g) => (
                        <span
                          key={g.id}
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ring-1 ring-inset shrink-0',
                            getGradeColor(g.score)
                          )}
                        >
                          {getGradeLetter(g.score)}
                        </span>
                      ))}
                      {child.grades.length > 3 && (
                        <span className="text-[10px] text-gray-400 shrink-0">+{child.grades.length - 3}</span>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                        {child.grades.length} {child.grades.length === 1 ? 'grade' : 'grades'}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Detail overlay */}
        {selectedChild && (
          <div
            className="fixed inset-0 z-50 flex justify-end"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedChild(null) }}
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
            <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
              {/* Detail header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                      getAvatarColor(selectedChild.user?.name || '')
                    )}>
                      {getInitials(selectedChild.user?.name || '?')}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedChild.user?.name}</h2>
                      <p className="text-sm text-gray-500">
                        {selectedChild.class ? `${selectedChild.class.name}${selectedChild.class.section ? ` - ${selectedChild.class.section}` : ''}` : 'No class'}
                        <span className="mx-1.5 text-gray-300">&middot;</span>
                        {selectedChild.admissionNo}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedChild(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="mdi mdi-close text-xl" />
                  </button>
                </div>

                {/* Summary stats row */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Attendance',
                      value: `${calcAttendance(selectedChild.attendance)}%`,
                      color: getAttendanceColor(calcAttendance(selectedChild.attendance)),
                      textColor: getAttendanceTextColor(calcAttendance(selectedChild.attendance)),
                    },
                    {
                      label: 'Average',
                      value: selectedChild.grades.length > 0 ? `${calcAverage(selectedChild.grades)}%` : '—',
                      color: (() => {
                        const a = calcAverage(selectedChild.grades)
                        return a >= 70 ? 'bg-emerald-500' : a >= 50 ? 'bg-amber-500' : a > 0 ? 'bg-red-500' : 'bg-gray-200'
                      })(),
                      textColor: 'text-gray-700',
                    },
                    {
                      label: 'Total Grades',
                      value: String(selectedChild.grades.length),
                      color: 'bg-purple-500',
                      textColor: 'text-gray-700',
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className={cn('w-1.5 h-1.5 rounded-full mx-auto mb-1.5', stat.color)} />
                      <p className={cn('text-lg font-bold', stat.textColor)}>{stat.value}</p>
                      <p className="text-[11px] text-gray-500 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail body */}
              <div className="p-6 space-y-8">
                {/* Grades */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="mdi mdi-school text-purple-500 text-lg" />
                    <h3 className="font-semibold text-gray-900">Recent Grades</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {selectedChild.grades.length}
                    </span>
                  </div>
                  {selectedChild.grades.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <span className="mdi mdi-file-document-outline text-3xl text-gray-300 block mb-2" />
                      <p className="text-sm text-gray-500">No grades recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedChild.grades.slice(0, 8).map((grade) => (
                        <div key={grade.id} className="bg-gray-50 rounded-xl p-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800 truncate">
                                  {grade.subject?.name || 'Unknown Subject'}
                                </span>
                                {GRADE_TYPE_LABELS[grade.type] && (
                                  <span className={cn(
                                    'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                                    GRADE_TYPE_LABELS[grade.type].color
                                  )}>
                                    {GRADE_TYPE_LABELS[grade.type].label}
                                  </span>
                                )}
                              </div>
                              {grade.term?.name && (
                                <p className="text-[11px] text-gray-400 mt-0.5">{grade.term.name}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    grade.score >= 70 ? 'bg-emerald-500' : grade.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                  )}
                                  style={{ width: `${Math.min(grade.score, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-gray-800 w-10 text-right">{grade.score}%</span>
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ring-1 ring-inset',
                                getGradeColor(grade.score)
                              )}>
                                {grade.grade}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedChild.grades.length > 8 && (
                        <p className="text-xs text-gray-400 text-center pt-1">
                          Showing 8 of {selectedChild.grades.length} grades
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Attendance */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="mdi mdi-calendar-check text-blue-500 text-lg" />
                    <h3 className="font-semibold text-gray-900">Recent Attendance</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {selectedChild.attendance.length}
                    </span>
                  </div>
                  {selectedChild.attendance.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <span className="mdi mdi-calendar-blank-outline text-3xl text-gray-300 block mb-2" />
                      <p className="text-sm text-gray-500">No attendance records yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedChild.attendance.slice(0, 10).map((record) => {
                        const cfg = ATTENDANCE_STATUS_CONFIG[record.status] || ATTENDANCE_STATUS_CONFIG.PRESENT
                        return (
                          <div key={record.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3.5 py-3">
                            <span className={cn('mdi text-lg shrink-0', cfg.icon, record.status === 'PRESENT' ? 'text-emerald-500' : record.status === 'ABSENT' ? 'text-red-500' : record.status === 'LATE' ? 'text-amber-500' : 'text-blue-500')} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{formatDate(record.date)}</p>
                              <p className="text-[11px] text-gray-400">{timeAgo(record.date)}</p>
                            </div>
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full ring-1 ring-inset shrink-0',
                              cfg.color
                            )}>
                              {record.status.charAt(0) + record.status.slice(1).toLowerCase()}
                            </span>
                          </div>
                        )
                      })}
                      {selectedChild.attendance.length > 10 && (
                        <p className="text-xs text-gray-400 text-center pt-1">
                          Showing 10 of {selectedChild.attendance.length} records
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
