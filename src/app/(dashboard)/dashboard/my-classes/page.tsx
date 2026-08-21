'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Class {
  id: string
  name: string
  section?: string
  capacity: number
  _teacherName?: string | null
  _count: {
    students: number
    subjects: number
  }
}

export default function MyClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      if (!profileRes.ok) return
      const profile = await profileRes.json()
      const userRole = profile?.role || ''
      setRole(userRole)
      setUserName(profile?.name || '')

      if (userRole === 'TEACHER') {
        const teacherId = profile?.teacher?.id
        if (!teacherId) { setClasses([]); return }
        const res = await fetch(`/api/classes?teacherId=${teacherId}`)
        if (res.ok) {
          const data = await res.json()
          setClasses(data)
        }
      } else if (userRole === 'STUDENT') {
        const classId = profile?.student?.classId
        if (!classId) { setClasses([]); return }
        const res = await fetch(`/api/classes`)
        if (res.ok) {
          const data = await res.json()
          const myClass = data.filter((c: Class) => c.id === classId)
          setClasses(myClass)
        }
      } else {
        setClasses([])
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Classes</h1>
          <p className="text-gray-500">
            {role === 'TEACHER'
              ? `Classes assigned to ${userName}`
              : role === 'STUDENT'
                ? `Your class information`
                : 'Your classes'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
          ) : classes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              {role === 'STUDENT' ? 'You are not assigned to any class yet.' : 'No classes assigned to you yet.'}
            </div>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {cls.name}
                    </h3>
                    {cls.section && (
                      <p className="text-sm text-gray-500">Section: {cls.section}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {role === 'TEACHER' ? 'Class Teacher' : 'My Class'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {cls._teacherName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Class Teacher:</span>
                      <span className="font-medium">{cls._teacherName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Students:</span>
                    <span className="font-medium">{cls._count.students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subjects:</span>
                    <span className="font-medium">{cls._count.subjects}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Capacity:</span>
                    <span className="font-medium">{cls.capacity} students</span>
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
