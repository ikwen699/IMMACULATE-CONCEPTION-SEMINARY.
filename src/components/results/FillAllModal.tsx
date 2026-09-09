'use client'

import { useState } from 'react'
import { gradeMax } from './gradeUtils'
import type { GradeField } from './types'

interface FillAllModalProps {
  column: GradeField
  onClose: () => void
  onApply: (value: string) => void
}

const PRESETS = ['0', '5', '7', '8', '10']
const EXAM_PRESETS = ['0', '35', '49', '56', '63', '70']

export default function FillAllModal({ column, onClose, onApply }: FillAllModalProps) {
  const [value, setValue] = useState('')
  const max = gradeMax(column)
  const presets = column === 'exam' ? EXAM_PRESETS : PRESETS

  const apply = () => onApply(value)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="fill-title">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <span className="mdi mdi-format-paint text-violet-600 text-xl" />
          </div>
          <div>
            <h2 id="fill-title" className="text-lg font-semibold text-gray-900">Fill All {column.toUpperCase()}</h2>
            <p className="text-xs text-gray-500">Set the same score for all students</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close dialog">
            <span className="mdi mdi-close text-lg" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Score (max {max})</label>
            <input
              type="number"
              min="0"
              max={max}
              step="0.5"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') apply() }}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
              placeholder={`Enter score (0-${max})`}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setValue(p)}
                className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-violet-100 hover:text-violet-700 transition-colors"
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setValue('')}
              className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={apply}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors">
              <span className="mdi mdi-check" /> Apply to All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}