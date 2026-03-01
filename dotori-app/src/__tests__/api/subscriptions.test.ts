import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const dbConnectMock = vi.fn()

const userFindByIdMock = vi.fn()
const userFindByIdAndUpdateMock = vi.fn()

const subscriptionFindOneMock = vi.fn()
const subscriptionFindMock = vi.fn()
const subscriptionUpdateManyMock = vi.fn()
const subscriptionCreateMock = vi.fn()
const subscriptionDeleteOneMock = vi.fn()

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
    find: subscriptionFindMock,
    updateMany: subscriptionUpdateManyMock,
    create: subscriptionCreateMock,
    deleteOne: subscriptionDeleteOneMock,
  },
}))

beforeEach(() => {
  authMock.mockReset()
  dbConnectMock.mockReset()
  userFindByIdMock.mockReset()
  userFindByIdAndUpdateMock.mockReset()
  subscriptionFindOneMock.mockReset()
  subscriptionFindMock.mockReset()
  subscriptionUpdateManyMock.mockReset()
  subscriptionCreateMock.mockReset()
  subscriptionDeleteOneMock.mockReset()

  dbConnectMock.mockResolvedValue(undefined)
  subscriptionFindMock.mockReturnValue({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
  })
  subscriptionDeleteOneMock.mockResolvedValue({ deletedCount: 1 })
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
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(['UNAUTHORIZED', 'UNAUTHENTICATED']).toContain(code)
    expect(['UNAUTHORIZED', 'UNAUTHENTICATED']).toContain(canonicalCode)
    expect(getErrorMessage(json)).toContain('인증')
    expect(dbConnectMock).not.toHaveBeenCalled()
    expect(userFindByIdMock).not.toHaveBeenCalled()
    expect(subscriptionUpdateManyMock).not.toHaveBeenCalled()
    expect(subscriptionCreateMock).not.toHaveBeenCalled()
  })

  it('returns 401 when session user id is missing', async () => {
    authMock.mockResolvedValue({ user: {} })

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(getErrorMessage(json)).toContain('인증')
    expect(dbConnectMock).not.toHaveBeenCalled()
    expect(userFindByIdMock).not.toHaveBeenCalled()
    expect(subscriptionUpdateManyMock).not.toHaveBeenCalled()
    expect(subscriptionCreateMock).not.toHaveBeenCalled()
  })

  it('returns 403 when user is not admin', async () => {
    authMock.mockResolvedValue({ user: { id: '507f1f77bcf86cd799439021' } })
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

  it('returns 400 when session user id is invalid object id', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } })

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(getErrorMessage(json)).toContain('유효하지 않은 사용자 ID입니다')
    expect(userFindByIdMock).not.toHaveBeenCalled()
    expect(subscriptionUpdateManyMock).not.toHaveBeenCalled()
    expect(subscriptionCreateMock).not.toHaveBeenCalled()
  })

  it('returns 201 when admin creates subscription for target user', async () => {
    const adminUserId = '507f1f77bcf86cd799439011'
    const targetUserId = '507f1f77bcf86cd799439012'
    authMock.mockResolvedValue({ user: { id: adminUserId } })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ role: 'admin' }),
      }),
    })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: targetUserId }),
      }),
    })
    subscriptionUpdateManyMock.mockResolvedValue({ modifiedCount: 0 })
    subscriptionCreateMock.mockResolvedValue({
      toObject: vi.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439013',
        userId: targetUserId,
        plan: 'premium',
        status: 'active',
      }),
    })
    userFindByIdAndUpdateMock.mockResolvedValue({ _id: targetUserId })

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium', targetUserId }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json).toMatchObject({
      data: expect.objectContaining({
        userId: targetUserId,
        plan: 'premium',
      }),
    })
    expect(subscriptionUpdateManyMock).toHaveBeenCalledWith(
      { userId: targetUserId, status: 'active' },
      { $set: { status: 'expired' } },
    )
    expect(subscriptionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: targetUserId, plan: 'premium' }),
    )
    expect(userFindByIdAndUpdateMock).toHaveBeenCalledWith(
      targetUserId,
      { $set: { plan: 'premium' } },
      { runValidators: false },
    )
    expect(userFindByIdMock).toHaveBeenCalledTimes(2)
  })

  it('returns 409 when active subscription already exists', async () => {
    const adminUserId = '507f1f77bcf86cd799439011'
    const targetUserId = '507f1f77bcf86cd799439012'
    authMock.mockResolvedValue({ user: { id: adminUserId } })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ role: 'admin' }),
      }),
    })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: targetUserId }),
      }),
    })
    subscriptionUpdateManyMock.mockResolvedValue({ modifiedCount: 1 })
    subscriptionCreateMock.mockRejectedValueOnce(
      Object.assign(new Error('duplicate key'), { code: 11000 }),
    )

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium', targetUserId }),
    })

    const res = await POST(req)
    expect(res.status).toBe(409)

    const json = await res.json()
    expect(getErrorMessage(json)).toContain('이미 활성 구독이 존재합니다')
    expect(userFindByIdAndUpdateMock).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid targetUserId', async () => {
    const adminUserId = '507f1f77bcf86cd799439011'
    authMock.mockResolvedValue({ user: { id: adminUserId } })
    userFindByIdMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ role: 'admin' }),
      }),
    })

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium', targetUserId: 'invalid-user-id' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json).toMatchObject({
      error: expect.anything(),
    })
    expect(getErrorMessage(json)).toContain('유효하지 않은 대상 사용자 ID입니다')
    expect(subscriptionUpdateManyMock).not.toHaveBeenCalled()
    expect(subscriptionCreateMock).not.toHaveBeenCalled()
    expect(userFindByIdAndUpdateMock).not.toHaveBeenCalled()
  })

  it('returns 404 when target user does not exist', async () => {
    const adminUserId = '507f1f77bcf86cd799439011'
    const targetUserId = '507f1f77bcf86cd799439012'
    authMock.mockResolvedValue({ user: { id: adminUserId } })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ role: 'admin' }),
      }),
    })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    })

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium', targetUserId }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json).toMatchObject({
      error: expect.anything(),
    })
    expect(getErrorMessage(json)).toContain('구독 대상 사용자를 찾을 수 없습니다')
    expect(subscriptionUpdateManyMock).not.toHaveBeenCalled()
    expect(subscriptionCreateMock).not.toHaveBeenCalled()
    expect(userFindByIdAndUpdateMock).not.toHaveBeenCalled()
    expect(userFindByIdMock).toHaveBeenCalledTimes(2)
  })

  it('returns 404 when targetUserId is omitted and actor user does not exist', async () => {
    const adminUserId = '507f1f77bcf86cd799439011'
    authMock.mockResolvedValue({ user: { id: adminUserId } })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ role: 'admin' }),
      }),
    })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
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
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(getErrorMessage(json)).toContain('구독 대상 사용자를 찾을 수 없습니다')
    expect(subscriptionUpdateManyMock).not.toHaveBeenCalled()
    expect(subscriptionCreateMock).not.toHaveBeenCalled()
    expect(userFindByIdAndUpdateMock).not.toHaveBeenCalled()
    expect(userFindByIdMock).toHaveBeenCalledTimes(2)
  })

  it('returns 201 and falls back to actor userId when targetUserId is omitted', async () => {
    const adminUserId = '507f1f77bcf86cd799439011'
    authMock.mockResolvedValue({ user: { id: adminUserId } })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ role: 'admin' }),
      }),
    })
    userFindByIdMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: adminUserId }),
      }),
    })
    subscriptionUpdateManyMock.mockResolvedValue({ modifiedCount: 0 })
    subscriptionCreateMock.mockResolvedValue({
      toObject: vi.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439013',
        userId: adminUserId,
        plan: 'premium',
        status: 'active',
      }),
    })
    userFindByIdAndUpdateMock.mockResolvedValue({ _id: adminUserId })

    const { POST } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ plan: 'premium' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json).toMatchObject({
      data: expect.objectContaining({
        userId: adminUserId,
        plan: 'premium',
      }),
    })
    expect(subscriptionUpdateManyMock).toHaveBeenCalledWith(
      { userId: adminUserId, status: 'active' },
      { $set: { status: 'expired' } },
    )
    expect(subscriptionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: adminUserId, plan: 'premium' }),
    )
    expect(userFindByIdAndUpdateMock).toHaveBeenCalledWith(
      adminUserId,
      { $set: { plan: 'premium' } },
      { runValidators: false },
    )
    expect(userFindByIdMock).toHaveBeenCalledTimes(2)
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

  it('returns active subscription when one exists', async () => {
    const userId = '507f1f77bcf86cd799439021'
    const activeSubscription = {
      _id: '507f1f77bcf86cd799439031',
      userId,
      plan: 'premium',
      status: 'active',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-02-01T00:00:00.000Z'),
    }
    authMock.mockResolvedValue({ user: { id: userId } })
    subscriptionFindOneMock.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(activeSubscription),
        }),
      }),
    })

    const { GET } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'GET',
    })

    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toMatchObject({
      data: expect.objectContaining({
        userId,
        plan: 'premium',
        status: 'active',
      }),
    })
    expect(subscriptionFindOneMock).toHaveBeenCalledTimes(1)
    expect(subscriptionFindOneMock).toHaveBeenCalledWith({
      userId,
      status: 'active',
    })
    expect(userFindByIdMock).not.toHaveBeenCalled()
  })

  it('falls back to latest subscription when active subscription is missing', async () => {
    const userId = '507f1f77bcf86cd799439022'
    const latestSubscription = {
      _id: '507f1f77bcf86cd799439032',
      userId,
      plan: 'partner',
      status: 'expired',
      startedAt: new Date('2025-12-01T00:00:00.000Z'),
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    authMock.mockResolvedValue({ user: { id: userId } })
    subscriptionFindOneMock
      .mockReturnValueOnce({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(null),
          }),
        }),
      })
      .mockReturnValueOnce({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(latestSubscription),
        }),
      })

    const { GET } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'GET',
    })

    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toMatchObject({
      data: expect.objectContaining({
        userId,
        plan: 'partner',
        status: 'expired',
      }),
    })
    expect(subscriptionFindOneMock).toHaveBeenCalledTimes(2)
    expect(subscriptionFindOneMock).toHaveBeenNthCalledWith(1, {
      userId,
      status: 'active',
    })
    expect(subscriptionFindOneMock).toHaveBeenNthCalledWith(2, { userId })
    expect(userFindByIdMock).not.toHaveBeenCalled()
  })

  it('falls back to user plan when no subscription history exists', async () => {
    const userId = '507f1f77bcf86cd799439023'
    authMock.mockResolvedValue({ user: { id: userId } })
    subscriptionFindOneMock
      .mockReturnValueOnce({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(null),
          }),
        }),
      })
      .mockReturnValueOnce({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null),
        }),
      })
    userFindByIdMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ plan: 'partner' }),
      }),
    })

    const { GET } = await import('@/app/api/subscriptions/route')
    const req = new NextRequest('http://localhost/api/subscriptions', {
      method: 'GET',
    })

    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toMatchObject({
      data: {
        userId,
        plan: 'partner',
        status: 'active',
        startedAt: null,
        expiresAt: null,
      },
    })
    expect(subscriptionFindOneMock).toHaveBeenCalledTimes(2)
    expect(subscriptionFindOneMock).toHaveBeenNthCalledWith(1, {
      userId,
      status: 'active',
    })
    expect(subscriptionFindOneMock).toHaveBeenNthCalledWith(2, { userId })
    expect(userFindByIdMock).toHaveBeenCalledWith(userId)
  })
})
