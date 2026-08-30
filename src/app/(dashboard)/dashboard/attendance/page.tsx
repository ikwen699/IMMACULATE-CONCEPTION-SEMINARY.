'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Student {
  id: string
  admissionNo: string
  name: string
}

interface Class {
  id: string
  name: string
  section?: string
}

interface AttendanceRecord {
  studentId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchClasses()
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (selectedClass) {
      fetchClassStudents()
    }
  }, [selectedClass, status])

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setClasses(data)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchClassStudents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users?role=STUDENT&classId=${selectedClass}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const studentList = data
        .filter((u: any) => u.student?.classId === selectedClass)
        .map((u: any) => ({
          id: u.id,
          admissionNo: u.student?.admissionNo || '',
          name: u.name,
        }))
      setStudents(studentList)
      const existingAttendance: Record<string, string> = {}
      studentList.forEach((s: Student) => {
        existingAttendance[s.id] = 'PRESENT'
      })
      setAttendance(existingAttendance)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmit = async () => {
    if (!selectedClass || !date) {
      alert('Please select a class and date')
      return
    }

    setSaving(true)
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }))

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          date,
          records
        })
      })

      if (res.ok) {
        alert('Attendance saved successfully!')
      } else {
        alert('Error saving attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Error saving attendance')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      case 'EXCUSED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
          <p className="text-gray-500">Record and manage student attendance</p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            />
          </div>
        </div>

        {selectedClass && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Students ({students.length})
              </h3>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No students in this class</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {students.map((student) => (
                  <div key={student.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.admissionNo}</p>
                    </div>
                    <div className="flex gap-2">
                      {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleAttendanceChange(student.id, status)}
                          className={`px-3 py-1 text-sm rounded-lg transition ${
                            attendance[student.id] === status
                              ? getStatusColor(status)
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {status.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
