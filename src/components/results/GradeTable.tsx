'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { accentFor, calcTotal, getGradeColor, getScoreColor, gradeMax, rowState } from './gradeUtils'
import CommentInput from './CommentInput'
import type { GradeField, StudentGrade } from './types'

interface GradeTableProps {
  grades: StudentGrade[]
  rows: number[]
  isDragging: boolean
  onUpdate: (index: number, field: GradeField, value: string) => void
  onCommentChange: (index: number, value: string) => void
  onPaste: (e: React.ClipboardEvent, index: number, field: GradeField) => void
  onColumnDragStart: (e: React.DragEvent, value: string) => void
  onColumnDrop: (e: React.DragEvent, field: GradeField) => void
  onDragEnd: () => void
  onFillClick: (field: GradeField) => void
}

const headers: { field: GradeField; label: string }[] = [
  { field: 'ca1', label: 'CA1' },
  { field: 'ca2', label: 'CA2' },
  { field: 'ca3', label: 'CA3' },
  { field: 'exam', label: 'Exam' },
]

function focusCell(domRow: number, field: GradeField) {
  const el = document.querySelector<HTMLInputElement>(`input[data-row="${domRow}"][data-field="${field}"]`)
  el?.focus()
  el?.select()
}

function handleCellKeyDown(e: React.KeyboardEvent, domRow: number, field: GradeField, rowCount: number) {
  if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const isDown = e.key === 'Enter' || e.key === 'ArrowDown'
    if (isDown) {
      e.preventDefault()
      focusCell(domRow + 1 < rowCount ? domRow + 1 : 0, field)
    } else {
      e.preventDefault()
      if (domRow > 0) focusCell(domRow - 1, field)
    }
  }
}

interface FieldCellProps {
  domRow: number
  rowCount: number
  row: StudentGrade
  field: GradeField
  index: number
  isFail: boolean
  onUpdate: GradeTableProps['onUpdate']
  onPaste: GradeTableProps['onPaste']
  onColumnDragStart: GradeTableProps['onColumnDragStart']
  onDragEnd: () => void
}

function FieldCell({ domRow, rowCount, row, field, index, isFail, onUpdate, onPaste, onColumnDragStart, onDragEnd }: FieldCellProps) {
  const max = gradeMax(field)
  const value = row[field]
  const hasValue = value !== ''
  return (
    <td className="px-2 py-2 text-center">
      <div className="relative inline-block">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max={max}
          step="0.5"
          data-row={domRow}
          data-field={field}
          aria-label={`${field === 'exam' ? 'Exam' : field.toUpperCase()} score for ${row.name} (max ${max})`}
          aria-invalid={isFail && field === 'exam'}
          title={`Max ${max}`}
          value={value}
          onChange={e => onUpdate(index, field, e.target.value)}
          onPaste={e => onPaste(e, index, field)}
          onKeyDown={e => handleCellKeyDown(e, domRow, field, rowCount)}
          draggable={hasValue}
          onDragStart={e => onColumnDragStart(e, value)}
          onDragEnd={onDragEnd}
          className={cn(
            'w-16 px-1.5 py-2 rounded-lg text-sm text-center tabular-nums border transition-all',
            'bg-gray-50/80 border-gray-200 hover:border-violet-300',
            'focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 focus:bg-white',
            hasValue && 'bg-white border-violet-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.15)]',
            isFail && field === 'exam' && 'border-red-300 bg-red-50 text-red-700 font-semibold'
          )}
        />
        {hasValue && (
          <span className="pointer-events-none absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
        )}
      </div>
    </td>
  )
}

