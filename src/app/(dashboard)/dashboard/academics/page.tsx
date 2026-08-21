'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface ClassPerformance {
  classId: string
  className: string
  section?: string
  studentCount: number
  averageScore: number
  subjectPerformance: {
    subjectName: string
    averageScore: number
  }[]
}

interface Grade {
  id: string
  score: number
  grade: string
  type: string
  student: {
    user: { name: string }
    class: { name: string; section?: string }
  }
  subject: { name: string }
  term: { name: string }
}

export default function AcademicsPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTerm, setSelectedTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [selectedTerm])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [classesRes, gradesRes] = await Promise.all([
        fetch('/api/classes'),
        fetch(`/api/grades${selectedTerm ? `?termId=${selectedTerm}` : ''}`)
      ])

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData)
      }
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json()
        setGrades(gradesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateClassAverage = (className: string) => {
    const classGrades = grades.filter(g => g.student.class?.name === className)
    if (classGrades.length === 0) return 0
    const sum = classGrades.reduce((acc, g) => acc + g.score, 0)
    return Math.round(sum / classGrades.length)
  }

  const calculateSubjectAverage = (subjectName: string) => {
    const subjectGrades = grades.filter(g => g.subject.name === subjectName)
    if (subjectGrades.length === 0) return 0
    const sum = subjectGrades.reduce((acc, g) => acc + g.score, 0)
    return Math.round(sum / subjectGrades.length)
  }

  const getSubjects = () => {
    const subjectMap = new Map<string, number>()
    grades.forEach(g => {
      if (!subjectMap.has(g.subject.name)) {
        subjectMap.set(g.subject.name, 0)
      }
    })
    return Array.from(subjectMap.keys())
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Academic Overview</h1>
          <p className="text-gray-500">View class and subject performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Classes</p>
                <p className="text-2xl font-bold text-gray-800">{classes.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">C</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Grades</p>
                <p className="text-2xl font-bold text-gray-800">{grades.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">G</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Average</p>
                <p className="text-2xl font-bold text-gray-800">
                  {grades.length > 0 ? Math.round(grades.reduce((a, g) => a + g.score, 0) / grades.length) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">P</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-800">{getSubjects().length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">S</div>
            </div>
          </div>
        </div>

        {/* Class Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Class Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : classes.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No classes found</td></tr>
                ) : (
                  classes.map((cls) => {
                    const avg = calculateClassAverage(cls.name)
                    return (
                      <tr key={cls.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{cls.name}{cls.section ? ` - ${cls.section}` : ''}</td>
                        <td className="px-4 py-3 text-gray-500">{cls._count?.students || 0}</td>
                        <td className="px-4 py-3 font-medium">{avg}%</td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                avg >= 70 ? 'bg-green-500' : avg >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${avg}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getSubjects().map((subject) => {
              const avg = calculateSubjectAverage(subject)
              return (
                <div key={subject} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{subject}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      avg >= 70 ? 'bg-green-100 text-green-800' :
                      avg >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {avg}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        avg >= 70 ? 'bg-green-500' : avg >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
