'use client'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: string
  iconBg?: string
  iconColor?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  noSelection?: boolean
  onSelectFirst?: () => void
}

const STEPS = [
  { step: '1', title: 'Choose a class', body: 'Pick a class to load its students', icon: 'mdi-account-group' },
  { step: '2', title: 'Pick subject & term', body: 'Narrow down to the result sheet', icon: 'mdi-book-open-page-variant-outline' },
  { step: '3', title: 'Post grades', body: 'Enter scores, then post for all', icon: 'mdi-send-check' },
]

export default function EmptyState({
  icon, iconBg = 'bg-violet-50', iconColor = 'text-violet-400', title, description,
  actionLabel, onAction, noSelection, onSelectFirst,
}: EmptyStateProps) {
  if (noSelection) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-600/25 animate-scale-in">
            <span className="mdi mdi-clipboard-text-search text-violet-50 text-3xl" />
          </div>
          <span className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center">
            <span className="mdi mdi-check text-white text-sm" />
          </span>
        </div>

        <h2 className="mt-6 text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-1.5 max-w-sm text-sm text-gray-500 leading-relaxed">{description}</p>

        <div className="mt-6 grid sm:grid-cols-3 gap-2.5 w-full max-w-lg text-left">
          {STEPS.map(f => (
            <div key={f.step} className="rounded-xl border bg-gray-50/40 p-3.5 border-gray-200/70">
              <div className="flex items-center justify-between mb-2">
                <span className="h-6 w-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">{f.step}</span>
                <span className={`mdi ${f.icon} text-lg text-violet-400`} />
              </div>
              <p className="text-xs font-semibold text-gray-800 leading-snug">{f.title}</p>
              <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{f.body}</p>
            </div>
          ))}
        </div>

        {onSelectFirst && (
          <button
            onClick={onSelectFirst}
            className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-600/25 active:scale-[.98]"
          >
            {actionLabel || 'Start with a class'}
            <span className="mdi mdi-arrow-right text-base" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm px-6 py-12 flex flex-col items-center justify-center text-center animate-fade-in">
      <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center', iconBg)}>
        <span className={cn('mdi text-2xl', icon, iconColor)} />
      </div>
      <h2 className="mt-4 text-base font-bold text-gray-900">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-500 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-violet-700 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
        >
          <span className="mdi mdi-refresh" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}