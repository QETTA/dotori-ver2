import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ONE_HOUR_MS = 60 * 60 * 1000

function withNoStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store')
  return response
}

function json(payload: unknown, status = 200) {
  return withNoStore(NextResponse.json(payload, { status }))
}

function parseSince(raw: string | null) {
  const fallback = new Date(Date.now() - ONE_HOUR_MS)
  if (!raw) return fallback

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return fallback
  return parsed
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth()
  const email = session?.user?.email?.trim()
  if (!email) {
    return json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      },
      401,
    )
  }

  const sinceDate = parseSince(req.nextUrl.searchParams.get('since'))
  const since = sinceDate.toISOString()
  const nowIso = new Date().toISOString()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    return json({ success: true, since, nextSince: nowIso, items: [] })
  }

  const subs = await prisma.toAlertSubscription.findMany({
    where: {
      userId: user.id,
      enabled: true,
    },
    select: {
      daycareId: true,
      age: true,
    },
  })

  if (subs.length === 0) {
    return json({ success: true, since, nextSince: nowIso, items: [] })
  }

  const items = await prisma.toAlertEvent.findMany({
    where: {
      detectedAt: { gt: sinceDate },
      OR: subs.map((sub) => ({
        daycareId: sub.daycareId,
        age: sub.age,
      })),
    },
    include: {
      daycare: {
        select: {
          name: true,
          district: true,
          dong: true,
        },
      },
    },
    orderBy: { detectedAt: 'asc' },
    take: 30,
  })

  const nextSince = items[items.length - 1]?.detectedAt.toISOString() ?? nowIso

  return json({
    success: true,
    since,
    nextSince,
    items: items.map((item) => ({
      id: item.id,
      daycareId: item.daycareId,
      age: item.age,
      detectedAt: item.detectedAt.toISOString(),
      message: item.message,
      source: item.source,
      daycare: item.daycare
        ? {
            name: item.daycare.name,
            district: item.daycare.district,
            dong: item.daycare.dong,
          }
        : undefined,
    })),
  })
})
