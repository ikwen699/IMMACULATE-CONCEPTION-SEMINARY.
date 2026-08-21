'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface UserWithTeacher {
  id: string
  name: string
  email: string
  phone?: string
  teacher?: {
    employeeId: string
    department?: string
    qualification?: string
  }
}

export default function StaffPage() {
  const [teachers, setTeachers] = useState<UserWithTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTeachers()
  }, [search])

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('role', 'TEACHER')
      if (search) params.append('search', search)

      const res = await fetch(`/api/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Directory</h1>
          <p className="text-gray-500">View all teachers and their assignments</p>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
          ) : teachers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">No teachers found</div>
          ) : (
            teachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold shrink-0">
                    {teacher.name ? teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{teacher.name}</h3>
                    <p className="text-sm text-gray-500">{teacher.teacher?.employeeId || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium truncate">{teacher.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{teacher.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-medium">{teacher.teacher?.department || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Qualification:</span>
                    <span className="font-medium">{teacher.teacher?.qualification || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
