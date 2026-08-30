'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalParents: number
  totalPayments: number
  totalRevenue: number
  pendingPayments: number
  approvedPayments: number
  rejectedPayments: number
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  PRINCIPAL_APPROVED: '#3b82f6',
  ACCOUNTANT_REVIEWED: '#f59e0b',
  SUBMITTED: '#8b5cf6',
  REJECTED: '#ef4444',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color || entry.fill }}>
          {entry.name}: {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('rate')
            ? `${entry.value}%`
            : entry.name?.toLowerCase().includes('revenue') || entry.name?.toLowerCase().includes('amount')
              ? `$${entry.value.toLocaleString()}`
              : entry.value}
        </p>
      ))}
    </div>
  )
}

const QUICK_ACTIONS = [
  { label: 'Academic Report', icon: 'mdi-school', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', href: '/dashboard/academics' },
  { label: 'Financial Report', icon: 'mdi-cash-multiple', color: 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200', href: '/dashboard/payment-approvals' },
  { label: 'Enrollment Trends', icon: 'mdi-chart-timeline-variant', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', href: '/dashboard/overview' },
  { label: 'Student Records', icon: 'mdi-account-details', color: 'bg-amber-100 text-amber-600 hover:bg-amber-200', href: '/dashboard/students' },
]

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const principalName = user?.name?.split(' ')[0] || 'Principal'

  const [stats, setStats] = useState<SchoolStats>({
    totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalParents: 0,
    totalPayments: 0, totalRevenue: 0, pendingPayments: 0, approvedPayments: 0, rejectedPayments: 0,
  })
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true)
    setError(false)
    try {
      const [studentsRes, teachersRes, classesRes, parentsRes, paymentsRes] = await Promise.all([
        fetch('/api/users?role=STUDENT', { cache: 'no-store' }),
        fetch('/api/users?role=TEACHER', { cache: 'no-store' }),
        fetch('/api/classes', { cache: 'no-store' }),
        fetch('/api/users?role=PARENT', { cache: 'no-store' }),
        fetch('/api/payments', { cache: 'no-store' }),
      ])

      const students = studentsRes.ok ? await studentsRes.json() : []
      const teachers = teachersRes.ok ? await teachersRes.json() : []
      const classes = classesRes.ok ? await classesRes.json() : []
      const parents = parentsRes.ok ? await parentsRes.json() : []
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : []

      setPayments(Array.isArray(paymentsData) ? paymentsData : [])
      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalParents: parents.length,
        totalPayments: paymentsData.length,
        totalRevenue: paymentsData
          .filter((p: any) => p.status === 'PRINCIPAL_APPROVED' || p.status === 'COMPLETED')
          .reduce((sum: number, p: any) => sum + p.amount, 0),
        pendingPayments: paymentsData.filter((p: any) => p.status === 'SUBMITTED' || p.status === 'ACCOUNTANT_REVIEWED').length,
        approvedPayments: paymentsData.filter((p: any) => p.status === 'PRINCIPAL_APPROVED' || p.status === 'COMPLETED').length,
        rejectedPayments: paymentsData.filter((p: any) => p.status === 'REJECTED').length,
      })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { if (status !== 'authenticated') return;
    fetchData() }, [fetchData, status])

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  const peoplePieData = [
    { name: 'Students', value: stats.totalStudents },
    { name: 'Teachers', value: stats.totalTeachers },
    { name: 'Parents', value: stats.totalParents },
    { name: 'Classes', value: stats.totalClasses },
  ].filter(d => d.value > 0)

  const paymentStatusData = [
    { name: 'Approved', value: stats.approvedPayments, fill: '#10b981' },
    { name: 'Pending', value: stats.pendingPayments, fill: '#f59e0b' },
    { name: 'Rejected', value: stats.rejectedPayments, fill: '#ef4444' },
  ].filter(d => d.value > 0)

  const financialBarData = [
    { name: 'Revenue', amount: stats.totalRevenue },
    { name: 'Pending', amount: stats.pendingPayments * 100 },
  ]

  const summaryCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: 'mdi-school', color: 'bg-blue-100 text-blue-600', ringColor: 'ring-blue-600/10' },
    { label: 'Total Teachers', value: stats.totalTeachers, icon: 'mdi-account-school', color: 'bg-emerald-100 text-emerald-600', ringColor: 'ring-emerald-600/10' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: 'mdi-cash', color: 'bg-purple-100 text-purple-600', ringColor: 'ring-purple-600/10' },
    { label: 'Pending Approvals', value: stats.pendingPayments, icon: 'mdi-clock-outline', color: 'bg-amber-100 text-amber-600', ringColor: 'ring-amber-600/10' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="mdi mdi-chart-bar text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}, {principalName}
              </h1>
              <p className="text-sm text-gray-500">
                {format(today, 'EEEE, MMMM d, yyyy')} &middot; Reports &amp; analytics
              </p>
            </div>
          </div>
          {!loading && stats.totalPayments > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
                <span className="mdi mdi-check-circle text-base" />
                ${stats.totalRevenue.toLocaleString()} revenue
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg font-medium">
                <span className="mdi mdi-clock-outline text-base" />
                {stats.pendingPayments} pending
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="mdi mdi-alert-circle-outline text-3xl text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Failed to load reports</p>
                <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
              </div>
              <button onClick={fetchData} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <span className="mdi mdi-refresh" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center ring-1 ring-inset', stat.color, stat.ringColor)}>
                      <span className={cn('mdi text-xl', stat.icon)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row 1: People pie + Payment status pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* People distribution */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-account-group text-blue-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">People Distribution</h2>
                </div>
                {peoplePieData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-gray-500">No data</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={peoplePieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                          {peoplePieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {peoplePieData.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {peoplePieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.name}: {d.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment status breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-credit-card-check text-emerald-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Payment Status</h2>
                </div>
                {paymentStatusData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-gray-500">No payments yet</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentStatusData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                          {paymentStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {paymentStatusData.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {paymentStatusData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                        {d.name}: {d.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Charts row 2: Enrollment bar + Financial summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrollment bar chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-chart-bar text-purple-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Enrollment Summary</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Students', count: stats.totalStudents, fill: '#3b82f6' },
                      { name: 'Teachers', count: stats.totalTeachers, fill: '#10b981' },
                      { name: 'Classes', count: stats.totalClasses, fill: '#8b5cf6' },
                      { name: 'Parents', count: stats.totalParents, fill: '#f59e0b' },
                    ]} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]} barSize={40}>
                        {[
                          { fill: '#3b82f6' },
                          { fill: '#10b981' },
                          { fill: '#8b5cf6' },
                          { fill: '#f59e0b' },
                        ].map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial summary card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="mdi mdi-cash-multiple text-emerald-500 text-lg" />
                  <h2 className="font-semibold text-gray-900">Financial Summary</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: 'mdi-cash-check', color: 'bg-emerald-100 text-emerald-600' },
                    { label: 'Total Transactions', value: stats.totalPayments, icon: 'mdi-receipt-text', color: 'bg-blue-100 text-blue-600' },
                    { label: 'Approved Payments', value: stats.approvedPayments, icon: 'mdi-check-decagram', color: 'bg-indigo-100 text-indigo-600' },
                    { label: 'Pending Payments', value: stats.pendingPayments, icon: 'mdi-clock-outline', color: 'bg-amber-100 text-amber-600' },
                    { label: 'Rejected Payments', value: stats.rejectedPayments, icon: 'mdi-close-circle', color: 'bg-red-100 text-red-600' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.color)}>
                          <span className={cn('mdi text-base', item.icon)} />
                        </div>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="mdi mdi-lightning-bolt text-amber-500 text-lg" />
                <h2 className="font-semibold text-gray-900">Report Actions</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn('p-4 rounded-xl text-left transition-all duration-200 hover:shadow-sm group', action.color)}
                  >
                    <span className={cn('mdi text-2xl block mb-2 group-hover:scale-110 transition-transform', action.icon)} />
                    <p className="text-xs font-semibold">{action.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
