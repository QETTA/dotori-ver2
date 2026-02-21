import { type NextRequest, NextResponse } from 'next/server'
import type { ApiError as ApiErrorType, ApiResponse } from '@/lib/types'

/* ─── Error Classes ─── */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource}을(를) 찾을 수 없습니다.`)
  }
}

export class ValidationError extends ApiError {
  constructor(field: string, message?: string) {
    super(400, 'VALIDATION_ERROR', message || `${field} 필드가 올바르지 않습니다.`)
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, 'UNAUTHORIZED', '인증이 필요합니다.')
  }
}

export class ForbiddenError extends ApiError {
  constructor() {
    super(403, 'FORBIDDEN', '접근 권한이 없습니다.')
  }
}

export class RateLimitError extends ApiError {
  constructor() {
    super(429, 'RATE_LIMIT', '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
  }
}

/* ─── Response Helpers ─── */
export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']): NextResponse {
  return NextResponse.json({
    data,
    success: true,
    ...(meta && { meta }),
  } satisfies ApiResponse<T>)
}

export function errorResponse(error: ApiError | Error): NextResponse {
  const isApiError = error instanceof ApiError
  const status = isApiError ? error.statusCode : 500
  const code = isApiError ? error.code : 'INTERNAL_ERROR'
  const message = isApiError ? error.message : '서버 내부 오류가 발생했습니다.'

  if (!isApiError) {
    console.error('[API Error]', error)
  }

  // RFC 7807 Problem Details compatible response
  return NextResponse.json(
    {
      error: { code, message, status } satisfies ApiErrorType,
      success: false,
      // RFC 7807 fields
      type: `https://dotori.ai/errors/${code.toLowerCase()}`,
      title: code,
      detail: message,
      instance: undefined,
    },
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    },
  )
}

/* ─── Route Handler Wrapper ─── */
type RouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse | Response>

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error)
      }
      return errorResponse(error instanceof Error ? error : new Error('Unknown error'))
    }
  }
}

/* ─── Pagination Helper ─── */
export function paginationMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}

/* ─── Parse Query Params ─── */
export function getSearchParams(request: Request) {
  const url = new URL(request.url)
  return {
    get: (key: string) => url.searchParams.get(key),
    getNumber: (key: string, defaultVal: number) => {
      const val = url.searchParams.get(key)
      return val ? Number.parseInt(val, 10) || defaultVal : defaultVal
    },
    getString: (key: string, defaultVal = '') => {
      return url.searchParams.get(key) || defaultVal
    },
  }
}
