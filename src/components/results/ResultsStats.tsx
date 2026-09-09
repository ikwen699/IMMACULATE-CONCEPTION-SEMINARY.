'use client'

import { cn } from '@/lib/utils'

interface ResultsStatsProps {
  totalStudents: number
  gradedCount: number
  passingCount: number
  averageScore: number
}

function StatCard({ icon, iconColor, label, value, valueColor }: { icon: string; iconColor: string; label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <span className={`mdi ${icon} ${iconColor} text-lg`} />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold text-gray-900', valueColor)}>{value}</p>
    </div>
  )
}

export default function ResultsStats({ totalStudents, gradedCount, passingCount, averageScore }: ResultsStatsProps) {
  const gradedPct = totalStudents > 0 ? Math.round((gradedCount / totalStudents) * 100) : 0
  const progressColor = gradedPct === 100 ? 'bg-emerald-500' : gradedPct >= 50 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="mdi-account-multiple" iconColor="text-gray-400" label="Students" value={totalStudents} />
        <StatCard icon="mdi-check-circle" iconColor="text-violet-500" label="Graded" value={gradedCount} />
        <StatCard icon="mdi-school" iconColor="text-emerald-500" label="Passing (50+)" value={passingCount} valueColor="text-emerald-700" />
        <div className="col-span-2 lg:col-span-1 p-4 rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="mdi mdi-chart-line text-amber-500 text-lg" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Average</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{averageScore > 0 ? averageScore.toFixed(1) : '—'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Grading progress</span>
          <span className="text-xs font-semibold text-gray-700">{gradedCount} of {totalStudents} ({gradedPct}%)</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-500', progressColor)} style={{ width: `${gradedPct}%` }} />
        </div>
      </div>
    </div>
  )
}