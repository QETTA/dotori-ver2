import { z } from 'zod'
import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const createWaitlistSchema = z.object({
  facilityId: z.string().min(1),
  childId: z.string().min(1),
  ageGroup: z.string().min(1),
})

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

    const entries = await prisma.waitlistEntry.findMany({
      where: { userId: user!.id },
      include: { facility: true, child: true },
      orderBy: { appliedAt: 'desc' },
    })
    return ok(entries)
  },
})

export const POST = apiHandler({
  auth: true,
  input: createWaitlistSchema,
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

    // Verify child ownership
    const child = await prisma.child.findFirst({ where: { id: input.childId, userId: user!.id } })
    if (!child) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: '자녀를 찾을 수 없습니다.' } },
        { status: 404 },
      ) as any
    }

    // Check duplicate
    const existing = await prisma.waitlistEntry.findFirst({
      where: { userId: user!.id, facilityId: input.facilityId, childId: input.childId },
    })
    if (existing) {
      return Response.json(
        { success: false, error: { code: 'DUPLICATE', message: '이미 대기 신청한 시설입니다.' } },
        { status: 409 },
      ) as any
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        userId: user!.id,
        facilityId: input.facilityId,
        childId: input.childId,
        ageGroup: input.ageGroup,
      },
      include: { facility: true, child: true },
    })
    return ok(entry)
  },
})

export const DELETE = apiHandler({
  auth: true,
  handler: async ({ user, request }) => {
    const url = new URL(request.url)
    const entryId = url.searchParams.get('id')
    if (!entryId) {
      return Response.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'id 파라미터가 필요합니다.' } },
        { status: 400 },
      ) as any
    }

    const existing = await prisma.waitlistEntry.findFirst({ where: { id: entryId, userId: user!.id } })
    if (!existing) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: '대기 항목을 찾을 수 없습니다.' } },
        { status: 404 },
      ) as any
    }

    await prisma.waitlistEntry.delete({ where: { id: entryId } })
    return ok({ deleted: true })
  },
})
