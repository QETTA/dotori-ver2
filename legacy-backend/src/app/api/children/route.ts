import { z } from 'zod'
import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const createChildSchema = z.object({
  name: z.string().min(1).max(20),
  birthDate: z.string().datetime(),
  gender: z.string().optional(),
  note: z.string().max(200).optional(),
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

    const children = await prisma.child.findMany({
      where: { userId: user!.id },
      include: { waitlist: { include: { facility: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return ok(children)
  },
})

export const POST = apiHandler({
  auth: true,
  input: createChildSchema,
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

    const count = await prisma.child.count({ where: { userId: user!.id } })
    if (count >= 5) {
      return Response.json(
        { success: false, error: { code: 'LIMIT_EXCEEDED', message: '자녀는 최대 5명까지 등록할 수 있습니다.' } },
        { status: 400 },
      ) as any
    }

    const child = await prisma.child.create({
      data: {
        userId: user!.id,
        name: input.name,
        birthDate: new Date(input.birthDate),
        gender: input.gender,
        note: input.note,
      },
    })
    return ok(child)
  },
})
