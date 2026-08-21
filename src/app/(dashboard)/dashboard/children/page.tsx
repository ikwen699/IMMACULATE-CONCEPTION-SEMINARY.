'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Child {
  id: string
  admissionNo: string
  dateOfBirth?: string
  gender?: string
  user: {
    name: string
    email: string
  }
  class?: {
    name: string
    section?: string
  }
  grades: {
    id: string
    score: number
    grade: string
    type: string
    subject: { name: string }
  }[]
  attendance: {
    id: string
    date: string
    status: string
  }[]
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/children')
      if (res.ok) {
        const data = await res.json()
        setChildren(data)
      }
    } catch (error) {
      console.error('Error fetching children:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAttendanceRate = (attendance: any[]) => {
    if (attendance.length === 0) return 0
    const present = attendance.filter(a => a.status === 'PRESENT').length
    return Math.round((present / attendance.length) * 100)
  }

  const calculateAverageGrade = (grades: any[]) => {
    if (grades.length === 0) return 0
    const sum = grades.reduce((acc, g) => acc + g.score, 0)
    return Math.round(sum / grades.length)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Children</h1>
          <p className="text-gray-500">View your children&apos;s academic information</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : children.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No children linked to your account</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div
                key={child.id}
                className={`bg-white rounded-xl shadow-sm border p-6 cursor-pointer transition hover:shadow-md ${
                  selectedChild?.id === child.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'
                }`}
                onClick={() => setSelectedChild(child)}
              >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-gray-800 font-semibold">
                      {child.user?.name ? child.user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{child.user?.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">{child.admissionNo}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Class:</span>
                    <span className="font-medium">
                      {child.class ? `${child.class.name}${child.class.section ? ` - ${child.class.section}` : ''}` : 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Attendance:</span>
                    <span className="font-medium">{calculateAttendanceRate(child.attendance)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Average Grade:</span>
                    <span className="font-medium">{calculateAverageGrade(child.grades)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedChild && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {selectedChild.user.name}&apos;s Details
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Recent Grades</h3>
                {selectedChild.grades.length === 0 ? (
                  <p className="text-gray-500 text-sm">No grades available</p>
                ) : (
                  <div className="space-y-2">
                    {selectedChild.grades.slice(0, 5).map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">{grade.subject.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{grade.score}%</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            grade.score >= 70 ? 'bg-green-100 text-green-800' :
                            grade.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {grade.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-3">Recent Attendance</h3>
                {selectedChild.attendance.length === 0 ? (
                  <p className="text-gray-500 text-sm">No attendance records</p>
                ) : (
                  <div className="space-y-2">
                    {selectedChild.attendance.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">{new Date(record.date).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                          record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                          record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
