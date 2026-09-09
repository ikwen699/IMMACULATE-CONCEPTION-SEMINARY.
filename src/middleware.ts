import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const ROLE_ROUTES: Record<string, string[]> = {
  ADMIN: [
    '/dashboard',
    '/dashboard/users',
    '/dashboard/approvals',
    '/dashboard/students',
    '/dashboard/teachers',
    '/dashboard/classes',
    '/dashboard/subjects',
    '/dashboard/sessions',
    '/dashboard/announcements',
    '/dashboard/settings',
    '/dashboard/audit-logs',
    '/dashboard/profile',
    '/dashboard/notifications',
    '/dashboard/fees',
    '/dashboard/payments',
    '/dashboard/grades',
    '/dashboard/attendance',
    '/dashboard/assignments',
    '/dashboard/timetable',
    '/dashboard/my-classes',
    '/dashboard/results',
    '/dashboard/payment-reviews',
    '/dashboard/payment-approvals',
    '/dashboard/children',
    '/dashboard/reports',
  ],
  PRINCIPAL: [
    '/dashboard',
    '/dashboard/overview',
    '/dashboard/staff',
    '/dashboard/students',
    '/dashboard/classes',
    '/dashboard/academics',
    '/dashboard/grades',
    '/dashboard/results',
    '/dashboard/payment-approvals',
    '/dashboard/announcements',
    '/dashboard/reports',
    '/dashboard/profile',
    '/dashboard/notifications',
    '/dashboard/fees',
    '/dashboard/attendance',
    '/dashboard/assignments',
    '/dashboard/timetable',
    '/dashboard/my-classes',
    '/dashboard/subjects',
    '/dashboard/sessions',
  ],
  TEACHER: [
    '/dashboard',
    '/dashboard/my-classes',
    '/dashboard/results',
    '/dashboard/grades',
    '/dashboard/attendance',
    '/dashboard/timetable',
    '/dashboard/assignments',
    '/dashboard/announcements',
    '/dashboard/profile',
    '/dashboard/notifications',
    '/dashboard/payments',
  ],
  STUDENT: [
    '/dashboard',
    '/dashboard/profile',
    '/dashboard/my-classes',
    '/dashboard/grades',
    '/dashboard/assignments',
    '/dashboard/timetable',
    '/dashboard/fees',
    '/dashboard/announcements',
    '/dashboard/notifications',
  ],
  PARENT: [
    '/dashboard',
    '/dashboard/children',
    '/dashboard/grades',
    '/dashboard/fees',
    '/dashboard/notifications',
    '/dashboard/profile',
    '/dashboard/announcements',
  ],
  ACCOUNTANT: [
    '/dashboard',
    '/dashboard/fees',
    '/dashboard/payments',
    '/dashboard/payment-reviews',
    '/dashboard/students',
    '/dashboard/reports',
    '/dashboard/announcements',
    '/dashboard/profile',
    '/dashboard/notifications',
  ],
}

const ADMIN_ONLY = ['/dashboard/users', '/dashboard/approvals', '/dashboard/settings', '/dashboard/audit-logs', '/dashboard/teachers']

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/dashboard',
  PRINCIPAL: '/dashboard/overview',
  TEACHER: '/dashboard/results',
  ACCOUNTANT: '/dashboard/payment-reviews',
  STUDENT: '/dashboard/grades',
  PARENT: '/dashboard/children',
}

const RATE_LIMITED_ROUTES = ['/api/auth/register', '/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/signin']
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string, path: string): boolean {
  const key = `${ip}:${path}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX) {
    return false
  }
  return true
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith('/api/auth/')) {
    const isRateLimited = RATE_LIMITED_ROUTES.some((route) => path.startsWith(route))
    if (isRateLimited && request.method === 'POST') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      if (!rateLimit(ip, path)) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
      }
    }
    return NextResponse.next()
  }

  if (path.startsWith('/dashboard')) {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const role = (token as any).role as string
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const allowedRoutes = ROLE_ROUTES[role]
    const isAllowed = allowedRoutes.some((r) => path === r || path.startsWith(r + '/'))

    if (!isAllowed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Route users to their role-specific dashboard when hitting the generic /dashboard
    if (path === '/dashboard') {
      const home = ROLE_HOME[role]
      if (home && home !== '/dashboard') {
        return NextResponse.redirect(new URL(home, request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/auth/:path*'],
}
