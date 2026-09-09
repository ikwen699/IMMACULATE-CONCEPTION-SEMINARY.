'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

const STUDENT_ACTIONS = [
  { label: 'My Grades', icon: 'mdi-school', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/grades' },
  { label: 'Assignments', icon: 'mdi-clipboard-text', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', href: '/dashboard/assignments' },
  { label: 'Timetable', icon: 'mdi-calendar', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/timetable' },
  { label: 'Fees', icon: 'mdi-cash', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/fees' },
  { label: 'My Class', icon: 'mdi-door-open', color: 'bg-amber-100 text-amber-600 hover:bg-amber-200', href: '/dashboard/my-classes' },
  { label: 'Announcements', icon: 'mdi-bullhorn', color: 'bg-rose-100 text-rose-600 hover:bg-rose-200', href: '/dashboard/announcements' },
]

const NOTIF_DOT_COLORS: Record<string, string> = {
  PAYMENT: 'bg-emerald-500',
  GRADE: 'bg-blue-500',
  ATTENDANCE: 'bg-amber-500',
  ANNOUNCEMENT: 'bg-purple-500',
}

function StudentDashboard() {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const studentName = user?.name?.split(' ')[0] || 'Student'

  const [className, setClassName] = useState('')
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return
    setLoading(true)
    try {
      const [profileRes, announceRes, notifRes] = await Promise.all([
        fetch('/api/profile', { cache: 'no-store' }),
        fetch('/api/announcements', { cache: 'no-store' }),
        fetch('/api/notifications', { cache: 'no-store' }),
      ])

      if (profileRes.ok) {
        const profile = await profileRes.json()
        setClassName(profile.class?.name || '')
      }

      if (announceRes.ok) {
        const data = await announceRes.json()
        const items = Array.isArray(data) ? data : []
        setAnnouncements(items.filter((a: any) => a.isPublished !== false).slice(0, 3))
      }

      if (notifRes.ok) {
        const data = await notifRes.json()
        setNotifications((data.notifications || []).slice(0, 5))
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData, status])

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {studentName}</h1>
          <p className="text-sm text-gray-500">
            {format(today, 'EEEE, MMMM d, yyyy')}
            {className && <><span className="mx-1.5">&middot;</span>{className}</>}
          </p>
        </div>
        {unreadCount > 0 && (
          <Link
            href="/dashboard/notifications"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <span className="mdi mdi-bell text-lg" />
            {unreadCount} unread
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STUDENT_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              'flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-200 hover:shadow-sm',
              action.color
            )}
          >
            <span className={cn('mdi text-3xl', action.icon)} />
            <p className="text-xs font-semibold">{action.label}</p>
          </Link>
        ))}
      </div>

      {/* Announcements + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <span className="mdi mdi-bullhorn text-rose-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Announcements</h2>
            </div>
            <Link href="/dashboard/announcements" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              View all
            </Link>
          </div>
          {announcements.length === 0 ? (
            <div className="py-8 text-center">
              <span className="mdi mdi-bullhorn-outline text-3xl text-gray-300 block mb-2" />
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

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="mdi mdi-bell text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Notifications</h2>
            </div>
            <Link href="/dashboard/notifications" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <span className="mdi mdi-bell-off-outline text-3xl text-gray-300 block mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={cn(
                  'flex items-start gap-3 p-3 rounded-xl transition-colors',
                  !n.read ? 'bg-indigo-50/50' : 'bg-gray-50 hover:bg-gray-100'
                )}>
                  <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', NOTIF_DOT_COLORS[n.type] || 'bg-gray-400')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !n.read ? 'font-semibold text-gray-900' : 'text-gray-700')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const role = user?.role || 'STUDENT'

  const [stats, setStats] = useState<Array<{ label: string; value: string; icon: string; color: string }>>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [activities, setActivities] = useState<Array<{ title: string; time: string; type: string }>>([])

  const fetchStats = useCallback(async () => {
    if (status !== 'authenticated') return
    setStatsLoading(true)

    const getCount = async (url: string) => {
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return null
        const data = await res.json()
        return Array.isArray(data) ? data.length : null
      } catch {
        return null
      }
    }

    try {
      if (role === 'ADMIN' || role === 'PRINCIPAL') {
        const [studentCount, teacherCount, classCount, sessionData] = await Promise.all([
          getCount('/api/users?role=STUDENT'),
          getCount('/api/users?role=TEACHER'),
          getCount('/api/classes'),
          fetch('/api/sessions', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
        ])

        const activeSessions = (Array.isArray(sessionData) ? sessionData : []).filter((s: any) => s.isActive).length

        setStats([
          { label: 'Total Students', value: studentCount != null ? studentCount.toLocaleString() : '—', icon: 'mdi-school', color: 'bg-blue-100 text-blue-600' },
          { label: 'Total Teachers', value: teacherCount != null ? teacherCount.toLocaleString() : '—', icon: 'mdi-account-school', color: 'bg-green-100 text-green-600' },
          { label: 'Total Classes', value: classCount != null ? classCount.toLocaleString() : '—', icon: 'mdi-door-open', color: 'bg-purple-100 text-purple-600' },
          { label: 'Active Sessions', value: activeSessions.toLocaleString() || '0', icon: 'mdi-calendar-clock', color: 'bg-orange-100 text-orange-600' },
        ])

        if (role === 'ADMIN') {
          const [usersRes, paymentRes] = await Promise.all([
            fetch('/api/users', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('/api/payments', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
          ])
          const recentUsers = Array.isArray(usersRes) ? usersRes.filter((u: any) => u.status === 'PENDING').slice(0, 3) : []
          const recentPayments = Array.isArray(paymentRes) ? paymentRes.filter((p: any) => p.status === 'SUBMITTED').slice(0, 2) : []
          setActivities([
            ...recentUsers.map((u: any) => ({ title: `Pending approval: ${u.name} (${u.role})`, time: 'Awaiting review', type: 'warning' })),
            ...recentPayments.map((p: any) => ({ title: 'Payment submitted for review', time: 'Awaiting review', type: 'info' })),
          ])
          if (recentUsers.length === 0 && recentPayments.length === 0) setActivities([])
        }
      } else if (role === 'TEACHER') {
        const [classesData, gradesData, assignmentsData] = await Promise.all([
          fetch('/api/classes', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch('/api/grades', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch('/api/assignments', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
        ])

        const classes = Array.isArray(classesData) ? classesData : []
        const grades = Array.isArray(gradesData) ? gradesData : []
        const assignments = Array.isArray(assignmentsData) ? assignmentsData : []

        const systemCount = new Set(assignments.map((a: any) => a.subjectId)).size

        setStats([
          { label: 'My Classes', value: classes.length.toLocaleString(), icon: 'mdi-door-open', color: 'bg-blue-100 text-blue-600' },
          { label: 'My Students', value: '—', icon: 'mdi-account-group', color: 'bg-green-100 text-green-600' },
          { label: 'Grades Recorded', value: grades.length.toLocaleString(), icon: 'mdi-clipboard-text', color: 'bg-orange-100 text-orange-600' },
          { label: 'Assigned Subjects', value: systemCount.toLocaleString() || '0', icon: 'mdi-book-open-variant', color: 'bg-purple-100 text-purple-600' },
        ])
      } else if (role === 'ACCOUNTANT') {
        const paymentsData = await fetch('/api/payments', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => [])
        const payments = Array.isArray(paymentsData) ? paymentsData : []

        const totalAmount = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
        const approved = payments.filter((p: any) => p.status === 'PRINCIPAL_APPROVED' || p.status === 'PAID')
        const paidAmount = approved.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
        const pending = payments.filter((p: any) => p.status === 'SUBMITTED' || p.status === 'ACCOUNTANT_REVIEWED')

        const fmt = (n: number) => n.toLocaleString('en-NG', { maximumFractionDigits: 0 })

        setStats([
          { label: 'Total Collections', value: `₦${fmt(paidAmount)}`, icon: 'mdi-cash-multiple', color: 'bg-green-100 text-green-600' },
          { label: 'Pending Payments', value: pending.length.toLocaleString(), icon: 'mdi-clock-outline', color: 'bg-orange-100 text-orange-600' },
          { label: 'Total Payments', value: payments.length.toLocaleString(), icon: 'mdi-chart-line', color: 'bg-blue-100 text-blue-600' },
          { label: 'In Review', value: `₦${fmt(totalAmount - paidAmount)}`, icon: 'mdi-alert-circle', color: 'bg-red-100 text-red-600' },
        ])
      } else {
        setStats([])
      }
    } catch {
      setStats([])
    } finally {
      setStatsLoading(false)
    }
  }, [role, status])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetchStats()
  }, [fetchStats, status])

  const getWelcomeMessage = () => {
    switch (role) {
      case 'ADMIN': return 'Welcome to the Admin Dashboard'
      case 'PRINCIPAL': return 'Welcome to the Principal Dashboard'
      case 'TEACHER': return 'Welcome to the Teacher Dashboard'
      case 'STUDENT': return 'Welcome to the Student Dashboard'
      case 'PARENT': return 'Welcome to the Parent Dashboard'
      case 'ACCOUNTANT': return 'Welcome to the Accountant Dashboard'
      default: return 'Welcome to the Dashboard'
    }
  }

  const getStats = () => {
    if (statsLoading && stats.length === 0) {
      return [{ label: 'Loading...', value: '—', icon: 'mdi-loading', color: 'bg-gray-100 text-gray-400' }]
    }
    return stats
  }

  const getQuickActions = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Add User', icon: 'mdi-account-plus', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/users' },
          { label: 'Add Class', icon: 'mdi-door-open', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/classes' },
          { label: 'Add Subject', icon: 'mdi-book-plus', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/subjects' },
          { label: 'Announcement', icon: 'mdi-bullhorn', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', href: '/dashboard/announcements' },
        ]
      case 'TEACHER':
        return [
          { label: 'Take Attendance', icon: 'mdi-check-circle', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/attendance' },
          { label: 'Upload Results', icon: 'mdi-file-document-edit', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/results' },
          { label: 'My Classes', icon: 'mdi-door-open', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/my-classes' },
          { label: 'Announcement', icon: 'mdi-bullhorn', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', href: '/dashboard/announcements' },
        ]
      case 'ACCOUNTANT':
        return [
          { label: 'Record Payment', icon: 'mdi-credit-card', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/payments' },
          { label: 'Generate Invoice', icon: 'mdi-receipt', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/fees' },
          { label: 'View Reports', icon: 'mdi-chart-bar', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/reports' },
          { label: 'Daily Summary', icon: 'mdi-chart-line', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', href: '/dashboard/reports' },
        ]
      case 'PRINCIPAL':
        return [
          { label: 'View Reports', icon: 'mdi-chart-bar', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/reports' },
          { label: 'View Staff', icon: 'mdi-account-group', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/staff' },
          { label: 'View Students', icon: 'mdi-school', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/students' },
          { label: 'Announcements', icon: 'mdi-bullhorn', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', href: '/dashboard/announcements' },
        ]
      case 'PARENT':
        return [
          { label: 'My Children', icon: 'mdi-account-group', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/children' },
          { label: 'View Grades', icon: 'mdi-school', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/grades' },
          { label: 'Fees & Payments', icon: 'mdi-cash', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/fees' },
          { label: 'Notifications', icon: 'mdi-bell', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', href: '/dashboard/notifications' },
        ]
      default:
        return [
          { label: 'View Reports', icon: 'mdi-chart-bar', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/reports' },
          { label: 'View Staff', icon: 'mdi-account-group', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/staff' },
          { label: 'View Students', icon: 'mdi-school', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/students' },
          { label: 'Announcements', icon: 'mdi-bullhorn', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', href: '/dashboard/announcements' },
        ]
    }
  }

  if (role === 'STUDENT') return <StudentDashboard />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{getWelcomeMessage()}</h1>
        <p className="text-gray-500">Here&apos;s what&apos;s happening today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {getStats().map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <span className={`mdi ${stat.icon} text-2xl`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(role === 'ADMIN' || role === 'PRINCIPAL') && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No recent activity</p>
          ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{activity.title}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {getQuickActions().map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`p-4 rounded-lg text-left transition-colors ${action.color}`}
              >
                <span className={`mdi ${action.icon} text-2xl mb-2 block`} />
                <p className="text-sm font-medium">{action.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}
