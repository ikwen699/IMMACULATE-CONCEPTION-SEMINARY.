'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface ProfileData {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  role: string
  student?: {
    admissionNo: string
    dateOfBirth?: string
    gender?: string
    enrollmentDate?: string
    class?: { name: string; section?: string }
    parent?: {
      user: { name: string; phone?: string; email: string }
    }
  }
  teacher?: {
    employeeId?: string
    department?: string
    qualification?: string
  }
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-gray-500">Profile not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500">View and manage your profile information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-gray-800 text-3xl font-semibold mx-auto">
                {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mt-4">{profile.name}</h2>
              <p className="text-gray-500">{profile.student?.admissionNo || profile.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                {profile.student?.class ? `${profile.student.class.name}${profile.student.class.section ? ` - ${profile.student.class.section}` : ''}` : 'No class assigned'}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{profile.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Gender:</span>
                  <span className="font-medium">{profile.student?.gender || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Date of Birth:</span>
                  <span className="font-medium">
                    {profile.student?.dateOfBirth ? new Date(profile.student.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                  <p className="font-medium text-gray-800">{profile.name}</p>
                </div>
                {profile.role === 'STUDENT' && (
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Admission Number</label>
                    <p className="font-medium text-gray-800">{profile.student?.admissionNo || 'N/A'}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Email Address</label>
                  <p className="font-medium text-gray-800">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Phone Number</label>
                  <p className="font-medium text-gray-800">{profile.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Address</label>
                  <p className="font-medium text-gray-800">{profile.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Enrollment Date</label>
                  <p className="font-medium text-gray-800">
                    {profile.student?.enrollmentDate ? new Date(profile.student.enrollmentDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {profile.student?.parent && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent/Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Name</label>
                    <p className="font-medium text-gray-800">{profile.student.parent.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Email</label>
                    <p className="font-medium text-gray-800">{profile.student.parent.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Phone</label>
                    <p className="font-medium text-gray-800">{profile.student.parent.user?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
