'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn, calculateGrade } from '@/lib/utils'

interface ClassData { id: string; name: string; section?: string }
interface Subject { id: string; name: string; code: string }
interface Term { id: string; name: string; sessionId: string }
interface Session { id: string; name: string; terms: Term[] }
interface Student { id: string; admissionNo: string; name: string }
interface ExistingGrade { studentId: string; ca1: number; ca2: number; ca3: number; exam: number; total: number; grade: string }

interface StudentGrade {
  studentId: string
  name: string
  admissionNo: string
  ca1: string
  ca2: string
  ca3: string
  exam: string
  total: number
  letterGrade: string
  isNew: boolean
}

function getGradeColor(grade: string) {
  if (grade === 'A') return 'bg-green-100 text-green-700'
  if (grade === 'B') return 'bg-blue-100 text-blue-700'
  if (grade === 'C') return 'bg-amber-100 text-amber-700'
  if (grade === 'D') return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

function calcTotal(ca1: string, ca2: string, ca3: string, exam: string) {
  return (parseFloat(ca1) || 0) + (parseFloat(ca2) || 0) + (parseFloat(ca3) || 0) + (parseFloat(exam) || 0)
}

export default function ResultsPage() {
  const { data: session, status } = useSession()

  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedGradeType, setSelectedGradeType] = useState('')

  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)

  const fetchInitialData = useCallback(async () => {
    if (status !== 'authenticated') return
    setLoading(true)
    try {
      const profileRes = await fetch('/api/profile', { cache: 'no-store' })
      const profile = profileRes.ok ? await profileRes.json() : null
      const teacherId = profile?.teacher?.id

      const [classesRes, sessionsRes] = await Promise.all([
        teacherId ? fetch(`/api/classes?teacherId=${teacherId}`, { cache: 'no-store' }) : fetch('/api/classes', { cache: 'no-store' }),
        fetch('/api/sessions', { cache: 'no-store' }),
      ])

      if (classesRes.ok) {
        const data = await classesRes.json()
        setClasses(Array.isArray(data) ? data : [])
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setSessions(Array.isArray(data) ? data : [])
      }
    } catch {} finally { setLoading(false) }
  }, [status])

  useEffect(() => { fetchInitialData() }, [fetchInitialData])

  useEffect(() => {
    if (!selectedClass) { setSubjects([]); return }
    fetch(`/api/subjects?classId=${selectedClass}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setSubjects(Array.isArray(d) ? d : []))
      .catch(() => setSubjects([]))
  }, [selectedClass])

  const loadStudents = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm) return
    setLoadingStudents(true)
    setSaveResult(null)
    try {
      const [studentsRes, gradesRes] = await Promise.all([
        fetch(`/api/users?role=STUDENT&classId=${selectedClass}`, { cache: 'no-store' }),
        fetch(`/api/grades?classId=${selectedClass}&subjectId=${selectedSubject}&termId=${selectedTerm}`, { cache: 'no-store' }),
      ])

      const studentsData = studentsRes.ok ? await studentsRes.json() : []
      const gradesData = gradesRes.ok ? await gradesRes.json() : []

      const students = (Array.isArray(studentsData) ? studentsData : [])
        .filter((u: any) => u.student?.classId === selectedClass)
        .map((u: any) => ({
          id: u.student?.id || u.id,
          admissionNo: u.student?.admissionNo || '',
          name: u.name,
        }))

      const existingGrades: ExistingGrade[] = (Array.isArray(gradesData) ? gradesData : [])
        .filter((g: any) => g.student?.id && g.subject?.id === selectedSubject)
        .map((g: any) => ({
          studentId: g.student.id,
          ca1: g.ca1 || 0,
          ca2: g.ca2 || 0,
          ca3: g.ca3 || 0,
          exam: g.exam || 0,
          total: g.total || 0,
          grade: g.grade || '',
        }))

      const gradeMap = new Map(existingGrades.map(g => [g.studentId, g]))

      const merged: StudentGrade[] = students.map(s => {
        const existing = gradeMap.get(s.id)
        if (existing) {
          const total = existing.ca1 + existing.ca2 + existing.ca3 + existing.exam
          return {
            studentId: s.id,
            name: s.name,
            admissionNo: s.admissionNo,
            ca1: String(existing.ca1),
            ca2: String(existing.ca2),
            ca3: String(existing.ca3),
            exam: String(existing.exam),
            total,
            letterGrade: existing.grade || calculateGrade(total),
            isNew: false,
          }
        }
        return {
          studentId: s.id,
          name: s.name,
          admissionNo: s.admissionNo,
          ca1: '', ca2: '', ca3: '', exam: '',
          total: 0, letterGrade: '', isNew: true,
        }
      })

      setStudentGrades(merged)
    } catch {} finally { setLoadingStudents(false) }
  }, [selectedClass, selectedSubject, selectedTerm])

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) {
      loadStudents()
    } else {
      setStudentGrades([])
    }
  }, [selectedClass, selectedSubject, selectedTerm, loadStudents])

  const updateGrade = (index: number, field: 'ca1' | 'ca2' | 'ca3' | 'exam', value: string) => {
    setStudentGrades(prev => prev.map((row, i) => {
      if (i !== index) return row
      const numVal = value === '' ? '' : value
      const max = field === 'exam' ? 70 : 10
      const parsed = parseFloat(numVal as string)
      if (numVal !== '' && (isNaN(parsed) || parsed < 0 || parsed > max)) return row

      const updated = { ...row, [field]: numVal }
      const total = calcTotal(updated.ca1, updated.ca2, updated.ca3, updated.exam)
      updated.total = total
      updated.letterGrade = calculateGrade(total)
      return updated
    }))
  }

  const handlePost = async () => {
    setSaving(true)
    setSaveResult(null)

    const gradesToPost = studentGrades
      .filter(r => r.total > 0 || r.ca1 || r.ca2 || r.ca3 || r.exam)
      .map(r => ({
        studentId: r.studentId,
        subjectId: selectedSubject,
        termId: selectedTerm,
        ca1: parseFloat(r.ca1) || 0,
        ca2: parseFloat(r.ca2) || 0,
        ca3: parseFloat(r.ca3) || 0,
        exam: parseFloat(r.exam) || 0,
      }))

    if (gradesToPost.length === 0) {
      setSaveResult({ success: false, message: 'No grades to save. Enter at least one score.' })
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesToPost }),
      })
      if (res.ok) {
        setSaveResult({ success: true, message: `${gradesToPost.length} result${gradesToPost.length === 1 ? '' : 's'} posted successfully!` })
        loadStudents()
      } else {
        const d = await res.json()
        setSaveResult({ success: false, message: d.error || 'Failed to post results' })
      }
    } catch {
      setSaveResult({ success: false, message: 'Failed to post results. Please try again.' })
    } finally { setSaving(false) }
  }

  const selectedSession = sessions.find(s => s.terms?.some(t => t.id === selectedTerm))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <span className="mdi mdi-file-document-edit text-violet-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Post Results</h1>
              <p className="text-sm text-gray-500">Enter CA and exam scores for students</p>
            </div>
          </div>
          {studentGrades.length > 0 && (
            <button
              onClick={handlePost}
              disabled={saving}
              className={cn('px-5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                saving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'
              )}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...
                </span>
              ) : 'Post Grades'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Selectors */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Class</label>
                  <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); setStudentGrades([]) }}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject</label>
                  <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setStudentGrades([]) }}
                    disabled={!selectedClass}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none disabled:opacity-50">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Term</label>
                  <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setStudentGrades([]) }}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none">
                    <option value="">Select Term</option>
                    {sessions.map(s => s.terms?.map(t => (
                      <option key={t.id} value={t.id}>{s.name} — {t.name}</option>
                    )))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                  <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                    {studentGrades.length > 0 ? `${studentGrades.length} students loaded` : 'Select all above to load'}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            {loadingStudents ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading students...</p>
                </div>
              </div>
            ) : studentGrades.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Score breakdown info */}
                <div className="px-5 py-3 bg-violet-50 border-b border-violet-100 flex flex-wrap items-center gap-4 text-xs text-violet-700">
                  <span className="font-semibold">Score Breakdown:</span>
                  <span>CA1: /10</span>
                  <span>CA2: /10</span>
                  <span>CA3: /10</span>
                  <span>Exam: /70</span>
                  <span className="font-semibold">Total: /100</span>
                  <span className="ml-auto">A(70+) B(60-69) C(50-59) D(40-49) F(&lt;40)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase sticky left-8 bg-gray-50 z-10 min-w-[180px]">Student</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">CA1</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">CA2</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">CA3</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Exam</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Total</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {studentGrades.map((row, i) => {
                        const total = calcTotal(row.ca1, row.ca2, row.ca3, row.exam)
                        const grade = calculateGrade(total)
                        const isFail = grade === 'F' && total > 0
                        return (
                          <tr key={row.studentId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-2.5 text-sm text-gray-400 sticky left-0 bg-white hover:bg-gray-50/50 z-10">{i + 1}</td>
                            <td className="px-4 py-2.5 sticky left-8 bg-white hover:bg-gray-50/50 z-10">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{row.name}</p>
                                <p className="text-[11px] text-gray-400">{row.admissionNo}</p>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input type="number" min="0" max="10" step="0.5"
                                value={row.ca1} onChange={e => updateGrade(i, 'ca1', e.target.value)}
                                className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input type="number" min="0" max="10" step="0.5"
                                value={row.ca2} onChange={e => updateGrade(i, 'ca2', e.target.value)}
                                className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input type="number" min="0" max="10" step="0.5"
                                value={row.ca3} onChange={e => updateGrade(i, 'ca3', e.target.value)}
                                className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input type="number" min="0" max="70" step="0.5"
                                value={row.exam} onChange={e => updateGrade(i, 'exam', e.target.value)}
                                className={cn(
                                  'w-16 px-2 py-1.5 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20',
                                  isFail ? 'border-red-300 bg-red-50 text-red-700 font-bold' : 'border-gray-200 bg-gray-50 focus:border-violet-400'
                                )} />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={cn('text-sm font-bold',
                                total >= 70 ? 'text-green-700' : total >= 60 ? 'text-blue-700' : total >= 50 ? 'text-amber-700' : total > 0 ? 'text-red-700' : 'text-gray-300'
                              )}>
                                {total > 0 ? total.toFixed(1) : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {total > 0 && (
                                <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold', getGradeColor(grade))}>
                                  {grade}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>{studentGrades.length} students</span>
                  <div className="flex gap-3">
                    <span>Passing (50+): {studentGrades.filter(r => calcTotal(r.ca1, r.ca2, r.ca3, r.exam) >= 50).length}</span>
                    <span>Failed (&lt;50): {studentGrades.filter(r => { const t = calcTotal(r.ca1, r.ca2, r.ca3, r.exam); return t > 0 && t < 50 }).length}</span>
                  </div>
                </div>
              </div>
            ) : selectedClass && selectedSubject && selectedTerm ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <span className="mdi mdi-account-off-outline text-3xl text-gray-300 block mb-2" />
                <p className="text-sm text-gray-500">No students found in this class</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <span className="mdi mdi-text-box-check-outline text-3xl text-gray-300 block mb-2" />
                <p className="text-sm text-gray-500">Select a class, subject, and term to begin entering grades</p>
              </div>
            )}

            {/* Save Result */}
            {saveResult && (
              <div className={cn('rounded-xl border p-4',
                saveResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              )}>
                <div className="flex items-center gap-2">
                  <span className={cn('mdi text-lg', saveResult.success ? 'mdi-check-circle text-green-600' : 'mdi-alert-circle text-red-600')} />
                  <p className="text-sm font-medium">{saveResult.message}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
