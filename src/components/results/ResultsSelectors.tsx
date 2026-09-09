'use client'

import { GRADE_LEGEND } from './gradeUtils'
import type { ClassData, Session, Subject } from './types'

interface ResultsSelectorsProps {
  classes: ClassData[]
  subjects: Subject[]
  sessions: Session[]
  selectedClass: string
  selectedSubject: string
  selectedTerm: string
  onClassChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onTermChange: (value: string) => void
}

const selectCls =
  'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export default function ResultsSelectors({
  classes, subjects, sessions,
  selectedClass, selectedSubject, selectedTerm,
  onClassChange, onSubjectChange, onTermChange,
}: ResultsSelectorsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="class-select" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Class</label>
          <select id="class-select" value={selectedClass} onChange={e => onClassChange(e.target.value)} className={selectCls}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="subject-select" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject</label>
          <select id="subject-select" value={selectedSubject} onChange={e => onSubjectChange(e.target.value)} disabled={!selectedClass} className={selectCls}>
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="term-select" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Term</label>
          <select id="term-select" value={selectedTerm} onChange={e => onTermChange(e.target.value)} disabled={!selectedSubject} className={selectCls}>
            <option value="">Select Term</option>
            {sessions.map(s => s.terms?.map(t => (
              <option key={t.id} value={t.id}>{s.name} — {t.name}</option>
            )))}
          </select>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-violet-50 border border-violet-100 rounded-xl flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-violet-700">
        <span className="font-semibold">Score Breakdown:</span>
        <span><span className="font-semibold">CA1</span>: /10</span>
        <span><span className="font-semibold">CA2</span>: /10</span>
        <span><span className="font-semibold">CA3</span>: /10</span>
        <span><span className="font-semibold">Exam</span>: /70</span>
        <span><span className="font-semibold">Total</span>: /100</span>
        <span className="ml-auto hidden md:flex gap-3">
          {GRADE_LEGEND.map(g => <span key={g}>{g}</span>)}
        </span>
      </div>
    </div>
  )
}