import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { getAuthUser } from '@/lib/api-guard'
import { fail, ok, replay, requestIdFrom } from '../../../_stub/api-response'
import { getReplay, idempotencyKeyFrom, putReplay } from '../../../_stub/idempotency'
import {
  loadWatchlistState,
  persistWatchlistState,
  type WatchlistItemSnapshot,
  writeJsonCookie,
} from '../../../_stub/me-persistence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RequestBody = {
  primaryChoiceId?: string | null
  watchlist?: Array<{ daycareId?: string; name?: string; age?: number; alertEnabled?: boolean; priority?: number }>
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const user = await getAuthUser(req)
  if (!user?.email) {
    return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)
  }

  const state = await loadWatchlistState(req)
  return ok(requestId, {
    watchlistState: state ?? {
      primaryChoiceId: null,
      watchlist: [] as WatchlistItemSnapshot[],
      updatedAt: new Date(0).toISOString(),
      persisted: 'db',
    },
  })
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const user = await getAuthUser(req)
  if (!user?.email) {
    return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)
  }

  const scope = 'me/chat/watchlist:post'
  const idempotencyKey = idempotencyKeyFrom(req)
  const replayEntry = getReplay(scope, idempotencyKey)
  if (replayEntry) {
    return replay(requestId, replayEntry.body, replayEntry.status)
  }

  let body: RequestBody | null = null
  try {
    body = (await req.json()) as RequestBody
  } catch {
    const payload = {
      success: false,
      requestId,
      error: {
        code: 'INVALID_JSON',
        message: 'JSON body가 필요합니다.',
      },
    }
    putReplay(scope, idempotencyKey, 400, payload)
    const response = NextResponse.json(payload, { status: 400 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  const watchlist = Array.isArray(body?.watchlist)
    ? body!.watchlist
        .filter((item) => Boolean(item?.daycareId))
        .map((item) => ({
          daycareId: String(item!.daycareId),
          name: item?.name,
          age: item?.age,
          alertEnabled: item?.alertEnabled,
          priority: item?.priority,
        }))
    : []

  const state = await persistWatchlistState(req, {
    primaryChoiceId: body?.primaryChoiceId ?? null,
    watchlist,
  })

  const payload = {
    success: true,
    requestId,
    watchlistState: state,
  }
  putReplay(scope, idempotencyKey, 200, payload)
  const response = NextResponse.json(payload, { status: 200 })
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('X-Request-Id', requestId)
  writeJsonCookie(response, 'ipso_watchlist_state', state)
  return response
})
