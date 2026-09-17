'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, Calendar, Users, GraduationCap, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

export default function ApplyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    classAppliedFor: '',
    password: '',
    confirmPassword: '',
  })

  const update = (key: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email.toLowerCase(),
          password: formData.password,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          classAppliedFor: formData.classAppliedFor,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Application failed')
        return
      }

      setSuccess(data.message || 'Application received! An administrator will review it and approve your account before you can log in.')
      setTimeout(() => router.push('/login'), 4000)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400 bg-white'
  const selectBase =
    'w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 bg-white appearance-none'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gold-100/60 py-10 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-center relative">
          <Link href="/" className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-blue-200 text-sm hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <img src="/school-badge.jpg" alt="School Badge" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-gold-300" />
          <h1 className="font-display text-2xl font-semibold text-white">ICS</h1>
          <p className="text-gold-300 text-xs font-bold tracking-[0.2em] uppercase mt-1">Admission Application</p>
          <p className="text-blue-100/80 text-sm mt-3 max-w-sm mx-auto">
            Apply for a place at Immaculate Conception Seminary. Your application will be reviewed by the school.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div id="apply-error" role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div id="apply-success" role="status" className="mb-5 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
              <span>{success}</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="apply-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <input
                      id="apply-name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={update('name')}
                      className={inputBase}
                      placeholder="e.g. John Michael Obi"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="apply-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <input
                      id="apply-email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={update('email')}
                      className={inputBase}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="apply-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <input
                      id="apply-phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={update('phone')}
                      className={inputBase}
                      placeholder="e.g. 08012345678"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="apply-dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <input
                      id="apply-dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={update('dateOfBirth')}
                      className={inputBase}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="apply-gender" className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                    <select
                      id="apply-gender"
                      value={formData.gender}
                      onChange={update('gender')}
                      className={selectBase}
                      required
                    >
                      <option value="" disabled>Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="apply-class" className="block text-sm font-medium text-gray-700 mb-1">Class Applying For *</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                    <select
                      id="apply-class"
                      value={formData.classAppliedFor}
                      onChange={update('classAppliedFor')}
                      className={selectBase}
                      required
                    >
                      <option value="" disabled>Select class</option>
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="apply-password" className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                    <input
                      id="apply-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={6}
                      value={formData.password}
                      onChange={update('password')}
                      className={inputBase + ' pr-11'}
                      placeholder="Min. 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">At least 6 characters.</p>
                </div>

                <div>
                  <label htmlFor="apply-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                    <input
                      id="apply-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={update('confirmPassword')}
                      className={inputBase + ' pr-11'}
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link>
            {' '}&middot;{' '}
            <Link href="/" className="text-gray-600 hover:underline">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}