'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, UserCog, ShieldCheck, Mail, Lock, Phone, User, Calendar, Building, Award, Users, Banknote, Eye, EyeOff } from 'lucide-react'

type RegistrationRole = 'STUDENT' | 'TEACHER' | 'PARENT' | 'PRINCIPAL' | 'ADMIN' | 'ACCOUNTANT'

const roleConfig: Record<RegistrationRole, { icon: React.ReactNode; title: string; message: string }> = {
  STUDENT: {
    icon: <GraduationCap className="w-10 h-10 text-blue-600" />,
    title: 'Student Registration',
    message: 'Apply for admission as a new student',
  },
  PARENT: {
    icon: <Users className="w-10 h-10 text-blue-600" />,
    title: 'Parent Registration',
    message: 'Register as a parent/guardian',
  },
  TEACHER: {
    icon: <UserCog className="w-10 h-10 text-blue-600" />,
    title: 'Teacher Registration',
    message: 'Register as a new teacher',
  },
  PRINCIPAL: {
    icon: <ShieldCheck className="w-10 h-10 text-blue-600" />,
    title: 'Principal Registration',
    message: 'Register as a principal',
  },
  ADMIN: {
    icon: <ShieldCheck className="w-10 h-10 text-blue-600" />,
    title: 'Admin Registration',
    message: 'Create an admin account',
  },
  ACCOUNTANT: {
    icon: <Banknote className="w-10 h-10 text-blue-600" />,
    title: 'Accountant Registration',
    message: 'Register as an accountant',
  },
}

export default function RegisterPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>('STUDENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: 'MALE',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    department: '',
    qualification: '',
    occupation: '',
  })

  const config = roleConfig[selectedRole]

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: selectedRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setSuccess(data.message || 'Registration successful! Please wait for admin approval.')
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <img src="/school-badge.jpg" alt="School Badge" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-white" />
          <h1 className="text-xl font-bold text-white">ICS</h1>
          <p className="text-blue-100 text-sm mt-1">Create Your Account</p>
        </div>

        <div className="border-b border-gray-200">
          <div className="grid grid-cols-3 gap-1 p-2">
            {(['STUDENT', 'PARENT', 'TEACHER', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT'] as RegistrationRole[]).map((role) => {
              const r = roleConfig[role]
              const active = selectedRole === role
              return (
                <button
                  key={role}
                  onClick={() => { setSelectedRole(role); setError(''); setSuccess('') }}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'text-blue-600 bg-blue-50 border border-blue-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <span className="scale-75">{r.icon}</span>
                  <span>{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">{config.icon}</div>
            <h2 className="text-lg font-semibold text-gray-800">{config.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{config.message}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-11 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                    placeholder="Min. 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-11 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {selectedRole === 'STUDENT' && (
              <>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-3">Student Information</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-3">Parent/Guardian Information</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                      placeholder="Enter parent/guardian name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                      placeholder="Enter parent/guardian email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                      placeholder="Enter parent/guardian phone"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'TEACHER' && (
              <>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-3">Teaching Information</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                      placeholder="e.g., Mathematics, Science"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                      placeholder="e.g., B.Sc, M.Ed"
                    />
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'PARENT' && (
              <>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-3">Parent Information</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                      placeholder="e.g., Engineer, Doctor"
                    />
                  </div>
                </div>
              </>
            )}

            {(selectedRole === 'PRINCIPAL' || selectedRole === 'ADMIN' || selectedRole === 'ACCOUNTANT') && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-3">
                  {selectedRole === 'PRINCIPAL' && 'Principal Registration'}
                  {selectedRole === 'ADMIN' && 'Admin Registration'}
                  {selectedRole === 'ACCOUNTANT' && 'Accountant Registration'}
                </p>
                <p className="text-xs text-gray-400">
                  Complete the basic information above to register.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
