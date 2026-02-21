import { NextResponse } from 'next/server'
import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { facilityFilterSchema, facilityListResponseSchema } from '@/lib/validations'

/** Haversine distance in meters */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const GET = apiHandler({
  auth: false, // public endpoint, but auth gives personalized results
  input: facilityFilterSchema,
  handler: async ({ input, user, request }) => {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'anonymous'
    const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.api)
    if (!rateCheck.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
      return Response.json(
        { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      ) as any
    }

    const { type, ageGroup, sort, q, page = 1, pageSize = 20, lat, lng } = input

    try {
      const where: any = { isActive: true }
      if (type) where.type = type
      if (q)
        where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }]

      // Bounding box filter for geo queries
      if (lat && lng) {
        const radiusKm = 3
        const latDelta = radiusKm / 111
        const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180))
        where.lat = { gte: lat - latDelta, lte: lat + latDelta }
        where.lng = { gte: lng - lngDelta, lte: lng + lngDelta }
      }

      const needsPostSort = sort === 'distance' || sort === 'probability'

      const orderBy: any =
        sort === 'rating' ? { rating: 'desc' } : sort === 'cost' ? { monthlyCost: 'asc' } : { updatedAt: 'desc' }

      const [facilities, total] = await Promise.all([
        prisma.facility.findMany({
          where,
          include: {
            probabilityCache: { orderBy: { calculatedAt: 'desc' }, take: 1 },
            ageClasses: ageGroup ? { where: { ageGroup } } : { take: 4 },
            ...(user ? { favorites: { where: { userId: user.id }, take: 1 } } : {}),
          },
          // For post-sort, fetch all to sort properly before pagination
          ...(needsPostSort ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
          orderBy,
        }),
        prisma.facility.count({ where }),
      ])

      let data = facilities.map((f: any) => {
        const prob = f.probabilityCache?.[0]
        return {
          id: f.id,
          name: f.name,
          type: f.type,
          address: f.address,
          lat: f.lat,
          lng: f.lng,
          capacity: f.capacity,
          currentEnroll: f.currentEnroll,
          phone: f.phone,
          operatingHours: f.operatingHours,
          probability: prob?.probability ?? null,
          grade: prob?.grade ?? null,
          factors: prob?.factors ?? null,
          ageGroups: f.ageClasses,
          isFavorited: user ? f.favorites?.length > 0 : false,
          distanceMeters: lat && lng ? calculateDistance(lat, lng, f.lat, f.lng) : null,
        }
      })

      // Sort by distance or probability, then paginate
      if (sort === 'distance' && lat && lng) {
        data.sort(
          (a, b) => (a.distanceMeters ?? Number.POSITIVE_INFINITY) - (b.distanceMeters ?? Number.POSITIVE_INFINITY),
        )
      } else if (sort === 'probability') {
        data.sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
      }

      if (needsPostSort) {
        data = data.slice((page - 1) * pageSize, page * pageSize)
      }

      const responseData = facilityListResponseSchema.parse(data)
      return ok(responseData, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) })
    } catch (error) {
      console.error('[API] Database error:', error)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'SERVICE_UNAVAILABLE', message: '서비스에 일시적인 문제가 발생했습니다.' },
        },
        { status: 503 },
      )
    }
  },
})
