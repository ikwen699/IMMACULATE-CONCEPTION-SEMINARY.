import Link from 'next/link'
import { cn } from '@/lib/utils'

const variants = {
  primary:
    'bg-blue-800 text-white hover:bg-blue-900 shadow-lg shadow-blue-800/25 hover:shadow-xl hover:shadow-blue-900/30',
  gold: 'bg-gold-cta text-white hover:bg-gold-cta-hover shadow-lg shadow-gold-800/30',
  outline:
    'ring-1 ring-white/25 text-white bg-white/10 hover:bg-white/15 backdrop-blur-md',
  ghost: 'text-white/80 hover:text-white hover:bg-white/10',
}

const sizes = {
  sm: 'px-4 py-2 text-sm gap-1.5 rounded-xl',
  md: 'px-6 py-2.5 text-sm gap-2 rounded-2xl',
  lg: 'px-8 py-3.5 text-[15px] gap-2.5 rounded-2xl',
}

export default function Button({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: {
  href: string
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
  children: React.ReactNode
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.97]',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  )
}
