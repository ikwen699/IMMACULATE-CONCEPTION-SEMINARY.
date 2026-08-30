import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

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
  matcher: ['/dashboard/:path*'],
}
