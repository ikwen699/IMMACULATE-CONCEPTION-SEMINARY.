'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Users, UserCog, ShieldCheck, Settings, Banknote, Mail, Lock } from 'lucide-react'

type LoginRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'PRINCIPAL' | 'ADMIN' | 'ACCOUNTANT'

const roleConfig: Record<LoginRole, { icon: React.ReactNode; title: string; message: string }> = {
  STUDENT: {
    icon: <GraduationCap className="w-10 h-10 text-blue-600" />,
    title: 'Student Portal',
    message: 'Access your academic information, grades, and assignments',
  },
  PARENT: {
    icon: <Users className="w-10 h-10 text-blue-600" />,
    title: 'Parent Portal',
    message: 'Monitor your child\'s progress, fees, and school activities',
  },
  TEACHER: {
    icon: <UserCog className="w-10 h-10 text-blue-600" />,
    title: 'Teacher Portal',
    message: 'Manage your classes, attendance, grades, and assignments',
  },
  PRINCIPAL: {
    icon: <ShieldCheck className="w-10 h-10 text-blue-600" />,
    title: 'Principal Portal',
    message: 'Oversee school operations, staff, and academic performance',
  },
  ADMIN: {
    icon: <Settings className="w-10 h-10 text-blue-600" />,
    title: 'Admin Portal',
    message: 'Manage portal settings, users, and school records',
  },
  ACCOUNTANT: {
    icon: <Banknote className="w-10 h-10 text-blue-600" />,
    title: 'Accountant Portal',
    message: 'Manage school fees, payments, and financial reports',
  },
}

const roles: LoginRole[] = ['STUDENT', 'PARENT', 'TEACHER', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT']

const roleTabIcons: Record<LoginRole, React.ReactNode> = {
  STUDENT: <GraduationCap className="w-4 h-4 inline mr-1" />,
  PARENT: <Users className="w-4 h-4 inline mr-1" />,
  TEACHER: <UserCog className="w-4 h-4 inline mr-1" />,
  PRINCIPAL: <ShieldCheck className="w-4 h-4 inline mr-1" />,
  ADMIN: <Settings className="w-4 h-4 inline mr-1" />,
  ACCOUNTANT: <Banknote className="w-4 h-4 inline mr-1" />,
}

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<LoginRole>('STUDENT')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const config = roleConfig[selectedRole]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-blue-200 py-8 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <img src="/school-badge.jpg" alt="School Badge" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-white" />
          <h1 className="text-xl font-bold text-white">IMMACULATE CONCEPTION SEMINARY</h1>
          <p className="text-blue-100 text-sm mt-1">School Portal</p>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => { setSelectedRole(role); setError(''); setEmail(''); setPassword('') }}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedRole === role
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {roleTabIcons[role]}
                {role === 'STUDENT' ? 'Student' :
                 role === 'PARENT' ? 'Parent' :
                 role === 'TEACHER' ? 'Teacher' :
                 role === 'PRINCIPAL' ? 'Principal' :
                 role === 'ADMIN' ? 'Admin' : 'Accountant'}
              </button>
            ))}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
