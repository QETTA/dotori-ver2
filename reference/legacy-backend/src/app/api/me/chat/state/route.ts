import { createHash } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { getAuthUser } from '@/lib/api-guard'
import { fail, ok, requestIdFrom } from '../../../_stub/api-response'
import { findStubDaycare, loadFirstChoice, loadToAlerts, loadWatchlistState } from '../../../_stub/me-persistence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const user = await getAuthUser(req)
  if (!user?.email) {
    return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)
  }

  const [firstChoice, alerts, persistedWatchlistState] = await Promise.all([
    loadFirstChoice(req),
    loadToAlerts(req),
    loadWatchlistState(req),
  ])
  const firstChoiceDaycare = firstChoice ? findStubDaycare(firstChoice.daycareId) : null
  const normalizedAlerts = alerts.map((item) => {
    const daycare = findStubDaycare(item.daycareId)
    return {
      daycareId: item.daycareId,
      age: item.age,
      name: daycare?.name ?? null,
      district: daycare?.district ?? null,
      dong: daycare?.dong ?? null,
      enabled: item.enabled,
      enabledAt: item.enabledAt,
      persisted: item.persisted,
    }
  })

  const computedWatchlist = new Map<
    string,
    {
      daycareId: string
      name: string
      age?: number
      alertEnabled: boolean
      priority: number
    }
  >()

  if (firstChoice && firstChoiceDaycare) {
    computedWatchlist.set(firstChoice.daycareId, {
      daycareId: firstChoice.daycareId,
      name: firstChoiceDaycare.name,
      age: firstChoice.age ?? undefined,
      alertEnabled: normalizedAlerts.some((item) => item.daycareId === firstChoice.daycareId && item.enabled),
      priority: 1,
    })
  }

  for (const item of normalizedAlerts) {
    if (!item.daycareId || !item.name) continue
    if (computedWatchlist.has(item.daycareId)) continue
    computedWatchlist.set(item.daycareId, {
      daycareId: item.daycareId,
      name: item.name,
      age: item.age,
      alertEnabled: true,
      priority: computedWatchlist.size + 1,
    })
    if (computedWatchlist.size >= 3) break
  }

  const watchlist = persistedWatchlistState?.watchlist?.length
    ? persistedWatchlistState.watchlist.slice(0, 3)
    : Array.from(computedWatchlist.values()).slice(0, 3)

  const stateUpdatedAt =
    persistedWatchlistState?.updatedAt ??
    firstChoice?.savedAt ??
    normalizedAlerts[0]?.enabledAt ??
    new Date().toISOString()

  const responseBody = {
    firstChoice: firstChoice
      ? {
          daycareId: firstChoice.daycareId,
          age: firstChoice.age,
          name: firstChoiceDaycare?.name ?? null,
          district: firstChoiceDaycare?.district ?? null,
          dong: firstChoiceDaycare?.dong ?? null,
          savedAt: firstChoice.savedAt,
          persisted: firstChoice.persisted,
        }
      : null,
    alerts: normalizedAlerts,
    watchlist,
    stateUpdatedAt,
  }

  const etag = `"${createHash('sha1').update(JSON.stringify(responseBody)).digest('hex')}"`
  if (req.headers.get('if-none-match') === etag) {
    const notModified = new NextResponse(null, { status: 304 })
    notModified.headers.set('Cache-Control', 'no-store')
    notModified.headers.set('ETag', etag)
    notModified.headers.set('X-Request-Id', requestId)
    return notModified
  }

  const response = ok(requestId, responseBody)
  response.headers.set('ETag', etag)
  return response
})
