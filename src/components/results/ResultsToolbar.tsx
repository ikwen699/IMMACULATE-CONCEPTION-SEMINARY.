'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SortDir, SortKey, ViewMode } from './types'

interface ResultsToolbarProps {
  searchInput: string
  resultCount: number
  totalCount: number
  isDragging: boolean
  viewMode: ViewMode
  sortKey: SortKey
  sortDir: SortDir
  canUndo: boolean
  canRedo: boolean
  onSearchInputChange: (value: string) => void
  onClearSearch: () => void
  onViewModeChange: (mode: ViewMode) => void
  onSortKeyChange: (key: SortKey) => void
  onSortDirChange: (dir: SortDir) => void
  onUndo: () => void
  onRedo: () => void
}

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: '↓ / Enter', label: 'Move to next student (same column)' },
  { keys: '↑', label: 'Move to previous student (same column)' },
  { keys: 'Tab / Shift+Tab', label: 'Move between score fields' },
  { keys: 'Ctrl+Z', label: 'Undo last change' },
  { keys: 'Ctrl+Shift+Z / Ctrl+Y', label: 'Redo last change' },
  { keys: 'Esc', label: 'Close dialogs' },
]

export default function ResultsToolbar({
  searchInput, resultCount, totalCount, isDragging, viewMode, sortKey, sortDir,
  canUndo, canRedo,
  onSearchInputChange, onClearSearch, onViewModeChange, onSortKeyChange, onSortDirChange, onUndo, onRedo,
}: ResultsToolbarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            value={searchInput}
            placeholder="Search by name or admission number..."
            onChange={e => onSearchInputChange(e.target.value)}
            aria-label="Search students"
            className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
          />
          {searchInput && (
            <button onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Clear search">
              <span className="mdi mdi-close text-lg" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortKey}
            onChange={e => onSortKeyChange(e.target.value as SortKey)}
            aria-label="Sort by"
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 appearance-none transition-colors"
          >
            <option value="name">Name</option>
            <option value="admissionNo">Admission No.</option>
            <option value="total">Score</option>
          </select>
          <button
            onClick={() => onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')}
            aria-label={sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'}
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            className="px-2.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-violet-600 hover:border-violet-300 transition-colors"
          >
            <span className={cn('mdi text-lg', sortDir === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending')} />
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
            className="px-2.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-violet-600 hover:border-violet-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-colors"
          >
            <span className="mdi mdi-undo text-lg" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo (Ctrl+Shift+Z)"
            title="Redo (Ctrl+Shift+Z)"
            className="px-2.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-violet-600 hover:border-violet-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-colors"
          >
            <span className="mdi mdi-redo text-lg" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShortcuts(s => !s)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts"
              className="px-2.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-violet-600 hover:border-violet-300 transition-colors"
            >
              <span className="mdi mdi-keyboard-outline text-lg" />
            </button>
            {showShortcuts && (
              <div className="absolute right-0 top-full mt-2 z-30 w-72 bg-white rounded-xl border border-gray-200 shadow-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="mdi mdi-keyboard text-violet-500 text-base" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Keyboard shortcuts</span>
                </div>
                <div className="space-y-2">
                  {SHORTCUTS.map(s => (
                    <div key={s.keys} className="flex items-start justify-between gap-3">
                      <span className="text-xs text-gray-500">{s.label}</span>
                      <kbd className="shrink-0 inline-flex px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-600">{s.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => onViewModeChange('table')}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              className={cn('px-3 py-2.5 transition-colors', viewMode === 'table' ? 'bg-violet-50 text-violet-700' : 'text-gray-400 hover:text-gray-600')}
            >
              <span className="mdi mdi-view-list text-lg" />
            </button>
            <div className="w-px bg-gray-200" />
            <button
              onClick={() => onViewModeChange('card')}
              aria-label="Card view"
              aria-pressed={viewMode === 'card'}
              className={cn('px-3 py-2.5 transition-colors', viewMode === 'card' ? 'bg-violet-50 text-violet-700' : 'text-gray-400 hover:text-gray-600')}
            >
              <span className="mdi mdi-view-grid text-lg" />
            </button>
          </div>
        </div>
      </div>

      {isDragging && (
        <div className="px-4 py-2 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700 flex items-center gap-2">
          <span className="mdi mdi-cursor-move" />
          Now drop onto a column header (CA1, CA2, CA3 or Exam) to fill it for all students. Drag a score value from any input while holding it.
        </div>
      )}
      <p className="text-xs text-gray-400">
        Showing {resultCount} of {totalCount} student{totalCount === 1 ? '' : 's'}
        {searchInput ? ' — filtered by search' : ''}
      </p>
    </div>
  )
}