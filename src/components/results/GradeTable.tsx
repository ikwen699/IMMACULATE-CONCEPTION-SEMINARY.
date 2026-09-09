'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { calcTotal, getGradeColor, getScoreColor, gradeMax, rowState } from './gradeUtils'
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

const inputCls =
  'w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors'

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
    <td className="px-3 py-2.5 text-center">
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
        className={cn(inputCls,
          hasValue && 'bg-white border-violet-200',
          isFail && field === 'exam' && 'border-red-300 bg-red-50 text-red-700 font-bold'
        )}
      />
    </td>
  )
}

export default function GradeTable({
  grades, rows, isDragging, onUpdate, onCommentChange, onPaste,
  onColumnDragStart, onColumnDrop, onDragEnd, onFillClick,
}: GradeTableProps) {
  const headers: { field: GradeField; label: string }[] = [
    { field: 'ca1', label: 'CA1' },
    { field: 'ca2', label: 'CA2' },
    { field: 'ca3', label: 'CA3' },
    { field: 'exam', label: 'Exam' },
  ]

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      onDragOver={e => e.preventDefault()}
      onDrop={e => e.preventDefault()}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50/50 z-10">#</th>
              <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase sticky left-8 bg-gray-50/50 z-10 min-w-[180px]">Student</th>
              {headers.map(h => (
                <th key={h.field} scope="col"
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                  onDrop={e => onColumnDrop(e, h.field)}
                  className={cn('text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20 transition-colors', isDragging && 'bg-violet-50 text-violet-700')}>
                  <div className="flex flex-col items-center gap-1">
                    <span>{h.label}</span>
                    <button
                      onClick={() => onFillClick(h.field)}
                      aria-label={`Fill all ${h.label}`}
                      title={`Fill all ${h.label}`}
                      className={cn(
                        'p-1 rounded-md transition-colors text-violet-400 hover:text-violet-600',
                        isDragging && 'bg-violet-100 text-violet-700'
                      )}
                    >
                      <span className="mdi mdi-format-paint text-sm" />
                    </button>
                  </div>
                </th>
              ))}
              <th scope="col" className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Total</th>
              <th scope="col" className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((index, domRow) => {
              const row = grades[index]
              const state = rowState(row)
              const grade = row.letterGrade
              const barColor = state.isFail ? 'border-l-red-400' : state.partial ? 'border-l-amber-400' : state.complete ? 'border-l-emerald-400' : 'border-l-transparent'
              return (
                <tr key={row.studentId} className={cn('hover:bg-gray-50/50 transition-colors group', row.isNew && 'bg-violet-50/30')}>
                  <td className={cn('px-4 py-2.5 text-sm text-gray-400 sticky left-0 bg-white hover:bg-gray-50/50 z-10 border-l-[3px]', barColor)}>{domRow + 1}</td>
                  <td className="px-4 py-2.5 sticky left-8 bg-white hover:bg-gray-50/50 z-10">
                    <div className="flex items-center gap-2">
                      <CommentInput value={row.comments} onChange={v => onCommentChange(index, v)} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
                          {row.isNew && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-600 uppercase tracking-wide">New</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">{row.admissionNo}</p>
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
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn('text-sm font-bold', getScoreColor(state.total))}>
                      {state.total > 0 ? state.total.toFixed(1) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {state.total > 0 && (
                      <span aria-label={`Grade: ${grade}`} className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold', getGradeColor(grade))}>
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

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>{rows.length} student{rows.length === 1 ? '' : 's'}</span>
        <div className="flex gap-3">
          <span>Passing (50+): {grades.filter(r => calcTotal(r.ca1, r.ca2, r.ca3, r.exam) >= 50).length}</span>
          <span>Failed (&lt;50): {grades.filter(r => { const t = calcTotal(r.ca1, r.ca2, r.ca3, r.exam); return t > 0 && t < 50 }).length}</span>
        </div>
      </div>
    </div>
  )
}