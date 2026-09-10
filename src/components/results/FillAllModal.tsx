'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { gradeMax } from './gradeUtils'
import type { GradeField } from './types'

interface FillAllModalProps {
  column: GradeField
  onClose: () => void
  onApply: (value: string) => void
}

const PRESETS = ['0', '5', '7', '8', '10']
const EXAM_PRESETS = ['0', '35', '49', '56', '63', '70']

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export default function FillAllModal({ column, onClose, onApply }: FillAllModalProps) {
  const [value, setValue] = useState('')
  const max = gradeMax(column)
  const presets = column === 'exam' ? EXAM_PRESETS : PRESETS
  const isExam = column === 'exam'

  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    return () => previouslyFocused?.focus?.()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const root = dialogRef.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const apply = () => {
    if (value === '') return
    onApply(value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="fill-title" aria-describedby="fill-desc">
      <div ref={dialogRef} onKeyDown={onKeyDown} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shadow-violet-600/25" aria-hidden="true">
            <span className="mdi mdi-format-paint text-violet-50 text-xl" />
          </div>
          <div>
            <h2 id="fill-title" className="text-lg font-bold text-gray-900">Fill All {column.toUpperCase()}</h2>
            <p className="text-xs text-gray-500">Set the same score for every student</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close dialog">
            <span className="mdi mdi-close text-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="fill-score" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Score (max {max})</label>
            <input
              id="fill-score"
              type="number"
              min="0"
              max={max}
              step="0.5"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') apply() }}
              autoFocus
              className="w-full px-3.5 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-lg text-center tabular-nums text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-colors placeholder:text-gray-400"
              placeholder={`0 — ${max}`}
            />
            {isExam && (
              <p id="fill-desc" className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                <span className="mdi mdi-information-outline text-sm text-violet-400" aria-hidden="true" />
                Exam is out of 70. CA components remain out of 10 each.
              </p>
            )}
            {!isExam && <p id="fill-desc" className="mt-2 text-[11px] text-gray-500">Applies the same {column.toUpperCase()} score (max {max}) to every student.</p>}
          </div>

          <div>
            <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick fill</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preset values">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setValue(p)}
                  aria-pressed={value === p}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-semibold tabular-nums transition-colors',
                    value === p ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/25' : 'text-gray-600 bg-gray-100 hover:bg-violet-100 hover:text-violet-700'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setValue('')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={apply} disabled={value === ''}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-all shadow-sm shadow-violet-600/20 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed">
              <span className="mdi mdi-check" aria-hidden="true" /> Apply to All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}