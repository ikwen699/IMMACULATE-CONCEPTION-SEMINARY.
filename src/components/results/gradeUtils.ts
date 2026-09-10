import type { GradeField, StudentGrade } from './types'

export function gradeMax(field: GradeField) {
  return field === 'exam' ? 70 : 10
}

export function calcTotal(ca1: string, ca2: string, ca3: string, exam: string) {
  return (parseFloat(ca1) || 0) + (parseFloat(ca2) || 0) + (parseFloat(ca3) || 0) + (parseFloat(exam) || 0)
}

/** Single source of truth for the A–F grade scale.
 *  Each consumer imports only the fields it needs. */
export const GRADE_SCALE = [
  { grade: 'A' as const, label: 'A', sub: '70+', range: '70–100', min: 70, dot: 'bg-emerald-500', chip: 'bg-emerald-50', text: 'text-emerald-700', bg: 'bg-emerald-100' },
  { grade: 'B' as const, label: 'B', sub: '60–69', range: '60–69', min: 60, dot: 'bg-blue-500', chip: 'bg-blue-50', text: 'text-blue-700', bg: 'bg-blue-100' },
  { grade: 'C' as const, label: 'C', sub: '50–59', range: '50–59', min: 50, dot: 'bg-amber-500', chip: 'bg-amber-50', text: 'text-amber-700', bg: 'bg-amber-100' },
  { grade: 'D' as const, label: 'D', sub: '40–49', range: '40–49', min: 40, dot: 'bg-orange-500', chip: 'bg-orange-50', text: 'text-orange-700', bg: 'bg-orange-100' },
  { grade: 'F' as const, label: 'F', sub: '<40', range: '<40', min: 0, dot: 'bg-red-500', chip: 'bg-red-50', text: 'text-red-700', bg: 'bg-red-100' },
]

const _gradeEntry = (grade: string) => GRADE_SCALE.find(s => s.grade === grade) ?? GRADE_SCALE[4]

export function getGradeColor(grade: string) {
  const e = _gradeEntry(grade)
  return `${e.bg} ${e.text}`
}

export function gradeDotColor(grade: string) {
  return _gradeEntry(grade).dot
}

export function getScoreColor(total: number) {
  if (total >= 70) return 'text-emerald-700'
  if (total >= 60) return 'text-blue-700'
  if (total >= 50) return 'text-amber-700'
  if (total > 0) return 'text-red-700'
  return 'text-gray-300'
}

export function rowState(row: StudentGrade) {
  const filled = [row.ca1, row.ca2, row.ca3, row.exam].filter(v => v !== '').length
  const complete = filled === 4
  const total = calcTotal(row.ca1, row.ca2, row.ca3, row.exam)
  return {
    complete,
    partial: filled > 0 && !complete,
    ungraded: filled === 0,
    isFail: total > 0 && total < 50,
    total,
  }
}

export function getBreakdown(row: StudentGrade) {
  const total = calcTotal(row.ca1, row.ca2, row.ca3, row.exam)
  if (total === 0) return null
  const match = GRADE_SCALE.find(s => total >= s.min) ?? GRADE_SCALE[4]
  return { grade: match.grade, bg: match.bg, text: match.text, dot: match.dot }
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
}

export function accentFor(state: { complete: boolean; partial: boolean; isFail: boolean }) {
  if (state.isFail) return 'border-l-red-500'
  if (state.complete) return 'border-l-emerald-500'
  if (state.partial) return 'border-l-amber-400'
  return 'border-l-transparent'
}