import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { features } from '@/lib/env'

/**
 * GET /api/health
 * Health check for monitoring and load balancers
 */
export const GET = withErrorHandling(async () => {
  const checks: Record<string, { status: 'ok' | 'degraded' | 'down'; latency?: number }> = {}
  let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  // Database
  if (features.database) {
    const start = Date.now()
    try {
      const prisma = (await import('@/lib/db/prisma')).default
      await prisma.$runCommandRaw({ ping: 1 })
      checks.database = { status: 'ok', latency: Date.now() - start }
    } catch {
      checks.database = { status: 'down', latency: Date.now() - start }
      overall = 'unhealthy'
    }
  } else {
    checks.database = { status: 'degraded' }
    overall = 'degraded'
  }

  // Feature flags
  checks.kakaoMap = { status: features.kakaoMap ? 'ok' : 'degraded' }
  checks.payment = { status: features.tossPayment ? 'ok' : 'degraded' }
  checks.ai = { status: features.openai ? 'ok' : 'degraded' }
  checks.publicData = { status: features.publicData ? 'ok' : 'degraded' }

  if (!features.kakaoMap || !features.tossPayment) {
    if (overall === 'healthy') overall = 'degraded'
  }

  const status = overall === 'unhealthy' ? 503 : 200

  return NextResponse.json(
    {
      status: overall,
      version: process.env.npm_package_version ?? '0.3.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime() ?? 0,
      checks,
    },
    { status },
  )
})
