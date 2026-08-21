'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Student {
  id: string
  admissionNo: string
  name: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Term {
  id: string
  name: string
  session: { name: string }
}

interface GradeEntry {
  id: string
  score: number
  grade: string
  type: string
  comments?: string
  subject: { name: string }
  term: { name: string }
  student?: { name: string; class?: { name: string } }
}

export default function GradesPage() {
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRole()
  }, [])

  const fetchRole = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      setRole(data.role || '')
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </DashboardLayout>
    )
  }

  if (role === 'STUDENT') return <StudentGradesView />
  if (role === 'PARENT') return <ParentGradesView />
  if (['TEACHER', 'ADMIN', 'PRINCIPAL'].includes(role)) return <TeacherGradesView />
  return (
    <DashboardLayout>
      <div className="text-center py-12 text-gray-500">Access denied</div>
    </DashboardLayout>
  )
}

function StudentGradesView() {
  const [grades, setGrades] = useState<GradeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    fetchGrades()
  }, [])

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/children')
      const data = await res.json()
      if (data.length > 0) {
        setStudentName(data[0].user?.name || '')
        setGrades(data[0].grades || [])
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Grades</h1>
          <p className="text-gray-500">{studentName ? `Grades for ${studentName}` : 'View your academic results'}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : grades.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            No grades available yet
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {grades.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{g.subject?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{g.score}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          g.score >= 70 ? 'bg-green-100 text-green-800' :
                          g.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {g.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{g.type}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{g.term?.name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function ParentGradesView() {
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<string>('')

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/children')
      const data = await res.json()
      setChildren(data)
      if (data.length > 0) setSelectedChild(data[0].id)
    } catch (error) {
      console.error('Error fetching children:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeChild = children.find(c => c.id === selectedChild)
  const grades = activeChild?.grades || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Children&apos;s Grades</h1>
          <p className="text-gray-500">View your children&apos;s academic results</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            No children linked to your account
          </div>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedChild === child.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {child.user?.name || 'Child'}
                </button>
              ))}
            </div>

            {grades.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                No grades available for {activeChild?.user?.name}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {grades.map((g: GradeEntry) => (
                        <tr key={g.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{g.subject?.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-700">{g.score}%</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              g.score >= 70 ? 'bg-green-100 text-green-800' :
                              g.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {g.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">{g.type}</td>
                          <td className="px-6 py-4 text-gray-500 text-sm">{g.term?.name || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function TeacherGradesView() {
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({})

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [gradeType, setGradeType] = useState('TEST')

  useEffect(() => {
    fetchClasses()
    fetchSubjects()
    fetchTerms()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents()
    }
  }, [selectedClass])

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes')
      const data = await res.json()
      setClasses(data)
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects')
      const data = await res.json()
      setSubjects(data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      if (!Array.isArray(data)) {
        setTerms([])
        return
      }
      const allTerms = data.flatMap((session: any) =>
        (session.terms || []).map((term: any) => ({
          ...term,
          session: { name: session.name }
        }))
      )
      setTerms(allTerms)
    } catch (error) {
      console.error('Error fetching terms:', error)
    }
  }

  const fetchClassStudents = async () => {
    try {
      const res = await fetch(`/api/users?role=STUDENT&classId=${selectedClass}`)
      const data = await res.json()
      const studentList = data
        .filter((u: any) => u.student?.classId === selectedClass)
        .map((u: any) => ({
          id: u.student?.id || u.id,
          admissionNo: u.student?.admissionNo || '',
          name: u.name,
        }))
      setStudents(studentList)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleScoreChange = (studentId: string, score: string) => {
    const numScore = parseFloat(score) || 0
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [selectedSubject]: numScore
      }
    }))
  }

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedTerm) {
      alert('Please select a subject and term')
      return
    }

    const gradesToSubmit = Object.entries(grades).flatMap(([studentId, subjectGrades]) =>
      Object.entries(subjectGrades).map(([subjectId, score]) => ({
        studentId,
        subjectId,
        termId: selectedTerm,
        score,
        type: gradeType
      }))
    )

    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesToSubmit })
      })

      if (res.ok) {
        alert('Grades saved successfully!')
        setGrades({})
      } else {
        alert('Error saving grades')
      }
    } catch (error) {
      console.error('Error saving grades:', error)
      alert('Error saving grades')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Grade Management</h1>
            <p className="text-gray-500">Enter and manage student grades</p>
          </div>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-blue-700 transition"
          >
            Save Grades
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            >
              <option value="">Select Term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name} ({term.session.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade Type</label>
            <select
              value={gradeType}
              onChange={(e) => setGradeType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            >
              <option value="TEST">Test</option>
              <option value="EXAM">Exam</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="PROJECT">Project</option>
            </select>
          </div>
        </div>

        {selectedClass && selectedSubject && selectedTerm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                Enter Grades ({students.length} students)
              </h3>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No students in this class</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {students.map((student) => (
                  <div key={student.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.admissionNo}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grades[student.id]?.[selectedSubject] || ''}
                        onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black text-center"
                        placeholder="Score"
                      />
                      <span className="text-sm text-gray-500">/ 100</span>
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
