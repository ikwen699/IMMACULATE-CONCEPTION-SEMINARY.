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
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0" aria-hidden="true">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-md shadow-violet-600/25">
            <span className="mdi mdi-file-document-edit text-2xl" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
            Results
            <span className="mx-1.5 text-gray-300">/</span>
            Post Grades
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Post Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enter continuous assessment and exam scores, then publish them.</p>
        </div>
      </div>

      {hasStudents && (
        <button
          onClick={onPost}
          disabled={saving}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm',
            saving
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-[.98] shadow-violet-600/25 hover:shadow-violet-600/30'
          )}
        >
          {saving ? (
            <>
              <span className="h-4 w-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" aria-hidden="true" />
              Posting...
            </>
          ) : (
            <>
              <span className="mdi mdi-send-check text-lg" aria-hidden="true" />
              Post Grades
            </>
          )}
        </button>
      )}
    </div>
  )
}