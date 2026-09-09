'use client'

interface EmptyStateProps {
  icon: string
  iconBg: string
  iconColor: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon, iconBg, iconColor, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center`}>
          <span className={`${iconColor} text-3xl mdi ${icon}`} />
        </div>
        <div>
          <p className="font-medium text-gray-700">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        {actionLabel && onAction && (
          <button onClick={onAction}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
            <span className="mdi mdi-refresh" /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}