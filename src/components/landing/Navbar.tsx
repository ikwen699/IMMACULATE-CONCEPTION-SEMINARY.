'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { site } from '@/lib/site'

const links = [
  { id: 'about', label: 'About' },
  { id: 'academics', label: 'Academics' },
  { id: 'features', label: 'Features' },
  { id: 'campus-life', label: 'Campus Life' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
]

export default function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = links.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[]
    if (!sections.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="absolute top-0 left-0 h-[2px] bg-blue-400 transition-all duration-150" style={{ width: `${progress}%` }} />

      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16 md:h-[72px]">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src={site.images.badge}
            alt="ICS Badge"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30 shadow-sm"
          />
          <div className="hidden min-[400px]:flex flex-col leading-none">
            <span
              className={cn(
                'font-bold text-[13px] tracking-wide transition-colors',
                scrolled ? 'text-gray-900' : 'text-white'
              )}
            >
              Immaculate Conception
            </span>
            <span
              className={cn(
                'text-[9px] font-bold tracking-[0.2em] uppercase transition-colors',
                scrolled ? 'text-blue-600' : 'text-blue-300'
              )}
            >
              Seminary
            </span>
          </div>
        </Link>

        <ul className="hidden lg:flex items-center gap-0.5">
          {links.map((l) => {
            const isActive = active === l.id
            return (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className={cn(
                    'relative px-3 py-2 text-sm font-medium transition-colors',
                    scrolled
                      ? isActive
                        ? 'text-blue-700'
                        : 'text-gray-500 hover:text-gray-900'
                      : isActive
                        ? 'text-blue-300'
                        : 'text-white/70 hover:text-white'
                  )}
                >
                  {l.label}
                  <span
                    className={cn(
                      'absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-blue-500 transition-all duration-300',
                      isActive ? 'w-full opacity-100' : 'w-0 opacity-0'
                    )}
                  />
                </a>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors shadow-lg shadow-blue-800/25"
            >
              <LogIn className="w-4 h-4" />
              Sign In to the Portal
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn(
                'hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                scrolled
                  ? 'text-blue-700 hover:bg-blue-50'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              )}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
          <Link
            href="/apply"
            className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-xl bg-gold-cta text-black text-sm font-semibold hover:bg-gold-cta-hover transition-colors shadow-lg shadow-black/30"
          >
            Apply for Admission
          </Link>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
              'lg:hidden p-2 rounded-lg transition-colors',
              scrolled
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-white hover:bg-white/10'
            )}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-t border-gray-100 shadow-2xl animate-slide-in-top">
          <div className="px-5 py-5 space-y-1 max-h-[70vh] overflow-y-auto">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active === l.id
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
                  isAuthenticated
                    ? 'bg-blue-800 text-white'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors'
                )}
              >
                <LogIn className="w-4 h-4" />
                {isAuthenticated ? 'Sign In to the Portal' : 'Sign In'}
              </Link>
              <Link
                href="/apply"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-gold-cta text-black text-sm font-semibold"
              >
                Apply for Admission
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
