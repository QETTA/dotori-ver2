/**
 * Rate limiter — Redis-backed (Upstash REST) with in-memory fallback
 * Drop-in async replacement for the original synchronous rate limiter.
 */

/* ─── In-Memory Fallback ─── */
const memoryStore = new Map<string, { count: number; resetAt: number }>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore) {
      if (now > entry.resetAt) memoryStore.delete(key)
    }
  }, 60_000)
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs, limit }
  }

  entry.count++
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    limit,
  }
}

/* ─── Redis (Upstash REST) ─── */
async function redisRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return memoryRateLimit(key, limit, windowMs)

  try {
    const token = process.env.REDIS_TOKEN ?? ''
    const baseUrl = redisUrl.includes('upstash') ? redisUrl.replace(/^redis/, 'https').replace(/:6379$/, '') : redisUrl

    const res = await fetch(`${baseUrl}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify([
        ['INCR', key],
        ['PTTL', key],
      ]),
    })

    const results = await res.json()
    const count = results[0]?.result ?? 1
    const ttl = results[1]?.result ?? -1

    if (ttl === -1 || ttl === -2) {
      await fetch(`${baseUrl}/PEXPIRE/${key}/${windowMs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }

    const remaining = Math.max(0, limit - count)
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs)

    return { allowed: count <= limit, remaining, resetAt, limit }
  } catch (err) {
    console.error('[RateLimit] Redis error, falling back to memory:', err)
    return memoryRateLimit(key, limit, windowMs)
  }
}

/* ─── Preset Configs ─── */
interface RateLimitConfig {
  /** Max requests in window */
  limit: number
  /** Window size in seconds */
  windowSec: number
}

export const RATE_LIMITS = {
  /** General API: 60 req/min */
  api: { limit: 60, windowSec: 60 },
  /** Chat API: 20 req/min */
  chat: { limit: 20, windowSec: 60 },
  /** Auth: 10 req/min */
  auth: { limit: 10, windowSec: 60 },
  /** Search: 30 req/min */
  search: { limit: 30, windowSec: 60 },
  /** Heavy operations: 5 req/min */
  heavy: { limit: 5, windowSec: 60 },
} as const

/* ─── Public API (async) ─── */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 60, windowSec: 60 },
): Promise<RateLimitResult> {
  const windowMs = config.windowSec * 1000
  const rlKey = `rl:${key}`

  if (process.env.REDIS_URL) {
    return redisRateLimit(rlKey, config.limit, windowMs)
  }
  return memoryRateLimit(rlKey, config.limit, windowMs)
}

/* ─── Next.js Helper ─── */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}

/**
 * Extract client identifier from request
 * Uses IP → forwarded-for → fallback
 */
export function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous'
  return ip
}
