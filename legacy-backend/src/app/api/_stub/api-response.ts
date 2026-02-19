import { type NextRequest, NextResponse } from 'next/server'

export type ApiErrorCode = 'UNAUTHORIZED' | 'INVALID_JSON' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR'

type JsonObject = Record<string, unknown>

export function requestIdFrom(req: NextRequest) {
  const headerId = req.headers.get('x-idempotency-key')?.trim()
  if (headerId) return headerId.slice(0, 128)
  return crypto.randomUUID()
}

function withCommonHeaders(res: NextResponse, requestId: string) {
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('X-Request-Id', requestId)
  return res
}

export function ok(requestId: string, body: JsonObject, status = 200) {
  return withCommonHeaders(NextResponse.json({ success: true, requestId, ...body }, { status }), requestId)
}

export function fail(
  requestId: string,
  code: ApiErrorCode,
  message: string,
  status: number,
  extras?: Record<string, unknown>,
) {
  return withCommonHeaders(
    NextResponse.json(
      {
        success: false,
        requestId,
        error: {
          code,
          message,
          ...(extras ?? {}),
        },
      },
      { status },
    ),
    requestId,
  )
}

export function replay(requestId: string, body: unknown, status: number) {
  const res = withCommonHeaders(NextResponse.json(body, { status }), requestId)
  res.headers.set('X-Idempotent-Replay', 'true')
  return res
}
