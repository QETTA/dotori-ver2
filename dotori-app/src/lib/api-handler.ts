/**
 * Centralized API route handler wrapper.
 *
 * Eliminates boilerplate for auth, db connection, validation, rate limiting,
 * and error handling. Each route becomes a slim handler function.
 *
 * Usage:
 *   export const GET = withApiHandler(async (req, { userId }) => {
 *     const data = await Model.find({ userId }).lean();
 *     return NextResponse.json({ data });
 *   }, { auth: true });
 *
 *   export const POST = withApiHandler(async (req, { userId, body }) => {
 *     const item = await Model.create({ ...body, userId });
 *     return NextResponse.json({ data: item }, { status: 201 });
 *   }, { auth: true, schema: myZodSchema, rateLimiter: standardLimiter });
 */
import { auth } from '@/auth'
import { createApiErrorResponse, getLegacyApiErrorCodeByStatus } from '@/lib/api-error'
import dbConnect from '@/lib/db'
import { log } from '@/lib/logger'
import { type NextRequest, NextResponse } from 'next/server'
import type { z } from 'zod'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Generate a weak ETag from a response body string using Web Crypto API.
 * Uses a fast FNV-1a 32-bit hash for minimal overhead.
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/**
 * Apply ETag/If-None-Match handling for GET responses.
 * Returns a 304 Not Modified if the client already has the current version.
 */
function applyETag(req: NextRequest, response: NextResponse, bodyText: string): NextResponse {
  const etag = `W/"${fnv1aHash(bodyText)}"`
  response.headers.set('ETag', etag)

  const ifNoneMatch = req.headers.get('If-None-Match')
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': response.headers.get('Cache-Control') || '',
        'X-Request-Id': response.headers.get('X-Request-Id') || '',
      },
    })
  }

  return response
}

type RateLimiter = {
  check: (req: NextRequest, requestId?: string) => NextResponse | null
}

/** Next.js route context for dynamic segments (e.g. [id]) */
type RouteContext = { params: Promise<Record<string, string>> }

interface HandlerContext<T = unknown> {
  userId: string
  body: T
  /** Resolved route params for dynamic segments (e.g. { id: "..." }) */
  params: Record<string, string>
}

interface ApiHandlerOptions<T = unknown> {
  /** Require authenticated session (default: true) */
  auth?: boolean
  /** Zod schema for request body validation */
  schema?: z.ZodType<T>
  /** Rate limiter instance */
  rateLimiter?: RateLimiter
  /** Skip dbConnect (default: false) */
  skipDb?: boolean
  /** Cache-Control header for successful GET responses */
  cacheControl?: string
}

type HandlerFn<T = unknown> = (req: NextRequest, ctx: HandlerContext<T>) => Promise<NextResponse>

function addRequestIdHeader(response: NextResponse, requestId: string): NextResponse {
  if (!response.headers.has('X-Request-Id')) {
    response.headers.set('X-Request-Id', requestId)
  }
  return response
}

