import type { NextRequest } from 'next/server'

type Entry = {
  status: number
  body: unknown
  expiresAt: number
}

const TTL_MS = 5 * 60 * 1000
const MAX_ENTRIES = 1000

const globalCache = globalThis as unknown as {
  __ipsoIdempotencyCache?: Map<string, Entry>
}

function cache() {
  if (!globalCache.__ipsoIdempotencyCache) {
    globalCache.__ipsoIdempotencyCache = new Map<string, Entry>()
  }
  return globalCache.__ipsoIdempotencyCache
}

function scopedKey(scope: string, key: string) {
  return `${scope}:${key}`
}

function cleanup() {
  const now = Date.now()
  const map = cache()
  for (const [key, value] of map.entries()) {
    if (value.expiresAt <= now) map.delete(key)
  }
  if (map.size <= MAX_ENTRIES) return
  const overflow = map.size - MAX_ENTRIES
  let removed = 0
  for (const key of map.keys()) {
    map.delete(key)
    removed += 1
    if (removed >= overflow) break
  }
}

export function idempotencyKeyFrom(req: NextRequest) {
  const key = req.headers.get('x-idempotency-key')?.trim()
  if (!key) return null
  return key.slice(0, 128)
}

export function getReplay(scope: string, key: string | null) {
  if (!key) return null
  cleanup()
  const entry = cache().get(scopedKey(scope, key))
  if (!entry) return null
  return {
    status: entry.status,
    body: entry.body,
  }
}

export function putReplay(scope: string, key: string | null, status: number, body: unknown) {
  if (!key) return
  cleanup()
  cache().set(scopedKey(scope, key), {
    status,
    body,
    expiresAt: Date.now() + TTL_MS,
  })
}
