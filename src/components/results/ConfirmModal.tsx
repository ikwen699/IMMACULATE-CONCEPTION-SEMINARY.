'use client'

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

export default function ConfirmModal({ className, subjectName, termLabel, count, saving, onClose, onConfirm }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shadow-violet-600/25">
            <span className="mdi mdi-file-document-check text-violet-50 text-xl" />
          </div>
          <div>
            <h2 id="confirm-title" className="text-lg font-bold text-gray-900">Post Grades</h2>
            <p className="text-xs text-gray-500">This will update student records</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close dialog">
            <span className="mdi mdi-close text-lg" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-gray-500"><span className="mdi mdi-school-outline text-slate-400" /> Class</span>
              <span className="font-semibold text-gray-900">{className}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-gray-500"><span className="mdi mdi-book-open-page-variant-outline text-slate-400" /> Subject</span>
              <span className="font-semibold text-gray-900">{subjectName}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-gray-500"><span className="mdi mdi-calendar-range text-slate-400" /> Term</span>
              <span className="font-semibold text-gray-900">{termLabel}</span>
            </div>
          </div>

          <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-violet-800">
              <span className="mdi mdi-clipboard-text text-violet-500" /> Grades to post
            </span>
            <span className="text-lg font-bold text-violet-700 tabular-nums">{count}</span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">Are you sure you want to post these grades? Students and parents will see the updated results immediately and this cannot be undone.</p>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={saving}
            className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-all shadow-sm shadow-violet-600/20 active:scale-[.98]', saving && 'opacity-50 cursor-not-allowed')}>
            {saving ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="mdi mdi-send-check" />}
            {saving ? 'Posting...' : 'Post Grades'}
          </button>
        </div>
      </div>
    </div>
  )
}