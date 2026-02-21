/**
 * Redis-backed rate limiter (production)
 * Falls back to in-memory if Redis unavailable
 *
 * Requires: REDIS_URL env var (e.g. Upstash, Vercel KV)
 */

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/* ─── In-Memory Fallback ─── */
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/* ─── Redis Rate Limiter ─── */
async function redisRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return memoryRateLimit(key, limit, windowMs)

  try {
    // Upstash REST API compatible
    const isUpstash = redisUrl.includes('upstash')

    if (isUpstash) {
      const token = process.env.REDIS_TOKEN ?? ''
      const baseUrl = redisUrl.replace(/^redis/, 'https').replace(/:6379$/, '')

      // INCR + EXPIRE atomic via pipeline
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

      // Set expiry on first request
      if (ttl === -1 || ttl === -2) {
        await fetch(`${baseUrl}/PEXPIRE/${key}/${windowMs}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      const remaining = Math.max(0, limit - count)
      const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs)

      return { allowed: count <= limit, remaining, resetAt }
    }

    // Generic Redis (ioredis style) — fallback to memory
    return memoryRateLimit(key, limit, windowMs)
  } catch (err) {
    console.error('[RateLimit] Redis error, falling back to memory:', err)
    return memoryRateLimit(key, limit, windowMs)
  }
}

/* ─── Public API ─── */

export interface RateLimitConfig {
  /** Unique prefix for the rate limit bucket */
  prefix?: string
  /** Maximum requests per window */
  limit?: number
  /** Time window in milliseconds */
  windowMs?: number
}

const defaults: Required<RateLimitConfig> = {
  prefix: 'rl',
  limit: 60,
  windowMs: 60_000,
}

export async function rateLimit(identifier: string, config?: RateLimitConfig): Promise<RateLimitResult> {
  const { prefix, limit, windowMs } = { ...defaults, ...config }
  const key = `${prefix}:${identifier}`

  if (process.env.REDIS_URL) {
    return redisRateLimit(key, limit, windowMs)
  }

  return memoryRateLimit(key, limit, windowMs)
}

/** Stricter rate limit for auth endpoints */
export async function authRateLimit(ip: string): Promise<RateLimitResult> {
  return rateLimit(ip, { prefix: 'rl:auth', limit: 10, windowMs: 300_000 }) // 10 per 5 min
}

/** Rate limit for API endpoints */
export async function apiRateLimit(ip: string): Promise<RateLimitResult> {
  return rateLimit(ip, { prefix: 'rl:api', limit: 60, windowMs: 60_000 }) // 60 per min
}

/** Rate limit for search */
export async function searchRateLimit(ip: string): Promise<RateLimitResult> {
  return rateLimit(ip, { prefix: 'rl:search', limit: 30, windowMs: 60_000 }) // 30 per min
}

/* ─── Cleanup (for in-memory store) ─── */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore) {
      if (now > entry.resetAt) memoryStore.delete(key)
    }
  }, 60_000) // Clean every minute
}
