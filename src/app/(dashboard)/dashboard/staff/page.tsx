'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format, formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  createdAt: string
  teacher?: {
    employeeId: string
    department?: string
    qualification?: string
    teacherRecordId?: string
  }
}

const DEPARTMENT_COLORS: Record<string, string> = {
  Science: 'bg-emerald-100 text-emerald-700',
  Mathematics: 'bg-blue-100 text-blue-700',
  English: 'bg-purple-100 text-purple-700',
  'Social Studies': 'bg-amber-100 text-amber-700',
  Languages: 'bg-rose-100 text-rose-700',
  Arts: 'bg-pink-100 text-pink-700',
  'Physical Education': 'bg-orange-100 text-orange-700',
  default: 'bg-gray-100 text-gray-600',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Inactive' },
  SUSPENDED: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Suspended' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Pending' },
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
]

function getInitials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getDeptColor(dept?: string) {
  if (!dept) return DEPARTMENT_COLORS.default
  return DEPARTMENT_COLORS[dept] || DEPARTMENT_COLORS.default
}

export default function StaffPage() {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const principalName = user?.name?.split(' ')[0] || 'Principal'

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [searchInput, setSearchInput] = useState('')

  const fetchTeachers = useCallback(async (q: string) => {
    if (status !== 'authenticated') return;
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ role: 'TEACHER' })
      if (q) params.append('search', q)
      const res = await fetch(`/api/users?${params}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTeachers(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { if (status !== 'authenticated') return;
    fetchTeachers(search) }, [fetchTeachers, search, status])

  const handleSearch = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(value), 300)
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  const activeCount = teachers.filter(t => t.status === 'ACTIVE').length
  const deptSet = new Set(teachers.map(t => t.teacher?.department).filter(Boolean))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-account-group text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {principalName}
              </h1>
              <p className="text-sm text-gray-500">
                {format(today, 'EEEE, MMMM d, yyyy')} &middot; Staff directory
              </p>
            </div>
          </div>
          {!loading && teachers.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                <span className="mdi mdi-account-group text-base" />
                {teachers.length} teacher{teachers.length === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                <span className="mdi mdi-check-circle text-base" />
                {activeCount} active
              </span>
              {deptSet.size > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium">
                  <span className="mdi mdi-domain text-base" />
                  {deptSet.size} department{deptSet.size === 1 ? '' : 's'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="mdi mdi-close text-lg" />
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load staff</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button onClick={() => fetchTeachers(search)} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <span className="mdi mdi-refresh" /> Retry
              </button>
            </div>
          </div>
        ) : teachers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="mdi mdi-account-off-outline text-3xl text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {search ? 'No teachers match your search' : 'No teachers found'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {search ? 'Try a different search term' : 'Teachers will appear here once they are added'}
                </p>
              </div>
              {search && (
                <button onClick={() => handleSearch('')} className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {teachers.map((teacher) => {
              const isExpanded = expandedId === teacher.id
              const status = STATUS_STYLES[teacher.status] || STATUS_STYLES.ACTIVE
              return (
                <div
                  key={teacher.id}
                  className={cn(
                    'bg-white rounded-xl border shadow-sm transition-all duration-200',
                    isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-100' : 'border-gray-100 hover:shadow-md'
                  )}
                >
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex items-start gap-3.5">
                      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm shrink-0', getAvatarColor(teacher.name))}>
                        {getInitials(teacher.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{teacher.name}</h3>
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0', status.bg, status.text)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{teacher.teacher?.employeeId || 'No employee ID'}</p>
                      </div>
                    </div>

                    {/* Quick info */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="mdi mdi-email-outline text-gray-400 text-base shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="mdi mdi-phone-outline text-gray-400 text-base shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                      {teacher.teacher?.department && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="mdi mdi-domain text-gray-400 text-base shrink-0" />
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', getDeptColor(teacher.teacher.department))}>
                            {teacher.teacher.department}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : teacher.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-gray-100 text-xs font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors rounded-b-xl"
                  >
                    <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                    <span className={cn('mdi text-sm transition-transform duration-200', isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down')} />
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4 animate-fade-in">
                      {teacher.teacher?.qualification && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <span className="mdi mdi-certificate text-amber-500 text-base" /> Qualification
                          </span>
                          <span className="font-medium text-gray-800">{teacher.teacher.qualification}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <span className="mdi mdi-calendar text-blue-500 text-base" /> Joined
                        </span>
                        <span className="font-medium text-gray-800">{format(new Date(teacher.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <span className="mdi mdi-clock-outline text-gray-400 text-base" /> Member for
                        </span>
                        <span className="font-medium text-gray-800">{formatDistanceToNow(new Date(teacher.createdAt), { addSuffix: true })}</span>
                      </div>
                      {!teacher.teacher?.qualification && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <span className="mdi mdi-certificate text-gray-300 text-base" /> Qualification
                          </span>
                          <span className="text-gray-400 italic">Not specified</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
