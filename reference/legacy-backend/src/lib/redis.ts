/**
 * Shared Redis utility — Upstash REST API
 * Falls back gracefully when REDIS_URL is not set.
 */

const REDIS_URL = () => process.env.REDIS_URL ?? ''
const REDIS_TOKEN = () => process.env.REDIS_TOKEN ?? ''

function baseUrl(): string {
  const url = REDIS_URL()
  if (!url) return ''
  return url.includes('upstash') ? url.replace(/^redis/, 'https').replace(/:6379$/, '') : url
}

export function isRedisAvailable(): boolean {
  return !!REDIS_URL()
}

/**
 * Execute a single Upstash REST command.
 * Returns the parsed `result` field or null on error.
 */
export async function redisCommand<T = unknown>(args: string[]): Promise<T | null> {
  const base = baseUrl()
  if (!base) return null

  try {
    const res = await fetch(`${base}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })
    const json = await res.json()
    return (json.result ?? null) as T
  } catch (err) {
    console.error('[Redis] command error:', err)
    return null
  }
}

/**
 * Execute a pipeline of Upstash REST commands.
 * Returns array of results.
 */
export async function redisPipeline<T = unknown>(commands: string[][]): Promise<(T | null)[]> {
  const base = baseUrl()
  if (!base) return commands.map(() => null)

  try {
    const res = await fetch(`${base}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REDIS_TOKEN()}` },
      body: JSON.stringify(commands),
    })
    const results = await res.json()
    return (results as Array<{ result: T }>).map((r) => r.result ?? null)
  } catch (err) {
    console.error('[Redis] pipeline error:', err)
    return commands.map(() => null)
  }
}

/** LPUSH — push to head of list */
export async function redisLPush(key: string, value: string): Promise<number | null> {
  return redisCommand<number>(['LPUSH', key, value])
}

/** RPOP — pop from tail of list */
export async function redisRPop(key: string): Promise<string | null> {
  return redisCommand<string>(['RPOP', key])
}

/** SET with optional expiry (seconds) */
export async function redisSet(key: string, value: string, exSec?: number): Promise<void> {
  if (exSec) {
    await redisCommand(['SET', key, value, 'EX', String(exSec)])
  } else {
    await redisCommand(['SET', key, value])
  }
}

/** GET */
export async function redisGet(key: string): Promise<string | null> {
  return redisCommand<string>(['GET', key])
}
