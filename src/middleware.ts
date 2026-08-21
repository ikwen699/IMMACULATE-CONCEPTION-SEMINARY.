import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = token.role as string

    const allowedRoutes = roleRoutes[userRole] || []
    const hasAccess = allowedRoutes.some(route =>
      route === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(route)
    )

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
