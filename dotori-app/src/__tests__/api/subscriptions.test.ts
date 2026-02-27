import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const dbConnectMock = vi.fn()

const userFindByIdMock = vi.fn()
const userFindByIdAndUpdateMock = vi.fn()

const subscriptionFindOneMock = vi.fn()
const subscriptionUpdateManyMock = vi.fn()
const subscriptionCreateMock = vi.fn()

vi.mock('@/auth', () => ({
  auth: authMock,
}))

vi.mock('@/lib/db', () => ({
  default: dbConnectMock,
}))

vi.mock('@/lib/logger', () => {
  const log = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    withRequestId: () => log,
  }
  return { log }
})

vi.mock('@/models/User', () => ({
  default: {
    findById: userFindByIdMock,
    findByIdAndUpdate: userFindByIdAndUpdateMock,
  },
}))

vi.mock('@/models/Subscription', () => ({
  default: {
    findOne: subscriptionFindOneMock,
    updateMany: subscriptionUpdateManyMock,
    create: subscriptionCreateMock,
  },
}))

beforeEach(() => {
  authMock.mockReset()
  dbConnectMock.mockReset()
  userFindByIdMock.mockReset()
  userFindByIdAndUpdateMock.mockReset()
  subscriptionFindOneMock.mockReset()
  subscriptionUpdateManyMock.mockReset()
  subscriptionCreateMock.mockReset()

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

describe('POST /api/subscriptions', () => {
  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    userFindByIdMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ role: 'user' }),
      }),
    })

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(403)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    expect(json).toMatchObject({
      error: expect.anything(),
    })
    if (typeof json.code === 'string') {
      expect(json.code).toBe('FORBIDDEN')
    }
    if (typeof canonical.code === 'string') {
      expect(canonical.code).toBe('FORBIDDEN')
    }
    expect(getErrorMessage(json)).toContain('관리자만 구독을 생성할 수 있습니다')
    expect(subscriptionUpdateManyMock).not.toHaveBeenCalled()
    expect(subscriptionCreateMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/subscriptions', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const { GET } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'GET',
    })

    const res = await GET(req)
    expect(res.status).toBe(401)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(['UNAUTHORIZED', 'UNAUTHENTICATED']).toContain(code)
    expect(['UNAUTHORIZED', 'UNAUTHENTICATED']).toContain(canonicalCode)
    expect(getErrorMessage(json)).toContain('인증')
    expect(dbConnectMock).not.toHaveBeenCalled()
  })
})
