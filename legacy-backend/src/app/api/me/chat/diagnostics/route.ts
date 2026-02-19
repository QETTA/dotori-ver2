import { createHash } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { getAuthUser } from '@/lib/api-guard'
import { fail, ok, requestIdFrom } from '../../../_stub/api-response'
import {
  loadFirstChoice,
  loadPersistenceDiagnostics,
  loadToAlertHistory,
  loadToAlerts,
  loadWatchlistState,
} from '../../../_stub/me-persistence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const user = await getAuthUser(req)
  if (!user?.email) {
    return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)
  }

  const historyLimitRaw = Number(req.nextUrl.searchParams.get('historyLimit') ?? 20)
  const historyLimit = Number.isFinite(historyLimitRaw) ? Math.max(1, Math.min(100, Math.floor(historyLimitRaw))) : 20

  const [firstChoice, alerts, watchlistState, history, persistence] = await Promise.all([
    loadFirstChoice(req),
    loadToAlerts(req),
    loadWatchlistState(req),
    loadToAlertHistory(req, historyLimit),
    loadPersistenceDiagnostics(req),
  ])

  const responseBody = {
    firstChoice,
    alerts,
    watchlistState,
    history,
    persistence,
    generatedAt: new Date().toISOString(),
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
