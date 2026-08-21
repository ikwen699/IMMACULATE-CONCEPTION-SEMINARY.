'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalParents: number
  totalPayments: number
  totalRevenue: number
  pendingPayments: number
  attendanceRate: number
}

export default function ReportsPage() {
  const [stats, setStats] = useState<SchoolStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalParents: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [studentsRes, teachersRes, classesRes, parentsRes, paymentsRes] = await Promise.all([
        fetch('/api/users?role=STUDENT'),
        fetch('/api/users?role=TEACHER'),
        fetch('/api/classes'),
        fetch('/api/users?role=PARENT'),
        fetch('/api/payments')
      ])

      let students: any[] = []
      let teachers: any[] = []
      let classes: any[] = []
      let parents: any[] = []
      let payments: any[] = []
      if (studentsRes.ok) {
        students = await studentsRes.json()
      }
      if (teachersRes.ok) {
        teachers = await teachersRes.json()
      }
      if (classesRes.ok) {
        classes = await classesRes.json()
      }
      if (parentsRes.ok) {
        parents = await parentsRes.json()
      }
      if (paymentsRes.ok) {
        payments = await paymentsRes.json()
      }

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalParents: parents.length,
        totalPayments: payments.length,
        totalRevenue: payments.filter((p: any) => p.status === 'PRINCIPAL_APPROVED' || p.status === 'COMPLETED')
          .reduce((sum: number, p: any) => sum + p.amount, 0),
        pendingPayments: payments.filter((p: any) => p.status === 'SUBMITTED' || p.status === 'ACCOUNTANT_REVIEWED').length,
        attendanceRate: 95
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500">School performance and financial reports</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">S</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">T</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">R</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingPayments}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">P</div>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Enrollment Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Total Students Enrolled</span>
                <span className="font-bold text-blue-700">{stats.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Total Teachers</span>
                <span className="font-bold text-green-700">{stats.totalTeachers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Total Classes</span>
                <span className="font-bold text-purple-700">{stats.totalClasses}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-700">Total Parents</span>
                <span className="font-bold text-yellow-700">{stats.totalParents}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Total Revenue</span>
                <span className="font-bold text-green-700">${stats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-700">Pending Payments</span>
                <span className="font-bold text-orange-700">{stats.pendingPayments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Total Transactions</span>
                <span className="font-bold text-blue-700">{stats.totalPayments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Attendance Rate</span>
                <span className="font-bold text-purple-700">{stats.attendanceRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => alert('Feature coming soon')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition">
              <span className="text-2xl">AR</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Academic Report</p>
            </button>
            <button onClick={() => alert('Feature coming soon')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition">
              <span className="text-2xl">FR</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Financial Report</p>
            </button>
            <button onClick={() => alert('Feature coming soon')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition">
              <span className="text-2xl">ET</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Enrollment Trends</p>
            </button>
            <button onClick={() => alert('Feature coming soon')} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition">
              <span className="text-2xl">ED</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Export Data</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
