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

    expect(res.status).toBe(400)
    expect(body).toMatchObject({
      code: 'BAD_REQUEST',
      error: expect.any(String),
    })
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

    expect(res.status).toBe(401)
    expect(body).toMatchObject({
      code: 'UNAUTHORIZED',
    })
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

    expect(res.status).toBe(500)
    expect(body).toMatchObject({
      code: 'INTERNAL_ERROR',
      error: expect.any(String),
    })
    expect(body.error).not.toContain('DB_PASSWORD')
    expect(body.error).not.toContain('token')
    expect(body.error).not.toContain('SELECT * FROM users')
    expect(body.error).not.toContain('/srv/app/route.ts')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })
})
