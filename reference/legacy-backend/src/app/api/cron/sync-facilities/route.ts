import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { SEOUL_REGION_CODES, syncFacilitiesToDB } from '@/lib/external/childcare-api'

/**
 * GET /api/cron/sync-facilities
 * Daily cron (Vercel Cron) — sync facility data from 공공데이터포털
 * Protected by CRON_SECRET
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, { created: number; updated: number }> = {}
  const errors: string[] = []

  // Sync Seoul districts (top 5 by population)
  const targetRegions = ['강남구', '송파구', '서초구', '강동구', '마포구']

  for (const region of targetRegions) {
    const code = SEOUL_REGION_CODES[region]
    if (!code) continue

    try {
      const result = await syncFacilitiesToDB(code)
      results[region] = { created: result.created, updated: result.updated }
    } catch (e) {
      errors.push(`${region}: ${(e as Error).message}`)
    }
  }

  // Log sync result
  try {
    const { logAudit } = await import('@/lib/audit')
    await logAudit({
      action: 'sync_facilities',
      entity: 'Facility',
      metadata: { results, errors, severity: errors.length > 0 ? 'warning' : 'info' },
    })
  } catch {
    /* DB not available */
  }

  return NextResponse.json({
    success: errors.length === 0,
    results,
    errors,
    timestamp: new Date().toISOString(),
  })
})
