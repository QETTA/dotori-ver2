import { type NextRequest, NextResponse } from 'next/server'
import { DAYCARES } from '@/app/api/_stub/daycares'
import { withErrorHandling } from '@/lib/api-errors'
import prisma from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function withNoStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store')
  return response
}

function json(payload: unknown, status = 200) {
  return withNoStore(NextResponse.json(payload, { status }))
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'production') {
    return json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not Found' },
      },
      404,
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json(
      {
        success: false,
        error: { code: 'INVALID_JSON', message: 'JSON body가 필요합니다.' },
      },
      400,
    )
  }

  const parsed = body as { daycareId?: unknown; age?: unknown; message?: unknown }
  const daycareId = String(parsed.daycareId ?? '').trim()
  const age = Number(parsed.age)
  const message = typeof parsed.message === 'string' ? parsed.message.trim() || null : null

  if (!daycareId) {
    return json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'daycareId가 필요합니다.' },
      },
      400,
    )
  }

  if (!Number.isInteger(age) || age < 0 || age > 5) {
    return json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'age(0~5)가 필요합니다.' },
      },
      400,
    )
  }

  const stub = DAYCARES.find((item) => item.id === daycareId)
  const daycareData = {
    name: stub?.name ?? daycareId,
    district: stub?.district ?? '미상',
    dong: stub?.dong ?? null,
    type: stub?.type ?? null,
    address: stub?.address ?? null,
    lat: stub?.geo?.lat ?? null,
    lng: stub?.geo?.lng ?? null,
  }

  const existing = await prisma.daycare.findUnique({ where: { id: daycareId } })
  const daycare = existing
    ? await prisma.daycare.update({
        where: { id: daycareId },
        data: daycareData,
        select: { name: true, district: true, dong: true },
      })
    : await prisma.daycare.create({
        data: { id: daycareId, ...daycareData },
        select: { name: true, district: true, dong: true },
      })

  const event = await prisma.toAlertEvent.create({
    data: {
      daycareId,
      age,
      message,
      source: 'debug',
    },
    select: {
      id: true,
      daycareId: true,
      age: true,
      detectedAt: true,
      message: true,
      source: true,
    },
  })

  return json({
    success: true,
    event: {
      id: event.id,
      daycareId: event.daycareId,
      age: event.age,
      detectedAt: event.detectedAt.toISOString(),
      message: event.message,
      source: event.source,
      daycare,
    },
  })
})