export function withApiHandler<T = unknown>(
  handler: HandlerFn<T>,
  options: ApiHandlerOptions<T> = {},
) {
  const { auth: requireAuth = true, schema, rateLimiter, skipDb = false, cacheControl } = options

  return async (req: NextRequest, routeCtx?: RouteContext): Promise<NextResponse> => {
    const requestId = crypto.randomUUID()

    // 1. Rate limiting
    if (rateLimiter) {
      const limited = rateLimiter.check(req, requestId)
      if (limited) return addRequestIdHeader(limited, requestId)
    }

    // 2. Authentication
    let userId = ''
    if (requireAuth) {
      const session = await auth()
      if (!session?.user?.id) {
        return addRequestIdHeader(
          createApiErrorResponse({
            status: 401,
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다',
            requestId,
          }),
          requestId,
        )
      }
      userId = session.user.id
    } else {
      // Optional auth: try to extract userId without failing
      try {
        const session = await auth()
        if (session?.user?.id) {
          userId = session.user.id
        }
      } catch {
        // Ignore auth errors for non-required auth routes
      }
    }

    const rlog = log.withRequestId(requestId)

    try {
      // 3. Database connection
      if (!skipDb) {
        await dbConnect()
      }

      // 4. Body validation
      let body = undefined as T
      if (schema) {
        let rawBody: unknown
        try {
          rawBody = await req.json()
        } catch {
          return addRequestIdHeader(
            createApiErrorResponse({
              status: 400,
              code: 'BAD_REQUEST',
              message: '유효하지 않은 JSON입니다',
              requestId,
            }),
            requestId,
          )
        }

        const parsed = schema.safeParse(rawBody)
        if (!parsed.success) {
          const firstError = parsed.error.issues[0]
          return addRequestIdHeader(
            createApiErrorResponse({
              status: 400,
              code: 'BAD_REQUEST',
              message: firstError?.message || '입력값이 올바르지 않습니다',
              details: firstError
                ? {
                    fields: [
                      {
                        path: firstError.path.join('.'),
                        reason: firstError.code,
                      },
                    ],
                  }
                : null,
              requestId,
            }),
            requestId,
          )
        }
        body = parsed.data
      }

      // 5. Resolve dynamic route params
      const params = routeCtx?.params ? await routeCtx.params : {}

      // 6. Execute handler
      const start = Date.now()
      const response = await handler(req, { userId, body, params })
      if (req.method === 'GET' && response.status >= 200 && response.status < 300) {
        const cacheValue = cacheControl || 'private, max-age=30, stale-while-revalidate=60'
        if (!response.headers.get('Cache-Control')) {
          response.headers.set('Cache-Control', cacheValue)
        }
      }

      // 7. Request logging + response size tracking
      const latency = Date.now() - start
      const path = req.nextUrl.pathname

      // Log slow or error responses
      if (latency > 1000 || response.status >= 400) {
        const logFn =
          response.status >= 500 ? rlog.error : response.status >= 400 ? rlog.warn : rlog.info
        logFn('Request completed', {
          method: req.method,
          path,
          status: response.status,
          userId: userId || undefined,
          latencyMs: latency,
        })
      }

      // For successful responses: apply ETag (GET) and log body size (dev)
      let finalResponse = response
      if (response.status >= 200 && response.status < 300) {
        const cloned = response.clone()
        const bodyText = await cloned.text()

        // Dev-only: log response body size for oversized response detection
        if (isDev) {
          const bodySize = new TextEncoder().encode(bodyText).byteLength
          const sizeKB = (bodySize / 1024).toFixed(1)
          if (bodySize > 50 * 1024) {
            rlog.warn('Large API response', {
              method: req.method,
              path,
              bodySizeKB: sizeKB,
              latencyMs: latency,
            })
          } else if (bodySize > 10 * 1024) {
            rlog.info('API response size', {
              method: req.method,
              path,
              bodySizeKB: sizeKB,
            })
          }
        }

        // Apply ETag for GET requests with successful responses
        if (req.method === 'GET') {
          addRequestIdHeader(response, requestId)
          finalResponse = applyETag(req, response, bodyText)
          return finalResponse
        }
      }

      return addRequestIdHeader(finalResponse, requestId)
    } catch (err) {
      if (err instanceof ApiError) {
        rlog.warn('API error', {
          method: req.method,
          path: req.nextUrl.pathname,
          status: err.status,
          error: err.message,
        })
        return addRequestIdHeader(
          createApiErrorResponse({
            status: err.status,
            code: err.code || getLegacyApiErrorCodeByStatus(err.status),
            message: err.message,
            details: typeof err.details === 'undefined' ? null : err.details,
            requestId,
          }),
          requestId,
        )
      }
      const internalMessage = err instanceof Error ? err.message : '알 수 없는 오류'
      rlog.error('Unhandled error', {
        method: req.method,
        path: req.nextUrl.pathname,
        error: internalMessage,
        userId: userId || undefined,
      })
      // Never expose internal error details to client
      return addRequestIdHeader(
        createApiErrorResponse({
          status: 500,
          code: 'INTERNAL_ERROR',
          message: '요청 처리에 실패했습니다',
          requestId,
        }),
        requestId,
      )
    }
  }
}

/**
 * Typed error classes for structured API error responses.
 * Throw these in handler functions to return specific HTTP status codes.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    options?: {
      code?: string
      details?: unknown
    },
  ) {
    super(message)
    this.code = options?.code
    this.details = options?.details
  }

  code?: string

  details?: unknown
}

export class NotFoundError extends ApiError {
  constructor(message = '리소스를 찾을 수 없습니다') {
    super(message, 404)
  }
}

export class ConflictError extends ApiError {
  constructor(message = '이미 존재하는 리소스입니다') {
    super(message, 409)
  }
}

export class BadRequestError extends ApiError {
  constructor(message = '잘못된 요청입니다') {
    super(message, 400)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = '권한이 없습니다') {
    super(message, 403)
  }
}
