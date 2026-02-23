import { createApiErrorResponse } from '@/lib/api-error'
import dbConnect from '@/lib/db'
import UsageLog from '@/models/UsageLog'
import { NextResponse } from 'next/server'

export const MONTHLY_FREE_CHAT_LIMIT = 5
export const GUEST_CHAT_LIMIT = 3
export const MONTHLY_QUOTA_EXCEEDED_MESSAGE =
  '이번 달 무료 채팅 횟수를 모두 사용했어요. 프리미엄으로 업그레이드하면 무제한으로 대화할 수 있어요.'

type GuestUsage = {
  count: number
  resetAt: number
}

const guestUsageMap = new Map<string, GuestUsage>()

type EnsureQuotaParams = {
  userId?: string
  isPremiumPlan: boolean
  clientIp: string
  requestId?: string
}

type RecordUsageParams = EnsureQuotaParams

export function getMonthKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function getNextMonthResetAt(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0).getTime()
}

function getGuestUsage(ip: string): GuestUsage {
  const now = Date.now()
  const existing = guestUsageMap.get(ip)
  if (!existing || now >= existing.resetAt) {
    const refreshed = {
      count: 0,
      resetAt: getNextMonthResetAt(new Date(now)),
    }
    guestUsageMap.set(ip, refreshed)
    return refreshed
  }

  return existing
}

function incrementGuestUsage(ip: string): void {
  const usage = getGuestUsage(ip)
  usage.count += 1
  guestUsageMap.set(ip, usage)
}

function buildQuotaExceededResponse(
  limitType: 'guest' | 'monthly',
  requestId?: string,
): NextResponse {
  return createApiErrorResponse({
    status: 403,
    code: 'FORBIDDEN',
    message: MONTHLY_QUOTA_EXCEEDED_MESSAGE,
    details: {
      limitType,
      limit: limitType === 'guest' ? GUEST_CHAT_LIMIT : MONTHLY_FREE_CHAT_LIMIT,
    },
    legacyError: 'quota_exceeded',
    requestId,
  })
}

async function getMonthlyChatCount(userId: string): Promise<number> {
  const month = getMonthKey()
  const usage = await UsageLog.findOne({
    userId,
    type: 'chat',
    month,
  }).lean<{ count?: unknown }>()
  if (!usage || typeof usage.count !== 'number' || Number.isNaN(usage.count)) {
    return 0
  }
  return Math.max(0, Math.floor(usage.count))
}

async function incrementMonthlyChatCount(userId: string): Promise<void> {
  const month = getMonthKey()
  await UsageLog.findOneAndUpdate(
    { userId, type: 'chat', month },
    {
      $setOnInsert: {
        userId,
        type: 'chat',
        month,
        count: 0,
      },
      $inc: { count: 1 },
    },
    { upsert: true, new: true },
  )
}

export function resolveClientIp(forwardedFor: string | null): string {
  return forwardedFor?.split(',')[0]?.trim() || 'unknown'
}

export async function ensureChatQuota({
  userId,
  isPremiumPlan,
  clientIp,
  requestId,
}: EnsureQuotaParams): Promise<NextResponse | null> {
  if (userId && !isPremiumPlan) {
    await dbConnect()
    const currentMonthUsage = await getMonthlyChatCount(userId)
    if (currentMonthUsage >= MONTHLY_FREE_CHAT_LIMIT) {
      return buildQuotaExceededResponse('monthly', requestId)
    }
    return null
  }

  if (!userId) {
    const guestUsage = getGuestUsage(clientIp)
    if (guestUsage.count >= GUEST_CHAT_LIMIT) {
      return buildQuotaExceededResponse('guest', requestId)
    }
  }

  return null
}

export async function recordChatUsage({
  userId,
  isPremiumPlan,
  clientIp,
}: RecordUsageParams): Promise<void> {
  if (userId && !isPremiumPlan) {
    await dbConnect()
    await incrementMonthlyChatCount(userId)
    return
  }

  if (!userId) {
    incrementGuestUsage(clientIp)
  }
}

export function __resetGuestUsageForTests(): void {
  guestUsageMap.clear()
}

export function __setGuestUsageForTests(
  ip: string,
  count: number,
  resetAt = getNextMonthResetAt(),
): void {
  guestUsageMap.set(ip, { count, resetAt })
}
