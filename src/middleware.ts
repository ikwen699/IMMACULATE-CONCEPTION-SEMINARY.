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

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

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
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
