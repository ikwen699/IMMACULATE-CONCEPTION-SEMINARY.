import type { GradeField, StudentGrade } from './types'

export function gradeMax(field: GradeField) {
  return field === 'exam' ? 70 : 10
}

export function calcTotal(ca1: string, ca2: string, ca3: string, exam: string) {
  return (parseFloat(ca1) || 0) + (parseFloat(ca2) || 0) + (parseFloat(ca3) || 0) + (parseFloat(exam) || 0)
}

export function getGradeColor(grade: string) {
  if (grade === 'A') return 'bg-green-100 text-green-700'
  if (grade === 'B') return 'bg-blue-100 text-blue-700'
  if (grade === 'C') return 'bg-amber-100 text-amber-700'
  if (grade === 'D') return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export function getScoreColor(total: number) {
  if (total >= 70) return 'text-green-700'
  if (total >= 60) return 'text-blue-700'
  if (total >= 50) return 'text-amber-700'
  if (total > 0) return 'text-red-700'
  return 'text-gray-300'
}

export function gradeDotColor(grade: string) {
  if (grade === 'A') return 'bg-green-500'
  if (grade === 'B') return 'bg-blue-500'
  if (grade === 'C') return 'bg-amber-500'
  if (grade === 'D') return 'bg-orange-500'
  return 'bg-red-500'
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

export const GRADE_LEGEND = ['A (70+)', 'B (60-69)', 'C (50-59)', 'D (40-49)', 'F (<40)'] as const

export function getBreakdown(row: StudentGrade) {
  const total = calcTotal(row.ca1, row.ca2, row.ca3, row.exam)
  if (total === 0) return null
  if (total >= 70) return { grade: 'A', bg: 'bg-green-100', text: 'text-green-700' }
  if (total >= 60) return { grade: 'B', bg: 'bg-blue-100', text: 'text-blue-700' }
  if (total >= 50) return { grade: 'C', bg: 'bg-amber-100', text: 'text-amber-700' }
  if (total >= 40) return { grade: 'D', bg: 'bg-orange-100', text: 'text-orange-700' }
  return { grade: 'F', bg: 'bg-red-100', text: 'text-red-700' }
}