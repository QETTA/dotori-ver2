import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  authMock,
  dbConnectMock,
  standardLimiterCheckMock,
  executeActionMock,
  actionIntentFindOneMock,
  actionIntentFindByIdAndUpdateMock,
  actionExecutionFindOneMock,
  actionExecutionCreateMock,
  actionExecutionFindOneAndUpdateMock,
  actionExecutionDeleteOneMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  dbConnectMock: vi.fn(),
  standardLimiterCheckMock: vi.fn(),
  executeActionMock: vi.fn(),
  actionIntentFindOneMock: vi.fn(),
  actionIntentFindByIdAndUpdateMock: vi.fn(),
  actionExecutionFindOneMock: vi.fn(),
  actionExecutionCreateMock: vi.fn(),
  actionExecutionFindOneAndUpdateMock: vi.fn(),
  actionExecutionDeleteOneMock: vi.fn(),
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

vi.mock('@/lib/engine/action-executor', () => ({
  executeAction: executeActionMock,
}))

vi.mock('@/models/ActionIntent', () => ({
  default: {
    findOne: actionIntentFindOneMock,
    findByIdAndUpdate: actionIntentFindByIdAndUpdateMock,
  },
}))

vi.mock('@/models/ActionExecution', () => ({
  default: {
    findOne: actionExecutionFindOneMock,
    create: actionExecutionCreateMock,
    findOneAndUpdate: actionExecutionFindOneAndUpdateMock,
    deleteOne: actionExecutionDeleteOneMock,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'user-1' } })
  dbConnectMock.mockResolvedValue(undefined)
  standardLimiterCheckMock.mockReturnValue(null)
  actionExecutionFindOneMock.mockResolvedValue(null)
  actionExecutionCreateMock.mockResolvedValue({})
  actionIntentFindByIdAndUpdateMock.mockResolvedValue({})
  actionExecutionFindOneAndUpdateMock.mockResolvedValue({})
  actionExecutionDeleteOneMock.mockResolvedValue({ deletedCount: 1 })
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

describe('POST /api/actions/execute', () => {
  it('returns 422 with compatible error payload when action execution fails', async () => {
    actionIntentFindOneMock.mockResolvedValueOnce({
      _id: '507f1f77bcf86cd799439011',
      userId: 'user-1',
      actionType: 'apply_waiting',
      expiresAt: new Date(Date.now() + 60_000),
    })
    executeActionMock.mockResolvedValueOnce({
      success: false,
      error: '액션 실행에 실패했습니다',
    })

    const { POST } = await import('@/app/api/actions/execute/route')
    const req = new NextRequest('http://localhost:3000/api/actions/execute', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intentId: '507f1f77bcf86cd799439011' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(422)

    const json = await res.json()
    const canonical = getCanonicalError(json)
    const topLevelCode = typeof json.code === 'string' ? json.code : ''
    const canonicalCode = typeof canonical.code === 'string' ? canonical.code : ''

    expect(topLevelCode).toBe('UNPROCESSABLE_ENTITY')
    expect(canonicalCode).toBe('UNPROCESSABLE_ENTITY')
    expect(json).toMatchObject({
      error: {
        code: 'UNPROCESSABLE_ENTITY',
        message: '액션 실행에 실패했습니다',
      },
      code: 'UNPROCESSABLE_ENTITY',
      message: '액션 실행에 실패했습니다',
      requestId: expect.any(String),
    })
    expect(canonical.requestId).toBe(json.requestId)
    expect(actionExecutionDeleteOneMock).toHaveBeenCalledWith({
      idempotencyKey: 'user-1-507f1f77bcf86cd799439011',
    })
  })
})
