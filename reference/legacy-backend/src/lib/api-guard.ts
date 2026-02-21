import { type NextRequest, NextResponse } from 'next/server'
import { ZodError, type z } from 'zod'
import { auth } from '@/lib/auth'

/**
 * Authenticated user from session
 */
export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  plan: string
}

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try NextAuth session
    const session = await auth()
    if (session?.user?.email) {
      return {
        id: session.user.id ?? session.user.email,
        email: session.user.email,
        name: session.user.name ?? '',
        role: session.user.role ?? 'user',
        plan: session.user.plan ?? 'free',
      }
    }
  } catch {
    // NextAuth not configured, try cookie fallback
  }

  // Cookie-based auth fallback (for dev/testing)
  const sessionToken =
    request.cookies.get('__Secure-next-auth.session-token')?.value ??
    request.cookies.get('next-auth.session-token')?.value

  if (sessionToken) {
    // In production, verify JWT. For now, decode basic info
    return {
      id: 'session_user',
      email: 'user@dotori.ai',
      name: 'Session User',
      role: 'user',
      plan: 'free',
    }
  }

  return null
}

/**
 * Require authentication — throws 401 if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request)
  if (!user) {
    throw new AuthenticationError()
  }
  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request)
  if (user.role !== 'admin') {
    throw new AuthorizationError()
  }
  return user
}

/**
 * Error classes
 */
export class AuthenticationError extends Error {
  constructor() {
    super('인증이 필요합니다.')
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super('접근 권한이 없습니다.')
  }
}

/**
 * Unified API handler wrapper
 * - Auth check (optional)
 * - Zod input validation
 * - Error handling with proper status codes
 * - Request timing
 */
export function apiHandler<TInput = void>(options: {
  auth?: boolean | 'admin'
  input?: z.ZodType<TInput>
  handler: (ctx: {
    request: NextRequest
    user: AuthUser | null
    input: TInput
    params?: Record<string, string>
    requestId: string
  }) => Promise<NextResponse>
}) {
  return async (request: NextRequest, segmentData?: unknown) => {
    const context = segmentData as { params?: Promise<Record<string, string>> } | undefined
    const start = Date.now()
    const requestId = request.headers.get('x-idempotency-key') ?? crypto.randomUUID()

    try {
      // 1. Auth check
      let user: AuthUser | null = null
      if (options.auth === 'admin') {
        user = await requireAdmin(request)
      } else if (options.auth) {
        user = await requireAuth(request)
      } else {
        user = await getAuthUser(request) // optional — get if available
      }

      // 2. Input validation
      let input: TInput = undefined as TInput
      if (options.input) {
        try {
          if (request.method === 'GET') {
            const searchParams = new URL(request.url).searchParams
            const obj: Record<string, string> = {}
            searchParams.forEach((v, k) => {
              obj[k] = v
            })
            input = options.input.parse(obj)
          } else {
            const body = await request.json().catch(() => ({}))
            input = options.input.parse(body)
          }
        } catch (e) {
          if (e instanceof ZodError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: '입력값이 올바르지 않습니다.',
                  requestId,
                  details: e.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                  })),
                },
              },
              { status: 400 },
            )
          }
          throw e
        }
      }

      // 3. Await params (Next.js 15)
      const params = context?.params ? await context.params : undefined

      // 4. Execute handler
      const response = await options.handler({
        request,
        user,
        input,
        params,
        requestId,
      })

      // 4. Add timing header
      response.headers.set('X-Response-Time', `${Date.now() - start}ms`)
      response.headers.set('X-Request-Id', requestId)
      return response
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: error.message, requestId } },
          { status: 401 },
        )
      }
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: error.message, requestId } },
          { status: 403 },
        )
      }

      console.error('[API Error]', error)
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', requestId } },
        { status: 500 },
      )
    }
  }
}

/**
 * Shortcut: success JSON response
 */
export function ok<T>(data: T, meta?: Record<string, unknown>, requestId?: string) {
  const mergedMeta = requestId ? { ...(meta ?? {}), requestId } : meta
  return NextResponse.json({ success: true, data, ...(mergedMeta ? { meta: mergedMeta } : {}) })
}
