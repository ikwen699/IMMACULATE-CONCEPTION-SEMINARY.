'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navigationItems: Record<string, { title: string; href: string; icon: string }[]> = {
  ADMIN: [
    { title: 'Dashboard', href: '/dashboard', icon: 'mdi-view-dashboard' },
    { title: 'Users', href: '/dashboard/users', icon: 'mdi-account-group' },
    { title: 'Approvals', href: '/dashboard/approvals', icon: 'mdi-check-decagram' },
    { title: 'Students', href: '/dashboard/students', icon: 'mdi-school' },
    { title: 'Teachers', href: '/dashboard/teachers', icon: 'mdi-account-school' },
    { title: 'Classes', href: '/dashboard/classes', icon: 'mdi-door-open' },
    { title: 'Subjects', href: '/dashboard/subjects', icon: 'mdi-book-open-variant' },
    { title: 'Sessions', href: '/dashboard/sessions', icon: 'mdi-calendar-clock' },
    { title: 'Announcements', href: '/dashboard/announcements', icon: 'mdi-bullhorn' },
    { title: 'Settings', href: '/dashboard/settings', icon: 'mdi-cog' },
  ],
  PRINCIPAL: [
    { title: 'Dashboard', href: '/dashboard', icon: 'mdi-view-dashboard' },
    { title: 'Overview', href: '/dashboard/overview', icon: 'mdi-chart-line' },
    { title: 'Staff', href: '/dashboard/staff', icon: 'mdi-account-group' },
    { title: 'Students', href: '/dashboard/students', icon: 'mdi-school' },
    { title: 'Classes', href: '/dashboard/classes', icon: 'mdi-door-open' },
    { title: 'Academics', href: '/dashboard/academics', icon: 'mdi-book-open-variant' },
    { title: 'Payment Approvals', href: '/dashboard/payment-approvals', icon: 'mdi-check-decagram' },
    { title: 'Announcements', href: '/dashboard/announcements', icon: 'mdi-bullhorn' },
    { title: 'Reports', href: '/dashboard/reports', icon: 'mdi-chart-bar' },
  ],
  TEACHER: [
    { title: 'Dashboard', href: '/dashboard', icon: 'mdi-view-dashboard' },
    { title: 'My Classes', href: '/dashboard/my-classes', icon: 'mdi-door-open' },
    { title: 'Timetable', href: '/dashboard/timetable', icon: 'mdi-calendar' },
    { title: 'Announcements', href: '/dashboard/announcements', icon: 'mdi-bullhorn' },
  ],
  STUDENT: [
    { title: 'Dashboard', href: '/dashboard', icon: 'mdi-view-dashboard' },
    { title: 'My Profile', href: '/dashboard/profile', icon: 'mdi-account' },
    { title: 'Grades', href: '/dashboard/grades', icon: 'mdi-school' },
  ],
  PARENT: [
    { title: 'Dashboard', href: '/dashboard', icon: 'mdi-view-dashboard' },
    { title: 'My Children', href: '/dashboard/children', icon: 'mdi-account-group' },
    { title: 'Grades', href: '/dashboard/grades', icon: 'mdi-school' },
    { title: 'Fees & Payments', href: '/dashboard/fees', icon: 'mdi-cash' },
    { title: 'Notifications', href: '/dashboard/notifications', icon: 'mdi-bell' },
  ],
  ACCOUNTANT: [
    { title: 'Dashboard', href: '/dashboard', icon: 'mdi-view-dashboard' },
    { title: 'Fee Structure', href: '/dashboard/fees', icon: 'mdi-cash-multiple' },
    { title: 'Payments', href: '/dashboard/payments', icon: 'mdi-credit-card' },
    { title: 'Payment Reviews', href: '/dashboard/payment-reviews', icon: 'mdi-check-decagram' },
    { title: 'Students', href: '/dashboard/students', icon: 'mdi-school' },
    { title: 'Reports', href: '/dashboard/reports', icon: 'mdi-chart-bar' },
    { title: 'Announcements', href: '/dashboard/announcements', icon: 'mdi-bullhorn' },
  ],
}

export default function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [showBadge, setShowBadge] = useState(false)
  const items = navigationItems[role] || navigationItems.STUDENT

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'bg-blue-700 text-white min-h-screen transition-all duration-300 flex flex-col overflow-hidden z-50',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen
            ? 'fixed inset-y-0 left-0'
            : 'hidden lg:flex lg:relative'
        )}
      >
        <div className="p-4 border-b border-blue-600">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <button onClick={() => setShowBadge(true)} className="shrink-0">
                  <img src="/school-badge.jpg" alt="ICS Badge" className="w-10 h-10 rounded-full object-cover border border-blue-500 cursor-pointer hover:ring-2 hover:ring-white/50 transition" />
                </button>
                <div>
                  <h1 className="font-bold text-lg text-white">ICS Portal</h1>
                  <p className="text-xs text-blue-200">{role}</p>
                </div>
              </div>
            )}
            {collapsed && (
              <button onClick={() => setShowBadge(true)} className="mx-auto">
                <img src="/school-badge.jpg" alt="ICS" className="w-8 h-8 rounded-full object-cover border border-blue-500 cursor-pointer hover:ring-2 hover:ring-white/50 transition" />
              </button>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 hover:bg-blue-600 rounded-lg text-blue-200 hidden lg:block"
            >
              <span className={cn('mdi', collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left', 'text-lg')} />
            </button>
            <button
              onClick={onMobileClose}
              className="p-1.5 hover:bg-blue-600 rounded-lg text-blue-200 lg:hidden"
            >
              <span className="mdi mdi-close text-lg" />
            </button>
          </div>
        </div>

        <nav className="flex-1 mt-2 px-2 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-lg transition-colors text-sm',
                pathname === item.href
                  ? 'bg-white text-blue-700 font-medium'
                  : 'text-blue-100 hover:bg-blue-600 hover:text-white'
              )}
            >
              <span className={cn('mdi', item.icon, 'text-xl shrink-0')} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-blue-600 p-2">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-100 hover:bg-red-700 hover:text-white rounded-lg transition-colors text-sm"
          >
            <span className="mdi mdi-logout text-xl shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {showBadge && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowBadge(false)}
        >
          <img
            src="/school-badge.jpg"
            alt="ICS School Badge"
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}
    </>
  )
}
