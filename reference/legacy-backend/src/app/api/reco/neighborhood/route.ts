import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import prisma from '@/lib/db/prisma'
import { DAYCARES, type StubDaycare } from '../../_stub/daycares'
import { makeAsOf, makeRecoItem } from '../../_stub/scoring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams

  const district = (sp.get('district') ?? '').trim() || undefined
  const dong = (sp.get('dong') ?? '').trim() || undefined

  const ageRaw = sp.get('age')
  const age = Number(ageRaw)

  const mode = (sp.get('mode') ?? 'balance') as 'balance' | 'close' | 'low_wait' | 'high_to'

  if (!Number.isFinite(age) || age < 0 || age > 5) {
    return json({ error: 'age(0~5)가 필요합니다.' }, { status: 400 })
  }
  if (!district && !dong) {
    return json({ error: 'district 또는 dong 중 하나는 필요합니다.' }, { status: 400 })
  }

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

  let base: StubDaycare[] = []

  try {
    const where: { district?: string; dong?: string; isActive?: boolean } = { isActive: true }
    if (district) where.district = district
    if (dong) where.dong = dong

    const dbFiltered = await prisma.facility.findMany({
      where,
      take: 100,
    })

    if (dbFiltered.length > 0) {
      base = dbFiltered.map(toScoringInput)
    } else if (district) {
      const dbByDistrict = await prisma.facility.findMany({
        where: { district, isActive: true },
        take: 100,
      })
      if (dbByDistrict.length > 0) {
        base = dbByDistrict.map(toScoringInput)
      }
    }
  } catch {}

  if (base.length === 0) {
    const filtered = DAYCARES.filter((d) => {
      if (district && d.district !== district) return false
      if (dong && d.dong !== dong) return false
      return true
    })
    base = filtered.length ? filtered : DAYCARES.filter((d) => (district ? d.district === district : true))
  }

  const items = base
    .map((d) => makeRecoItem(d, age, mode))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const context = {
    district,
    dong,
    age,
    mode,
    asOf: makeAsOf(120),
  }

  return json({ context, items })
})
