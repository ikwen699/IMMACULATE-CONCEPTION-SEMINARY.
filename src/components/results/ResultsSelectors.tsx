'use client'

import { cn } from '@/lib/utils'
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
  'w-full pl-9 pr-8 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer'

const wrapIcon = 'mdi absolute left-2.5 top-1/2 -translate-y-1/2 text-base pointer-events-none'

const GRADE_DOTS: { grade: string; dot: string }[] = [
  { grade: 'A (70+)', dot: 'bg-emerald-500' },
  { grade: 'B (60-69)', dot: 'bg-blue-500' },
  { grade: 'C (50-59)', dot: 'bg-amber-500' },
  { grade: 'D (40-49)', dot: 'bg-orange-500' },
  { grade: 'F (<40)', dot: 'bg-red-500' },
]

function StepField({
  step, icon, label, hint, id, value, options, onChange, disabled, active,
}: {
  step: number
  icon: string
  label: string
  hint: string
  id: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled: boolean
  active: boolean
}) {
  return (
    <div className={cn('relative rounded-2xl border p-3.5 transition-all', active ? 'border-violet-200 bg-violet-50/40 ring-1 ring-violet-100' : 'border-gray-100 bg-white')}>
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className={cn(
            'inline-flex items-center justify-center h-6 w-6 rounded-lg text-[11px] font-bold shrink-0',
            value ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-400'
          )}
        >
          {value ? <span className="mdi mdi-check text-sm" /> : step}
        </span>
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="ml-auto hidden sm:block text-[10px] text-gray-400">{hint}</span>
      </div>
      <div className="relative">
        <span className={cn(wrapIcon, value ? 'text-violet-500' : 'text-gray-400')}>
          <span className={icon} />
        </span>
        <select id={id} value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={selectCls}>
          <option value="">Select {label}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="mdi mdi-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
      </div>
    </div>
  )
}

export default function ResultsSelectors({
  classes, subjects, sessions,
  selectedClass, selectedSubject, selectedTerm,
  onClassChange, onSubjectChange, onTermChange,
}: ResultsSelectorsProps) {
  const stepsDone = [selectedClass, selectedSubject, selectedTerm].filter(Boolean).length
  const progress = Math.round((stepsDone / 3) * 100)

  const termOptions = sessions.flatMap(s =>
    (s.terms || []).map(t => ({ value: t.id, label: `${s.name} — ${t.name}` }))
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="mdi mdi-tune-variant text-violet-600 text-lg" />
          <h2 className="text-sm font-semibold text-gray-900">Class setup</h2>
          <span className="hidden sm:inline text-xs text-gray-400">Select the class, subject and term you want to grade.</span>
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1">
          {stepsDone}/3 selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StepField
          step={1}
          icon="mdi-school-outline"
          label="Class"
          hint="Step 1 of 3"
          id="class-select"
          value={selectedClass}
          options={classes.map(c => ({ value: c.id, label: `${c.name}${c.section ? ` — ${c.section}` : ''}` }))}
          onChange={onClassChange}
          disabled={false}
          active={!selectedClass}
        />
        <StepField
          step={2}
          icon="mdi-book-open-page-variant-outline"
          label="Subject"
          hint="Step 2 of 3"
          id="subject-select"
          value={selectedSubject}
          options={subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          onChange={onSubjectChange}
          disabled={!selectedClass}
          active={!!selectedClass && !selectedSubject}
        />
        <StepField
          step={3}
          icon="mdi-calendar-range"
          label="Term"
          hint="Step 3 of 3"
          id="term-select"
          value={selectedTerm}
          options={termOptions}
          onChange={onTermChange}
          disabled={!selectedClass || !selectedSubject}
          active={!!selectedSubject && !selectedTerm}
        />
      </div>

      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200/70 rounded-xl">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Score breakdown:</span>
          {[
            { label: 'CA1', total: '/10' },
            { label: 'CA2', total: '/10' },
            { label: 'CA3', total: '/10' },
            { label: 'Exam', total: '/70' },
            { label: 'Total', total: '/100' },
          ].map(item => (
            <span key={item.label} className="inline-flex items-center gap-1">
              <span className="font-semibold">{item.label}</span>
              <span className="text-slate-400">{item.total}</span>
            </span>
          ))}
        </div>
        <div className="hidden lg:block w-px h-4 bg-slate-200" />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1">Scale:</span>
          {GRADE_DOTS.map(g => (
            <span key={g.grade} className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <span className={cn('h-2 w-2 rounded-full', g.dot)} />
              {g.grade}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}