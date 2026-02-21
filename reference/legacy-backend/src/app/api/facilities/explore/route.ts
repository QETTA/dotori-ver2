import { type NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-errors'
import prisma from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const lat = Number(searchParams.get('lat') || '37.5665')
    const lng = Number(searchParams.get('lng') || '126.978')
    const radius = Number(searchParams.get('radius') || '1000')
    const ageGroup = searchParams.get('ageGroup') || undefined
    const hasTO = searchParams.get('hasTO') === 'true' ? true : undefined
    const type = searchParams.get('type') || undefined
    const q = searchParams.get('q') || undefined
    const page = Number(searchParams.get('page') || '1')
    const pageSize = 30

    const where: Record<string, unknown> = { isActive: true }
    if (type) where.type = type
    if (q) {
      where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }]
    }

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        probabilityCache: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        ageClasses: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize * 2,
    })

    const filtered = facilities
      .map((f) => ({
        ...f,
        distance: haversineDistance(lat, lng, f.lat ?? 0, f.lng ?? 0),
      }))
      .filter((f) => f.distance <= radius)
      .filter((f) => {
        if (hasTO && (f.currentEnroll ?? 0) >= (f.capacity ?? 0)) return false
        if (ageGroup && !f.ageClasses?.some((ac) => ac.ageGroup === ageGroup)) return false
        return true
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, pageSize)

    const data = filtered.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      address: f.address,
      lat: f.lat,
      lng: f.lng,
      capacity: f.capacity,
      currentEnroll: f.currentEnroll,
      probability: (f.probabilityCache as any)?.[0]?.probability ?? null,
      grade: (f.probabilityCache as any)?.[0]?.grade ?? null,
      distance: Math.round(f.distance),
    }))

    return NextResponse.json({ data, count: data.length })
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err : new Error('Failed to fetch facilities'))
  }
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
