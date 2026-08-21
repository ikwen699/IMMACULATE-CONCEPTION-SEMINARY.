'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface UserWithTeacher {
  id: string
  name: string
  email: string
  phone?: string
  teacher?: {
    id: string
    employeeId: string
    department?: string
    qualification?: string
    teacherRecordId?: string
  }
}

interface Class {
  id: string
  name: string
  section?: string
}

interface Subject {
  id: string
  name: string
  code: string
  teacherId?: string
  teacher?: { id: string; name: string } | null
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<UserWithTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<UserWithTeacher | null>(null)
  const [assignClasses, setAssignClasses] = useState<Class[]>([])
  const [assignSubjects, setAssignSubjects] = useState<Subject[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTeachers()
    fetchRole()
  }, [search])

  const fetchRole = async () => {
    try {
      const res = await fetch('/api/profile')
      const profile = await res.json()
      setRole(profile.role || '')
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('role', 'TEACHER')
      if (search) params.append('search', search)

      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setTeachers(data)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAssignModal = async (teacher: UserWithTeacher) => {
    setSelectedTeacher(teacher)
    setShowAssignModal(true)
    try {
      const res = await fetch('/api/classes')
      const data = await res.json()
      setAssignClasses(data)
      if (data.length > 0) {
        setSelectedClassId(data[0].id)
        fetchSubjects(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchSubjects = async (classId: string) => {
    try {
      const res = await fetch(`/api/subjects?classId=${classId}`)
      const data = await res.json()
      setAssignSubjects(data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    fetchSubjects(classId)
  }

  const handleAssign = async (subjectId: string, currentlyAssigned: boolean) => {
    if (!selectedTeacher) return
    setSaving(true)
    try {
      const res = await fetch('/api/subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: subjectId,
            teacherId: currentlyAssigned ? '' : selectedTeacher.teacher?.teacherRecordId || '',
          }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update assignment')
        return
      }
      fetchSubjects(selectedClassId)
    } catch (error) {
      console.error('Error updating assignment:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
          <p className="text-gray-500">View and manage teacher records</p>
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
                    <span className="text-gray-500">Department:</span>
                    <span className="font-medium">{teacher.teacher?.department || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Qualification:</span>
                    <span className="font-medium">{teacher.teacher?.qualification || 'N/A'}</span>
                  </div>
                </div>

                {role === 'ADMIN' && teacher.teacher && (
                  <button
                    onClick={() => openAssignModal(teacher)}
                    className="mt-4 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    Assign to Subject
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Assign Subjects</h2>
                  <p className="text-sm text-gray-500">{selectedTeacher.name}</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  x
                </button>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                >
                  {assignClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {assignSubjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No subjects in this class</div>
              ) : (
                <div className="space-y-3">
                  {assignSubjects.map((subject) => {
                    const isAssigned = subject.teacherId === selectedTeacher.teacher?.teacherRecordId
                    return (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800">{subject.name}</p>
                          <p className="text-sm text-gray-500">
                            {subject.code}
                            {subject.teacher && !isAssigned && (
                              <span className="text-gray-400"> — {subject.teacher.name}</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAssign(subject.id, isAssigned)}
                          disabled={saving}
                          className={`px-3 py-1.5 text-sm rounded-lg transition disabled:opacity-50 ${
                            isAssigned
                              ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isAssigned ? 'Assigned' : 'Assign'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
