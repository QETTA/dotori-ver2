import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import prisma from '@/lib/db/prisma'
import { DAYCARES, type StubDaycare } from '../../_stub/daycares'
import { makeAnalysis } from '../../_stub/scoring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams

  const daycareId = (sp.get('daycareId') ?? '').trim()
  const ageRaw = sp.get('age')
  const age = Number(ageRaw)

  if (!daycareId) return json({ error: 'daycareId가 필요합니다.' }, { status: 400 })
  if (!Number.isFinite(age) || age < 0 || age > 5) return json({ error: 'age(0~5)가 필요합니다.' }, { status: 400 })

  const toScoringInput = (d: {
    id: string
    name: string
    district: string
    dong: string | null
    type: string | null
    address: string | null
    lat: number | null
    lng: number | null
  }): StubDaycare => ({
    id: d.id,
    name: d.name,
    district: d.district,
    dong: d.dong ?? undefined,
    type: (d.type ?? undefined) as '국공립' | '민간' | '가정' | '직장' | '기타' | undefined,
    address: d.address ?? undefined,
    geo: d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : undefined,
  })

  let daycare: StubDaycare | null = null

  try {
    const dbDaycare = await prisma.facility.findFirst({
      where: { id: daycareId, isActive: true },
    })
    if (dbDaycare) {
      daycare = toScoringInput(dbDaycare)
    }
  } catch {}

  if (!daycare) {
    daycare = DAYCARES.find((x) => x.id === daycareId) ?? null
  }

  if (!daycare) return json({ error: '해당 daycareId를 찾지 못했습니다.' }, { status: 404 })

  const result = makeAnalysis(daycare, age)
  return json(result)
})
