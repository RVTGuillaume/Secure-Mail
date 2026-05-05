import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/inbox', '/sent', '/drafts', '/trash', '/archive', '/settings', '/email']
const PUBLIC_ROUTES = ['/login', '/register']

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('sm_access_token')?.value

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isRoot = pathname === '/'

  // Non connecté → redirige vers login si route protégée
  if ((isProtectedRoute || isRoot) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Déjà connecté → redirige vers inbox si page auth
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/inbox', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}