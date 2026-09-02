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
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Total Students', value: '1,234', icon: 'mdi-school', color: 'bg-blue-100 text-blue-600' },
          { label: 'Total Teachers', value: '56', icon: 'mdi-account-school', color: 'bg-green-100 text-green-600' },
          { label: 'Total Classes', value: '24', icon: 'mdi-door-open', color: 'bg-purple-100 text-purple-600' },
          { label: 'Active Sessions', value: '2', icon: 'mdi-calendar-clock', color: 'bg-orange-100 text-orange-600' },
        ]
      case 'TEACHER':
        return [
          { label: 'My Classes', value: '5', icon: 'mdi-door-open', color: 'bg-blue-100 text-blue-600' },
          { label: 'My Students', value: '150', icon: 'mdi-account-group', color: 'bg-green-100 text-green-600' },
          { label: 'Pending Grades', value: '12', icon: 'mdi-clipboard-text', color: 'bg-orange-100 text-orange-600' },
          { label: 'Assignments', value: '8', icon: 'mdi-file-document', color: 'bg-purple-100 text-purple-600' },
        ]
      case 'ACCOUNTANT':
        return [
          { label: 'Total Revenue', value: '$125,000', icon: 'mdi-cash-multiple', color: 'bg-green-100 text-green-600' },
          { label: 'Pending Payments', value: '$12,500', icon: 'mdi-clock-outline', color: 'bg-orange-100 text-orange-600' },
          { label: 'Today Collections', value: '$2,500', icon: 'mdi-chart-line', color: 'bg-blue-100 text-blue-600' },
          { label: 'Outstanding', value: '$8,500', icon: 'mdi-alert-circle', color: 'bg-red-100 text-red-600' },
        ]
      default:
        return [
          { label: 'Overview', value: '100%', icon: 'mdi-chart-line', color: 'bg-blue-100 text-blue-600' },
          { label: 'Activities', value: '25', icon: 'mdi-lightning-bolt', color: 'bg-green-100 text-green-600' },
          { label: 'Reports', value: '10', icon: 'mdi-chart-bar', color: 'bg-purple-100 text-purple-600' },
          { label: 'Messages', value: '5', icon: 'mdi-email', color: 'bg-orange-100 text-orange-600' },
        ]
    }
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
          { label: 'Enter Grades', icon: 'mdi-clipboard-text', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/grades' },
          { label: 'Create Assignment', icon: 'mdi-file-plus', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/assignments' },
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

  const getRecentActivities = () => {
    return [
      { title: 'New student admitted', time: '2 hours ago', type: 'success' },
      { title: 'Fee payment received', time: '3 hours ago', type: 'info' },
      { title: 'Exam results published', time: '5 hours ago', type: 'warning' },
      { title: 'Parent meeting scheduled', time: '1 day ago', type: 'info' },
      { title: 'System update completed', time: '2 days ago', type: 'success' },
    ]
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
          <div className="space-y-4">
            {getRecentActivities().map((activity, index) => (
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
