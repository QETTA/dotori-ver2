import { NextResponse } from 'next/server'

export type CanonicalApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_ERROR'
  | 'UPSTREAM_BAD_GATEWAY'
  | 'UPSTREAM_TIMEOUT'
  | 'SERVICE_UNAVAILABLE'

const LEGACY_TO_CANONICAL_CODE: Record<string, CanonicalApiErrorCode> = {
  BAD_REQUEST: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_REQUESTS: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UPSTREAM_BAD_GATEWAY: 'UPSTREAM_BAD_GATEWAY',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
}

const STATUS_TO_CANONICAL_CODE: Record<number, CanonicalApiErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_ERROR',
  502: 'UPSTREAM_BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'UPSTREAM_TIMEOUT',
}

const STATUS_TO_LEGACY_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
}

export type ApiErrorPayload = {
  error: {
    code: CanonicalApiErrorCode
    message: string
    details: unknown
    requestId: string
  }
  code: string
  message: string
  details: unknown
  requestId: string
  legacyError?: string
}

type CreateApiErrorPayloadParams = {
  status: number
  message: string
  requestId?: string
  code?: string
  details?: unknown
  legacyError?: string
}

type CreateApiErrorResponseParams = CreateApiErrorPayloadParams & {
  headers?: HeadersInit
}

function isCanonicalCode(value: string): value is CanonicalApiErrorCode {
  return Object.values(STATUS_TO_CANONICAL_CODE).includes(value as CanonicalApiErrorCode)
}

export function getLegacyApiErrorCodeByStatus(status: number): string {
  return STATUS_TO_LEGACY_CODE[status] || 'INTERNAL_ERROR'
}

export function getCanonicalApiErrorCode(status: number, code?: string): CanonicalApiErrorCode {
  if (code) {
    if (isCanonicalCode(code)) return code
    const mapped = LEGACY_TO_CANONICAL_CODE[code]
    if (mapped) return mapped
  }
  return STATUS_TO_CANONICAL_CODE[status] || 'INTERNAL_ERROR'
}

export function createApiErrorPayload({
  status,
  message,
  requestId = crypto.randomUUID(),
  code,
  details = null,
  legacyError,
}: CreateApiErrorPayloadParams): ApiErrorPayload {
  const canonicalCode = getCanonicalApiErrorCode(status, code)
  return {
    error: {
      code: canonicalCode,
      message,
      details,
      requestId,
    },
    code: code || canonicalCode,
    message,
    details,
    requestId,
    ...(legacyError ? { legacyError } : {}),
  }
}

export function createApiErrorResponse({
  status,
  message,
  requestId,
  code,
  details,
  legacyError,
  headers,
}: CreateApiErrorResponseParams): NextResponse {
  const payload = createApiErrorPayload({
    status,
    message,
    requestId,
    code,
    details,
    legacyError,
  })
  const response = NextResponse.json(payload, { status, headers })
  response.headers.set('X-Request-Id', payload.requestId)
  return response
}
