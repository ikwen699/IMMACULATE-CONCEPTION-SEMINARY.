'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  School,
  X,
  GraduationCap,
  BookOpen,
  Banknote,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  { icon: <GraduationCap className="w-5 h-5" />, text: 'Live grades & real-time academic progress' },
  { icon: <BookOpen className="w-5 h-5" />, text: 'Assignments, timetables & announcements' },
  { icon: <Banknote className="w-5 h-5" />, text: 'Fees, receipts & payment approvals' },
]

function SchoolBadge({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 rounded-full bg-blue-400/25 blur-xl scale-110" />
      <img
        src="/school-badge.jpg"
        alt="ICS School Badge"
        className="relative w-full h-full rounded-full object-cover ring-[3px] ring-white/30 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
      />
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase(),
        password,
        rememberMe,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'PENDING_APPROVAL') {
          setError('Your account is pending admin approval. Please wait for your account to be activated.')
        } else if (result.error === 'ACCOUNT_INACTIVE') {
          setError('Your account has been deactivated or suspended. Please contact the administrator.')
        } else {
          setError('Invalid email or password. Please check your credentials and try again.')
        }
      } else {
        window.location.href = '/dashboard'
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* â”€â”€ Left brand panel (desktop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="hidden xl:flex w-[44%] relative flex-col overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
        {/* Ambient glow orbs */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-blue-500/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-sky-400/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)]" />

        <div className="relative flex flex-col justify-between h-full p-14 xl:p-16 animate-fade-in">
          <div className="flex flex-col items-center text-center -mt-4">
            <SchoolBadge className="w-40 h-40 mb-6" />
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-blue-100 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md ring-1 ring-white/15 uppercase">
                <School className="w-3.5 h-3.5" aria-hidden="true" />
                Established &middot; Excellence in Education
              </p>
              <h1 className="text-3xl font-extrabold text-white mt-4 leading-[1.15] tracking-wide">
                IMMACULATE CONCEPTION
                <span className="block text-[15px] font-semibold text-blue-200/90 tracking-[0.25em] mt-1.5 uppercase">
                  School Portal
                </span>
              </h1>
            </div>
          </div>

          <div className="my-auto py-10 text-center">
            <h2 className="text-[28px] xl:text-3xl font-bold text-white leading-snug">
              One portal for your
              <br />
              entire school journey.
            </h2>
            <p className="text-blue-100/70 mt-4 text-[15px] leading-relaxed max-w-sm mx-auto">
              Access academic records, attendance, fees and announcements from a single secure
              sign-in â€” no matter your role.
            </p>

            <div className="mt-8 space-y-3 mx-auto max-w-sm">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 text-blue-50 text-left group cursor-default"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/20 text-blue-100 shrink-0 transition-all duration-300 group-hover:bg-white/15 group-hover:ring-white/30 group-hover:scale-105">
                    {f.icon}
                  </span>
                  <p className="text-sm font-medium transition-colors duration-200 group-hover:text-white">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs text-blue-200/50 text-center pt-6 border-t border-white/[0.08]">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Main Campus, Nigeria
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" /> +234 (0) 000 000 0000
              </span>
            </div>
            <p className="text-blue-200/40">&copy; 2026 Immaculate Conception School. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Form panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 xl:py-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile / tablet: compact brand header */}
          <div className="flex flex-col items-center mb-8 xl:hidden animate-fade-in">
            <div className="relative w-full rounded-b-3xl bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 px-6 pt-8 pb-12 overflow-hidden shadow-lg">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.25)_100%)]" />
              <div className="relative flex flex-col items-center text-center">
                <SchoolBadge className="w-24 h-24 sm:w-28 sm:h-28 mb-4" />
                <h1 className="text-lg font-extrabold text-white leading-tight text-center tracking-wide">
                  IMMACULATE CONCEPTION
                  <span className="block text-[11px] font-semibold text-blue-200/80 tracking-[0.25em] mt-1.5 uppercase">
                    School Portal
                  </span>
                </h1>
                <p className="text-sm text-blue-100/80 mt-3 font-medium">Sign in to continue</p>
              </div>
            </div>
          </div>

          {/* Desktop card header */}
          <div className="hidden xl:block mb-7 animate-fade-in">
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">Welcome back</h1>
            <p className="text-gray-400 mt-1.5 text-[15px]">
              Sign in to your account to continue.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div id="login-error" className="mb-5 flex items-start gap-3 p-4 bg-red-50/80 border border-red-200/80 rounded-2xl text-red-700 text-sm animate-slide-in-top shadow-sm" role="alert">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0" aria-hidden="true">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <span className="flex-1 pt-1">{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className="shrink-0 text-red-300 hover:text-red-600 transition-colors p-1 -m-1 rounded-lg hover:bg-red-100"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" noValidate>
            <div>
              <label htmlFor="email" className="block text-[13px] font-semibold text-gray-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                  className={cn(
                    'w-full pl-11 pr-11 py-3 rounded-2xl border border-gray-200/80 outline-none transition-all duration-200 text-[15px] text-gray-800 placeholder-gray-400',
                    'bg-gray-50/50 focus:bg-white',
                    email && !loading
                      ? 'border-green-300/60 focus:border-green-400 focus:ring-4 focus:ring-green-100/80'
                      : 'focus:border-blue-400 focus:ring-4 focus:ring-blue-100/80 hover:border-gray-300'
                  )}
                  placeholder="you@example.com"
                  required
                />
                {email && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400" aria-hidden="true">
                    <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[13px] font-semibold text-gray-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-medium text-blue-500 hover:text-blue-700 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="w-full pl-11 pr-11 py-3 rounded-2xl border border-gray-200/80 bg-gray-50/50 outline-none transition-all duration-200 text-[15px] text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100/80 hover:border-gray-300"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group min-w-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  className={cn(
                    'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shrink-0',
                    rememberMe
                      ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-200'
                      : 'border-gray-300 bg-white group-hover:border-blue-400'
                  )}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-gray-500 whitespace-nowrap">Remember me</span>
              </label>

              <span className="text-[13px] text-gray-400 flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400/80" aria-hidden="true" />
                Secure sign-in
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-semibold text-[15px] text-white transition-all duration-200',
                loading
                  ? 'bg-blue-400 cursor-not-allowed shadow-lg shadow-blue-200/50'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.985] shadow-lg shadow-blue-200/60 hover:shadow-xl hover:shadow-blue-300/60'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-gray-200/80" />
            <span className="text-[11px] text-gray-500 font-semibold tracking-wide uppercase">New here?</span>
            <div className="flex-1 h-px bg-gray-200/80" />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-200 inline-flex items-center gap-1 group"
              >
                Create Account
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
