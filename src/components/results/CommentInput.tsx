'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface CommentInputProps {
  value?: string
  onChange: (value: string) => void
}

export default function CommentInput({ value = '', onChange }: CommentInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const hasComment = value.trim().length > 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={hasComment ? 'Edit comment' : 'Add comment'}
        title={hasComment ? 'Edit comment' : 'Add comment'}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          hasComment ? 'bg-violet-100 text-violet-600' : 'text-gray-300 hover:text-violet-500 hover:bg-violet-50'
        )}
      >
        <span className={cn('text-base mdi', hasComment ? 'mdi-message-text' : 'mdi-message-text-outline')} />
        {hasComment && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 w-64 bg-white rounded-xl border border-gray-200 shadow-xl p-3 animate-scale-in">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Teacher comment</label>
          <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="Add a comment for this student..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-y"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {hasComment && (
                <button
                  type="button"
                  onClick={() => { onChange(''); ref.current?.focus() }}
                  className="px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
              <span className="text-[10px] text-gray-400 tabular-nums">{value.length}/160</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-2.5 py-1 text-xs font-semibold text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}