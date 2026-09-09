export interface ClassData {
  id: string
  name: string
  section?: string
}

export interface Subject {
  id: string
  name: string
  code: string
}

export interface Term {
  id: string
  name: string
  sessionId: string
}

export interface Session {
  id: string
  name: string
  terms: Term[]
}

export interface Student {
  id: string
  admissionNo: string
  name: string
}

export interface ExistingGrade {
  studentId: string
  ca1: number
  ca2: number
  ca3: number
  exam: number
  total: number
  grade: string
  comments?: string
}

export interface StudentGrade {
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
  comments?: string
}

export const GRADE_FIELDS = ['ca1', 'ca2', 'ca3', 'exam'] as const
export type GradeField = (typeof GRADE_FIELDS)[number]

export type ViewMode = 'table' | 'card'
export type SortKey = 'name' | 'admissionNo' | 'total'
export type SortDir = 'asc' | 'desc'
export type DraftState = 'clean' | 'saving' | 'saved'