'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Payment {
  id: string
  amount: number
  paymentDate: string
  receiptNo: string
  paymentMethod?: string
  status: string
  notes?: string
  student: {
    id: string
    admissionNo: string
    user: { name: string }
  }
  fee: {
    id: string
    name: string
    amount: number
  }
  accountant?: {
    id: string
    user: { name: string }
  }
}

interface Student {
  id: string
  admissionNo: string
  user: { name: string }
}

interface Fee {
  id: string
  name: string
  amount: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [formData, setFormData] = useState({
    studentId: '',
    feeId: '',
    amount: 0,
    paymentMethod: 'CASH',
    reference: '',
    notes: ''
  })
  const [role, setRole] = useState('')

  useEffect(() => {
    fetchPayments()
    fetchStudents()
    fetchFees()
    fetch('/api/profile').then(r => r.json()).then(d => setRole(d.role || '')).catch(() => {})
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments')
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/users?role=STUDENT')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/fees')
      if (res.ok) {
        const data = await res.json()
        setFees(data)
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchPayments()
        alert('Payment recorded successfully!')
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Error recording payment')
    }
  }

  const resetForm = () => {
    setFormData({
      studentId: '',
      feeId: '',
      amount: 0,
      paymentMethod: 'CASH',
      reference: '',
      notes: ''
    })
  }

  const selectedFee = fees.find(f => f.id === formData.feeId)

  if (!['ADMIN', 'ACCOUNTANT'].includes(role)) return <DashboardLayout><div className="text-center py-12 text-gray-500">Access Denied</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
            <p className="text-gray-500">Record and track student payments</p>
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
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-blue-700 transition"
            >
              + Record Payment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
                P
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Collected</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">
                T
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Collections</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${payments
                    .filter(p => new Date(p.paymentDate).toDateString() === new Date().toDateString())
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">
                D
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Fees</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${fees
                    .filter(f => !payments.some(p => p.fee.id === f.id))
                    .reduce((sum, f) => sum + f.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">
                P
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'card' && (
          <div className="lg:hidden space-y-3">
            {loading ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">No payments found</div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{payment.student.user.name}</div>
                      <div className="text-sm text-gray-500">{payment.student.admissionNo}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{payment.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Receipt:</span> <span className="font-mono text-gray-900">{payment.receiptNo}</span></div>
                    <div><span className="text-gray-500">Fee:</span> <span className="text-gray-900">{payment.fee.name}</span></div>
                    <div><span className="text-gray-500">Amount:</span> <span className="font-medium text-gray-900">${payment.amount.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</span></div>
                    <div><span className="text-gray-500">Method:</span> <span className="text-gray-900">{payment.paymentMethod || 'N/A'}</span></div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                      {payment.receiptNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{payment.student.user.name}</div>
                      <div className="text-sm text-gray-500">{payment.student.admissionNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {payment.fee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {payment.paymentMethod || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {payment.status}
                      </span>
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
              <h2 className="text-xl font-bold mb-4">Record New Payment</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user.name} ({student.admissionNo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
                  <select
                    value={formData.feeId}
                    onChange={(e) => setFormData({ ...formData, feeId: e.target.value, amount: fees.find(f => f.id === e.target.value)?.amount || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    required
                  >
                    <option value="">Select Fee</option>
                    {fees.map((fee) => (
                      <option key={fee.id} value={fee.id}>
                        {fee.name} - ${fee.amount}
                      </option>
                    ))}
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                    <option value="MOBILE">Mobile Payment</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    rows={2}
                  />
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
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
                    Record Payment
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
