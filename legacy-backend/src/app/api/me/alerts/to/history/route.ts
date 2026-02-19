import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { getAuthUser } from '@/lib/api-guard'
import { fail, ok, requestIdFrom } from '../../../../_stub/api-response'
import { findStubDaycare, loadToAlertHistory } from '../../../../_stub/me-persistence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const user = await getAuthUser(req)
  if (!user?.email) {
    return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)
  }

  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? 50)
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50
  const items = await loadToAlertHistory(req, limit)

  return ok(requestId, {
    items: items.map((item) => {
      const daycare = findStubDaycare(item.daycareId)
      return {
        daycareId: item.daycareId,
        age: item.age,
        action: item.action,
        requestId: item.requestId,
        createdAt: item.createdAt,
        persisted: item.persisted,
        name: daycare?.name ?? null,
        district: daycare?.district ?? null,
        dong: daycare?.dong ?? null,
      }
    }),
  })
})
