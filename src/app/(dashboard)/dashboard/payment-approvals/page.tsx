'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Payment {
  id: string
  amount: number
  receiptNo: string
  paymentMethod?: string
  reference?: string
  receiptImageUrl?: string
  accountantRemarks?: string
  principalRemarks?: string
  submittedAt: string
  status: string
  student: {
    admissionNo: string
    user: { name: string }
  }
  fee: {
    name: string
    amount: number
  }
  parent?: {
    user: { name: string; email: string }
  }
  accountant?: {
    user: { name: string }
  }
}

export default function PaymentApprovalsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [remarks, setRemarks] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [role, setRole] = useState('')

  useEffect(() => {
    fetchPayments()
    fetch('/api/profile').then(r => r.json()).then(d => setRole(d.role || '')).catch(() => {})
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments?status=ACCOUNTANT_REVIEWED')
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

  const handleApprove = async (paymentId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentId,
          status: 'PRINCIPAL_APPROVED',
          principalRemarks: remarks
        })
      })

      if (res.ok) {
        setSelectedPayment(null)
        setRemarks('')
        fetchPayments()
      }
    } catch (error) {
      console.error('Error approving payment:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (paymentId: string) => {
    if (!remarks) {
      alert('Please provide a reason for rejection')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentId,
          status: 'REJECTED',
          principalRemarks: remarks
        })
      })

      if (res.ok) {
        setSelectedPayment(null)
        setRemarks('')
        fetchPayments()
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (!['PRINCIPAL'].includes(role)) return <DashboardLayout><div className="text-center py-12 text-gray-500">Access Denied</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payment Approvals</h1>
          <p className="text-gray-500">Review and approve payments forwarded by accountant</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No payments awaiting approval</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{payment.receiptNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{payment.student.user.name}</div>
                      <div className="text-sm text-gray-500">{payment.student.admissionNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{payment.fee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">${payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {payment.accountant?.user.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(payment.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Review Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Approve Payment</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Receipt No</label>
                    <p className="font-medium">{selectedPayment.receiptNo}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Amount</label>
                    <p className="font-medium">${selectedPayment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Student</label>
                    <p className="font-medium">{selectedPayment.student.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Fee</label>
                    <p className="font-medium">{selectedPayment.fee.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Payment Method</label>
                    <p className="font-medium">{selectedPayment.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Submitted By</label>
                    <p className="font-medium">{selectedPayment.parent?.user.name || 'N/A'}</p>
                  </div>
                </div>

                {selectedPayment.accountantRemarks && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <label className="text-sm font-medium text-blue-700">Accountant Remarks</label>
                    <p className="text-sm text-blue-600 mt-1">{selectedPayment.accountantRemarks}</p>
                  </div>
                )}

                {selectedPayment.receiptImageUrl && (
                  <div>
                    <label className="text-sm text-gray-500">Proof of Payment</label>
                    <img
                      src={selectedPayment.receiptImageUrl}
                      alt="Receipt"
                      className="mt-2 max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    rows={3}
                    placeholder="Add remarks (required for rejection)"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setSelectedPayment(null)
                    setRemarks('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedPayment.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-100 text-gray-800 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedPayment.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-100 text-gray-800 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  Approve Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
