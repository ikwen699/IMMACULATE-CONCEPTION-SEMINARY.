import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip auth routes themselves
  if (path.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Protect dashboard routes - handle both plain and __Secure- prefixed cookies (production HTTPS)
  if (path.startsWith('/dashboard')) {
    const token =
      request.cookies.get('authjs.session-token') ??
      request.cookies.get('__Secure-authjs.session-token') ??
      request.cookies.get('__Host-authjs.session-token')
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}

// Next.js 16 deprecation alias: `proxy` is the new name for `middleware`
export const proxy = middleware
