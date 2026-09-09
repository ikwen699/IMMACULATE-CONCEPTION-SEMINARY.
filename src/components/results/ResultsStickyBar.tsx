'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DraftState } from './types'

interface ResultsStickyBarProps {
  count: number
  lastSaved: Date | null
  lastDraftAt: Date | null
  draftState: DraftState
  hasEdits: boolean
  saving: boolean
  onPost: () => void
  onClearAll: () => void
}

export default function ResultsStickyBar({
  count, lastSaved, lastDraftAt, draftState, hasEdits, saving, onPost, onClearAll,
}: ResultsStickyBarProps) {
  return (
    <div className="sticky bottom-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
        <span className="font-semibold text-violet-700">{count} grade{count === 1 ? '' : 's'} to post</span>

        {hasEdits && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            {draftState === 'saving' ? (
              <>
                <span className="w-3 h-3 border-[1.5px] border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                Saving draft…
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {lastDraftAt ? `Draft saved ${format(lastDraftAt, 'h:mm a')}` : 'Draft saved'}
              </>
            )}
          </span>
        )}

        {lastSaved && (
          <span className="text-xs text-gray-400">
            Last posted: {format(lastSaved, 'h:mm a')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClearAll}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={onPost}
          disabled={saving}
          className={cn('inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors',
            saving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
          )}
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...
            </>
          ) : (
            <>
              <span className="mdi mdi-check-circle" /> Post {count} Grade{count === 1 ? '' : 's'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}