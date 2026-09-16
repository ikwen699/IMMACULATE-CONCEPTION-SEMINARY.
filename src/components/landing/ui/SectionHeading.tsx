import { cn } from '@/lib/utils'

export default function SectionHeading({
  eyebrow,
  title,
  sub,
  align = 'center',
  dark = false,
  className,
}: {
  eyebrow: string
  title: string
  sub?: string
  align?: 'center' | 'left'
  dark?: boolean
  className?: string
}) {
  return (
    <div className={cn('mb-14 md:mb-16', align === 'center' && 'text-center', className)}>
      <span
        className={cn(
          'inline-block text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5',
          dark
            ? 'text-gold-300 bg-gold-400/10 ring-1 ring-gold-400/20'
            : 'text-gold-700 bg-gold-50 ring-1 ring-gold-200'
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          'font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold leading-tight tracking-tight',
          dark ? 'text-white' : 'text-gray-900'
        )}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={cn(
            'mt-4 text-[15px] leading-relaxed max-w-2xl',
            align === 'center' && 'mx-auto',
            dark ? 'text-blue-200/70' : 'text-gray-500'
          )}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
