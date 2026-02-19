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
    if (!user) return ok(requestId, { firstChoice: null })

    const fc = await prisma.userFirstChoice.findUnique({
      where: { userId: user.id },
      include: { daycare: { select: { name: true, district: true, dong: true } } },
    })

    if (!fc) return ok(requestId, { firstChoice: null })

    const stub = findStubDaycare(fc.daycareId)
    return ok(requestId, {
      firstChoice: {
        daycareId: fc.daycareId,
        age: fc.age,
        name: fc.daycare?.name ?? stub?.name ?? null,
        district: fc.daycare?.district ?? stub?.district ?? null,
        dong: fc.daycare?.dong ?? stub?.dong ?? null,
        savedAt: fc.updatedAt.toISOString(),
        persisted: 'db',
      },
    })
  } catch {
    return fail(requestId, 'INTERNAL_ERROR', '1지망 조회 중 오류가 발생했습니다.', 500)
  }
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const requestId = requestIdFrom(req)
  const identity = await getIdentity()
  if (!identity) return fail(requestId, 'UNAUTHORIZED', '인증이 필요합니다.', 401)

  const scope = 'me/preferences/first-choice:post'
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

    const existingFC = await prisma.userFirstChoice.findUnique({ where: { userId } })
    const saved = existingFC
      ? await prisma.userFirstChoice.update({ where: { userId }, data: { daycareId, age } })
      : await prisma.userFirstChoice.create({ data: { userId, daycareId, age } })

    const payload = {
      success: true,
      requestId,
      firstChoice: {
        daycareId: saved.daycareId,
        age: saved.age,
        name: daycare.name ?? null,
        district: daycare.district ?? null,
        dong: daycare.dong ?? null,
        savedAt: saved.updatedAt.toISOString(),
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
      error: { code: 'INTERNAL_ERROR', message: '1지망 저장 중 오류가 발생했습니다.' },
    }
    putReplay(scope, idempotencyKey, 500, payload)
    const response = NextResponse.json(payload, { status: 500 })
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', requestId)
    return response
  }
})
