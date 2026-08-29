'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Fee {
  id: string
  name: string
  amount: number
  class?: { id: string; name: string; section?: string }
  session: { id: string; name: string }
  term?: { id: string; name: string }
  description?: string
  dueDate?: string
  _count: { payments: number }
}

interface Class {
  id: string
  name: string
  section?: string
}

interface Session {
  id: string
  name: string
  terms: { id: string; name: string }[]
}

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    classId: '',
    sessionId: '',
    termId: '',
    description: '',
    dueDate: ''
  })
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

  useEffect(() => {
    fetchFees()
    fetchClasses()
    fetchSessions()
    fetchRole()
  }, [])

  const fetchRole = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      setRole(data.role || '')
    } catch (error) {
      console.error('Error fetching role:', error)
    }
  }

  const fetchFees = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fees')
      if (res.ok) {
        const data = await res.json()
        setFees(data)
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingFee ? '/api/fees' : '/api/fees'
      const method = editingFee ? 'PUT' : 'POST'

      const body = editingFee
        ? { id: editingFee.id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setShowModal(false)
        setEditingFee(null)
        resetForm()
        fetchFees()
      }
    } catch (error) {
      console.error('Error saving fee:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee?')) return

    try {
      const res = await fetch(`/api/fees?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchFees()
      } else {
        alert('Failed to delete fee')
      }
    } catch (error) {
      console.error('Error deleting fee:', error)
    }
  }

  const handleEdit = (fee: Fee) => {
    setEditingFee(fee)
    setFormData({
      name: fee.name,
      amount: fee.amount,
      classId: fee.class?.id || '',
      sessionId: fee.session.id,
      termId: fee.term?.id || '',
      description: fee.description || '',
      dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      classId: '',
      sessionId: '',
      termId: '',
      description: '',
      dueDate: ''
    })
  }

  const selectedSession = sessions.find(s => s.id === formData.sessionId)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fee Management</h1>
            <p className="text-gray-500">Manage school fees and structures</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="lg:hidden flex border-2 border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 text-sm ${viewMode === 'card' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                ▦
              </button>
            </div>
            {role !== 'STUDENT' && (
              <button
                onClick={() => {
                  resetForm()
                  setEditingFee(null)
                  setShowModal(true)
                }}
                className="px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-blue-700 transition"
              >
                + Add Fee
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Fees</p>
                <p className="text-2xl font-bold text-gray-800">{fees.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
                F
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${fees.reduce((sum, fee) => sum + fee.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">
                R
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Payments Received</p>
                <p className="text-2xl font-bold text-gray-800">
                  {fees.reduce((sum, fee) => sum + fee._count.payments, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">
                P
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'card' && (
          <div className="lg:hidden space-y-3">
            {loading ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">Loading...</div>
            ) : fees.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">No fees found</div>
            ) : (
              fees.map((fee) => (
                <div key={fee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{fee.name}</div>
                      {fee.description && <div className="text-sm text-gray-500">{fee.description}</div>}
                    </div>
                    {role !== 'STUDENT' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(fee)} className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                        <button onClick={() => handleDelete(fee.id)} className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Amount:</span> <span className="font-medium text-gray-900">${fee.amount.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Class:</span> <span className="text-gray-900">{fee.class ? `${fee.class.name}${fee.class.section ? ` - ${fee.class.section}` : ''}` : 'All Classes'}</span></div>
                    <div><span className="text-gray-500">Session:</span> <span className="text-gray-900">{fee.session.name}{fee.term && ` - ${fee.term.name}`}</span></div>
                    <div><span className="text-gray-500">Due:</span> <span className="text-gray-900">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}</span></div>
                    <div><span className="text-gray-500">Payments:</span> <span className="text-gray-900">{fee._count.payments}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className={`${viewMode === 'table' ? '' : 'hidden'} lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No fees found
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{fee.name}</div>
                      {fee.description && (
                        <div className="text-sm text-gray-500">{fee.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      ${fee.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {fee.class ? `${fee.class.name}${fee.class.section ? ` - ${fee.class.section}` : ''}` : 'All Classes'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {fee.session.name}
                      {fee.term && ` - ${fee.term.name}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {fee._count.payments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {role !== 'STUDENT' && (
                        <>
                          <button
                            onClick={() => handleEdit(fee)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(fee.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingFee ? 'Edit Fee' : 'Add New Fee'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder="e.g., Tuition Fee"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                  <select
                    value={formData.sessionId}
                    onChange={(e) => setFormData({ ...formData, sessionId: e.target.value, termId: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    required
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSession && selectedSession.terms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Term (Optional)</label>
                    <select
                      value={formData.termId}
                      onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    >
                      <option value="">All Terms</option>
                      {selectedSession.terms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  />
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingFee(null)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingFee ? 'Update' : 'Create'}
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
