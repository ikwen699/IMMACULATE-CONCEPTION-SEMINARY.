'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface PendingUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  createdAt: string
  student?: {
    admissionNo: string
    dateOfBirth?: string
    gender?: string
  }
  teacher?: {
    employeeId: string
    department?: string
    qualification?: string
  }
}

export default function ApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [role, setRole] = useState('')

  useEffect(() => {
    fetchUsers()
    fetch('/api/profile').then(r => r.json()).then(d => setRole(d.role || '')).catch(() => {})
  }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.append('status', filter)

      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status: 'ACTIVE' })
      })

      if (res.ok) {
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error('Error approving user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this registration?')) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status: 'INACTIVE' })
      })

      if (res.ok) {
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      PRINCIPAL: 'bg-purple-100 text-purple-800',
      TEACHER: 'bg-blue-100 text-blue-800',
      STUDENT: 'bg-green-100 text-green-800',
      PARENT: 'bg-yellow-100 text-yellow-800',
      ACCOUNTANT: 'bg-blue-100 text-blue-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (!['ADMIN'].includes(role)) return <DashboardLayout><div className="text-center py-12 text-gray-500">Access Denied</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Registration Approvals</h1>
          <p className="text-gray-500">Review and approve pending registrations</p>
        </div>

        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
          >
            <option value="PENDING">Pending Approval</option>
            <option value="ACTIVE">Approved</option>
            <option value="INACTIVE">Rejected</option>
            <option value="">All Users</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      {user.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
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

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Registration Details</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Role</label>
                  <p className="font-medium">{selectedUser.role}</p>
                </div>
                {selectedUser.student && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">Student Info</p>
                    <p className="text-sm">Admission No: {selectedUser.student.admissionNo}</p>
                    {selectedUser.student.dateOfBirth && (
                      <p className="text-sm">DOB: {new Date(selectedUser.student.dateOfBirth).toLocaleDateString()}</p>
                    )}
                    {selectedUser.student.gender && (
                      <p className="text-sm">Gender: {selectedUser.student.gender}</p>
                    )}
                  </div>
                )}
                {selectedUser.teacher && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">Teacher Info</p>
                    <p className="text-sm">Employee ID: {selectedUser.teacher.employeeId}</p>
                    {selectedUser.teacher.department && (
                      <p className="text-sm">Department: {selectedUser.teacher.department}</p>
                    )}
                    {selectedUser.teacher.qualification && (
                      <p className="text-sm">Qualification: {selectedUser.teacher.qualification}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {selectedUser.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedUser.id)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-green-100 text-gray-800 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedUser.id)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-red-100 text-gray-800 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
