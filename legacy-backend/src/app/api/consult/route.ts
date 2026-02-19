import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { consultCreateResponseSchema, consultListResponseSchema, createConsultSchema } from '@/lib/validations'

export const GET = apiHandler({
  auth: true,
  handler: async ({ user }) => {
    try {
      const consults = await prisma.consult.findMany({
        where: { userId: user!.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      return ok(consultListResponseSchema.parse(consults))
    } catch {
      return ok(consultListResponseSchema.parse([]))
    }
  },
})

export const POST = apiHandler({
  auth: true,
  input: createConsultSchema,
  handler: async ({ input, user }) => {
    try {
      const consult = await prisma.consult.create({
        data: { userId: user!.id, type: input.type, status: 'pending', summary: input.notes },
      })
      return ok(consultCreateResponseSchema.parse(consult))
    } catch (error) {
      console.error('[API] Database error:', error)
      return Response.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: '서비스에 일시적인 문제가 발생했습니다.' } },
        { status: 503 },
      ) as any
    }
  },
})
