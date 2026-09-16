'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export default function StatCounter({
  end,
  suffix = '',
  label,
  icon,
  className,
}: {
  end: number
  suffix?: string
  label: string
  icon?: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        io.disconnect()
        if (reduced) {
          setValue(end)
          return
        }
        const duration = 1600
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration)
          const eased = 1 - Math.pow(1 - p, 3)
          setValue(Math.round(end * eased))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [end])

  return (
    <div ref={ref} className={cn('text-center', className)}>
      {icon && (
        <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-xl bg-white/10 ring-1 ring-white/20 text-gold-300">
          {icon}
        </div>
      )}
      <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
        {value.toLocaleString()}
        {suffix}
      </p>
      <p className="text-xs text-blue-200/60 mt-1 font-medium tracking-wide uppercase">
        {label}
      </p>
    </div>
  )
}
