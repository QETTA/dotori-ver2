import { getStreamErrorPayload } from '@/app/(app)/chat/_lib/chat-stream'
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

function isQuotaExceededError(body: unknown): boolean {
  if (!body || typeof body !== 'object') {
    return false
  }

  const record = body as Record<string, unknown>
  const details =
    (getCanonicalError(body).details as Record<string, unknown> | undefined) ??
    (record.details as Record<string, unknown> | undefined)

  return (
    record.error === 'quota_exceeded' ||
    details?.limitType === 'guest' ||
    details?.limitType === 'monthly' ||
    details?.reason === 'quota_exceeded' ||
    details?.error === 'quota_exceeded' ||
    details?.code === 'quota_exceeded' ||
    details?.type === 'quota_exceeded' ||
    details?.kind === 'quota_exceeded'
  )
}

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
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(code)
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(canonicalCode)
    expect(getErrorMessage(json)).toBe('message는 필수입니다')
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
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(code)
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(canonicalCode)
    expect(getErrorMessage(json)).toBe('메시지는 2000자 이내로 입력해주세요')
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
    const canonical = getCanonicalError(json)
    const details = (canonical.details as Record<string, unknown> | undefined) ?? json.details
    expect(json).toMatchObject({ code: 'FORBIDDEN' })
    expect(canonical).toMatchObject({ code: 'FORBIDDEN' })
    expect(details).toMatchObject({
      limitType: 'guest',
      limit: GUEST_CHAT_LIMIT,
    })
    expect(isQuotaExceededError(json)).toBe(true)
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
    const canonical = getCanonicalError(json)
    const details = (canonical.details as Record<string, unknown> | undefined) ?? json.details
    expect(json).toMatchObject({ code: 'FORBIDDEN' })
    expect(canonical).toMatchObject({ code: 'FORBIDDEN' })
    expect(details).toMatchObject({
      limitType: 'monthly',
      limit: MONTHLY_FREE_CHAT_LIMIT,
    })
    expect(isQuotaExceededError(json)).toBe(true)
  })
})

describe('chat stream error parsing compatibility', () => {
  it('detects quota_exceeded from legacy top-level error string', async () => {
    const response = new Response(
      JSON.stringify({
        error: 'quota_exceeded',
        code: 'FORBIDDEN',
        message: 'quota exceeded',
      }),
      {
        status: 403,
        headers: { 'content-type': 'application/json' },
      },
    )

    const payload = await getStreamErrorPayload(response)
    expect(payload).toMatchObject({
      isQuotaExceeded: true,
      message: 'quota exceeded',
    })
  })

  it('detects quota_exceeded from canonical details', async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          code: 'FORBIDDEN',
          message: 'quota exceeded',
          details: { reason: 'quota_exceeded' },
        },
        code: 'FORBIDDEN',
        message: 'quota exceeded',
        details: { reason: 'quota_exceeded' },
      }),
      {
        status: 403,
        headers: { 'content-type': 'application/json' },
      },
    )

    const payload = await getStreamErrorPayload(response)
    expect(payload).toMatchObject({
      isQuotaExceeded: true,
      message: 'quota exceeded',
    })
  })
})
