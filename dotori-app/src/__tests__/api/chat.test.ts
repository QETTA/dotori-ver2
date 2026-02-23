import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMock, dbConnectMock, usageLogFindOneMock, usageLogFindOneAndUpdateMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    dbConnectMock: vi.fn(),
    usageLogFindOneMock: vi.fn(),
    usageLogFindOneAndUpdateMock: vi.fn(),
  }),
)

vi.mock('@/auth', () => ({
  auth: authMock,
}))

vi.mock('@/lib/db', () => ({
  default: dbConnectMock,
}))

vi.mock('@/models/UsageLog', () => ({
  default: {
    findOne: usageLogFindOneMock,
    findOneAndUpdate: usageLogFindOneAndUpdateMock,
  },
}))

beforeEach(async () => {
  vi.clearAllMocks()
  authMock.mockResolvedValue(null)
  dbConnectMock.mockResolvedValue(undefined)
  usageLogFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
  usageLogFindOneAndUpdateMock.mockResolvedValue(undefined)
  const { __resetGuestUsageForTests } = await import('@/lib/chat-quota')
  __resetGuestUsageForTests()
})

function ensureCryptoRandomUUID(): void {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return
  }

  ;(globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
    randomUUID: () => '00000000-0000-4000-8000-000000000000',
  } as Crypto
}

describe('POST /api/chat', () => {
  it('returns 400 for an empty message', async () => {
    ensureCryptoRandomUUID()

    const { POST } = await import('@/app/api/chat/route')
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json).toMatchObject({
      error: 'message는 필수입니다',
      code: 'BAD_REQUEST',
    })
  })

  it('returns 400 when the message exceeds length limit', async () => {
    ensureCryptoRandomUUID()

    const { POST } = await import('@/app/api/chat/route')
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'a'.repeat(2001) }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json).toMatchObject({
      error: '메시지는 2000자 이내로 입력해주세요',
      code: 'BAD_REQUEST',
    })
  })

  it('returns 403 when guest monthly quota is exhausted', async () => {
    ensureCryptoRandomUUID()

    const { __setGuestUsageForTests, GUEST_CHAT_LIMIT } = await import('@/lib/chat-quota')
    const clientIp = '203.0.113.99'
    __setGuestUsageForTests(clientIp, GUEST_CHAT_LIMIT, Date.now() + 60_000)

    const { POST } = await import('@/app/api/chat/route')
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': clientIp,
      },
      body: JSON.stringify({ message: '추천해줘' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(403)

    const json = await res.json()
    expect(json).toMatchObject({
      error: 'quota_exceeded',
      code: 'FORBIDDEN',
      details: {
        limitType: 'guest',
        limit: GUEST_CHAT_LIMIT,
      },
    })
  })

  it('returns 403 when free user monthly quota is exhausted', async () => {
    ensureCryptoRandomUUID()

    const { MONTHLY_FREE_CHAT_LIMIT } = await import('@/lib/chat-quota')
    authMock.mockResolvedValue({
      user: { id: '507f1f77bcf86cd799439011', plan: 'free' },
    })
    usageLogFindOneMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ count: MONTHLY_FREE_CHAT_LIMIT }),
    })

    const { POST } = await import('@/app/api/chat/route')
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '우리 동네 추천해줘' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(403)

    const json = await res.json()
    expect(json).toMatchObject({
      error: 'quota_exceeded',
      code: 'FORBIDDEN',
      details: {
        limitType: 'monthly',
        limit: MONTHLY_FREE_CHAT_LIMIT,
      },
    })
  })
})
