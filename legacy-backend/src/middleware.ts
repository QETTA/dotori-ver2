import { type NextRequest, NextResponse } from 'next/server'
import { detectEntrySource, parseEntryParams, resolveEntryRedirect } from '@/lib/entry-routing'

/**
 * Enhanced Middleware — Route Protection + CSRF + Security Headers
 */

// 로그인 없이 무료로 모든 페이지 접근 가능 (웹앱 신뢰성 확보)
// 로그인이 필요한 "쓰기" 동작은 각 API에서 개별 체크
const AUTH_REQUIRED: string[] = []
const ADMIN_REQUIRED = ['/admin']
const CSRF_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'
const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  '/compare': '/in-fox',
  '/explore': '/in-fox',
  '/search': '/in-fox',
}

function generateCsrfToken(): string {
  const a = new Uint8Array(32)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

function buildCspHeader() {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.daumcdn.net https://t1.kakaocdn.net https://dapi.kakao.com https://js.tosspayments.com https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://t1.daumcdn.net https://map.daumcdn.net https://*.kakaocdn.net",
    "font-src 'self' https://cdn.jsdelivr.net",
    "connect-src 'self' https://dapi.kakao.com https://api.tosspayments.com https://api.openai.com https://cdn.jsdelivr.net wss:",
    'frame-src https://js.tosspayments.com https://www.youtube.com https://www.instagram.com',
    "worker-src 'self' blob:",
  ].join('; ')
}

function addSecurityHeaders(res: NextResponse) {

  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)')

  const csp = buildCspHeader()
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)

  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/fonts') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.ico') ||
    pathname === '/sw.js'
  ) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    addSecurityHeaders(response)
    return response
  }

  // Entry routing: redirect shared/channel links to correct destination
  const entryParams = parseEntryParams(request.nextUrl.searchParams)
  if (entryParams.entry === 'kakao_channel' && pathname !== '/chat') {
    const chatUrl = new URL('/chat', request.url)
    chatUrl.searchParams.set('entry', 'kakao_channel')
    if (entryParams.ref) chatUrl.searchParams.set('ref', entryParams.ref)
    if (entryParams.nbId) chatUrl.searchParams.set('nbId', entryParams.nbId)
    if (entryParams.age) chatUrl.searchParams.set('age', entryParams.age)
    return NextResponse.redirect(chatUrl)
  }
  if (entryParams.entry && pathname === '/') {
    const source = detectEntrySource(entryParams, request.headers.get('user-agent') ?? undefined)
    const dest = resolveEntryRedirect(entryParams, source)
    return NextResponse.redirect(new URL(dest, request.url))
  }
  if (pathname.startsWith('/consult')) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }
  const legacyRedirect = LEGACY_PATH_REDIRECTS[pathname]
  if (legacyRedirect) {
    return NextResponse.redirect(new URL(legacyRedirect, request.url))
  }
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  const sessionToken =
    request.cookies.get('__Secure-next-auth.session-token')?.value ??
    request.cookies.get('next-auth.session-token')?.value
  const isAuthenticated = !!sessionToken

  // Route protection
  if (AUTH_REQUIRED.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  if (ADMIN_REQUIRED.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // CSRF protection for state-changing API requests
  if (pathname.startsWith('/api/') && !CSRF_SAFE_METHODS.includes(request.method)) {
    const csrfExempt =
      pathname.startsWith('/api/auth') ||
      pathname.includes('webhook') ||
      pathname === '/api/health' ||
      pathname === '/api/chat' ||
      pathname.startsWith('/api/debug/')
    if (!csrfExempt) {
      const cookieToken = request.cookies.get(CSRF_COOKIE)?.value
      const headerToken = request.headers.get(CSRF_HEADER)
      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return NextResponse.json(
          { success: false, error: { code: 'CSRF_MISMATCH', message: 'CSRF token missing or mismatch' } },
          { status: 403 },
        )
      }
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Set CSRF cookie
  if (!request.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    })
  }

  addSecurityHeaders(response)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|fonts/).*)'],
}
