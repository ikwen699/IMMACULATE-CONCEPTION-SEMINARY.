'use client'

import { cn } from '@/lib/utils'

interface ResultsStatsProps {
  totalStudents: number
  gradedCount: number
  passingCount: number
  averageScore: number
}

interface Stat {
  icon: string
  chip: string
  accent: string
  label: string
  value: string
  hint?: string
}

function StatCard({ icon, chip, accent, label, value, hint }: Stat) {
  return (
    <div className="group p-4 rounded-2xl border border-gray-200/70 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('h-8 w-8 rounded-lg flex items-center justify-center', chip)}>
          <span className={cn('mdi text-lg', icon)} />
        </span>
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold tracking-tight tabular-nums', accent)}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

export default function ResultsStats({ totalStudents, gradedCount, passingCount, averageScore }: ResultsStatsProps) {
  const gradedPct = totalStudents > 0 ? Math.round((gradedCount / totalStudents) * 100) : 0
  const passPct = gradedCount > 0 ? Math.round((passingCount / gradedCount) * 100) : 0
  const remaining = totalStudents - gradedCount

  const progressColor = gradedPct === 100 ? 'bg-emerald-500' : gradedPct >= 50 ? 'bg-violet-500' : 'bg-amber-500'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon="mdi-account-group"
          chip="bg-slate-100 text-slate-600"
          accent="text-gray-900"
          label="Students"
          value={String(totalStudents)}
          hint={`${remaining} not yet graded`}
        />
        <StatCard
          icon="mdi-clipboard-check-outline"
          chip="bg-violet-50 text-violet-600"
          accent="text-gray-900"
          label="Graded"
          value={String(gradedCount)}
          hint={`${gradedPct}% complete`}
        />
        <StatCard
          icon="mdi-trophy-outline"
          chip="bg-emerald-50 text-emerald-600"
          accent="text-emerald-700"
          label="Passing (50+)"
          value={String(passingCount)}
          hint={`${passPct}% of graded`}
        />
        <StatCard
          icon="mdi-chart-line"
          chip="bg-amber-50 text-amber-600"
          accent={averageScore > 0 ? 'text-amber-700' : 'text-gray-300'}
          label="Average"
          value={averageScore > 0 ? averageScore.toFixed(1) : '—'}
          hint="Class mean score"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/70 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Grading progress</span>
          <span className="text-xs font-semibold text-gray-700 tabular-nums">
            {gradedCount} <span className="text-gray-400">of</span> {totalStudents}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', progressColor)}
            style={{ width: `${gradedPct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', progressColor)} />
            {gradedPct}% of students graded
          </span>
          {passPct > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {passPct}% of graded students are passing
            </span>
          )}
        </div>
      </div>
    </div>
  )
}