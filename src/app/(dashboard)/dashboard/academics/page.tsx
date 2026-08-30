'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface Grade {
  id: string
  score: number
  grade: string
  type: string
  student: { user: { name: string }; class: { name: string; section?: string } }
  subject: { name: string }
  term: { name: string; id: string }
}

interface ClassData {
  id: string
  name: string
  section?: string
  _count: { students: number; subjects: number }
}

interface Term {
  id: string
  name: string
  sessionId: string
  isCurrent: boolean
}

interface Session {
  id: string
  name: string
  isCurrent: boolean
  terms: Term[]
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value}{typeof entry.value === 'number' && entry.value <= 100 ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

function getGradeLabel(score: number): string {
  if (score >= 75) return 'A'
  if (score >= 65) return 'B'
  if (score >= 55) return 'C'
  if (score >= 45) return 'D'
  return 'F'
}

export default function AcademicsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const principalName = user?.name?.split(' ')[0] || 'Principal'

  const [classes, setClasses] = useState<ClassData[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedTerm, setSelectedTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async (termId: string) => {
    setLoading(true)
    setError(false)
    try {
      const [classesRes, gradesRes, sessionsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch(`/api/grades${termId ? `?termId=${termId}` : ''}`),
        fetch('/api/sessions'),
      ])
      if (classesRes.ok) setClasses(await classesRes.json())
      if (gradesRes.ok) setGrades(await gradesRes.json())
      if (sessionsRes.ok) {
        const s = await sessionsRes.json()
        setSessions(s)
        if (!termId) {
          const current = s.find((sess: Session) => sess.isCurrent)
          const currentTerm = current?.terms?.find((t: Term) => t.isCurrent)
          if (currentTerm) setSelectedTerm(currentTerm.id)
        }
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(selectedTerm) }, [fetchData, selectedTerm])

  const allTerms = sessions.flatMap(s => (s.terms || []).map(t => ({ ...t, sessionName: s.name })))

  const calcClassAvg = (className: string) => {
    const g = grades.filter(gr => gr.student?.class?.name === className)
    return g.length > 0 ? Math.round(g.reduce((a, gr) => a + gr.score, 0) / g.length) : 0
  }

  const calcSubjectAvg = (subjectName: string) => {
    const g = grades.filter(gr => gr.subject?.name === subjectName)
    return g.length > 0 ? Math.round(g.reduce((a, gr) => a + gr.score, 0) / g.length) : 0
  }

  const subjectNames = Array.from(new Set(grades.map(g => g.subject?.name).filter(Boolean)))
  const overallAvg = grades.length > 0 ? Math.round(grades.reduce((a, g) => a + g.score, 0) / grades.length) : 0

  const classBarData = classes.map(c => ({
    name: c.section ? `${c.name} ${c.section}` : c.name,
    average: calcClassAvg(c.name),
    students: c._count.students,
  }))

  const subjectRadarData = subjectNames.map(name => ({
    subject: name.length > 12 ? name.slice(0, 12) + '...' : name,
    fullName: name,
    score: calcSubjectAvg(name),
  }))

  const gradeDist = [
    { name: 'A (75+)', value: grades.filter(g => g.score >= 75).length },
    { name: 'B (65-74)', value: grades.filter(g => g.score >= 65 && g.score < 75).length },
    { name: 'C (55-64)', value: grades.filter(g => g.score >= 55 && g.score < 65).length },
    { name: 'D (45-54)', value: grades.filter(g => g.score >= 45 && g.score < 55).length },
    { name: 'F (<45)', value: grades.filter(g => g.score < 45).length },
  ].filter(d => d.value > 0)

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-book-open-variant text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {principalName}
              </h1>
              <p className="text-sm text-gray-500">
                {format(today, 'EEEE, MMMM d, yyyy')} &middot; Academic overview
              </p>
            </div>
          </div>
          {/* Term filter */}
          {!loading && allTerms.length > 0 && (
            <div className="relative">
              <span className="mdi mdi-calendar-clock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="">All Terms</option>
                {sessions.map(s => (
                  <optgroup key={s.id} label={s.name}>
                    {(s.terms || []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="mdi mdi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load academics</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button onClick={() => fetchData(selectedTerm)} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <span className="mdi mdi-refresh" /> Retry
              </button>
            </div>
          </div>
        ) : grades.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="mdi mdi-school-outline text-3xl text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {selectedTerm ? 'No grades for this term' : 'No grades recorded yet'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedTerm ? 'Try selecting a different term' : 'Grades will appear here once teachers start posting them'}
                </p>
              </div>
              {selectedTerm && (
                <button onClick={() => setSelectedTerm('')} className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                  View all terms
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Classes', value: classes.length, icon: 'mdi-door-open', color: 'bg-blue-100 text-blue-600' },
                { label: 'Total Grades', value: grades.length, icon: 'mdi-credit-card-outline', color: 'bg-emerald-100 text-emerald-600' },
                { label: 'Overall Average', value: `${overallAvg}%`, icon: 'mdi-chart-line', color: 'bg-purple-100 text-purple-600' },
                { label: 'Total Subjects', value: subjectNames.length, icon: 'mdi-book-open-variant', color: 'bg-amber-100 text-amber-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', stat.color)}>
                      <span className={cn('mdi text-xl', stat.icon)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row 1: Class performance bar + Subject radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class performance bar chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-chart-bar text-blue-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Class Performance</h2>
                </div>
                {classBarData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-gray-500">No class data</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classBarData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="average" name="Average" radius={[4, 4, 0, 0]} barSize={32}>
                          {classBarData.map((entry, i) => (
                            <Cell key={i} fill={entry.average >= 70 ? '#10b981' : entry.average >= 50 ? '#f59e0b' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Subject radar chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-radar text-purple-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Subject Performance</h2>
                </div>
                {subjectRadarData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-gray-500">No subject data</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={subjectRadarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Charts row 2: Grade distribution pie + Performance table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Grade distribution pie */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-chart-pie text-emerald-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Grade Distribution</h2>
                </div>
                {gradeDist.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-sm text-gray-500">No grade data</div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={gradeDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                          {gradeDist.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Legend */}
                {gradeDist.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    {gradeDist.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Performance table */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-table text-indigo-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Class Details</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3 pr-4">Class</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3 pr-4">Students</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3 pr-4">Subjects</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3 pr-4">Average</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {classes.map((cls) => {
                        const avg = calcClassAvg(cls.name)
                        const barColor = avg >= 70 ? 'bg-emerald-500' : avg >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        const textColor = avg >= 70 ? 'text-emerald-600' : avg >= 50 ? 'text-amber-600' : 'text-red-600'
                        return (
                          <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 pr-4">
                              <span className="font-medium text-gray-900">{cls.name}</span>
                              {cls.section && <span className="text-gray-400 ml-1">{cls.section}</span>}
                            </td>
                            <td className="py-3 pr-4 text-sm text-gray-600">{cls._count.students}</td>
                            <td className="py-3 pr-4 text-sm text-gray-600">{cls._count.subjects}</td>
                            <td className="py-3 pr-4">
                              <span className={cn('text-sm font-bold', textColor)}>{avg}%</span>
                              <span className="text-[10px] text-gray-400 ml-1">{getGradeLabel(avg)}</span>
                            </td>
                            <td className="py-3">
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${avg}%` }} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Subject cards */}
            {subjectNames.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-book-multiple text-amber-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Subject Breakdown</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {subjectNames.map((name, i) => {
                    const avg = calcSubjectAvg(name)
                    const grade = getGradeLabel(avg)
                    const barColor = avg >= 70 ? 'bg-emerald-500' : avg >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    const badgeColor = avg >= 70 ? 'bg-emerald-100 text-emerald-700' : avg >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    const iconColor = CHART_COLORS[i % CHART_COLORS.length]
                    return (
                      <div key={name} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconColor + '20' }}>
                            <span className="mdi mdi-book text-sm" style={{ color: iconColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                          </div>
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold', badgeColor)}>
                            {avg}% &middot; {grade}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${avg}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
