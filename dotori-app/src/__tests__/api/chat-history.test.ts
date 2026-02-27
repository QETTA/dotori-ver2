import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMock, dbConnectMock, chatHistoryFindOneMock, rateLimitCheckMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    dbConnectMock: vi.fn(),
    chatHistoryFindOneMock: vi.fn(),
    rateLimitCheckMock: vi.fn(),
  }),
)

vi.mock('@/auth', () => ({
  auth: authMock,
}))

vi.mock('@/lib/db', () => ({
  default: dbConnectMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  relaxedLimiter: {
    check: rateLimitCheckMock,
  },
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

vi.mock('@/models/ChatHistory', () => ({
  default: {
    findOne: chatHistoryFindOneMock,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'user-1' } })
  dbConnectMock.mockResolvedValue(undefined)
  rateLimitCheckMock.mockReturnValue(null)
  ensureCryptoRandomUUID()
})

function ensureCryptoRandomUUID(): void {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return
  }

  ;(globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
    randomUUID: () => '00000000-0000-4000-8000-000000000000',
  } as Crypto
}

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

describe('GET /api/chat/history', () => {
  it('returns empty messages when no history exists', async () => {
    const sortMock = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    })
    chatHistoryFindOneMock.mockReturnValue({ sort: sortMock })

    const { GET } = await import('@/app/api/chat/history/route')
    const req = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    })

    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({ data: { messages: [] } })
    expect(chatHistoryFindOneMock).toHaveBeenCalledWith({ userId: 'user-1' })
    expect(sortMock).toHaveBeenCalledWith({ updatedAt: -1 })
  })

  it('maps quickReplies from metadata and direct fields', async () => {
    const rawHistory = {
      messages: [
        {
          _id: 'm1',
          role: 'assistant',
          content: '메타 카멜',
          timestamp: new Date('2026-02-01T00:00:00.000Z'),
          metadata: { quickReplies: ['메타-카멜-1', '메타-카멜-2'] },
        },
        {
          _id: 'm2',
          role: 'assistant',
          content: '메타 스네이크',
          timestamp: '2026-02-01T01:00:00.000Z',
          metadata: { quick_replies: ['메타-스네이크-1'] },
        },
        {
          _id: 'm3',
          role: 'assistant',
          content: '다이렉트 카멜',
          timestamp: '2026-02-01T02:00:00.000Z',
          quickReplies: ['다이렉트-카멜-1'],
        },
        {
          _id: 'm4',
          role: 'assistant',
          content: '다이렉트 스네이크',
          timestamp: '2026-02-01T03:00:00.000Z',
          quick_replies: ['다이렉트-스네이크-1', '다이렉트-스네이크-2'],
        },
      ],
    }

    chatHistoryFindOneMock.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(rawHistory),
      }),
    })

    const { GET } = await import('@/app/api/chat/history/route')
    const req = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    })

    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.messages).toHaveLength(4)
    expect(json.data.messages[0]).toMatchObject({
      id: 'm1',
      quick_replies: ['메타-카멜-1', '메타-카멜-2'],
      timestamp: '2026-02-01T00:00:00.000Z',
    })
    expect(json.data.messages[1]).toMatchObject({
      id: 'm2',
      quick_replies: ['메타-스네이크-1'],
      timestamp: '2026-02-01T01:00:00.000Z',
    })
    expect(json.data.messages[2]).toMatchObject({
      id: 'm3',
      quick_replies: ['다이렉트-카멜-1'],
      timestamp: '2026-02-01T02:00:00.000Z',
    })
    expect(json.data.messages[3]).toMatchObject({
      id: 'm4',
      quick_replies: ['다이렉트-스네이크-1', '다이렉트-스네이크-2'],
      timestamp: '2026-02-01T03:00:00.000Z',
    })
  })

  it('returns 401 contract when unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const { GET } = await import('@/app/api/chat/history/route')
    const req = new NextRequest('http://localhost:3000/api/chat/history', {
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

describe('DELETE /api/chat/history', () => {
  it('returns deleted=true when no history exists', async () => {
    chatHistoryFindOneMock.mockResolvedValue(null)

    const { DELETE } = await import('@/app/api/chat/history/route')
    const req = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'DELETE',
    })

    const res = await DELETE(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({ data: { deleted: true } })
    expect(chatHistoryFindOneMock).toHaveBeenCalledWith({ userId: 'user-1' })
  })

  it('clears messages and saves when history exists', async () => {
    const saveMock = vi.fn().mockResolvedValue(undefined)
    const historyDoc: { messages: unknown[]; save: () => Promise<void> } = {
      messages: [
        {
          role: 'assistant',
          content: '기존 메시지',
          timestamp: '2026-02-01T00:00:00.000Z',
        },
      ],
      save: saveMock,
    }
    chatHistoryFindOneMock.mockResolvedValue(historyDoc)

    const { DELETE } = await import('@/app/api/chat/history/route')
    const req = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'DELETE',
    })

    const res = await DELETE(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toEqual({ data: { deleted: true } })
    expect(historyDoc.messages).toEqual([])
    expect(saveMock).toHaveBeenCalledTimes(1)
  })

  it('returns 401 contract when unauthenticated', async () => {
    authMock.mockResolvedValue(null)

    const { DELETE } = await import('@/app/api/chat/history/route')
    const req = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'DELETE',
    })

    const res = await DELETE(req)
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
