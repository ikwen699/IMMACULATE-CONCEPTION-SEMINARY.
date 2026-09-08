'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
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
  const [error, setError] = useState(false)

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')

  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentsError, setStudentsError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [showFillModal, setShowFillModal] = useState(false)
  const [fillColumn, setFillColumn] = useState<'ca1' | 'ca2' | 'ca3' | 'exam'>('ca1')
  const [fillValue, setFillValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const tableRef = useRef<HTMLDivElement>(null)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (studentGrades.length === 0) return
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      const draftKey = `results-draft-${selectedClass}-${selectedSubject}-${selectedTerm}`
      const data = { grades: studentGrades, timestamp: Date.now() }
      try { localStorage.setItem(draftKey, JSON.stringify(data)) } catch {}
    }, 2000)
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current) }
  }, [studentGrades, selectedClass, selectedSubject, selectedTerm])

  const fetchInitialData = useCallback(async () => {
    if (status !== 'authenticated') return
    setLoading(true); setError(false)
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
      } else { throw new Error() }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setSessions(Array.isArray(data) ? data : [])
      } else { throw new Error() }
    } catch { setError(true) } finally { setLoading(false) }
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
    setLoadingStudents(true); setStudentsError(false)
    try {
      const [studentsRes, gradesRes] = await Promise.all([
        fetch(`/api/users?role=STUDENT&classId=${selectedClass}`, { cache: 'no-store' }),
        fetch(`/api/grades?classId=${selectedClass}&subjectId=${selectedSubject}&termId=${selectedTerm}`, { cache: 'no-store' }),
      ])

      if (!studentsRes.ok || !gradesRes.ok) throw new Error()
      const studentsData = await studentsRes.json()
      const gradesData = await gradesRes.json()

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
          ca1: g.ca1 || 0, ca2: g.ca2 || 0, ca3: g.ca3 || 0, exam: g.exam || 0,
          total: g.total || 0, grade: g.grade || '',
        }))

      const gradeMap = new Map(existingGrades.map(g => [g.studentId, g]))

      const draftKey = `results-draft-${selectedClass}-${selectedSubject}-${selectedTerm}`
      let draftGrades: StudentGrade[] | null = null
      try {
        const draftRaw = localStorage.getItem(draftKey)
        if (draftRaw) {
          const draft = JSON.parse(draftRaw)
          if (Date.now() - draft.timestamp < 30 * 60 * 1000 && Array.isArray(draft.grades)) {
            draftGrades = draft.grades
          } else {
            localStorage.removeItem(draftKey)
          }
        }
      } catch {}

      const merged: StudentGrade[] = students.map(s => {
        if (draftGrades) {
          const draftGrade = draftGrades.find(d => d.studentId === s.id)
          if (draftGrade) return draftGrade
        }
        const existing = gradeMap.get(s.id)
        if (existing) {
          const total = existing.ca1 + existing.ca2 + existing.ca3 + existing.exam
          return {
            studentId: s.id, name: s.name, admissionNo: s.admissionNo,
            ca1: String(existing.ca1), ca2: String(existing.ca2), ca3: String(existing.ca3), exam: String(existing.exam),
            total, letterGrade: existing.grade || calculateGrade(total), isNew: false,
          }
        }
        return {
          studentId: s.id, name: s.name, admissionNo: s.admissionNo,
          ca1: '', ca2: '', ca3: '', exam: '', total: 0, letterGrade: '', isNew: true,
        }
      })

      setStudentGrades(merged)
    } catch { setStudentsError(true) } finally { setLoadingStudents(false) }
  }, [selectedClass, selectedSubject, selectedTerm])

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) loadStudents()
    else setStudentGrades([])
  }, [selectedClass, selectedSubject, selectedTerm, loadStudents])

  const updateGrade = (index: number, field: 'ca1' | 'ca2' | 'ca3' | 'exam', value: string) => {
    setStudentGrades(prev => prev.map((row, i) => {
      if (i !== index) return row
      const max = field === 'exam' ? 70 : 10
      const parsed = parseFloat(value)
      if (value !== '' && (isNaN(parsed) || parsed < 0 || parsed > max)) return row
      const updated = { ...row, [field]: value }
      const total = calcTotal(updated.ca1, updated.ca2, updated.ca3, updated.exam)
      updated.total = total; updated.letterGrade = calculateGrade(total)
      return updated
    }))
  }

  const handlePaste = useCallback((e: React.ClipboardEvent, startRow: number, startField: 'ca1' | 'ca2' | 'ca3' | 'exam') => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    const fields: ('ca1' | 'ca2' | 'ca3' | 'exam')[] = ['ca1', 'ca2', 'ca3', 'exam']
    const startFieldIdx = fields.indexOf(startField)

    setStudentGrades(prev => {
      const updated = [...prev]
      lines.forEach((line, lineIdx) => {
        const cells = line.split(/\t/)
        const targetRow = startRow + lineIdx
        if (targetRow >= updated.length) return
        cells.forEach((cell, cellIdx) => {
          const targetFieldIdx = startFieldIdx + cellIdx
          if (targetFieldIdx >= 4) return
          const field = fields[targetFieldIdx]
          const val = cell.trim()
          const max = field === 'exam' ? 70 : 10
          const parsed = parseFloat(val)
          if (val === '' || (!isNaN(parsed) && parsed >= 0 && parsed <= max)) {
            const row = { ...updated[targetRow] }
            row[field] = val
            const total = calcTotal(row.ca1, row.ca2, row.ca3, row.exam)
            row.total = total; row.letterGrade = calculateGrade(total)
            updated[targetRow] = row
          }
        })
      })
      return updated
    })
  }, [])

  const handleColumnDrop = useCallback((e: React.DragEvent, field: 'ca1' | 'ca2' | 'ca3' | 'exam') => {
    e.preventDefault(); setIsDragging(false)
    const val = e.dataTransfer.getData('text/plain')
    const max = field === 'exam' ? 70 : 10
    const parsed = parseFloat(val)
    if (val !== '' && (isNaN(parsed) || parsed < 0 || parsed > max)) return
    setStudentGrades(prev => prev.map(row => {
      const updated = { ...row, [field]: val }
      const total = calcTotal(updated.ca1, updated.ca2, updated.ca3, updated.exam)
      updated.total = total; updated.letterGrade = calculateGrade(total)
      return updated
    }))
  }, [])

  const handleColumnDragStart = useCallback((e: React.DragEvent, value: string) => {
    e.dataTransfer.setData('text/plain', value)
    e.dataTransfer.effectAllowed = 'copy'
    setIsDragging(true)
  }, [])

  const applyFillAll = () => {
    const max = fillColumn === 'exam' ? 70 : 10
    const parsed = parseFloat(fillValue)
    if (fillValue !== '' && (isNaN(parsed) || parsed < 0 || parsed > max)) return
    setStudentGrades(prev => prev.map(row => {
      const updated = { ...row, [fillColumn]: fillValue }
      const total = calcTotal(updated.ca1, updated.ca2, updated.ca3, updated.exam)
      updated.total = total; updated.letterGrade = calculateGrade(total)
      return updated
    }))
    setShowFillModal(false); setFillValue('')
  }

  const clearDraft = () => {
    const draftKey = `results-draft-${selectedClass}-${selectedSubject}-${selectedTerm}`
    try { localStorage.removeItem(draftKey) } catch {}
  }

  const gradesToPost = studentGrades.filter(r => r.total > 0 || r.ca1 || r.ca2 || r.ca3 || r.exam)

  const handlePost = async () => {
    setShowConfirm(false); setSaving(true); setSaveResult(null)
    const payload = gradesToPost.map(r => ({
      studentId: r.studentId, subjectId: selectedSubject, termId: selectedTerm,
      ca1: parseFloat(r.ca1) || 0, ca2: parseFloat(r.ca2) || 0, ca3: parseFloat(r.ca3) || 0, exam: parseFloat(r.exam) || 0,
    }))
    if (payload.length === 0) {
      setSaveResult({ success: false, message: 'No grades to save. Enter at least one score.' })
      setSaving(false); return
    }
    try {
      const res = await fetch('/api/grades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: payload }),
      })
      if (res.ok) {
        clearDraft()
        setSaveResult({ success: true, message: `${payload.length} result${payload.length === 1 ? '' : 's'} posted successfully!` })
        setLastSaved(new Date())
        loadStudents()
      } else {
        const d = await res.json()
        setSaveResult({ success: false, message: d.error || 'Failed to post results' })
      }
    } catch {
      setSaveResult({ success: false, message: 'Failed to post results. Please try again.' })
    } finally { setSaving(false) }
  }

  const handleClearAll = () => {
    setStudentGrades(prev => prev.map(row => {
      const updated = { ...row, ca1: '', ca2: '', ca3: '', exam: '', total: 0, letterGrade: '' }
      return updated
    }))
  }

  const selectedClassObj = classes.find(c => c.id === selectedClass)
  const selectedSubjectObj = subjects.find(s => s.id === selectedSubject)
  const selectedTermObj = sessions.flatMap(s => s.terms || []).find(t => t.id === selectedTerm)
  const selectedSessionObj = sessions.find(s => s.terms?.some(t => t.id === selectedTerm))

  const totalStudents = studentGrades.length
  const gradedCount = studentGrades.filter(r => r.total > 0).length
  const passingCount = studentGrades.filter(r => r.total >= 50).length
  const averageScore = gradedCount > 0 ? studentGrades.filter(r => r.total > 0).reduce((sum, r) => sum + r.total, 0) / gradedCount : 0

  const filteredGrades = studentGrades.filter(r => {
    const q = search.toLowerCase()
    return !q || r.name.toLowerCase().includes(q) || r.admissionNo.toLowerCase().includes(q)
  })

  const inputCls = 'w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <button onClick={() => setShowConfirm(true)} disabled={saving}
              className={cn('px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm',
                saving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'
              )}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="mdi mdi-check-circle text-lg" /> Post Grades
                </span>
              )}
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, j) => <div key={j} className="h-10 bg-gray-100 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load data</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button onClick={fetchInitialData}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
                <span className="mdi mdi-refresh" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Selectors */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="class-select" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Class</label>
                  <select id="class-select" value={selectedClass}
                    onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); setStudentGrades([]) }}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="subject-select" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject</label>
                  <select id="subject-select" value={selectedSubject}
                    onChange={e => { setSelectedSubject(e.target.value); setStudentGrades([]) }}
                    disabled={!selectedClass}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none disabled:opacity-50">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="term-select" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Term</label>
                  <select id="term-select" value={selectedTerm}
                    onChange={e => { setSelectedTerm(e.target.value); setStudentGrades([]) }}
                    disabled={!selectedSubject}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none disabled:opacity-50">
                    <option value="">Select Term</option>
                    {sessions.map(s => s.terms?.map(t => (
                      <option key={t.id} value={t.id}>{s.name} — {t.name}</option>
                    )))}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary stats */}
            {studentGrades.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-gray-100 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="mdi mdi-account-multiple text-gray-400 text-lg" />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Students</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="mdi mdi-check-circle text-violet-500 text-lg" />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Graded</span>
                  </div>
                  <p className="text-2xl font-bold text-violet-700">{gradedCount}</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="mdi mdi-school text-emerald-500 text-lg" />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Passing (50+)</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{passingCount}</p>
                </div>
                <div className="col-span-2 lg:col-span-1 p-4 rounded-xl border border-gray-100 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="mdi mdi-chart-line text-amber-500 text-lg" />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Average</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">{averageScore > 0 ? averageScore.toFixed(1) : '—'}</p>
                </div>
              </div>
            )}

            {/* Search + view toggle */}
            {studentGrades.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input type="text" placeholder="Search by name or admission number..."
                    value={searchInput}
                    onChange={e => {
                      setSearchInput(e.target.value)
                      if (debounceRef.current) clearTimeout(debounceRef.current)
                      debounceRef.current = setTimeout(() => setSearch(e.target.value), 300)
                    }}
                    className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors" />
                  {searchInput && (
                    <button onClick={() => { setSearchInput(''); setSearch('') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <span className="mdi mdi-close text-lg" />
                    </button>
                  )}
                </div>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button onClick={() => setViewMode('table')}
                    className={cn('px-3 py-2.5 transition-colors', viewMode === 'table' ? 'bg-violet-50 text-violet-700' : 'text-gray-400 hover:text-gray-600')}>
                    <span className="mdi mdi-view-list text-lg" />
                  </button>
                  <div className="w-px bg-gray-200" />
                  <button onClick={() => setViewMode('card')}
                    className={cn('px-3 py-2.5 transition-colors', viewMode === 'card' ? 'bg-violet-50 text-violet-700' : 'text-gray-400 hover:text-gray-600')}>
                    <span className="mdi mdi-view-grid text-lg" />
                  </button>
                </div>
              </div>
            )}

            {/* Student loading */}
            {loadingStudents ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                      <div className="space-y-2 flex-1"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/5" /></div>
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(4)].map((_, j) => <div key={j} className="w-16 h-10 bg-gray-100 rounded-lg" />)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : studentsError ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                    <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Failed to load students</p>
                    <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
                  </div>
                  <button onClick={loadStudents}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
                    <span className="mdi mdi-refresh" /> Retry
                  </button>
                </div>
              </div>
            ) : studentGrades.length > 0 ? (
              <>
                {/* Table view */}
                <div ref={tableRef} className={cn(viewMode === 'card' && 'hidden lg:block')}
                  onDragOver={e => e.preventDefault()}>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Score breakdown info */}
                    <div className="px-5 py-3 bg-violet-50 border-b border-violet-100 flex flex-wrap items-center gap-4 text-xs text-violet-700">
                      <span className="font-semibold">Score Breakdown:</span>
                      <span>CA1: /10</span><span>CA2: /10</span><span>CA3: /10</span><span>Exam: /70</span>
                      <span className="font-semibold">Total: /100</span>
                      <span className="ml-auto">A(70+) B(60-69) C(50-59) D(40-49) F(&lt;40)</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50/50 z-10">#</th>
                            <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase sticky left-8 bg-gray-50/50 z-10 min-w-[180px]">Student</th>
                            <th scope="col" className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">
                              <div className="flex flex-col items-center gap-1">
                                <span>CA1</span>
                                <button onClick={() => { setFillColumn('ca1'); setShowFillModal(true) }}
                                  className="text-violet-400 hover:text-violet-600 transition-colors" title="Fill all CA1">
                                  <span className="mdi mdi-format-paint text-sm" />
                                </button>
                              </div>
                            </th>
                            <th scope="col" className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">
                              <div className="flex flex-col items-center gap-1">
                                <span>CA2</span>
                                <button onClick={() => { setFillColumn('ca2'); setShowFillModal(true) }}
                                  className="text-violet-400 hover:text-violet-600 transition-colors" title="Fill all CA2">
                                  <span className="mdi mdi-format-paint text-sm" />
                                </button>
                              </div>
                            </th>
                            <th scope="col" className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">
                              <div className="flex flex-col items-center gap-1">
                                <span>CA3</span>
                                <button onClick={() => { setFillColumn('ca3'); setShowFillModal(true) }}
                                  className="text-violet-400 hover:text-violet-600 transition-colors" title="Fill all CA3">
                                  <span className="mdi mdi-format-paint text-sm" />
                                </button>
                              </div>
                            </th>
                            <th scope="col" className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">
                              <div className="flex flex-col items-center gap-1">
                                <span>Exam</span>
                                <button onClick={() => { setFillColumn('exam'); setShowFillModal(true) }}
                                  className="text-violet-400 hover:text-violet-600 transition-colors" title="Fill all Exam">
                                  <span className="mdi mdi-format-paint text-sm" />
                                </button>
                              </div>
                            </th>
                            <th scope="col" className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Total</th>
                            <th scope="col" className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredGrades.map((row, i) => {
                            const total = calcTotal(row.ca1, row.ca2, row.ca3, row.exam)
                            const grade = calculateGrade(total)
                            const isFail = grade === 'F' && total > 0
                            return (
                              <tr key={row.studentId} className={cn('hover:bg-gray-50/50 transition-colors', row.isNew && 'bg-violet-50/30')}>
                                <td className="px-4 py-2.5 text-sm text-gray-400 sticky left-0 bg-white hover:bg-gray-50/50 z-10">{i + 1}</td>
                                <td className="px-4 py-2.5 sticky left-8 bg-white hover:bg-gray-50/50 z-10">
                                  <div className="flex items-center gap-2">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
                                        {row.isNew && (
                                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-600 uppercase tracking-wide">New</span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-400">{row.admissionNo}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input type="number" min="0" max="10" step="0.5"
                                    aria-label={`CA1 score for ${row.name}`}
                                    value={row.ca1} onChange={e => updateGrade(i, 'ca1', e.target.value)}
                                    onPaste={e => handlePaste(e, i, 'ca1')}
                                    className={inputCls} />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input type="number" min="0" max="10" step="0.5"
                                    aria-label={`CA2 score for ${row.name}`}
                                    value={row.ca2} onChange={e => updateGrade(i, 'ca2', e.target.value)}
                                    onPaste={e => handlePaste(e, i, 'ca2')}
                                    className={inputCls} />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input type="number" min="0" max="10" step="0.5"
                                    aria-label={`CA3 score for ${row.name}`}
                                    value={row.ca3} onChange={e => updateGrade(i, 'ca3', e.target.value)}
                                    onPaste={e => handlePaste(e, i, 'ca3')}
                                    className={inputCls} />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <input type="number" min="0" max="70" step="0.5"
                                    aria-label={`Exam score for ${row.name}`}
                                    value={row.exam} onChange={e => updateGrade(i, 'exam', e.target.value)}
                                    onPaste={e => handlePaste(e, i, 'exam')}
                                    className={cn(inputCls, isFail && 'border-red-300 bg-red-50 text-red-700 font-bold')} />
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
                                    <span aria-label={`Grade: ${grade}`} className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold', getGradeColor(grade))}>
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

                    {/* Summary footer */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                      <span>{filteredGrades.length} student{filteredGrades.length === 1 ? '' : 's'}{search ? ' shown' : ''}</span>
                      <div className="flex gap-3">
                        <span>Passing (50+): {studentGrades.filter(r => r.total >= 50).length}</span>
                        <span>Failed (&lt;50): {studentGrades.filter(r => r.total > 0 && r.total < 50).length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card view (mobile) */}
                {viewMode === 'card' && (
                  <div className="lg:hidden space-y-3">
                    {filteredGrades.map((row, i) => {
                      const total = calcTotal(row.ca1, row.ca2, row.ca3, row.exam)
                      const grade = calculateGrade(total)
                      const isFail = grade === 'F' && total > 0
                      return (
                        <div key={row.studentId} className={cn('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden', row.isNew && 'border-violet-200 border-dashed')}>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
                                  {row.isNew && (
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-600 uppercase tracking-wide">New</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{row.admissionNo}</p>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <span className={cn('text-lg font-bold', total >= 70 ? 'text-green-700' : total >= 60 ? 'text-blue-700' : total >= 50 ? 'text-amber-700' : total > 0 ? 'text-red-700' : 'text-gray-300')}>
                                  {total > 0 ? total.toFixed(1) : '—'}
                                </span>
                                {total > 0 && (
                                  <span className={cn('ml-1.5 inline-flex px-2 py-0.5 rounded-full text-xs font-bold', getGradeColor(grade))}>{grade}</span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {(['ca1', 'ca2', 'ca3', 'exam'] as const).map(f => (
                                <div key={f}>
                                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">{f === 'exam' ? 'Exam' : f.toUpperCase()}</label>
                                  <input type="number" min="0" max={f === 'exam' ? 70 : 10} step="0.5"
                                    aria-label={`${f === 'exam' ? 'Exam' : f.toUpperCase()} score for ${row.name}`}
                                    value={row[f]} onChange={e => updateGrade(i, f, e.target.value)}
                                    className={cn('w-full px-2 py-2 border rounded-lg text-sm text-center bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors',
                                      isFail && f === 'exam' ? 'border-red-300 bg-red-50 text-red-700 font-bold' : 'border-gray-200'
                                    )} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <p className="text-xs text-gray-500 text-center pt-1">
                      {filteredGrades.length} student{filteredGrades.length === 1 ? '' : 's'}
                    </p>
                  </div>
                )}

                {/* Sticky save bar */}
                {gradesToPost.length > 0 && (
                  <div className="sticky bottom-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-semibold text-violet-700">{gradesToPost.length} grade{gradesToPost.length === 1 ? '' : 's'} to post</span>
                      {lastSaved && (
                        <span className="text-xs text-gray-400">
                          Last saved: {format(lastSaved, 'h:mm a')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleClearAll}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        Clear All
                      </button>
                      <button onClick={() => setShowConfirm(true)} disabled={saving}
                        className={cn('inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          saving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                        )}>
                        {saving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...
                          </>
                        ) : (
                          <>
                            <span className="mdi mdi-check-circle" /> Post {gradesToPost.length} Grade{gradesToPost.length === 1 ? '' : 's'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Save result banner */}
                {saveResult && (
                  <div role="alert" aria-live="polite" className={cn('rounded-xl border p-4',
                    saveResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn('mdi text-lg', saveResult.success ? 'mdi-check-circle text-green-600' : 'mdi-alert-circle text-red-600')} />
                      <p className="text-sm font-medium">{saveResult.message}</p>
                    </div>
                  </div>
                )}
              </>
            ) : selectedClass && selectedSubject && selectedTerm ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <span className="mdi mdi-account-off-outline text-3xl text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">No students found</p>
                    <p className="text-sm text-gray-500 mt-1">There are no students assigned to this class.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <span className="mdi mdi-text-box-check-outline text-3xl text-violet-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Get started</p>
                    <p className="text-sm text-gray-500 mt-1">Select a class, subject, and term to begin entering grades.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <span className="mdi mdi-file-document-check text-violet-600 text-xl" />
              </div>
              <div>
                <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">Post Grades</h2>
                <p className="text-xs text-gray-500">This will update student records</p>
              </div>
              <button onClick={() => setShowConfirm(false)} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="mdi mdi-close text-lg" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Class</span><span className="font-medium text-gray-900">{selectedClassObj?.name}{selectedClassObj?.section ? ` - ${selectedClassObj.section}` : ''}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Subject</span><span className="font-medium text-gray-900">{selectedSubjectObj?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Term</span><span className="font-medium text-gray-900">{selectedSessionObj?.name} — {selectedTermObj?.name}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2"><span className="text-gray-500">Grades to post</span><span className="font-bold text-violet-700">{gradesToPost.length}</span></div>
              </div>
              <p className="text-sm text-gray-600">Are you sure you want to post these grades? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handlePost} disabled={saving}
                className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors', saving && 'opacity-50 cursor-not-allowed')}>
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="mdi mdi-check" />}
                {saving ? 'Posting...' : 'Post Grades'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fill All Modal */}
      {showFillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="fill-title">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <span className="mdi mdi-format-paint text-violet-600 text-xl" />
              </div>
              <div>
                <h2 id="fill-title" className="text-lg font-semibold text-gray-900">Fill All {fillColumn.toUpperCase()}</h2>
                <p className="text-xs text-gray-500">Set the same score for all students</p>
              </div>
              <button onClick={() => { setShowFillModal(false); setFillValue('') }}
                className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="mdi mdi-close text-lg" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Score (max {fillColumn === 'exam' ? '70' : '10'})</label>
                <input type="number" min="0" max={fillColumn === 'exam' ? 70 : 10} step="0.5"
                  value={fillValue} onChange={e => setFillValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') applyFillAll() }}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
                  placeholder={`Enter score (0-${fillColumn === 'exam' ? '70' : '10'})`} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowFillModal(false); setFillValue('') }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={applyFillAll}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors">
                  <span className="mdi mdi-check" /> Apply to All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
