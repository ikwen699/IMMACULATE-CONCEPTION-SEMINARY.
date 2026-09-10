'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { calculateGrade } from '@/lib/utils'
import ConfirmModal from '@/components/results/ConfirmModal'
import EmptyState from '@/components/results/EmptyState'
import FillAllModal from '@/components/results/FillAllModal'
import GradeCard from '@/components/results/GradeCard'
import GradeDistribution from '@/components/results/GradeDistribution'
import GradeTable from '@/components/results/GradeTable'
import ResultsHeader from '@/components/results/ResultsHeader'
import ResultsSelectors from '@/components/results/ResultsSelectors'
import ResultsStats from '@/components/results/ResultsStats'
import ResultsStickyBar from '@/components/results/ResultsStickyBar'
import ResultsToolbar from '@/components/results/ResultsToolbar'
import { calcTotal } from '@/components/results/gradeUtils'
import { useGradeHistory } from '@/components/results/useGradeHistory'
import type { ClassData, DraftState, ExistingGrade } from '@/components/results/types'
import type { Session, StudentGrade, GradeField, SortDir, SortKey, Subject, ViewMode } from '@/components/results/types'

const DRAFT_TTL = 30 * 60 * 1000

export default function ResultsPage() {
  const { status } = useSession()

  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')

  const gradeHistory = useGradeHistory<StudentGrade[]>([])
  const studentGrades = gradeHistory.value

  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentsError, setStudentsError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showFillModal, setShowFillModal] = useState(false)
  const [fillColumn, setFillColumn] = useState<GradeField>('ca1')
  const [isDragging, setIsDragging] = useState(false)
  const [draftState, setDraftState] = useState<DraftState>('clean')
  const [lastDraftAt, setLastDraftAt] = useState<Date | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const draftKey = `results-draft-${selectedClass}-${selectedSubject}-${selectedTerm}`

  // ── Initial data ────────────────────────────────────────────────────────────
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

  // ── Load students + merge existing grades + drafts ─────────────────────────
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
          total: g.total || 0, grade: g.grade || '', comments: g.comments || '',
        }))

      const gradeMap = new Map(existingGrades.map(g => [g.studentId, g]))

      const draftKeyHere = `results-draft-${selectedClass}-${selectedSubject}-${selectedTerm}`
      let draftGrades: StudentGrade[] | null = null
      try {
        const draftRaw = localStorage.getItem(draftKeyHere)
        if (draftRaw) {
          const draft = JSON.parse(draftRaw)
          if (Date.now() - draft.timestamp < DRAFT_TTL && Array.isArray(draft.grades)) {
            draftGrades = draft.grades
          } else {
            localStorage.removeItem(draftKeyHere)
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
            total, letterGrade: existing.grade || calculateGrade(total), isNew: false, comments: existing.comments,
          }
        }
        return {
          studentId: s.id, name: s.name, admissionNo: s.admissionNo,
          ca1: '', ca2: '', ca3: '', exam: '', total: 0, letterGrade: '', isNew: true, comments: '',
        }
      })

      gradeHistory.reset(merged)
    } catch { setStudentsError(true) } finally { setLoadingStudents(false) }
  }, [selectedClass, selectedSubject, selectedTerm])

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) loadStudents()
    else gradeHistory.reset([])
  }, [selectedClass, selectedSubject, selectedTerm, loadStudents])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); if (draftTimerRef.current) clearTimeout(draftTimerRef.current) }
  }, [])

  // ── Draft autosave ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (studentGrades.length === 0) return
    setDraftState('saving')
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      const data = { grades: studentGrades, timestamp: Date.now() }
      try { localStorage.setItem(draftKey, JSON.stringify(data)) } catch {}
      setDraftState('saved')
      setLastDraftAt(new Date())
    }, 2000)
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current) }
  }, [studentGrades, draftKey])

  // ── Global keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowConfirm(false); setShowFillModal(false); return }
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        if (e.shiftKey) gradeHistory.redo(); else gradeHistory.undo()
      } else if (k === 'y') {
        e.preventDefault()
        gradeHistory.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gradeHistory.undo, gradeHistory.redo])

  // ── Grade mutations (all undoable) ──────────────────────────────────────────
  const updateGrade = (index: number, field: GradeField, value: string) => {
    gradeHistory.setValue(prev => prev.map((row, i) => {
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

  const handleCommentChange = (index: number, value: string) => {
    const v = value.slice(0, 160)
    gradeHistory.setValue(prev => prev.map((row, i) => i === index ? { ...row, comments: v } : row))
  }

  const handlePaste = useCallback((e: React.ClipboardEvent, startRow: number, startField: GradeField) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    const fields: GradeField[] = ['ca1', 'ca2', 'ca3', 'exam']
    const startFieldIdx = fields.indexOf(startField)

    gradeHistory.setValue(prev => {
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

  const handleColumnDrop = useCallback((e: React.DragEvent, field: GradeField) => {
    e.preventDefault(); setIsDragging(false)
    const val = e.dataTransfer.getData('text/plain')
    const max = field === 'exam' ? 70 : 10
    const parsed = parseFloat(val)
    if (val !== '' && (isNaN(parsed) || parsed < 0 || parsed > max)) return
    gradeHistory.setValue(prev => prev.map(row => {
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

  const applyFillAll = (value: string) => {
    const max = fillColumn === 'exam' ? 70 : 10
    const parsed = parseFloat(value)
    if (value !== '' && (isNaN(parsed) || parsed < 0 || parsed > max)) return
    gradeHistory.setValue(prev => prev.map(row => {
      const updated = { ...row, [fillColumn]: value }
      const total = calcTotal(updated.ca1, updated.ca2, updated.ca3, updated.exam)
      updated.total = total; updated.letterGrade = calculateGrade(total)
      return updated
    }))
    setShowFillModal(false)
  }

  const clearDraft = () => {
    try { localStorage.removeItem(draftKey) } catch {}
  }

  const gradesToPost = studentGrades.filter(r => r.total > 0 || r.ca1 || r.ca2 || r.ca3 || r.exam)

  // ── Post ─────────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    setShowConfirm(false); setSaving(true); setSaveResult(null)
    const payload = gradesToPost.map(r => ({
      studentId: r.studentId, subjectId: selectedSubject, termId: selectedTerm,
      ca1: parseFloat(r.ca1) || 0, ca2: parseFloat(r.ca2) || 0, ca3: parseFloat(r.ca3) || 0, exam: parseFloat(r.exam) || 0,
      comments: r.comments?.trim() ? r.comments.trim() : null,
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
    gradeHistory.setValue(prev => prev.map(row => ({ ...row, ca1: '', ca2: '', ca3: '', exam: '', total: 0, letterGrade: '' })))
  }

  // ── Derived view data ────────────────────────────────────────────────────────
  const selectedClassObj = classes.find(c => c.id === selectedClass)
  const selectedSubjectObj = subjects.find(s => s.id === selectedSubject)
  const selectedTermObj = sessions.flatMap(s => s.terms || []).find(t => t.id === selectedTerm)
  const selectedSessionObj = sessions.find(s => s.terms?.some(t => t.id === selectedTerm))

  const totalStudents = studentGrades.length
  const gradedCount = studentGrades.filter(r => r.total > 0).length
  const passingCount = studentGrades.filter(r => r.total >= 50).length
  const averageScore = gradedCount > 0 ? studentGrades.filter(r => r.total > 0).reduce((sum, r) => sum + r.total, 0) / gradedCount : 0

  const q = search.toLowerCase()
  const rows = studentGrades
    .map((_, i) => i)
    .filter(i => {
      const r = studentGrades[i]
      return !q || r.name.toLowerCase().includes(q) || r.admissionNo.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const ra = studentGrades[a]; const rb = studentGrades[b]
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'total') return (ra.total - rb.total || ra.name.localeCompare(rb.name)) * dir
      return (sortKey === 'admissionNo' ? ra.admissionNo.localeCompare(rb.admissionNo) : ra.name.localeCompare(rb.name)) * dir
    })

  const hasSelection = Boolean(selectedClass && selectedSubject && selectedTerm)
  const showContent = studentGrades.length > 0
  const noStudents = hasSelection && !showContent && !loadingStudents && !studentsError

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ResultsHeader hasStudents={showContent} saving={saving} onPost={() => setShowConfirm(true)} />

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
          <EmptyState
            icon="mdi-alert-circle-outline"
            iconBg="bg-red-100"
            iconColor="text-red-400"
            title="Failed to load data"
            description="Something went wrong. Please try again."
            actionLabel="Retry"
            onAction={fetchInitialData}
          />
        ) : (
          <>
            <ResultsSelectors
              classes={classes}
              subjects={subjects}
              sessions={sessions}
              selectedClass={selectedClass}
              selectedSubject={selectedSubject}
              selectedTerm={selectedTerm}
              onClassChange={value => { setSelectedClass(value); setSelectedSubject(''); gradeHistory.reset([]) }}
              onSubjectChange={value => { setSelectedSubject(value); gradeHistory.reset([]) }}
              onTermChange={value => { setSelectedTerm(value); gradeHistory.reset([]) }}
            />

            {showContent && (
              <>
                <ResultsStats
                  totalStudents={totalStudents}
                  gradedCount={gradedCount}
                  passingCount={passingCount}
                  averageScore={averageScore}
                />
                <GradeDistribution grades={studentGrades} />
                <ResultsToolbar
                  searchInput={searchInput}
                  resultCount={rows.length}
                  totalCount={totalStudents}
                  isDragging={isDragging}
                  viewMode={viewMode}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  canUndo={gradeHistory.canUndo}
                  canRedo={gradeHistory.canRedo}
                  onSearchInputChange={value => {
                    setSearchInput(value)
                    if (debounceRef.current) clearTimeout(debounceRef.current)
                    debounceRef.current = setTimeout(() => setSearch(value), 300)
                  }}
                  onClearSearch={() => { setSearchInput(''); setSearch('') }}
                  onViewModeChange={setViewMode}
                  onSortKeyChange={setSortKey}
                  onSortDirChange={setSortDir}
                  onUndo={gradeHistory.undo}
                  onRedo={gradeHistory.redo}
                />
              </>
            )}

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
              <EmptyState
                icon="mdi-alert-circle-outline"
                iconBg="bg-red-100"
                iconColor="text-red-400"
                title="Failed to load students"
                description="Something went wrong. Please try again."
                actionLabel="Retry"
                onAction={loadStudents}
              />
            ) : showContent ? (
              <>
                <div className={viewMode === 'card' ? 'hidden lg:block' : ''}>
                  <GradeTable
                    grades={studentGrades}
                    rows={rows}
                    isDragging={isDragging}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onUpdate={updateGrade}
                    onCommentChange={handleCommentChange}
                    onPaste={handlePaste}
                    onColumnDragStart={handleColumnDragStart}
                    onColumnDrop={handleColumnDrop}
                    onDragEnd={() => setIsDragging(false)}
                    onFillClick={field => { setFillColumn(field); setShowFillModal(true) }}
                  />
                </div>

                {viewMode === 'card' && (
                  <div className="lg:hidden">
                    <GradeCard grades={studentGrades} rows={rows} onUpdate={updateGrade} onPaste={handlePaste} />
                  </div>
                )}

                {gradesToPost.length > 0 && (
                  <ResultsStickyBar
                    count={gradesToPost.length}
                    lastSaved={lastSaved}
                    lastDraftAt={lastDraftAt}
                    draftState={draftState}
                    hasEdits={gradeHistory.historyCount > 0}
                    saving={saving}
                    onPost={() => setShowConfirm(true)}
                    onClearAll={handleClearAll}
                  />
                )}

                {saveResult && (
                  <div role="alert" aria-live="polite" className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 animate-fade-in ${saveResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${saveResult.success ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>
                      <span className={`mdi text-lg ${saveResult.success ? 'mdi-check-circle' : 'mdi-alert-circle'}`} />
                    </span>
                    <p className={`text-sm font-medium ${saveResult.success ? 'text-emerald-800' : 'text-red-800'}`}>{saveResult.message}</p>
                  </div>
                )}
              </>
            ) : noStudents ? (
              <EmptyState
                icon="mdi-account-off-outline"
                iconBg="bg-gray-100"
                iconColor="text-gray-300"
                title="No students found"
                description="There are no students assigned to this class."
              />
            ) : (
              <EmptyState
                noSelection
                icon="mdi-text-box-check-outline"
                iconBg="bg-violet-50"
                iconColor="text-violet-300"
                title="Get started"
                description="Select a class, subject, and term to load the roaster. Enter scores, then post everyone’s result in one click."
                actionLabel="Start with a class"
                onSelectFirst={() => document.getElementById('class-select')?.focus()}
              />
            )}
          </>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          className={`${selectedClassObj?.name || ''}${selectedClassObj?.section ? ` - ${selectedClassObj.section}` : ''}`}
          subjectName={selectedSubjectObj?.name || ''}
          termLabel={`${selectedSessionObj?.name || ''}${selectedSessionObj ? ' — ' : ''}${selectedTermObj?.name || ''}`}
          count={gradesToPost.length}
          saving={saving}
          onClose={() => setShowConfirm(false)}
          onConfirm={handlePost}
        />
      )}

      {showFillModal && (
        <FillAllModal
          column={fillColumn}
          onClose={() => { setShowFillModal(false) }}
          onApply={applyFillAll}
        />
      )}
    </DashboardLayout>
  )
}