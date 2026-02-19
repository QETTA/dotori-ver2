import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { favoriteListResponseSchema, favoriteToggleResponseSchema, toggleFavoriteSchema } from '@/lib/validations'

export const GET = apiHandler({
  auth: true,
  handler: async ({ user, request }) => {
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

    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId: user!.id },
        include: { facility: { include: { probabilityCache: { orderBy: { calculatedAt: 'desc' }, take: 1 } } } },
        orderBy: { createdAt: 'desc' },
      })
      const responseData = favoriteListResponseSchema.parse(
        favorites.map((f: any) => ({
          id: f.id,
          facilityId: f.facilityId,
          facility: {
            name: f.facility.name,
            type: f.facility.type,
            probability: f.facility.probabilityCache?.[0]?.probability,
            grade: f.facility.probabilityCache?.[0]?.grade,
          },
          createdAt: f.createdAt.toISOString(),
        })),
      )
      return ok(responseData)
    } catch {
      return ok(favoriteListResponseSchema.parse([]))
    }
  },
})

export const POST = apiHandler({
  auth: true,
  input: toggleFavoriteSchema,
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

    try {
      const existing = await prisma.favorite.findFirst({ where: { userId: user!.id, facilityId: input.facilityId } })
      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } })
        return ok(favoriteToggleResponseSchema.parse({ action: 'removed', facilityId: input.facilityId }))
      }
      await prisma.favorite.create({ data: { userId: user!.id, facilityId: input.facilityId } })
      return ok(favoriteToggleResponseSchema.parse({ action: 'added', facilityId: input.facilityId }))
    } catch (error) {
      console.error('[API] Database error:', error)
      return Response.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: '서비스에 일시적인 문제가 발생했습니다.' } },
        { status: 503 },
      ) as any
    }
  },
})
