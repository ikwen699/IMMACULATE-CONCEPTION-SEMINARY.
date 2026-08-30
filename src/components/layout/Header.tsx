'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { cn, getInitials } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string
  createdAt: string
}

const TYPE_DOT_COLORS: Record<string, string> = {
  PAYMENT: 'bg-emerald-500',
  GRADE: 'bg-blue-500',
  ATTENDANCE: 'bg-amber-500',
  ANNOUNCEMENT: 'bg-purple-500',
}

function timeAgo(date: string) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) }
  catch { return '' }
}

interface HeaderProps {
  onMenuToggle?: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession()
  const user = session?.user as any
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifError, setNotifError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        setNotifError(false)
      } else {
        setNotifError(true)
      }
    } catch {
      setNotifError(true)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (!showNotifications) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNotifications])

  const markAsRead = async (notificationId?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, markAll: !notificationId }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notifications:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 lg:hidden"
          >
            <span className="mdi mdi-menu text-xl" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-blue-800">ICS</h2>
            <p className="text-xs sm:text-sm text-blue-600">School Portal</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Notification bell */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'relative p-2 rounded-lg transition-colors',
                showNotifications
                  ? 'bg-gray-100 text-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <span className={cn('mdi text-xl', showNotifications ? 'mdi-bell' : 'mdi-bell-outline')} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-scale-in"
              >
                {/* Dropdown header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAsRead()}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifError ? (
                    <div className="p-6 text-center">
                      <span className="mdi mdi-alert-circle-outline text-2xl text-red-300 block mb-2" />
                      <p className="text-sm text-gray-500">Failed to load notifications</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <span className="mdi mdi-bell-off-outline text-2xl text-gray-300 block mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((notification) => {
                      const dotColor = TYPE_DOT_COLORS[notification.type] || 'bg-gray-400'
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'px-4 py-3 border-b border-gray-50 transition-colors cursor-pointer',
                            !notification.read ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-gray-50'
                          )}
                          onClick={() => {
                            markAsRead(notification.id)
                            if (notification.link) window.location.href = notification.link
                            setShowNotifications(false)
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', dotColor)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={cn(
                                  'text-sm truncate',
                                  !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                                )}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notification.message}</p>
                              <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notification.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                    <Link
                      href="/dashboard/notifications"
                      className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      onClick={() => setShowNotifications(false)}
                    >
                      View all notifications
                      <span className="mdi mdi-arrow-right text-sm" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <Link href="/dashboard/profile" className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name ? getInitials(user.name) : '?'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'Role'}</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
