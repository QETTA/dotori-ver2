import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMock, dbConnectMock, addInterestMock, removeInterestMock, standardLimiterCheckMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    dbConnectMock: vi.fn(),
    addInterestMock: vi.fn(),
    removeInterestMock: vi.fn(),
    standardLimiterCheckMock: vi.fn(),
  }))

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

vi.mock('@/lib/rate-limit', () => ({
  standardLimiter: {
    check: standardLimiterCheckMock,
  },
}))

vi.mock('@/lib/services/interest-service', () => ({
  addInterest: addInterestMock,
  removeInterest: removeInterestMock,
}))

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'user-1' } })
  dbConnectMock.mockResolvedValue(undefined)
  standardLimiterCheckMock.mockReturnValue(null)
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

describe('POST /api/users/me/interests', () => {
  it('returns 404 with compatible error payload when facility does not exist', async () => {
    addInterestMock.mockResolvedValueOnce({
      success: false,
      error: '존재하지 않는 시설입니다',
    })

    const { POST } = await import('@/app/api/users/me/interests/route')
    const req = new NextRequest('http://localhost:3000/api/users/me/interests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ facilityId: '507f1f77bcf86cd799439011' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const topLevelCode = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''

    expect(topLevelCode).toBe('NOT_FOUND')
    expect(canonicalCode).toBe('NOT_FOUND')
    expect(json).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: '존재하지 않는 시설입니다',
      },
      code: 'NOT_FOUND',
      message: '존재하지 않는 시설입니다',
      requestId: expect.any(String),
    })
    expect(canonical.requestId).toBe(json.requestId)
    expect(addInterestMock).toHaveBeenCalledWith('user-1', '507f1f77bcf86cd799439011')
    expect(removeInterestMock).not.toHaveBeenCalled()
  })
})
