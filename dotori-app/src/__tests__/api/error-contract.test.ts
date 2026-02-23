import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const {
  authMock,
  dbConnectMock,
  logDebugMock,
  logInfoMock,
  logWarnMock,
  logErrorMock,
  logWithRequestIdMock,
} = vi.hoisted(() => {
  const logDebugMock = vi.fn()
  const logInfoMock = vi.fn()
  const logWarnMock = vi.fn()
  const logErrorMock = vi.fn()
  const requestLogger = {
    debug: logDebugMock,
    info: logInfoMock,
    warn: logWarnMock,
    error: logErrorMock,
    withRequestId: vi.fn(),
  }

  return {
    authMock: vi.fn(),
    dbConnectMock: vi.fn(),
    logDebugMock,
    logInfoMock,
    logWarnMock,
    logErrorMock,
    logWithRequestIdMock: vi.fn(() => requestLogger),
  }
})

vi.mock('@/auth', () => ({
  auth: authMock,
}))

vi.mock('@/lib/db', () => ({
  default: dbConnectMock,
}))

vi.mock('@/lib/logger', () => ({
  log: {
    debug: logDebugMock,
    info: logInfoMock,
    warn: logWarnMock,
    error: logErrorMock,
    withRequestId: logWithRequestIdMock,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'user-1' } })
  dbConnectMock.mockResolvedValue(undefined)
})

function getCanonicalError(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    return {}
  }

  const record = body as Record<string, unknown>
  if (record.error && typeof record.error === 'object') {
    return record.error as Record<string, unknown>
  }
  return record
}

function getErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return ''
  }

  const record = body as Record<string, unknown>
  if (typeof record.error === 'string') {
    return record.error
  }
  if (typeof record.message === 'string') {
    return record.message
  }

  const canonical = getCanonicalError(body)
  return typeof canonical.message === 'string' ? canonical.message : ''
}

describe('API error contract (current compatibility)', () => {
  it('returns current BAD_REQUEST for validation error equivalent (400)', async () => {
    const { withApiHandler } = await import('@/lib/api-handler')

    const handler = withApiHandler(async () => NextResponse.json({ ok: true }), {
      auth: false,
      skipDb: true,
      schema: z.object({
        name: z.string().min(1),
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/error-contract', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })

    const res = await handler(req)
    const body = await res.json()
    const canonical = getCanonicalError(body)
    const code = typeof body.code === 'string' ? body.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''

    expect(res.status).toBe(400)
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(code)
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(canonicalCode)
    expect(getErrorMessage(body)).toBeTruthy()
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })

  it('returns UNAUTHORIZED (401) on authentication failure', async () => {
    const { withApiHandler } = await import('@/lib/api-handler')
    authMock.mockResolvedValueOnce(null)

    const protectedHandler = withApiHandler(async () => NextResponse.json({ ok: true }))
    const req = new NextRequest('http://localhost:3000/api/error-contract', {
      method: 'GET',
    })

    const res = await protectedHandler(req)
    const body = await res.json()
    const canonical = getCanonicalError(body)
    const code = typeof body.code === 'string' ? body.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''

    expect(res.status).toBe(401)
    expect(['UNAUTHORIZED', 'UNAUTHENTICATED']).toContain(code)
    expect(['UNAUTHORIZED', 'UNAUTHENTICATED']).toContain(canonicalCode)
    expect(getErrorMessage(body)).toContain('인증')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })

  it('returns INTERNAL_ERROR without leaking sensitive details on internal exception', async () => {
    const { withApiHandler } = await import('@/lib/api-handler')
    const sensitiveMessage =
      'DB_PASSWORD=super-secret token=abcd /srv/app/route.ts SELECT * FROM users'

    const brokenHandler = withApiHandler(
      async () => {
        throw new Error(sensitiveMessage)
      },
      { auth: false, skipDb: true },
    )

    const req = new NextRequest('http://localhost:3000/api/error-contract', {
      method: 'GET',
    })
    const res = await brokenHandler(req)
    const body = await res.json()
    const canonical = getCanonicalError(body)
    const errorMessage = getErrorMessage(body)

    expect(res.status).toBe(500)
    expect(body).toMatchObject({ code: 'INTERNAL_ERROR' })
    expect(canonical).toMatchObject({ code: 'INTERNAL_ERROR' })
    expect(errorMessage).toBeTruthy()
    expect(errorMessage).not.toContain('DB_PASSWORD')
    expect(errorMessage).not.toContain('token')
    expect(errorMessage).not.toContain('SELECT * FROM users')
    expect(errorMessage).not.toContain('/srv/app/route.ts')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })
})
