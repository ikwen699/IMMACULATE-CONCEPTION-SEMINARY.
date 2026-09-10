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
    <div className="sticky bottom-4 z-30">
      <div className="mx-auto max-w-3xl bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-900/10 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-in-top">
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-600 text-white px-3 py-1 text-xs font-bold shadow-sm shadow-violet-600/30">
            <span className="mdi mdi-clipboard-text text-sm" />
            {count} grade{count === 1 ? '' : 's'} ready
          </span>

          {hasEdits && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              {draftState === 'saving' ? (
                <>
                  <span className="h-3 w-3 border-[1.5px] border-amber-300 border-t-amber-500 rounded-full animate-spin" />
                  Saving draft…
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {lastDraftAt ? <>Draft saved <span className="tabular-nums">{format(lastDraftAt, 'h:mm a')}</span></> : 'Draft saved'}
                </>
              )}
            </span>
          )}

          {lastSaved && (
            <span className="text-xs text-gray-400 tabular-nums">
              Posted <span className="font-medium text-gray-500">{format(lastSaved, 'h:mm a')}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onClearAll}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <span className="mdi mdi-delete-sweep" />
            Clear
          </button>
          <button
            onClick={onPost}
            disabled={saving}
            className={cn(
              'flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm',
              saving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-[.98] shadow-violet-600/25'
            )}
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" /> Posting...
              </>
            ) : (
              <>
                <span className="mdi mdi-send-check" /> Post {count} Grade{count === 1 ? '' : 's'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}