import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  authMock,
  strictLimiterCheckMock,
  logErrorMock,
  anthropicCtorMock,
  anthropicMessagesCreateMock,
} = vi.hoisted(() => {
  const auth = vi.fn()
  const strictLimiterCheck = vi.fn()
  const logError = vi.fn()
  const anthropicMessagesCreate = vi.fn()
  const anthropicCtor = vi.fn(function (
    this: { messages: { create: typeof anthropicMessagesCreate } },
    _config: { apiKey: string },
  ) {
    this.messages = {
      create: anthropicMessagesCreate,
    }
  })

  return {
    authMock: auth,
    strictLimiterCheckMock: strictLimiterCheck,
    logErrorMock: logError,
    anthropicCtorMock: anthropicCtor,
    anthropicMessagesCreateMock: anthropicMessagesCreate,
  }
})

vi.mock('@/auth', () => ({
  auth: authMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  strictLimiter: {
    check: strictLimiterCheckMock,
  },
}))

vi.mock('@/lib/logger', () => {
  const log = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: logErrorMock,
    withRequestId: () => log,
  }
  return { log }
})

vi.mock('@anthropic-ai/sdk', () => ({
  default: anthropicCtorMock,
}))

const ORIGINAL_ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

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

async function importRouteWithApiKey(apiKey?: string) {
  if (typeof apiKey === 'undefined') {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = apiKey
  }

  vi.resetModules()
  return import('@/app/api/ocr/waitlist/route')
}

beforeEach(() => {
  ensureCryptoRandomUUID()
  vi.clearAllMocks()
  strictLimiterCheckMock.mockReturnValue(null)
  authMock.mockResolvedValue({ user: { id: 'user-1' } })
})

afterEach(() => {
  if (typeof ORIGINAL_ANTHROPIC_API_KEY === 'undefined') {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_ANTHROPIC_API_KEY
  }
})

describe('POST /api/ocr/waitlist', () => {
  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValueOnce(null)
    const { POST } = await importRouteWithApiKey('test-api-key')

    const req = new NextRequest('http://localhost:3000/api/ocr/waitlist', {
      method: 'POST',
      body: new FormData(),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(['UNAUTHORIZED', 'UNAUTHENTICATED']).toContain(code)
    expect(['UNAUTHORIZED', 'UNAUTHENTICATED']).toContain(canonicalCode)
  })

  it('returns 500 INTERNAL_ERROR when Anthropic API key is missing', async () => {
    const { POST } = await importRouteWithApiKey()

    const req = new NextRequest('http://localhost:3000/api/ocr/waitlist', {
      method: 'POST',
      body: new FormData(),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(code).toBe('INTERNAL_ERROR')
    expect(canonicalCode).toBe('INTERNAL_ERROR')
  })

  it('returns 400 when image is missing', async () => {
    const { POST } = await importRouteWithApiKey('test-api-key')

    const req = new NextRequest('http://localhost:3000/api/ocr/waitlist', {
      method: 'POST',
      body: new FormData(),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(code)
    expect(['BAD_REQUEST', 'VALIDATION_ERROR']).toContain(canonicalCode)
  })

  it('returns 400 UNSUPPORTED_MEDIA_TYPE for unsupported image type', async () => {
    const { POST } = await importRouteWithApiKey('test-api-key')

    const formData = new FormData()
    const file = new File(['not-an-image'], 'sample.txt', { type: 'text/plain' })
    formData.append('image', file)

    const req = new NextRequest('http://localhost:3000/api/ocr/waitlist', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(code).toBe('UNSUPPORTED_MEDIA_TYPE')
    expect(canonicalCode).toBe('UNSUPPORTED_MEDIA_TYPE')
  })

  it('returns 413 PAYLOAD_TOO_LARGE for oversized image', async () => {
    const { POST } = await importRouteWithApiKey('test-api-key')

    const formData = new FormData()
    const oversized = new Uint8Array(10 * 1024 * 1024 + 1)
    const file = new File([oversized], 'big.png', { type: 'image/png' })
    formData.append('image', file)

    const req = new NextRequest('http://localhost:3000/api/ocr/waitlist', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(req)
    expect(res.status).toBe(413)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const code = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''
    expect(code).toBe('PAYLOAD_TOO_LARGE')
    expect(canonicalCode).toBe('PAYLOAD_TOO_LARGE')
  })

  it('returns parsed items and count for markdown-fenced JSON response', async () => {
    anthropicMessagesCreateMock.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: `\`\`\`json
[
  {
    "facilityName": "도토리어린이집",
    "waitlistNumber": 3,
    "applicationDate": "2025-12-01",
    "status": "대기중",
    "childClass": "만 2세반",
    "childName": "김도토리",
    "facilityType": "국공립"
  }
]
\`\`\``,
        },
      ],
      usage: {
        input_tokens: 321,
        output_tokens: 123,
      },
    })

    const { POST } = await importRouteWithApiKey('test-api-key')

    const formData = new FormData()
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'waitlist.png', {
      type: 'image/png',
    })
    formData.append('image', file)

    const req = new NextRequest('http://localhost:3000/api/ocr/waitlist', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toMatchObject({
      data: {
        items: [
          {
            facilityName: '도토리어린이집',
            waitlistNumber: 3,
            applicationDate: '2025-12-01',
            status: '대기중',
            childClass: '만 2세반',
            childName: '김도토리',
            facilityType: '국공립',
          },
        ],
        count: 1,
        usage: {
          inputTokens: 321,
          outputTokens: 123,
        },
      },
    })
    expect(anthropicCtorMock).toHaveBeenCalledWith({ apiKey: 'test-api-key' })
    expect(anthropicMessagesCreateMock).toHaveBeenCalledTimes(1)
    expect(logErrorMock).not.toHaveBeenCalled()
  })
})
