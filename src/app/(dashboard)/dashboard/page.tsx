'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'

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
      case 'STUDENT':
        return [
          { label: 'My Grades', value: 'A', icon: 'mdi-school', color: 'bg-blue-100 text-blue-600' },
          { label: 'Attendance', value: '95%', icon: 'mdi-check-circle', color: 'bg-green-100 text-green-600' },
          { label: 'Assignments', value: '3', icon: 'mdi-clipboard-text', color: 'bg-orange-100 text-orange-600' },
          { label: 'Fee Status', value: 'Paid', icon: 'mdi-cash', color: 'bg-purple-100 text-purple-600' },
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
      case 'STUDENT':
        return [
          { label: 'View Grades', icon: 'mdi-school', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/grades' },
          { label: 'Attendance', icon: 'mdi-check-circle', color: 'bg-green-100 text-green-600 hover:bg-green-200', href: '/dashboard/attendance' },
          { label: 'Assignments', icon: 'mdi-clipboard-text', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/assignments' },
          { label: 'Fee Status', icon: 'mdi-cash', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', href: '/dashboard/fees' },
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
