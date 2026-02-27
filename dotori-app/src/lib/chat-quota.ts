import { createApiErrorResponse } from '@/lib/api-error'
import dbConnect from '@/lib/db'
import UsageLog from '@/models/UsageLog'
import { NextResponse } from 'next/server'

export const MONTHLY_FREE_CHAT_LIMIT = 5
export const GUEST_CHAT_LIMIT = 3
export const GLOBAL_GUEST_HOURLY_LIMIT = 100
export const MONTHLY_QUOTA_EXCEEDED_MESSAGE =
  '이번 달 무료 채팅 횟수를 모두 사용했어요. 프리미엄으로 업그레이드하면 무제한으로 대화할 수 있어요.'

const GUEST_MAP_MAX_SIZE = 10_000

type GuestUsage = {
  count: number
  resetAt: number
}

const guestUsageMap = new Map<string, GuestUsage>()

// Global guest hourly rate tracking (across all IPs)
let globalGuestHourlyCount = 0
let globalGuestHourlyResetAt = 0

type EnsureQuotaParams = {
  userId?: string
  isPremiumPlan: boolean
  clientIp: string
  requestId?: string
  consume?: boolean
}

type RecordUsageParams = EnsureQuotaParams

export function getMonthKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function getNextMonthResetAt(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0).getTime()
}

function getNextHourResetAt(now = Date.now()): number {
  return now - (now % 3_600_000) + 3_600_000
}

/**
 * Remove expired entries from the guest usage map.
 * Called when the map exceeds GUEST_MAP_MAX_SIZE to prevent unbounded memory growth.
 */
function pruneExpiredGuestEntries(): void {
  const now = Date.now()
  for (const [ip, usage] of guestUsageMap) {
    if (now >= usage.resetAt) {
      guestUsageMap.delete(ip)
    }
  }
}

