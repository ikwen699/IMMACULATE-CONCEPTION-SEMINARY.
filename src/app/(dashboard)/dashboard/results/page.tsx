'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn, calculateGrade } from '@/lib/utils'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ClassData { id: string; name: string; section?: string }
interface Subject { id: string; name: string; code: string }
interface Term { id: string; name: string; sessionId: string }
interface Session { id: string; name: string; terms: Term[] }

interface ParsedRow {
  studentName: string
  admissionNo: string
  score: string
  studentId?: string
  letterGrade: string
  status: 'valid' | 'error' | 'update' | 'new'
  error?: string
}

type Step = 'select' | 'upload' | 'preview'

const GRADE_TYPES = [
  { value: 'TEST', label: 'Test' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'PROJECT', label: 'Project' },
]

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
]

function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0]
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function ResultsPage() {
  const { data: session, status } = useSession()
  const user = session?.user as any

  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedType, setSelectedType] = useState('TEST')

  const [step, setStep] = useState<Step>('select')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
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

  const selectedSession = sessions.find(s => s.id === sessions.find(s => s.terms?.some(t => t.id === selectedTerm))?.id)
    || sessions.find(s => s.terms?.some(t => t.id === selectedTerm))

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    if (!selectedClass || !selectedSubject) return
    const url = `/api/grades/template?classId=${selectedClass}&subjectId=${selectedSubject}&format=${format}`
    const a = document.createElement('a')
    a.href = url
    a.download = `grades_template.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSaveResult(null)

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws)
        processRows(data)
      }
      reader.readAsArrayBuffer(file)
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRows(results.data as Record<string, string>[])
        },
      })
    }
  }

  const processRows = async (rawRows: Record<string, string>[]) => {
    const studentsRes = await fetch(`/api/users?role=STUDENT&classId=${selectedClass}`, { cache: 'no-store' })
    const studentsData = studentsRes.ok ? await studentsRes.json() : []
    const students = Array.isArray(studentsData) ? studentsData : []

    const studentMap = new Map<string, any>()
    const admissionMap = new Map<string, any>()
    students.forEach((s: any) => {
      if (s.id) studentMap.set(s.name?.toLowerCase().trim(), s)
      if (s.student?.admissionNo) admissionMap.set(s.student.admissionNo.toLowerCase().trim(), s)
    })

    const existingGradesRes = await fetch(`/api/grades?subjectId=${selectedSubject}`, { cache: 'no-store' })
    const existingGrades = existingGradesRes.ok ? await existingGradesRes.json() : []
    const existingGradeMap = new Map<string, any>()
    ;(Array.isArray(existingGrades) ? existingGrades : []).forEach((g: any) => {
      if (g.student?.id && g.type === selectedType) {
        existingGradeMap.set(g.student.id, g)
      }
    })

    const rows: ParsedRow[] = rawRows.map(row => {
      const nameKey = (row['Student Name'] || row['name'] || row['Name'] || '').toLowerCase().trim()
      const admKey = (row['Admission No'] || row['admissionNo'] || row['Admission'] || row['admission_no'] || '').toLowerCase().trim()
      const scoreRaw = (row['Score'] || row['score'] || row['Score '] || '').toString().trim()

      let matchedStudent = admissionMap.get(admKey) || studentMap.get(nameKey)
      const score = parseFloat(scoreRaw)

      if (!scoreRaw || isNaN(score)) {
        return {
          studentName: row['Student Name'] || nameKey || 'Unknown',
          admissionNo: row['Admission No'] || admKey || '',
          score: scoreRaw,
          letterGrade: '',
          status: 'error' as const,
          error: 'Missing or invalid score',
        }
      }

      if (score < 0 || score > 100) {
        return {
          studentName: matchedStudent?.name || row['Student Name'] || nameKey || 'Unknown',
          admissionNo: matchedStudent?.student?.admissionNo || admKey || '',
          score: scoreRaw,
          letterGrade: '',
          status: 'error' as const,
          error: 'Score must be between 0 and 100',
          studentId: matchedStudent?.id,
        }
      }

      if (!matchedStudent) {
        return {
          studentName: row['Student Name'] || nameKey || 'Unknown',
          admissionNo: admKey || '',
          score: scoreRaw,
          letterGrade: calculateGrade(score),
          status: 'error' as const,
          error: 'Student not found in this class',
        }
      }

      const hasExisting = existingGradeMap.has(matchedStudent.id)

      return {
        studentName: matchedStudent.name || nameKey,
        admissionNo: matchedStudent.student?.admissionNo || admKey,
        score: scoreRaw,
        studentId: matchedStudent.id,
        letterGrade: calculateGrade(score),
        status: hasExisting ? 'update' : 'new',
      }
    })

    setParsedRows(rows)
    setStep('preview')
  }

  const updateScore = (index: number, newScore: string) => {
    setParsedRows(prev => prev.map((row, i) => {
      if (i !== index) return row
      const score = parseFloat(newScore)
      if (isNaN(score) || newScore === '') {
        return { ...row, score: newScore, letterGrade: '', status: 'error', error: 'Invalid score' }
      }
      if (score < 0 || score > 100) {
        return { ...row, score: newScore, letterGrade: '', status: 'error', error: 'Score must be 0-100' }
      }
      return { ...row, score: newScore, letterGrade: calculateGrade(score), status: row.studentId ? (row.status === 'update' ? 'update' : 'new') : 'error', error: row.studentId ? undefined : 'Student not found' }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)

    const validRows = parsedRows.filter(r => r.status !== 'error' && r.studentId && r.score !== '')
    if (validRows.length === 0) {
      setSaveResult({ success: false, message: 'No valid grades to save' })
      setSaving(false)
      return
    }

    const grades = validRows.map(r => ({
      studentId: r.studentId!,
      subjectId: selectedSubject,
      termId: selectedTerm,
      score: parseFloat(r.score),
      type: selectedType,
    }))

    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades }),
      })
      if (!res.ok) {
        const d = await res.json()
        setSaveResult({ success: false, message: d.error || 'Failed to save grades' })
      } else {
        setSaveResult({ success: true, message: `${validRows.length} grade${validRows.length === 1 ? '' : 's'} saved successfully!` })
      }
    } catch {
      setSaveResult({ success: false, message: 'Failed to save grades. Please try again.' })
    } finally { setSaving(false) }
  }

  const resetAll = () => {
    setStep('select')
    setParsedRows([])
    setFileName('')
    setSaveResult(null)
  }

  const validCount = parsedRows.filter(r => r.status !== 'error' && r.studentId).length
  const errorCount = parsedRows.filter(r => r.status === 'error').length
  const updateCount = parsedRows.filter(r => r.status === 'update').length
  const newCount = parsedRows.filter(r => r.status === 'new').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <span className="mdi mdi-file-document-edit text-violet-600 text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Results</h1>
            <p className="text-sm text-gray-500">Import student grades from CSV or Excel files</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[
            { key: 'select', label: 'Select Details', icon: 'mdi-form-textbox' },
            { key: 'upload', label: 'Upload File', icon: 'mdi-file-upload' },
            { key: 'preview', label: 'Review & Save', icon: 'mdi-check-circle' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                step === s.key ? 'bg-violet-100 text-violet-700' :
                (['select', 'upload', 'preview'].indexOf(step) > i ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')
              )}>
                <span className={cn('mdi text-sm', ['select', 'upload', 'preview'].indexOf(step) > i ? 'mdi-check' : s.icon)} />
                {s.label}
              </div>
              {i < 2 && <span className="mdi mdi-chevron-right text-gray-300" />}
            </div>
          ))}
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
            {/* Step 1: Select */}
            {step === 'select' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900">Select Grade Details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSubject('') }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none">
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                    <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                      disabled={!selectedClass}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none disabled:opacity-50">
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
                    <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none">
                      <option value="">Select Term</option>
                      {sessions.map(s => s.terms?.map(t => (
                        <option key={t.id} value={t.id}>{s.name} — {t.name}</option>
                      )))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Type</label>
                    <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none">
                      {GRADE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    disabled={!selectedClass || !selectedSubject || !selectedTerm}
                    onClick={() => setStep('upload')}
                    className={cn('px-5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      selectedClass && selectedSubject && selectedTerm
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Upload */}
            {step === 'upload' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Upload Grades File</h2>
                  <button onClick={() => setStep('select')} className="text-sm text-gray-500 hover:text-gray-700">
                    <span className="mdi mdi-arrow-left" /> Change Details
                  </button>
                </div>

                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                  <p className="text-sm text-violet-800 font-medium">Download a template with your students pre-filled:</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleDownloadTemplate('csv')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-violet-300 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-50 transition-colors">
                      <span className="mdi mdi-file-document" /> Download CSV
                    </button>
                    <button onClick={() => handleDownloadTemplate('xlsx')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-violet-300 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-50 transition-colors">
                      <span className="mdi mdi-file-excel" /> Download Excel
                    </button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-violet-300 transition-colors">
                  <span className="mdi mdi-cloud-upload-outline text-4xl text-gray-300 block mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop your file here, or click to browse</p>
                  <p className="text-xs text-gray-400 mb-4">Supports CSV and Excel (.xlsx) files</p>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-600 file:text-white hover:file:bg-violet-700 file:cursor-pointer" />
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Required Columns</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">Student Name</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">Admission No</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">Score</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Review Grades</h2>
                    <div className="flex gap-2">
                      <button onClick={() => { setStep('upload'); setParsedRows([]); setFileName('') }}
                        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="mdi mdi-upload" /> Upload Different File
                      </button>
                      <button onClick={resetAll}
                        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Start Over
                      </button>
                    </div>
                  </div>

                  {fileName && <p className="text-xs text-gray-500 mb-3">File: {fileName}</p>}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-lg font-bold text-green-700">{newCount}</p>
                      <p className="text-[11px] text-green-600">New Grades</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-lg font-bold text-amber-700">{updateCount}</p>
                      <p className="text-[11px] text-amber-600">Updates</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-lg font-bold text-red-700">{errorCount}</p>
                      <p className="text-[11px] text-red-600">Errors</p>
                    </div>
                    <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                      <p className="text-lg font-bold text-violet-700">{validCount}</p>
                      <p className="text-[11px] text-violet-600">Total Valid</p>
                    </div>
                  </div>
                </div>

                {/* Preview table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Admission No</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {parsedRows.map((row, i) => (
                          <tr key={i} className={cn('hover:bg-gray-50/50 transition-colors', row.status === 'error' && 'bg-red-50/30')}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', getAvatarColor(row.studentName))}>
                                  {getInitials(row.studentName)}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{row.studentName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-gray-600">{row.admissionNo || '—'}</td>
                            <td className="px-5 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={row.score}
                                onChange={e => updateScore(i, e.target.value)}
                                className={cn(
                                  'w-20 px-2.5 py-1.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20',
                                  row.status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                                )}
                              />
                            </td>
                            <td className="px-5 py-3">
                              {row.letterGrade && (
                                <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold',
                                  row.letterGrade.startsWith('A') ? 'bg-green-100 text-green-700' :
                                  row.letterGrade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                                  row.letterGrade.startsWith('C') ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                )}>
                                  {row.letterGrade}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                                row.status === 'new' && 'bg-green-100 text-green-700',
                                row.status === 'update' && 'bg-amber-100 text-amber-700',
                                row.status === 'error' && 'bg-red-100 text-red-700'
                              )}>
                                <span className={cn('mdi text-xs',
                                  row.status === 'new' && 'mdi-plus-circle',
                                  row.status === 'update' && 'mdi-refresh',
                                  row.status === 'error' && 'mdi-alert-circle'
                                )} />
                                {row.status === 'new' ? 'New' : row.status === 'update' ? 'Update' : 'Error'}
                              </span>
                              {row.error && <p className="text-[11px] text-red-500 mt-0.5">{row.error}</p>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm text-gray-500">
                    {validCount} grade{validCount === 1 ? '' : 's'} ready to save
                    {errorCount > 0 && <span className="text-red-500 ml-2">({errorCount} with errors will be skipped)</span>}
                  </p>
                  <button
                    onClick={handleSave}
                    disabled={saving || validCount === 0}
                    className={cn('px-5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      saving || validCount === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    )}
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
                      </span>
                    ) : 'Save Grades'}
                  </button>
                </div>

                {/* Save result */}
                {saveResult && (
                  <div className={cn('rounded-xl border p-4',
                    saveResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn('mdi text-lg', saveResult.success ? 'mdi-check-circle text-green-600' : 'mdi-alert-circle text-red-600')} />
                      <p className="text-sm font-medium">{saveResult.message}</p>
                    </div>
                    {saveResult.success && (
                      <button onClick={resetAll} className="mt-3 text-sm text-green-700 underline hover:text-green-900">
                        Upload another file
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
