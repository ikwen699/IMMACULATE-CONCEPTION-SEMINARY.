'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { daysOfWeek } from '@/lib/utils'

interface TimetableEntry {
  id: string
  day: string
  startTime: string
  endTime: string
  subjectId: string
  teacherId: string
  classId: string
  subject: { name: string; code: string } | null
  teacher: { id: string; name: string } | null
  class: { name: string; section?: string } | null
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
}

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subjectId: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable()
      if (role === 'TEACHER' || role === 'ADMIN') {
        fetchSubjects(selectedClass)
      }
    }
  }, [selectedClass, role])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const profile = await res.json()
      setRole(profile.role || '')

      if (profile.role === 'TEACHER') {
        const tId = profile.teacher?.id
        if (tId) {
          setTeacherId(tId)
          const classRes = await fetch('/api/classes')
          const classData = await classRes.json()
          setClasses(classData)
          if (classData.length > 0) setSelectedClass(classData[0].id)
        }
      } else if (profile.role === 'STUDENT') {
        const classId = profile.student?.classId
        if (classId) {
          setSelectedClass(classId)
        }
        setClasses([])
      } else {
        const classRes = await fetch('/api/classes')
        const classData = await classRes.json()
        setClasses(classData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimetable = async () => {
    try {
      const res = await fetch(`/api/timetable?classId=${selectedClass}`)
      const data = await res.json()
      setTimetable(data)
    } catch (error) {
      console.error('Error fetching timetable:', error)
    }
  }

  const fetchSubjects = async (classId: string) => {
    try {
      const res = await fetch(`/api/subjects?classId=${classId}`)
      const data = await res.json()
      const filtered = role === 'TEACHER'
        ? data.filter((s: any) => s.teacherId === teacherId)
        : data
      setSubjects(filtered)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: formData.subjectId,
          day: formData.day,
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to create entry')
        return
      }
      setShowForm(false)
      setFormData({ subjectId: '', day: 'Monday', startTime: '08:00', endTime: '09:00' })
      fetchTimetable()
    } catch (error) {
      console.error('Error creating timetable entry:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this timetable entry?')) return
    try {
      await fetch(`/api/timetable?id=${id}`, { method: 'DELETE' })
      fetchTimetable()
    } catch (error) {
      console.error('Error deleting timetable entry:', error)
    }
  }

  const getTimetableForDay = (day: string) => {
    return timetable
      .filter(entry => entry.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']

  const canCreate = role === 'TEACHER' || role === 'ADMIN'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
            <p className="text-gray-500">
              {role === 'STUDENT' ? 'View your class schedule' : 'Manage class schedules'}
            </p>
          </div>
          {canCreate && selectedClass && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-blue-700 transition"
            >
              {showForm ? 'Cancel' : '+ Add Entry'}
            </button>
          )}
        </div>

        {role !== 'STUDENT' && classes.length > 0 && (
          <div className="flex gap-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {showForm && canCreate && selectedClass && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">New Timetable Entry</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleCreate}
                disabled={!formData.subjectId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Add to Timetable
              </button>
            </div>
          </div>
        )}

        {selectedClass && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {timetable.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                {role === 'STUDENT' ? 'No timetable available for your class yet.' : 'No timetable entries yet. Add one to get started.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Time</th>
                      {daysOfWeek.map((day) => (
                        <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {timeSlots.map((time) => (
                      <tr key={time}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50">{time}</td>
                        {daysOfWeek.map((day) => {
                          const entry = timetable.find(
                            (e) => e.day === day && e.startTime <= time && e.endTime > time
                          )
                          return (
                            <td key={day} className="px-4 py-3 text-sm">
                              {entry ? (
                                <div className="bg-blue-50 rounded-lg p-2 relative group">
                                  <p className="font-medium text-blue-800">{entry.subject?.name || 'N/A'}</p>
                                  <p className="text-xs text-blue-600">{entry.teacher?.name || 'N/A'}</p>
                                  <p className="text-xs text-gray-500">{entry.startTime} - {entry.endTime}</p>
                                  {canCreate && role === 'TEACHER' && entry.teacherId === teacherId && (
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      className="absolute top-1 right-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-xs"
                                    >
                                      x
                                    </button>
                                  )}
                                  {canCreate && role === 'ADMIN' && (
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      className="absolute top-1 right-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-xs"
                                    >
                                      x
                                    </button>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!selectedClass && !loading && (
          <div className="text-center py-12 text-gray-500">
            {role === 'STUDENT' ? 'You are not assigned to any class yet.' : 'Please select a class to view the timetable'}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
