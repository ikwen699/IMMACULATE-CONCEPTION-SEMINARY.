'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getGradeColor, getScoreColor, gradeMax, gradeDotColor, getBreakdown, rowState } from './gradeUtils'
import type { GradeField, StudentGrade } from './types'

interface GradeCardProps {
  grades: StudentGrade[]
  rows: number[]
  onUpdate: (index: number, field: GradeField, value: string) => void
  onPaste: (e: React.ClipboardEvent, index: number, field: GradeField) => void
}

const FIELDS: GradeField[] = ['ca1', 'ca2', 'ca3', 'exam']

function statusPill(state: { complete: boolean; partial: boolean; ungraded: boolean; isFail: boolean }) {
  if (state.isFail) return { label: 'Needs attention', cls: 'bg-red-50 text-red-600 border-red-200' }
  if (state.complete) return { label: 'Complete', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
  if (state.partial) return { label: 'In progress', cls: 'bg-amber-50 text-amber-600 border-amber-200' }
  return { label: 'Not started', cls: 'bg-gray-50 text-gray-400 border-gray-200' }
}

export default function GradeCard({ grades, rows, onUpdate, onPaste }: GradeCardProps) {
  return (
    <div className="space-y-3">
      {rows.map(index => {
        const row = grades[index]
        const state = rowState(row)
        const pill = statusPill(state)
        const breakdown = getBreakdown(row)
        return (
          <div key={row.studentId} className={cn(
            'bg-white rounded-xl shadow-sm border overflow-hidden',
            row.isNew ? 'border-violet-200 border-dashed' : 'border-gray-100'
          )}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
                    {row.isNew && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-600 uppercase tracking-wide shrink-0">New</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{row.admissionNo}</p>
                </div>
                <div className="text-right shrink-0">
                  {state.total > 0 && breakdown ? (
                    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xl font-bold', breakdown.bg, breakdown.text)}>
                      <span className={cn('w-2 h-2 rounded-full', gradeDotColor(breakdown.grade))} />
                      {state.total.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-gray-300">—</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {FIELDS.map(f => {
                  const max = gradeMax(f)
                  const hasValue = row[f] !== ''
                  return (
                    <div key={f}>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">{f === 'exam' ? 'Exam' : f.toUpperCase()}</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max={max}
                        step="0.5"
                        aria-label={`${f === 'exam' ? 'Exam' : f.toUpperCase()} score for ${row.name} (max ${max})`}
                        value={row[f]}
                        onChange={e => onUpdate(index, f, e.target.value)}
                        onPaste={e => onPaste(e, index, f)}
                        className={cn(
                          'w-full px-2 py-2 border rounded-lg text-sm text-center bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors',
                          hasValue && 'bg-white border-violet-200',
                          state.isFail && f === 'exam' ? 'border-red-300 bg-red-50 text-red-700 font-bold' : 'border-gray-200'
                        )}
                      />
                    </div>
                  )
                })}
              </div>

              {breakdown && (
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total:</span>
                  <span className={cn('font-bold', getScoreColor(state.total))}>{state.total.toFixed(1)}/100</span>
                  <span className="text-gray-300">•</span>
                  <span className={cn('inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold', getGradeColor(breakdown.grade))}>
                    Grade {breakdown.grade}
                  </span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className={cn('inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold', pill.cls)}>{pill.label}</span>
                {row.comments && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-violet-600">
                    <span className="mdi mdi-message-text text-sm" /> Comment
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <p className="text-xs text-gray-500 text-center pt-1">
        {rows.length} student{rows.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}