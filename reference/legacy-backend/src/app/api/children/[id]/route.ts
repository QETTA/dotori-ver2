import { z } from 'zod'
import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const updateChildSchema = z.object({
  name: z.string().min(1).max(20).optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.string().optional(),
  note: z.string().max(200).optional(),
})

export const GET = apiHandler({
  auth: true,
  handler: async ({ user, params }) => {
    const child = await prisma.child.findFirst({
      where: { id: params!.id, userId: user!.id },
      include: { waitlist: { include: { facility: true } } },
    })
    if (!child) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: '자녀를 찾을 수 없습니다.' } },
        { status: 404 },
      ) as any
    }
    return ok(child)
  },
})

export const PUT = apiHandler({
  auth: true,
  input: updateChildSchema,
  handler: async ({ input, user, params, request }) => {
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

    const existing = await prisma.child.findFirst({ where: { id: params!.id, userId: user!.id } })
    if (!existing) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: '자녀를 찾을 수 없습니다.' } },
        { status: 404 },
      ) as any
    }

    const child = await prisma.child.update({
      where: { id: params!.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.birthDate !== undefined && { birthDate: new Date(input.birthDate) }),
        ...(input.gender !== undefined && { gender: input.gender }),
        ...(input.note !== undefined && { note: input.note }),
      },
    })
    return ok(child)
  },
})

export const DELETE = apiHandler({
  auth: true,
  handler: async ({ user, params }) => {
    const existing = await prisma.child.findFirst({ where: { id: params!.id, userId: user!.id } })
    if (!existing) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: '자녀를 찾을 수 없습니다.' } },
        { status: 404 },
      ) as any
    }

    await prisma.child.delete({ where: { id: params!.id } })
    return ok({ deleted: true })
  },
})
