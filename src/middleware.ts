import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const roleRoutes: Record<string, string[]> = {
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
    '/dashboard/audit-logs',
    '/dashboard/settings',
  ],
  PRINCIPAL: [
    '/dashboard',
    '/dashboard/overview',
    '/dashboard/staff',
    '/dashboard/students',
    '/dashboard/classes',
    '/dashboard/academics',
    '/dashboard/payment-approvals',
    '/dashboard/announcements',
    '/dashboard/reports',
  ],
  TEACHER: [
    '/dashboard',
    '/dashboard/my-classes',
    '/dashboard/attendance',
    '/dashboard/grades',
    '/dashboard/assignments',
    '/dashboard/timetable',
    '/dashboard/announcements',
  ],
  STUDENT: [
    '/dashboard',
    '/dashboard/profile',
    '/dashboard/grades',
    '/dashboard/attendance',
    '/dashboard/timetable',
    '/dashboard/assignments',
    '/dashboard/fees',
    '/dashboard/my-classes',
    '/dashboard/announcements',
  ],
  PARENT: [
    '/dashboard',
    '/dashboard/children',
    '/dashboard/grades',
    '/dashboard/timetable',
    '/dashboard/fees',
    '/dashboard/notifications',
  ],
  ACCOUNTANT: [
    '/dashboard',
    '/dashboard/fees',
    '/dashboard/payments',
    '/dashboard/payment-reviews',
    '/dashboard/students',
    '/dashboard/reports',
    '/dashboard/announcements',
  ],
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    const userRole = (req.auth?.user as any)?.role as string

    if (!userRole) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const allowedRoutes = roleRoutes[userRole] || []
    const hasAccess = allowedRoutes.some(route =>
      route === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(route)
    )

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
