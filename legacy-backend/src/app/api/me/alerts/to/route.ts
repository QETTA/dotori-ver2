import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'
import { fail, ok, replay, requestIdFrom } from '../../../_stub/api-response'
import { DAYCARES } from '../../../_stub/daycares'
import { getReplay, idempotencyKeyFrom, putReplay } from '../../../_stub/idempotency'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function findStubDaycare(daycareId: string) {
  return DAYCARES.find((item) => item.id === daycareId) ?? null
}

type Identity = {
  email: string
  name: string
}

async function getIdentity(): Promise<Identity | null> {
  const session = await auth()
  const user = session?.user
  const email = user?.email?.trim()
  if (!email) return null

  const fallbackName = email.split('@')[0] || '사용자'
  const name = user?.name?.trim() || fallbackName

  return { email, name }
}

async function getOrCreateUserId(identity: Identity): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: identity.email }, select: { id: true } })
  if (existing) {
    if (identity.name) await prisma.user.update({ where: { email: identity.email }, data: { name: identity.name } })
    return existing.id
  }
  const created = await prisma.user.create({
    data: { email: identity.email, name: identity.name || '사용자', provider: 'email' },
    select: { id: true },
  })
  return created.id
}

async function ensureDaycare(daycareId: string) {
  const stub = findStubDaycare(daycareId)
  const data = {
    name: stub?.name ?? daycareId,
    district: stub?.district ?? '미상',
    dong: stub?.dong ?? null,
    type: stub?.type ?? null,
    address: stub?.address ?? null,
    lat: stub?.geo?.lat ?? null,
    lng: stub?.geo?.lng ?? null,
  }

  const existingDaycare = await prisma.daycare.findUnique({ where: { id: daycareId } })
  if (existingDaycare) {
    await prisma.daycare.update({ where: { id: daycareId }, data })
  } else {
    await prisma.daycare.create({ data: { id: daycareId, ...data } })
  }

  return { id: daycareId, ...data }
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const identity = await getIdentity()
  if (!identity) return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)

  try {
    const user = await prisma.user.findUnique({
      where: { email: identity.email },
      select: { id: true },
    })
    if (!user) return ok(requestId, { alerts: [] })

    const subscriptions = await prisma.toAlertSubscription.findMany({
      where: { userId: user.id, enabled: true },
      include: { daycare: { select: { name: true, district: true, dong: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    return ok(requestId, {
      alerts: subscriptions.map((item) => {
        const stub = findStubDaycare(item.daycareId)
        return {
          daycareId: item.daycareId,
          age: item.age,
          name: item.daycare?.name ?? stub?.name ?? null,
          district: item.daycare?.district ?? stub?.district ?? null,
          dong: item.daycare?.dong ?? stub?.dong ?? null,
          enabled: item.enabled,
          enabledAt: item.enabledAt.toISOString(),
          persisted: 'db',
        }
      }),
    })
  } catch {
    return fail(requestId, 'INTERNAL_ERROR', 'TO 알림 조회 중 오류가 발생했습니다.', 500)
  }
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const identity = await getIdentity()
  if (!identity) return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)

  const scope = 'me/alerts/to:post'
  const idempotencyKey = idempotencyKeyFrom(req)
  const replayEntry = getReplay(scope, idempotencyKey)
  if (replayEntry) {
    return replay(requestId, replayEntry.body, replayEntry.status)
  }

  let body: any = null
  try {
    body = await req.json()
  } catch {
    const payload = {
      success: false,
      requestId,
      error: { code: 'INVALID_JSON', message: 'JSON body가 필요합니다.' },
    }
    putReplay(scope, idempotencyKey, 400, payload)
    const response = NextResponse.json(payload, { status: 400 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  const daycareId = String(body?.daycareId ?? '').trim()
  const age = Number(body?.age)

  if (!daycareId) {
    const payload = {
      success: false,
      requestId,
      error: { code: 'VALIDATION_ERROR', message: 'daycareId가 필요합니다.' },
    }
    putReplay(scope, idempotencyKey, 400, payload)
    const response = NextResponse.json(payload, { status: 400 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }
  if (!Number.isFinite(age) || age < 0 || age > 5) {
    const payload = {
      success: false,
      requestId,
      error: { code: 'VALIDATION_ERROR', message: 'age(0~5)가 필요합니다.' },
    }
    putReplay(scope, idempotencyKey, 400, payload)
    const response = NextResponse.json(payload, { status: 400 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  try {
    const userId = await getOrCreateUserId(identity)
    const daycare = await ensureDaycare(daycareId)
    const now = new Date()

    const existingSub = await prisma.toAlertSubscription.findUnique({
      where: { userId_daycareId_age: { userId, daycareId, age } },
    })
    const saved = existingSub
      ? await prisma.toAlertSubscription.update({
          where: { id: existingSub.id },
          data: { enabled: true, enabledAt: now, disabledAt: null },
        })
      : await prisma.toAlertSubscription.create({ data: { userId, daycareId, age, enabled: true, enabledAt: now } })

    const payload = {
      success: true,
      requestId,
      alert: {
        daycareId: saved.daycareId,
        age: saved.age,
        name: daycare.name ?? null,
        enabled: saved.enabled,
        enabledAt: saved.enabledAt.toISOString(),
        persisted: 'db',
      },
    }
    putReplay(scope, idempotencyKey, 200, payload)
    const response = NextResponse.json(payload, { status: 200 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  } catch {
    const payload = {
      success: false,
      requestId,
      error: { code: 'INTERNAL_ERROR', message: 'TO 알림 저장 중 오류가 발생했습니다.' },
    }
    putReplay(scope, idempotencyKey, 500, payload)
    const response = NextResponse.json(payload, { status: 500 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }
})

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const identity = await getIdentity()
  if (!identity) return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)

  const scope = 'me/alerts/to:delete'
  const idempotencyKey = idempotencyKeyFrom(req)
  const replayEntry = getReplay(scope, idempotencyKey)
  if (replayEntry) {
    return replay(requestId, replayEntry.body, replayEntry.status)
  }

  let body: any = null
  try {
    body = await req.json()
  } catch {
    const payload = {
      success: false,
      requestId,
      error: { code: 'INVALID_JSON', message: 'JSON body가 필요합니다.' },
    }
    putReplay(scope, idempotencyKey, 400, payload)
    const response = NextResponse.json(payload, { status: 400 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  const daycareId = String(body?.daycareId ?? '').trim()
  const age = Number(body?.age)
  if (!daycareId) {
    const payload = {
      success: false,
      requestId,
      error: { code: 'VALIDATION_ERROR', message: 'daycareId가 필요합니다.' },
    }
    putReplay(scope, idempotencyKey, 400, payload)
    const response = NextResponse.json(payload, { status: 400 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }
  if (!Number.isFinite(age) || age < 0 || age > 5) {
    const payload = {
      success: false,
      requestId,
      error: { code: 'VALIDATION_ERROR', message: 'age(0~5)가 필요합니다.' },
    }
    putReplay(scope, idempotencyKey, 400, payload)
    const response = NextResponse.json(payload, { status: 400 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  try {
    const userId = await getOrCreateUserId(identity)
    const now = new Date()

    await prisma.toAlertSubscription.updateMany({
      where: { userId, daycareId, age },
      data: { enabled: false, disabledAt: now },
    })

    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
      select: { name: true },
    })
    const stub = findStubDaycare(daycareId)

    const payload = {
      success: true,
      requestId,
      alert: {
        daycareId,
        age,
        name: daycare?.name ?? stub?.name ?? null,
        enabled: false,
        disabledAt: now.toISOString(),
        persisted: 'db',
      },
    }
    putReplay(scope, idempotencyKey, 200, payload)
    const response = NextResponse.json(payload, { status: 200 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  } catch {
    const payload = {
      success: false,
      requestId,
      error: { code: 'INTERNAL_ERROR', message: 'TO 알림 해제 중 오류가 발생했습니다.' },
    }
    putReplay(scope, idempotencyKey, 500, payload)
    const response = NextResponse.json(payload, { status: 500 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }
})
