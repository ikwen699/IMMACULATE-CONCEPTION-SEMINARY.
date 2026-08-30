'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string
  createdAt: string
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  PAYMENT: { icon: 'mdi-cash', color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Payment' },
  GRADE: { icon: 'mdi-school', color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Grade' },
  ATTENDANCE: { icon: 'mdi-check-circle', color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Attendance' },
  ANNOUNCEMENT: { icon: 'mdi-bullhorn', color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Announcement' },
}

const DEFAULT_TYPE = { icon: 'mdi-bell', color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'General' }

function timeAgo(date: string) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) }
  catch { return '' }
}

function fullDate(date: string) {
  try { return format(new Date(date), 'MMM d, yyyy \'at\' h:mm a') }
  catch { return date }
}

type FilterType = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const clearAllTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { if (status !== 'authenticated') return;
    fetchNotifications() }, [fetchNotifications, status])

  useEffect(() => {
    if (status !== 'authenticated') return;
    return () => { if (clearAllTimeoutRef.current) clearTimeout(clearAllTimeoutRef.current) }
  }, [status])

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

  const deleteNotification = async (notificationId?: string) => {
    try {
      const url = notificationId
        ? `/api/notifications?id=${notificationId}`
        : '/api/notifications'
      await fetch(url, { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  const handleClearAll = () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true)
      clearAllTimeoutRef.current = setTimeout(() => setConfirmClearAll(false), 4000)
      return
    }
    if (clearAllTimeoutRef.current) clearTimeout(clearAllTimeoutRef.current)
    setConfirmClearAll(false)
    deleteNotification()
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'read') return n.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const filterTabs: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'read', label: 'Read' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-bell text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="mdi mdi-email-open text-lg" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors',
                  confirmClearAll
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-red-600 bg-red-50 hover:bg-red-100'
                )}
              >
                <span className={cn('mdi', confirmClearAll ? 'mdi-alert' : 'mdi-delete-outline')} />
                {confirmClearAll ? 'Confirm clear all' : 'Clear all'}
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 -mb-px">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
                  filter === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full',
                    filter === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading notifications...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                  <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">Failed to load notifications</p>
                  <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
                </div>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="mdi mdi-refresh" />
                  Retry
                </button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <span className={cn(
                    'text-3xl',
                    filter === 'unread' ? 'mdi mdi-email-open-outline text-gray-400' : 'mdi mdi-bell-off-outline text-gray-400'
                  )} />
                </div>
                <div>
                  <p className="font-medium text-gray-700">
                    {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {filter === 'unread' ? 'You\'re all caught up!' : 'When you receive notifications, they\'ll appear here.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((notification) => {
                const typeCfg = TYPE_CONFIG[notification.type] || DEFAULT_TYPE
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'group px-5 py-4 transition-colors',
                      !notification.read ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Type icon */}
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5', typeCfg.bgColor)}>
                        <span className={cn('mdi text-lg', typeCfg.icon, typeCfg.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            'text-sm',
                            !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          )}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-400" title={fullDate(notification.createdAt)}>
                            {timeAgo(notification.createdAt)}
                          </span>
                          <span className={cn(
                            'text-[10px] font-medium px-1.5 py-0.5 rounded',
                            typeCfg.bgColor, typeCfg.color
                          )}>
                            {typeCfg.label}
                          </span>
{notification.link && (
                              <a
                                href={notification.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-500 flex items-center gap-0.5"
                              >
                                <span className="mdi mdi-arrow-right text-sm" />
                                View
                              </a>
                            )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <span className="mdi mdi-email-open-outline text-lg" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="mdi mdi-close text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