export default function GradeTable({
  grades, rows, isDragging, onUpdate, onCommentChange, onPaste,
  onColumnDragStart, onColumnDrop, onDragEnd, onFillClick,
}: GradeTableProps) {
  const passingTotal = grades.filter(r => calcTotal(r.ca1, r.ca2, r.ca3, r.exam) >= 50).length
  const failedTotal = grades.filter(r => { const t = calcTotal(r.ca1, r.ca2, r.ca3, r.exam); return t > 0 && t < 50 }).length
  const ungradedTotal = grades.length - passingTotal - failedTotal

  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[62vh]">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th scope="col" className="sticky top-0 left-0 z-40 w-14 px-3 py-3.5 bg-white border-b border-gray-200">
                <span className="flex items-center justify-center text-[11px] font-bold text-gray-400">#</span>
              </th>
              <th scope="col" className="sticky top-0 left-14 z-30 min-w-[200px] px-3 py-3.5 bg-white border-b border-gray-200">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <span className="mdi mdi-account-details text-sm text-gray-400" />
                  Student
                </span>
              </th>
              {headers.map(h => (
                <th key={h.field} scope="col"
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                  onDrop={e => onColumnDrop(e, h.field)}
                  className={cn(
                    'sticky top-0 z-20 w-[92px] px-1 py-3.5 bg-white border-b border-gray-200 transition-colors text-center',
                    isDragging && 'bg-violet-50'
                  )}>
                  <div className={cn('flex flex-col items-center gap-1.5 py-1 rounded-lg transition-colors', isDragging && 'bg-violet-100 ring-1 ring-violet-200')}>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{h.label}</span>
                      <span className="text-[10px] text-gray-400 font-medium">/ {gradeMax(h.field)}</span>
                    </div>
                    <button
                      onClick={() => onFillClick(h.field)}
                      aria-label={`Fill all ${h.label}`}
                      title={`Fill all ${h.label}`}
                      className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors',
                        isDragging
                          ? 'bg-violet-600 text-white'
                          : 'text-violet-500 hover:bg-violet-50 hover:text-violet-700'
                      )}
                    >
                      <span className="mdi mdi-format-paint text-xs" />
                      Fill all
                    </button>
                  </div>
                </th>
              ))}
              <th scope="col" className="sticky top-0 z-20 w-24 px-3 py-3.5 bg-white border-b border-gray-200">
                <span className="block text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">Total</span>
              </th>
              <th scope="col" className="sticky top-0 z-20 w-20 px-3 py-3.5 bg-white border-b border-gray-200">
                <span className="block text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">Grade</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((index, domRow) => {
              const row = grades[index]
              const state = rowState(row)
              const grade = row.letterGrade
              const totalPct = Math.min(100, state.total)
              return (
                <tr key={row.studentId} className={cn('group transition-colors', domRow % 2 === 1 ? 'bg-slate-50/60' : 'bg-white', 'hover:bg-violet-50/40')}>
                  <td className={cn('sticky left-0 z-10 px-3 py-2 border-l-[3px] border-b border-gray-100', accentFor(state), domRow % 2 === 1 ? 'bg-slate-50/60 group-hover:bg-violet-50/40' : 'bg-white group-hover:bg-violet-50/40')}>
                    <span className="block text-center text-sm font-medium text-gray-400 tabular-nums">{domRow + 1}</span>
                  </td>
                  <td className="sticky left-14 z-10 px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <CommentInput value={row.comments || ''} onChange={v => onCommentChange(index, v)} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={cn('text-sm font-medium truncate', row.isNew ? 'text-violet-800' : 'text-gray-900')}>{row.name}</p>
                          {row.isNew && (
                            <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold text-violet-700 bg-violet-100 uppercase tracking-wide shrink-0">New</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 tabular-nums">{row.admissionNo}</p>
                      </div>
                    </div>
                  </td>
                  {headers.map(h => (
                    <FieldCell
                      key={h.field}
                      domRow={domRow}
                      rowCount={rows.length}
                      row={row}
                      field={h.field}
                      index={index}
                      isFail={state.isFail}
                      onUpdate={onUpdate}
                      onPaste={onPaste}
                      onColumnDragStart={onColumnDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                  <td className="px-3 py-2 border-b border-gray-100">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn('text-sm font-bold tabular-nums', getScoreColor(state.total))}>
                        {state.total > 0 ? state.total.toFixed(1) : '—'}
                      </span>
                      {state.total > 0 && (
                        <div className="h-1 w-12 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-300', state.isFail ? 'bg-red-400' : state.total >= 70 ? 'bg-emerald-500' : state.total >= 50 ? 'bg-amber-400' : 'bg-orange-400')}
                            style={{ width: `${totalPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100 text-center">
                    {state.total > 0 && (
                      <span aria-label={`Grade: ${grade}`} className={cn('inline-flex min-w-[28px] justify-center px-2 py-1 rounded-full text-xs font-bold ring-1 ring-black/5', getGradeColor(grade))}>
                        {grade}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 tabular-nums">
          {rows.length} student{rows.length === 1 ? '' : 's'}
          {rows.length !== grades.length && (
            <span className="text-gray-400"> (filtered from {grades.length})</span>
          )}
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Passing <span className="tabular-nums">{passingTotal}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Failed <span className="tabular-nums">{failedTotal}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <span className="h-2 w-2 rounded-full bg-gray-300" />
            Ungraded <span className="tabular-nums">{ungradedTotal}</span>
          </span>
        </div>
      </div>
    </div>
  )
}