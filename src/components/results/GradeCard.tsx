'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getBreakdown, getGradeColor, gradeMax, initialsOf, rowState } from './gradeUtils'
import type { GradeField, StudentGrade } from './types'

interface GradeCardProps {
  grades: StudentGrade[]
  rows: number[]
  onUpdate: (index: number, field: GradeField, value: string) => void
  onPaste: (e: React.ClipboardEvent, index: number, field: GradeField) => void
}

const FIELDS: GradeField[] = ['ca1', 'ca2', 'ca3', 'exam']

function statusPill(state: { complete: boolean; partial: boolean; ungraded: boolean; isFail: boolean }) {
  if (state.isFail) return { label: 'Needs attention', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' }
  if (state.complete) return { label: 'Complete', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500' }
  if (state.partial) return { label: 'In progress', cls: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500' }
  return { label: 'Not started', cls: 'bg-gray-50 text-gray-400 border-gray-200', dot: 'bg-gray-300' }
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
            'bg-white rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md',
            row.isNew ? 'border border-violet-300 border-dashed' : 'border border-gray-200/70'
          )}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0', breakdown ? `${breakdown.bg} ${breakdown.text}` : 'bg-slate-100 text-slate-400')}>
                    {initialsOf(row.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{row.name}</p>
                      {row.isNew && (
                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold text-violet-700 bg-violet-100 uppercase tracking-wide shrink-0">New</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 tabular-nums">{row.admissionNo}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {state.total > 0 && breakdown ? (
                    <div className={cn('h-12 w-12 rounded-full p-[3px]', breakdown.dot)}>
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                        <span className={cn('text-sm font-bold tabular-nums leading-none', breakdown.text)}>
                          {state.total.toFixed(0)}
                        </span>
                      </div>
                    </div>
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
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 text-center">
                        {f === 'exam' ? 'Exam' : f.toUpperCase()}
                      </label>
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
                          'w-full px-1 py-2 rounded-lg text-sm text-center tabular-nums border transition-all',
                          'bg-gray-50/80 border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 focus:bg-white',
                          hasValue && 'bg-white border-violet-300',
                          state.isFail && f === 'exam' && 'border-red-300 bg-red-50 text-red-700 font-semibold'
                        )}
                      />
                    </div>
                  )
                })}
              </div>

              {breakdown && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', breakdown.dot)} />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</span>
                    <span className={cn('font-bold tabular-nums', breakdown.text)}>{state.total.toFixed(1)}/100</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold', getGradeColor(breakdown.grade))}>
                    Grade {breakdown.grade}
                  </span>
                </div>
              )}

              <div className="mt-3.5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold', pill.cls)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', pill.dot)} />
                  {pill.label}
                </span>
                {row.comments ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-violet-600">
                    <span className="mdi mdi-message-text text-sm" /> Comment added
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-300">No comment</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <p className="text-xs text-gray-500 text-center pt-1 tabular-nums">
        {rows.length} student{rows.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}