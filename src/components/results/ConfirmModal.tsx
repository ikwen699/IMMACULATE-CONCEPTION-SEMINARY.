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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <span className="mdi mdi-file-document-check text-violet-600 text-xl" />
          </div>
          <div>
            <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">Post Grades</h2>
            <p className="text-xs text-gray-500">This will update student records</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close dialog">
            <span className="mdi mdi-close text-lg" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Class</span><span className="font-medium text-gray-900">{className}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Subject</span><span className="font-medium text-gray-900">{subjectName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Term</span><span className="font-medium text-gray-900">{termLabel}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2"><span className="text-gray-500">Grades to post</span><span className="font-bold text-violet-700">{count}</span></div>
          </div>
          <p className="text-sm text-gray-600">Are you sure you want to post these grades? This action cannot be undone.</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={saving}
            className={cn('flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors', saving && 'opacity-50 cursor-not-allowed')}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="mdi mdi-check" />}
            {saving ? 'Posting...' : 'Post Grades'}
          </button>
        </div>
      </div>
    </div>
  )
}