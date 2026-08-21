'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalParents: number
  recentEnrollments: number
  attendanceRate: number
}

export default function OverviewPage() {
  const [stats, setStats] = useState<SchoolStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalParents: 0,
    recentEnrollments: 0,
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [studentsRes, teachersRes, classesRes, parentsRes] = await Promise.all([
        fetch('/api/users?role=STUDENT'),
        fetch('/api/users?role=TEACHER'),
        fetch('/api/classes'),
        fetch('/api/users?role=PARENT')
      ])

      let students: any[] = []
      let teachers: any[] = []
      let classes: any[] = []
      let parents: any[] = []
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

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalParents: parents.length,
        recentEnrollments: students.filter((s: any) => {
          const enrolled = new Date(s.student?.enrollmentDate || s.createdAt)
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return enrolled >= monthAgo
        }).length,
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
          <h1 className="text-2xl font-bold text-gray-800">Principal&apos;s Overview</h1>
          <p className="text-gray-500">School performance and statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-3xl">
                S
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalTeachers}</p>
              </div>
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center text-3xl">
                T
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Classes</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalClasses}</p>
              </div>
              <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center text-3xl">
                C
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.attendanceRate}%</p>
              </div>
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center text-3xl">
                P
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">School Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Academic Performance</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Teacher Performance</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Student Engagement</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <span className="text-sm font-medium">78%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Parent Satisfaction</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <span className="text-sm font-medium">88%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">New student admission completed</p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">Teacher performance review scheduled</p>
                  <p className="text-xs text-gray-400">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">Exam results published for JSS 1</p>
                  <p className="text-xs text-gray-400">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-700">Parent-teacher meeting upcoming</p>
                  <p className="text-xs text-gray-400">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/reports" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition block">
              <span className="text-2xl">R</span>
              <p className="text-sm font-medium text-gray-700 mt-2">View Reports</p>
            </Link>
            <Link href="/dashboard/staff" className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition block">
              <span className="text-2xl">T</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Staff Directory</p>
            </Link>
            <Link href="/dashboard/students" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition block">
              <span className="text-2xl">S</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Student Records</p>
            </Link>
            <Link href="/dashboard/announcements" className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition block">
              <span className="text-2xl">A</span>
              <p className="text-sm font-medium text-gray-700 mt-2">Announcements</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
