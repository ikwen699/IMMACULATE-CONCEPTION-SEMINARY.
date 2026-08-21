'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Term {
  id?: string
  name: string
  startDate: string
  endDate: string
  isCurrent?: boolean
}

interface AcademicSession {
  id: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  terms: Term[]
  _count: { fees: number }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    terms: [{ name: '', startDate: '', endDate: '' }]
  })
  const [role, setRole] = useState('')

  useEffect(() => {
    fetchSessions()
    fetch('/api/profile').then(r => r.json()).then(d => setRole(d.role || '')).catch(() => {})
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingSession ? 'PUT' : 'POST'
      const body = editingSession ? { id: editingSession.id, ...formData } : formData

      const res = await fetch('/api/sessions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to save session')
        return
      }
      setShowModal(false)
      setEditingSession(null)
      resetForm()
      fetchSessions()
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return
    try {
      const res = await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchSessions()
      } else {
        alert('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const handleEdit = (session: AcademicSession) => {
    setEditingSession(session)
    setFormData({
      name: session.name,
      startDate: new Date(session.startDate).toISOString().split('T')[0],
      endDate: new Date(session.endDate).toISOString().split('T')[0],
      isCurrent: session.isCurrent,
      terms: session.terms.map(term => ({
        name: term.name,
        startDate: new Date(term.startDate).toISOString().split('T')[0],
        endDate: new Date(term.endDate).toISOString().split('T')[0]
      }))
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      terms: [{ name: '', startDate: '', endDate: '' }]
    })
  }

  const addTerm = () => {
    setFormData(prev => ({
      ...prev,
      terms: [...prev.terms, { name: '', startDate: '', endDate: '' }]
    }))
  }

  const removeTerm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== index)
    }))
  }

  const updateTerm = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      terms: prev.terms.map((term, i) =>
        i === index ? { ...term, [field]: value } : term
      )
    }))
  }

  const getSessionProgress = (session: AcademicSession) => {
    const now = new Date()
    const start = new Date(session.startDate)
    const end = new Date(session.endDate)
    if (now < start) return 0
    if (now > end) return 100
    return Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!['ADMIN'].includes(role)) return <DashboardLayout><div className="text-center py-12 text-gray-500">Access Denied</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Sessions</h1>
            <p className="text-gray-500">Manage academic sessions and terms</p>
          </div>
          <button
            onClick={() => { resetForm(); setEditingSession(null); setShowModal(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <span className="mdi mdi-plus text-lg" />
            New Session
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <span className="mdi mdi-calendar-blank text-6xl text-gray-300 block mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sessions Found</h3>
            <p className="text-gray-500 mb-6">Create your first academic session to get started.</p>
            <button
              onClick={() => { resetForm(); setEditingSession(null); setShowModal(true) }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sessions.map((session) => {
              const progress = getSessionProgress(session)
              return (
                <div
                  key={session.id}
                  className={`relative bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${
                    session.isCurrent
                      ? 'border-blue-300 shadow-md shadow-blue-100'
                      : 'border-gray-200'
                  }`}
                >
                  {session.isCurrent && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                        ACTIVE
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          session.isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className="mdi mdi-calendar-clock text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{session.name}</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(session.startDate)} - {formatDate(session.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-semibold text-gray-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            progress >= 80 ? 'bg-green-500' : progress >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <span className="mdi mdi-view-list text-xl text-gray-400 block mb-1" />
                        <p className="text-lg font-bold text-gray-800">{session.terms.length}</p>
                        <p className="text-xs text-gray-500">Terms</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <span className="mdi mdi-cash text-xl text-gray-400 block mb-1" />
                        <p className="text-lg font-bold text-gray-800">{session._count.fees}</p>
                        <p className="text-xs text-gray-500">Fees</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <span className={`mdi text-xl block mb-1 ${session.isCurrent ? 'text-green-500 mdi-checkbox-marked-circle' : 'text-gray-400 mdi-checkbox-blank-circle-outline'}`} />
                        <p className="text-lg font-bold text-gray-800">{session.isCurrent ? 'Yes' : 'No'}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                    </div>

                    {session.terms.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms</p>
                        <div className="space-y-2">
                          {session.terms.map((term, index) => (
                            <div key={index} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${
                                term.isCurrent ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{term.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(term.startDate)} - {formatDate(term.endDate)}
                                </p>
                              </div>
                              {term.isCurrent && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                  Current
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(session)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                      >
                        <span className="mdi mdi-pencil text-lg" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                      >
                        <span className="mdi mdi-delete text-lg" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingSession ? 'Edit Session' : 'New Session'}
                  </h2>
                  <button
                    onClick={() => { setShowModal(false); setEditingSession(null); resetForm() }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <span className="mdi mdi-close text-xl text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Name</label>
                  <div className="relative">
                    <span className="mdi mdi-calendar text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
                      placeholder="e.g., 2024/2025"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                    <div className="relative">
                      <span className="mdi mdi-calendar-start text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                    <div className="relative">
                      <span className="mdi mdi-calendar-end text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
                        required
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={formData.isCurrent}
                    onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Set as current session</span>
                    <p className="text-xs text-gray-500">This will be the active academic session</p>
                  </div>
                </label>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="mdi mdi-view-list text-lg" />
                      Terms
                    </h3>
                    <button
                      type="button"
                      onClick={addTerm}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                    >
                      <span className="mdi mdi-plus" />
                      Add Term
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.terms.map((term, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-600">Term {index + 1}</span>
                          {formData.terms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTerm(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                            >
                              <span className="mdi mdi-close-circle text-lg" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={term.name}
                          onChange={(e) => updateTerm(index, 'name', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 mb-3"
                          placeholder="Term name (e.g., First Term)"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={term.startDate}
                            onChange={(e) => updateTerm(index, 'startDate', e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
                          />
                          <input
                            type="date"
                            value={term.endDate}
                            onChange={(e) => updateTerm(index, 'endDate', e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingSession(null); resetForm() }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    {editingSession ? 'Update Session' : 'Create Session'}
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
