'use client'

import { getBreakdown } from './gradeUtils'
import type { StudentGrade } from './types'

interface GradeDistributionProps {
  grades: StudentGrade[]
}

const SLOTS = [
  { grade: 'A', label: 'A', color: 'bg-green-500', text: 'text-green-700' },
  { grade: 'B', label: 'B', color: 'bg-blue-500', text: 'text-blue-700' },
  { grade: 'C', label: 'C', color: 'bg-amber-500', text: 'text-amber-700' },
  { grade: 'D', label: 'D', color: 'bg-orange-500', text: 'text-orange-700' },
  { grade: 'F', label: 'F', color: 'bg-red-500', text: 'text-red-700' },
] as const

export default function GradeDistribution({ grades }: GradeDistributionProps) {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  grades.forEach(g => {
    const b = getBreakdown(g)
    if (b) counts[b.grade] += 1
  })
  const total = SLOTS.reduce((s, slot) => s + counts[slot.grade], 0)
  if (total === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="mdi mdi-chart-bar text-violet-500 text-lg" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade distribution</span>
      </div>
      <div className="flex h-8 gap-1 overflow-hidden rounded-lg">
        {SLOTS.map(slot => (
          <div
            key={slot.grade}
            title={`${slot.label}: ${counts[slot.grade]} student${counts[slot.grade] === 1 ? '' : 's'}`}
            className={`${slot.color} transition-all duration-500`}
            style={{ width: `${(counts[slot.grade] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-2.5">
        {SLOTS.map(slot => (
          <div key={slot.grade} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${slot.color}`} />
            <span className="text-xs font-medium text-gray-700">{slot.label}</span>
            <span className={`text-xs font-bold ${slot.text}`}>{counts[slot.grade]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}