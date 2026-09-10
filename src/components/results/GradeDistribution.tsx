'use client'

import { cn } from '@/lib/utils'
import { getBreakdown } from './gradeUtils'
import type { StudentGrade } from './types'

interface GradeDistributionProps {
  grades: StudentGrade[]
}

const SLOTS = [
  { grade: 'A', label: 'A', sub: '70–100', color: 'bg-emerald-500', text: 'text-emerald-700', chip: 'bg-emerald-50' },
  { grade: 'B', label: 'B', sub: '60–69', color: 'bg-blue-500', text: 'text-blue-700', chip: 'bg-blue-50' },
  { grade: 'C', label: 'C', sub: '50–59', color: 'bg-amber-500', text: 'text-amber-700', chip: 'bg-amber-50' },
  { grade: 'D', label: 'D', sub: '40–49', color: 'bg-orange-500', text: 'text-orange-700', chip: 'bg-orange-50' },
  { grade: 'F', label: 'F', sub: '<40', color: 'bg-red-500', text: 'text-red-700', chip: 'bg-red-50' },
] as const

export default function GradeDistribution({ grades }: GradeDistributionProps) {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  grades.forEach(g => {
    const b = getBreakdown(g)
    if (b) counts[b.grade] += 1
  })
  const total = SLOTS.reduce((s, slot) => s + counts[slot.grade], 0)
  if (total === 0) return null

  const summary = SLOTS.map(slot => `${slot.label}: ${counts[slot.grade]}`).join(', ')

  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center" aria-hidden="true">
          <span className="mdi mdi-chart-bar text-violet-600 text-lg" />
        </span>
        <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Grade distribution</span>
        <span className="ml-auto text-[11px] text-gray-500 tabular-nums">{total} graded</span>
      </div>

      <div
        role="img"
        aria-label={`Grade distribution: ${summary}`}
        className="flex h-9 gap-1.5 overflow-hidden rounded-xl"
      >
        {SLOTS.map(slot => (
          <div
            key={slot.grade}
            className={cn(slot.color, 'transition-all duration-500 min-w-0')}
            style={{ width: `${(counts[slot.grade] / total) * 100}%` }}
          >
            {counts[slot.grade] / total >= 0.08 && (
              <span className="hidden sm:flex items-center justify-center h-full text-[11px] font-bold text-white" aria-hidden="true">
                {counts[slot.grade]}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {SLOTS.map(slot => (
          <div key={slot.grade} className={cn('rounded-xl px-3 py-2 flex items-center justify-between gap-2', slot.chip)}>
            <div className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-full', slot.color)} aria-hidden="true" />
              <div className="leading-tight">
                <p className="text-xs font-bold text-gray-800">{slot.label}</p>
                <p className="text-[10px] text-gray-500">{slot.sub}</p>
              </div>
            </div>
            <span className={cn('text-sm font-bold tabular-nums', slot.text)}>{counts[slot.grade]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}