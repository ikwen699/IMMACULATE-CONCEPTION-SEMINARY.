'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, LayoutDashboard, LogIn } from 'lucide-react'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Academics', href: '#academics' },
  { label: 'Features', href: '#features' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16 md:h-18">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src="/school-badge.jpg"
            alt="ICS Badge"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30 shadow-sm"
          />
          <span
            className={`font-bold text-sm tracking-wide transition-colors ${
              scrolled ? 'text-gray-900' : 'text-white'
            }`}
          >
            ICS
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scrolled
                    ? 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  scrolled
                    ? 'text-blue-700 hover:bg-blue-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
              >
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg animate-slide-in-top">
          <div className="px-5 py-4 space-y-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
