'use client'

import { cn } from '@/lib/utils'

interface ResultsHeaderProps {
  hasStudents: boolean
  saving: boolean
  onPost: () => void
}

export default function ResultsHeader({ hasStudents, saving, onPost }: ResultsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <span className="mdi mdi-file-document-edit text-violet-600 text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post Results</h1>
          <p className="text-sm text-gray-500">Enter CA and exam scores for students</p>
        </div>
      </div>
      {hasStudents && (
        <button onClick={onPost} disabled={saving}
          className={cn('px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm',
            saving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'
          )}>
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="mdi mdi-check-circle text-lg" /> Post Grades
            </span>
          )}
        </button>
      )}
    </div>
  )
}