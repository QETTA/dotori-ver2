import { NextResponse } from 'next/server'
import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { searchResultListSchema, searchSchema } from '@/lib/validations'

export const GET = apiHandler({
  auth: false,
  input: searchSchema,
  handler: async ({ input, request }) => {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'anonymous'
    const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.search)
    if (!rateCheck.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
      return Response.json(
        { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      ) as any
    }

    const { q, limit = 10 } = input
    try {
      const [facilities, alerts] = await Promise.all([
        prisma.facility.findMany({
          where: {
            OR: [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }],
            isActive: true,
          },
          include: { probabilityCache: { orderBy: { calculatedAt: 'desc' }, take: 1 } },
          take: limit,
        }),
        prisma.tOEvent.findMany({
          where: { OR: [{ reason: { contains: q, mode: 'insensitive' } }] },
          take: Math.floor(limit / 2),
        }),
      ])
      const results = [
        ...facilities.map((f: any) => ({
          type: 'facility' as const,
          id: f.id,
          title: f.name,
          subtitle: `${f.type} · ${f.address}`,
          href: `/facility/${f.id}`,
          grade: f.probabilityCache?.[0]?.grade,
          probability: f.probabilityCache?.[0]?.probability,
        })),
        ...alerts.map((a: any) => ({
          type: 'alert' as const,
          id: a.id,
          title: 'TO 발생',
          subtitle: a.reason ?? `${a.ageGroup} ${a.slots}자리`,
          href: '/alerts',
        })),
      ]
      const responseData = searchResultListSchema.parse(results.slice(0, limit))
      return ok(responseData)
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
