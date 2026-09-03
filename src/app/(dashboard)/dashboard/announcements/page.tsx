'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn, getInitials } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  content: string
  targetRole?: string
  isPublished: boolean
  createdAt: string
  author: {
    id: string
    name: string
    role: string
  }
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 ring-red-600/20',
  PRINCIPAL: 'bg-purple-100 text-purple-700 ring-purple-600/20',
  TEACHER: 'bg-blue-100 text-blue-700 ring-blue-600/20',
  STUDENT: 'bg-green-100 text-green-700 ring-green-600/20',
  PARENT: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  ACCOUNTANT: 'bg-teal-100 text-teal-700 ring-teal-600/20',
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
]

function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function timeAgo(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return new Date(date).toLocaleDateString()
  }
}

const CONTENT_TRUNCATE_LENGTH = 220

export default function AnnouncementsPage() {
  const { status } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ title: '', content: '', targetRoles: [] as string[] })
  const modalRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchRole = async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' })
      const data = await res.json()
      setRole(data.role || '')
    } catch (error) {
      console.error('Error fetching role:', error)
    }
  }

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/announcements', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchAnnouncements()
    fetchRole()
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (showModal) {
      setTimeout(() => titleInputRef.current?.focus(), 100)
    }
  }, [showModal, status])

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!showModal) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        resetForm()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showModal, status])

  const resetForm = () => {
    setFormData({ title: '', content: '', targetRoles: [] })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          targetRoles: formData.targetRoles,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to create announcement', 'error')
        return
      }
      setShowModal(false)
      resetForm()
      fetchAnnouncements()
      showToast('Announcement published successfully')
    } catch (error) {
      console.error('Error creating announcement:', error)
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null)
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAnnouncements()
        showToast('Announcement deleted')
      } else {
        showToast('Failed to delete announcement', 'error')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      showToast('Something went wrong. Please try again.', 'error')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canManage = role === 'ADMIN' || role === 'PRINCIPAL'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div
            className={cn(
              'fixed top-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in-top',
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn('mdi', toast.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle')} />
              {toast.message}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="mdi mdi-bullhorn text-blue-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
              <p className="text-sm text-gray-500">View and manage school-wide announcements</p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
            >
              <span className="mdi mdi-plus text-lg" />
              New Announcement
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading announcements...</p>
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <span className="mdi mdi-bullhorn-outline text-3xl text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">No announcements yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {canManage
                      ? 'Create your first announcement to get started.'
                      : 'Check back later for school updates.'}
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={() => {
                      resetForm()
                      setShowModal(true)
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span className="mdi mdi-plus text-lg" />
                    New Announcement
                  </button>
                )}
              </div>
            </div>
          ) : (
            announcements.map((announcement) => {
              const isExpanded = expandedIds.has(announcement.id)
              const needsTruncation = announcement.content.length > CONTENT_TRUNCATE_LENGTH
              const displayContent =
                needsTruncation && !isExpanded
                  ? announcement.content.slice(0, CONTENT_TRUNCATE_LENGTH) + '...'
                  : announcement.content

              return (
                <div
                  key={announcement.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-5 sm:p-6">
                    {/* Top row: title + actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 break-words">
                            {announcement.title}
                          </h3>
                          {announcement.targetRole && announcement.targetRole.split(',').map(role => (
                            <span
                              key={role}
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset',
                                ROLE_BADGE_COLORS[role] || 'bg-gray-100 text-gray-700 ring-gray-600/20'
                              )}
                            >
                              {role.charAt(0) + role.slice(1).toLowerCase()}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {displayContent}
                        </p>
                        {needsTruncation && (
                          <button
                            onClick={() => toggleExpand(announcement.id)}
                            className="mt-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>

                      {canManage && (
                        <div className="shrink-0">
                          {deleteConfirmId === announcement.id ? (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                              <button
                                onClick={() => handleDelete(announcement.id)}
                                className="text-xs font-medium text-red-700 hover:text-red-900 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs font-medium text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(announcement.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete announcement"
                            >
                              <span className="mdi mdi-delete-outline text-lg" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer: author + time */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                          getAvatarColor(announcement.author.name)
                        )}
                      >
                        {getInitials(announcement.author.name)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                        <span className="font-medium text-gray-700">{announcement.author.name}</span>
                        <span className="text-gray-300">&middot;</span>
                        <span className="text-gray-500">{timeAgo(announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false)
                resetForm()
              }
            }}
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
            <div
              ref={modalRef}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="mdi mdi-bullhorn text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">New Announcement</h2>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="mdi mdi-close text-xl" />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Holiday Schedule Update"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400 transition-shadow"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">Content</label>
                    <span
                      className={cn(
                        'text-xs',
                        formData.content.length > 1000 ? 'text-red-500 font-medium' : 'text-gray-400'
                      )}
                    >
                      {formData.content.length}/1000
                    </span>
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value.slice(0, 1000) })
                    }
                    placeholder="Write your announcement here..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400 resize-none transition-shadow"
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {[
                      { value: 'ADMIN', label: 'Admin', icon: 'mdi-shield-crown' },
                      { value: 'PRINCIPAL', label: 'Principal', icon: 'mdi-school' },
                      { value: 'TEACHER', label: 'Teachers', icon: 'mdi-account-school' },
                      { value: 'STUDENT', label: 'Students', icon: 'mdi-school-outline' },
                      { value: 'PARENT', label: 'Parents', icon: 'mdi-account-group' },
                      { value: 'ACCOUNTANT', label: 'Accountants', icon: 'mdi-cash' },
                    ].map(({ value, label, icon }) => (
                      <label
                        key={value}
                        className={cn(
                          'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border cursor-pointer transition-colors',
                          formData.targetRoles.includes(value)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formData.targetRoles.includes(value)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...formData.targetRoles, value]
                              : formData.targetRoles.filter(r => r !== value)
                            setFormData({ ...formData, targetRoles: newRoles })
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={cn('mdi', icon, 'text-base sm:text-lg shrink-0')} />
                        <span className="text-xs sm:text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {formData.targetRoles.length === 0
                      ? 'Will be sent to everyone'
                      : `${formData.targetRoles.length} role(s) selected`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                    className={cn(
                      'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm',
                      submitting || !formData.title.trim() || !formData.content.trim()
                        ? 'bg-blue-300 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    )}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <span className="mdi mdi-send" />
                        Publish
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