function getGuestUsage(ip: string): GuestUsage {
  const now = Date.now()
  const existing = guestUsageMap.get(ip)
  if (!existing || now >= existing.resetAt) {
    // Enforce size cap before adding new entries
    if (guestUsageMap.size >= GUEST_MAP_MAX_SIZE) {
      pruneExpiredGuestEntries()
    }
    // If still at cap after pruning, evict oldest entry
    if (guestUsageMap.size >= GUEST_MAP_MAX_SIZE) {
      const firstKey = guestUsageMap.keys().next().value
      if (firstKey !== undefined) {
        guestUsageMap.delete(firstKey)
      }
    }

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

/**
 * Check and increment the global guest hourly counter.
 * Returns true if the global limit has been exceeded.
 */
function isGlobalGuestHourlyLimitExceeded(): boolean {
  const now = Date.now()
  if (now >= globalGuestHourlyResetAt) {
    globalGuestHourlyCount = 0
    globalGuestHourlyResetAt = getNextHourResetAt(now)
  }
  return globalGuestHourlyCount >= GLOBAL_GUEST_HOURLY_LIMIT
}

function incrementGlobalGuestHourlyCount(): void {
  const now = Date.now()
  if (now >= globalGuestHourlyResetAt) {
    globalGuestHourlyCount = 0
    globalGuestHourlyResetAt = getNextHourResetAt(now)
  }
  globalGuestHourlyCount += 1
}

function buildQuotaExceededResponse(
  limitType: 'guest' | 'monthly' | 'global_guest_hourly',
  requestId?: string,
): NextResponse {
  const limit =
    limitType === 'guest'
      ? GUEST_CHAT_LIMIT
      : limitType === 'monthly'
        ? MONTHLY_FREE_CHAT_LIMIT
        : GLOBAL_GUEST_HOURLY_LIMIT

  return createApiErrorResponse({
    status: 403,
    code: 'FORBIDDEN',
    message: MONTHLY_QUOTA_EXCEEDED_MESSAGE,
    details: {
      limitType,
      limit,
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

function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybeMongoError = error as { code?: unknown }
  return maybeMongoError.code === 11000
}

async function consumeMonthlyChatCount(userId: string): Promise<boolean> {
  const month = getMonthKey()

  const updateResult = await UsageLog.updateOne(
    {
      userId,
      type: 'chat',
      month,
      count: { $lt: MONTHLY_FREE_CHAT_LIMIT },
    },
    {
      $inc: { count: 1 },
    },
  )

  if (updateResult.modifiedCount > 0) {
    return true
  }

  if (updateResult.matchedCount > 0) {
    return false
  }

  const currentMonthUsage = await getMonthlyChatCount(userId)
  if (currentMonthUsage >= MONTHLY_FREE_CHAT_LIMIT) {
    return false
  }

  try {
    await UsageLog.create({
      userId,
      type: 'chat',
      month,
      count: 1,
    })
    return true
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error
    }

    const retryResult = await UsageLog.updateOne(
      {
        userId,
        type: 'chat',
        month,
        count: { $lt: MONTHLY_FREE_CHAT_LIMIT },
      },
      {
        $inc: { count: 1 },
      },
    )
    return retryResult.modifiedCount > 0
  }
}

async function decrementMonthlyChatCount(userId: string): Promise<void> {
  const month = getMonthKey()
  await UsageLog.updateOne(
    {
      userId,
      type: 'chat',
      month,
      count: { $gt: 0 },
    },
    {
      $inc: { count: -1 },
    },
  )
}

function decrementGuestUsage(ip: string): void {
  const usage = getGuestUsage(ip)
  if (usage.count <= 0) {
    return
  }

  usage.count -= 1
  guestUsageMap.set(ip, usage)
}

function decrementGlobalGuestHourlyCount(): void {
  const now = Date.now()
  if (now >= globalGuestHourlyResetAt) {
    globalGuestHourlyCount = 0
    globalGuestHourlyResetAt = getNextHourResetAt(now)
    return
  }

  globalGuestHourlyCount = Math.max(0, globalGuestHourlyCount - 1)
}

export function resolveClientIp(source: string | null | Headers): string {
  if (typeof source === 'string' || source === null) {
    return source?.split(',')[0]?.trim() || 'unknown'
  }

  const directIp = source.get('x-real-ip')?.trim()
  if (directIp) {
    return directIp
  }

  return source.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function ensureChatQuota({
  userId,
  isPremiumPlan,
  clientIp,
  requestId,
  consume = false,
}: EnsureQuotaParams): Promise<NextResponse | null> {
  if (userId && !isPremiumPlan) {
    await dbConnect()
    if (consume) {
      const consumed = await consumeMonthlyChatCount(userId)
      if (!consumed) {
        return buildQuotaExceededResponse('monthly', requestId)
      }
      return null
    }

    const currentMonthUsage = await getMonthlyChatCount(userId)
    if (currentMonthUsage >= MONTHLY_FREE_CHAT_LIMIT) {
      return buildQuotaExceededResponse('monthly', requestId)
    }
    return null
  }

  if (!userId) {
    // Global hourly cap across all guest IPs — prevents VPN/proxy abuse
    if (isGlobalGuestHourlyLimitExceeded()) {
      return buildQuotaExceededResponse('global_guest_hourly', requestId)
    }

    const guestUsage = getGuestUsage(clientIp)
    if (guestUsage.count >= GUEST_CHAT_LIMIT) {
      return buildQuotaExceededResponse('guest', requestId)
    }

    if (consume) {
      incrementGuestUsage(clientIp)
      incrementGlobalGuestHourlyCount()
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
    incrementGlobalGuestHourlyCount()
  }
}

export async function rollbackChatUsage({
  userId,
  isPremiumPlan,
  clientIp,
}: RecordUsageParams): Promise<void> {
  if (userId && !isPremiumPlan) {
    await dbConnect()
    await decrementMonthlyChatCount(userId)
    return
  }

  if (!userId) {
    decrementGuestUsage(clientIp)
    decrementGlobalGuestHourlyCount()
  }
}

export function __resetGuestUsageForTests(): void {
  guestUsageMap.clear()
  globalGuestHourlyCount = 0
  globalGuestHourlyResetAt = 0
}

export function __setGuestUsageForTests(
  ip: string,
  count: number,
  resetAt = getNextMonthResetAt(),
): void {
  guestUsageMap.set(ip, { count, resetAt })
}
