'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalParents: number
  recentEnrollments: number
}

interface Announcement {
  id: string
  title: string
  content: string
  targetRole?: string
  createdAt: string
  author: { name: string }
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

const STAT_CONFIG = [
  { key: 'totalStudents', label: 'Total Students', icon: 'mdi-school', color: 'bg-blue-100 text-blue-600', ringColor: 'ring-blue-600/10' },
  { key: 'totalTeachers', label: 'Total Teachers', icon: 'mdi-account-school', color: 'bg-emerald-100 text-emerald-600', ringColor: 'ring-emerald-600/10' },
  { key: 'totalClasses', label: 'Total Classes', icon: 'mdi-door-open', color: 'bg-purple-100 text-purple-600', ringColor: 'ring-purple-600/10' },
  { key: 'totalParents', label: 'Total Parents', icon: 'mdi-account-group', color: 'bg-amber-100 text-amber-600', ringColor: 'ring-amber-600/10' },
  { key: 'recentEnrollments', label: 'New This Month', icon: 'mdi-account-plus', color: 'bg-rose-100 text-rose-600', ringColor: 'ring-rose-600/10' },
] as const

const PERFORMANCE_DATA = [
  { name: 'Academic', value: 85, fill: '#10b981' },
  { name: 'Teacher', value: 92, fill: '#3b82f6' },
  { name: 'Engagement', value: 78, fill: '#f59e0b' },
  { name: 'Satisfaction', value: 88, fill: '#8b5cf6' },
]

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b']

const QUICK_ACTIONS = [
  { label: 'View Reports', icon: 'mdi-chart-bar', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/reports' },
  { label: 'Staff Directory', icon: 'mdi-account-group', color: 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200', href: '/dashboard/staff' },
  { label: 'Student Records', icon: 'mdi-school', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/students' },
  { label: 'Announcements', icon: 'mdi-bullhorn', color: 'bg-amber-100 text-amber-600 hover:bg-amber-200', href: '/dashboard/announcements' },
  { label: 'Classes', icon: 'mdi-door-open', color: 'bg-rose-100 text-rose-600 hover:bg-rose-200', href: '/dashboard/classes' },
  { label: 'Sessions', icon: 'mdi-calendar-clock', color: 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200', href: '/dashboard/sessions' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value}{entry.name?.includes('Rate') ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

export default function OverviewPage() {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const principalName = user?.name?.split(' ')[0] || 'Principal'

  const [stats, setStats] = useState<SchoolStats>({
    totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalParents: 0, recentEnrollments: 0,
  })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [enrollmentTrend, setEnrollmentTrend] = useState<{ month: string; count: number }[]>([])
  const [attendanceTrend, setAttendanceTrend] = useState<{ date: string; rate: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true)
    setError(false)
    try {
      const [studentsRes, teachersRes, classesRes, parentsRes, announceRes, notifRes, enrollRes, attendRes] = await Promise.all([
        fetch('/api/users?role=STUDENT', { cache: 'no-store' }),
        fetch('/api/users?role=TEACHER', { cache: 'no-store' }),
        fetch('/api/classes', { cache: 'no-store' }),
        fetch('/api/users?role=PARENT', { cache: 'no-store' }),
        fetch('/api/announcements', { cache: 'no-store' }),
        fetch('/api/notifications', { cache: 'no-store' }),
        fetch('/api/dashboard/enrollment-trend', { cache: 'no-store' }),
        fetch('/api/dashboard/attendance-trend', { cache: 'no-store' }),
      ])

      const students = studentsRes.ok ? await studentsRes.json() : []
      const teachers = teachersRes.ok ? await teachersRes.json() : []
      const classes = classesRes.ok ? await classesRes.json() : []
      const parents = parentsRes.ok ? await parentsRes.json() : []
      const announceData = announceRes.ok ? await announceRes.json() : []
      const notifData = notifRes.ok ? await notifRes.json() : {}
      const enrollData = enrollRes.ok ? await enrollRes.json() : []
      const attendData = attendRes.ok ? await attendRes.json() : []

      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalParents: parents.length,
        recentEnrollments: students.filter((s: any) => {
          const enrolled = new Date(s.student?.enrollmentDate || s.createdAt)
          return enrolled >= monthAgo
        }).length,
      })
      setAnnouncements(Array.isArray(announceData) ? announceData.slice(0, 3) : [])
      setNotifications(Array.isArray(notifData.notifications) ? notifData.notifications.slice(0, 5) : [])
      setEnrollmentTrend(Array.isArray(enrollData) ? enrollData : [])
      setAttendanceTrend(Array.isArray(attendData) ? attendData : [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { if (status !== 'authenticated') return;
    fetchData() }, [fetchData, status])

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const unreadCount = notifications.filter(n => !n.read).length

  const peoplePieData = [
    { name: 'Students', value: stats.totalStudents },
    { name: 'Teachers', value: stats.totalTeachers },
    { name: 'Parents', value: stats.totalParents },
  ].filter(d => d.value > 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-chart-line text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {principalName}
              </h1>
              <p className="text-sm text-gray-500">
                {format(today, 'EEEE, MMMM d, yyyy')} &middot; School overview
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <span className="mdi mdi-bell text-lg" />
              {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
            </Link>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading school overview...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load overview</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button onClick={fetchData} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <span className="mdi mdi-refresh" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {STAT_CONFIG.map((stat) => {
                const value = stats[stat.key as keyof SchoolStats]
                return (
                  <div key={stat.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center ring-1 ring-inset', stat.color, stat.ringColor)}>
                        <span className={cn('mdi text-xl', stat.icon)} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Charts row 1: Performance bar + People pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance bar chart */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-speedometer text-indigo-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">School Performance</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PERFORMANCE_DATA} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {PERFORMANCE_DATA.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* People distribution pie */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="mdi mdi-account-group text-emerald-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">People Distribution</h2>
                </div>
                {peoplePieData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-gray-500">No data yet</p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={peoplePieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {peoplePieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
                        />
                        <text x="50%" y="43%" textAnchor="middle" dominantBaseline="central" className="fill-gray-900 font-bold text-2xl">
                          {stats.totalStudents + stats.totalTeachers + stats.totalParents}
                        </text>
                        <text x="50%" y="53%" textAnchor="middle" className="fill-gray-400 text-xs">
                          Total
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Charts row 2: Enrollment trend + Attendance trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrollment trend */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-school text-blue-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Enrollment Trend</h2>
                  <span className="text-xs text-gray-400 ml-auto">Last 12 months</span>
                </div>
                {enrollmentTrend.length === 0 ? (
                  <div className="h-56 flex items-center justify-center">
                    <p className="text-sm text-gray-500">No enrollment data yet</p>
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="count" name="Enrollments" stroke="#3b82f6" strokeWidth={2} fill="url(#enrollGrad)" dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5, fill: '#3b82f6' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Attendance trend */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-check-circle text-emerald-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Attendance Trend</h2>
                  <span className="text-xs text-gray-400 ml-auto">Last 30 days</span>
                </div>
                {attendanceTrend.length === 0 ? (
                  <div className="h-56 flex items-center justify-center">
                    <p className="text-sm text-gray-500">No attendance data yet</p>
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={attendanceTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="rate" name="Attendance Rate" stroke="#10b981" strokeWidth={2} fill="url(#attendGrad)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom grid: Announcements + Recent activity + Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Announcements preview */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="mdi mdi-bullhorn text-amber-500 text-lg" />
                    <h2 className="font-semibold text-gray-900">Announcements</h2>
                  </div>
                  <Link href="/dashboard/announcements" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                    View all
                  </Link>
                </div>
                {announcements.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="mdi mdi-bullhorn-outline text-2xl text-gray-300 block mb-2" />
                    <p className="text-sm text-gray-500">No announcements yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-gray-400">{a.author?.name}</span>
                          <span className="text-gray-300">&middot;</span>
                          <span className="text-[11px] text-gray-400">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent notifications */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="mdi mdi-bell text-blue-500 text-lg" />
                    <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                  </div>
                  <Link href="/dashboard/notifications" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                    View all
                  </Link>
                </div>
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="mdi mdi-bell-off-outline text-2xl text-gray-300 block mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => {
                      const typeColors: Record<string, string> = {
                        PAYMENT: 'bg-emerald-500', GRADE: 'bg-blue-500', ATTENDANCE: 'bg-amber-500', ANNOUNCEMENT: 'bg-purple-500',
                      }
                      return (
                        <div key={n.id} className={cn('flex items-start gap-3 p-3 rounded-xl transition-colors', !n.read ? 'bg-indigo-50/50' : 'bg-gray-50 hover:bg-gray-100')}>
                          <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', typeColors[n.type] || 'bg-gray-400')} />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm', !n.read ? 'font-semibold text-gray-900' : 'text-gray-700')}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                          </div>
                          <span className="text-[11px] text-gray-400 shrink-0">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="mdi mdi-lightning-bolt text-amber-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_ACTIONS.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={cn('p-3.5 rounded-xl text-left transition-all duration-200 hover:shadow-sm', action.color)}
                    >
                      <span className={cn('mdi text-2xl block mb-2', action.icon)} />
                      <p className="text-xs font-semibold">{action.label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
