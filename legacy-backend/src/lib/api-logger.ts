/**
 * API Request Logger
 * Wraps route handlers with timing, error logging, and audit trail
 */

import type { NextRequest, NextResponse } from 'next/server'

interface RequestLog {
  method: string
  path: string
  status: number
  duration: number
  ip?: string
  userAgent?: string
  error?: string
  timestamp: string
}

const logs: RequestLog[] = []
const MAX_LOGS = 1000

function addLog(log: RequestLog) {
  logs.unshift(log)
  if (logs.length > MAX_LOGS) logs.pop()

  if (process.env.NODE_ENV === 'development') {
    const color = log.status >= 400 ? '\x1b[31m' : log.status >= 300 ? '\x1b[33m' : '\x1b[32m'
    console.log(`${color}[API]${'\x1b[0m'} ${log.method} ${log.path} → ${log.status} (${log.duration}ms)`)
  }
}

/**
 * Wraps an API handler with logging and timing
 *
 * Usage:
 *   export const GET = withLogging(async (request) => { ... })
 */
export function withLogging(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const start = Date.now()
    const { pathname } = new URL(request.url)
    const method = request.method

    try {
      const response = await handler(request)
      const duration = Date.now() - start

      addLog({
        method,
        path: pathname,
        status: response.status,
        duration,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined,
        userAgent: request.headers.get('user-agent')?.slice(0, 100) ?? undefined,
        timestamp: new Date().toISOString(),
      })

      // Add timing header
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Request-Id', crypto.randomUUID())

      // Warn on slow responses
      if (duration > 3000) {
        console.warn(`[API] Slow response: ${method} ${pathname} took ${duration}ms`)
      }

      return response
    } catch (error: any) {
      const duration = Date.now() - start

      addLog({
        method,
        path: pathname,
        status: 500,
        duration,
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      console.error(`[API] Error: ${method} ${pathname}`, error)
      throw error
    }
  }
}

/**
 * Get recent API logs (for admin dashboard)
 */
export function getRecentLogs(limit = 50): RequestLog[] {
  return logs.slice(0, limit)
}

/**
 * Get API performance stats
 */
export function getApiStats() {
  if (logs.length === 0) return { avgDuration: 0, errorRate: 0, totalRequests: 0 }

  const total = logs.length
  const errors = logs.filter((l) => l.status >= 400).length
  const avgDuration = logs.reduce((sum, l) => sum + l.duration, 0) / total

  return {
    totalRequests: total,
    errorRate: `${((errors / total) * 100).toFixed(2)}%`,
    avgDuration: `${Math.round(avgDuration)}ms`,
    p95Duration: `${Math.round(logs.sort((a, b) => b.duration - a.duration)[Math.floor(total * 0.05)]?.duration ?? 0)}ms`,
    topPaths: Object.entries(
      logs.reduce(
        (acc, l) => {
          acc[l.path] = (acc[l.path] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  }
}
