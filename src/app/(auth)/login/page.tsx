'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Users,
  UserCog,
  ShieldCheck,
  Settings,
  BookOpen,
  Banknote,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Check,
  MapPin,
  Phone,
  School,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_DASHBOARD_MAP: Record<LoginRole, string> = {
  STUDENT: '/dashboard/students',
  PARENT: '/dashboard/children',
  TEACHER: '/dashboard/my-classes',
  PRINCIPAL: '/dashboard/overview',
  ADMIN: '/dashboard/users',
  ACCOUNTANT: '/dashboard/fees',
}

type LoginRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'PRINCIPAL' | 'ADMIN' | 'ACCOUNTANT'

const roleConfig: Record<LoginRole, { icon: React.ReactNode; title: string; message: string; label: string }> = {
  STUDENT: {
    icon: <GraduationCap className="w-5 h-5" />,
    title: 'Student Portal',
    message: 'Access your grades, assignments & academic records',
    label: 'Student',
  },
  PARENT: {
    icon: <Users className="w-5 h-5" />,
    title: 'Parent Portal',
    message: 'Monitor your child\'s progress, fees & activities',
    label: 'Parent',
  },
  TEACHER: {
    icon: <UserCog className="w-5 h-5" />,
    title: 'Teacher Portal',
    message: 'Manage classes, attendance, grades & assignments',
    label: 'Teacher',
  },
  PRINCIPAL: {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Principal Portal',
    message: 'Oversee operations, staff & academic performance',
    label: 'Principal',
  },
  ADMIN: {
    icon: <Settings className="w-5 h-5" />,
    title: 'Admin Portal',
    message: 'Manage users, settings & school records',
    label: 'Admin',
  },
  ACCOUNTANT: {
    icon: <Banknote className="w-5 h-5" />,
    title: 'Accountant Portal',
    message: 'Manage fees, payments & financial reports',
    label: 'Accountant',
  },
}

const roles: LoginRole[] = ['STUDENT', 'PARENT', 'TEACHER', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT']

const features = [
  { icon: <GraduationCap className="w-5 h-5" />, text: 'Live grades & real-time academic progress' },
  { icon: <BookOpen className="w-5 h-5" />, text: 'Assignments, timetables & announcements' },
  { icon: <Banknote className="w-5 h-5" />, text: 'Fees, receipts & payment approvals' },
]

function SchoolBadge({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Glow ring behind the badge */}
      <div className="absolute inset-0 rounded-full bg-white/20 blur-xl scale-110" />
      <img
        src="/school-badge.jpg"
        alt="ICS School Badge"
        className="relative w-full h-full rounded-full object-cover ring-4 ring-white/40 shadow-2xl"
      />
      <div className="absolute inset-0 rounded-full ring-1 ring-white/50" />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<LoginRole>('STUDENT')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const config = roleConfig[selectedRole]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
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
        const callbackUrl = ROLE_DASHBOARD_MAP[selectedRole] || '/dashboard'
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Left brand panel (desktop) ─────────────────────────────── */}
      <div className="hidden xl:flex w-[44%] relative flex-col overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950">
        {/* Decorative elements */}
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[26rem] h-[26rem] bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-16 w-56 h-56 bg-sky-400/10 rounded-full blur-2xl" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative flex flex-col justify-between h-full p-14 xl:p-16 animate-fade-in">
          {/* Top: brand identity with prominent badge */}
          <div className="flex flex-col items-center text-center -mt-6">
            <SchoolBadge className="w-40 h-40 mb-6" />
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur">
                <School className="w-3.5 h-3.5" />
                ESTABLISHED &middot; EXCELLENCE IN EDUCATION
              </p>
              <h1 className="text-3xl font-bold text-white mt-3 leading-tight tracking-wide">
                IMMACULATE CONCEPTION
                <span className="block text-lg font-semibold text-sky-300 tracking-[0.3em] mt-1">
                  SCHOOL PORTAL
                </span>
              </h1>
            </div>
          </div>

          {/* Middle: messaging + features */}
          <div className="my-auto py-10 text-center">
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              One portal for your
              <br />
              entire school journey.
            </h2>
            <p className="text-blue-100/80 mt-4 text-base leading-relaxed max-w-md mx-auto">
              Access academic records, attendance, fees and announcements from a single secure
              sign-in — no matter your role.
            </p>

            <div className="mt-10 space-y-4 mx-auto max-w-sm">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 text-blue-50 text-left animate-fade-in"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/15 text-sky-300 shrink-0">
                    {f.icon}
                  </span>
                  <p className="text-sm font-medium">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: contact + copyright */}
          <div className="flex flex-col gap-3 text-xs text-blue-200/80 text-center">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Main Campus, Nigeria
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> +234 (0) 000 000 0000
              </span>
            </div>
            <p>&copy; {new Date().getFullYear()} Immaculate Conception School. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* ── Form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile / tablet: compact brand header with badge */}
          <div className="flex flex-col items-center mb-8 xl:hidden animate-fade-in">
            <SchoolBadge className="w-28 h-28 mb-4" />
            <h1 className="text-lg font-bold text-blue-900 leading-tight text-center tracking-wide">
              IMMACULATE CONCEPTION
              <span className="block text-xs font-semibold text-blue-600 tracking-[0.3em] mt-1">
                SCHOOL PORTAL
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-3">Sign in to continue</p>
          </div>

          {/* Desktop card header */}
          <div className="hidden xl:block mb-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back 👋</h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              Sign in to your {config.title.toLowerCase()} to continue.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-slide-in-top" role="alert">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Role selector */}
          <div className="mb-6 animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Continue as
            </p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => {
                const r = roleConfig[role]
                const active = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    aria-pressed={active}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 text-xs font-medium transition-all duration-200',
                      active
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-600'
                    )}
                  >
                    <span className={cn('transition-colors', active ? 'text-blue-600' : 'text-gray-400')}>
                      {r.icon}
                    </span>
                    <span className="truncate w-full text-center">{r.label}</span>
                    {active && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex items-start gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl animate-scale-in">
              <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                {config.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{config.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{config.message}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    'w-full pl-11 pr-11 py-3 rounded-xl border-2 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400',
                    'bg-white focus:bg-white',
                    email && !loading
                      ? 'border-green-200 focus:border-green-400 focus:ring-4 focus:ring-green-100'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  )}
                  placeholder="you@example.com"
                  required
                />
                {email && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500">
                    <Check className="w-5 h-5" strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-gray-200 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0',
                    rememberMe
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 bg-white group-hover:border-blue-400'
                  )}
                >
                  {rememberMe && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </button>
                <span className="text-sm text-gray-600">Remember me</span>
              </label>

              <span className="text-xs text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Secure sign-in
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg',
                loading
                  ? 'bg-blue-400 cursor-not-allowed shadow-blue-200'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-blue-200 hover:shadow-blue-300'
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
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">NEW HERE?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-blue-600 font-semibold hover:text-blue-800 transition-colors inline-flex items-center gap-1 group"
              >
                Create Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
