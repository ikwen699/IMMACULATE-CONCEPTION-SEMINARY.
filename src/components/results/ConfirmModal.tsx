'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  className: string
  subjectName: string
  termLabel: string
  count: number
  saving: boolean
  onClose: () => void
  onConfirm: () => void
}

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export default function ConfirmModal({ className, subjectName, termLabel, count, saving, onClose, onConfirm }: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body">
      <div
        ref={dialogRef}
        onKeyDown={onKeyDown}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in"
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shadow-violet-600/25" aria-hidden="true">
            <span className="mdi mdi-file-document-check text-violet-50 text-xl" />
          </div>
          <div>
            <h2 id="confirm-title" className="text-lg font-bold text-gray-900">Post Grades</h2>
            <p className="text-xs text-gray-500">This will update student records</p>
          </div>
          <button ref={cancelRef} onClick={onClose} className="ml-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close dialog">
            <span className="mdi mdi-close text-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-gray-600"><span className="mdi mdi-school-outline text-slate-400" aria-hidden="true" /> Class</span>
              <span className="font-semibold text-gray-900">{className}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-gray-600"><span className="mdi mdi-book-open-page-variant-outline text-slate-400" aria-hidden="true" /> Subject</span>
              <span className="font-semibold text-gray-900">{subjectName}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-gray-600"><span className="mdi mdi-calendar-range text-slate-400" aria-hidden="true" /> Term</span>
              <span className="font-semibold text-gray-900">{termLabel}</span>
            </div>
          </div>

          <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-violet-800">
              <span className="mdi mdi-clipboard-text text-violet-500" aria-hidden="true" /> Grades to post
            </span>
            <span className="text-lg font-bold text-violet-700 tabular-nums">{count}</span>
          </div>

          <p id="confirm-body" className="text-sm text-gray-600 leading-relaxed">Are you sure you want to post these grades? Students and parents will see the updated results immediately and this cannot be undone.</p>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={saving}
            className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-all shadow-sm shadow-violet-600/20 active:scale-[.98]', saving && 'opacity-50 cursor-not-allowed')}>
            {saving ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" /> : <span className="mdi mdi-send-check" aria-hidden="true" />}
            {saving ? 'Posting...' : 'Post Grades'}
          </button>
        </div>
      </div>
    </div>
  )
}