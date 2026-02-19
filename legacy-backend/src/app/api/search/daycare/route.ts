import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import prisma from '@/lib/db/prisma'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { DAYCARES } from '../../_stub/daycares'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'anonymous'
  const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.search)
  if (!rateCheck.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
    return Response.json(
      { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const sp = req.nextUrl.searchParams
  const q = (sp.get('q') ?? '').trim()
  const limitRaw = sp.get('limit') ?? '5'
  const limit = Math.max(1, Math.min(20, Number(limitRaw) || 5))

  if (q.length < 2) return json({ items: [] })

  const seen = new Set<string>()
  const items: Array<{
    id: string
    name: string
    district: string
    dong?: string | null
    type?: string | null
    address?: string | null
    geo?: { lat: number; lng: number } | undefined
  }> = []

  try {
    const dbItems = await prisma.facility.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { district: { contains: q, mode: 'insensitive' } },
          { dong: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    for (const d of dbItems) {
      if (seen.has(d.id)) continue
      seen.add(d.id)
      items.push({
        id: d.id,
        name: d.name,
        district: d.district,
        dong: d.dong,
        type: d.type,
        address: d.address,
        geo: { lat: d.lat, lng: d.lng },
      })
      if (items.length >= limit) break
    }
  } catch {}

  if (items.length < limit) {
    const lower = q.toLowerCase()
    for (const d of DAYCARES) {
      const hay = `${d.name} ${d.district} ${d.dong ?? ''} ${d.address ?? ''}`.toLowerCase()
      if (!hay.includes(lower)) continue
      if (seen.has(d.id)) continue
      seen.add(d.id)
      items.push({
        id: d.id,
        name: d.name,
        district: d.district,
        dong: d.dong,
        type: d.type,
        address: d.address,
        geo: d.geo,
      })
      if (items.length >= limit) break
    }
  }

  return json({ items })
})
