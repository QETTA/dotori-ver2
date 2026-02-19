import { z } from 'zod'
import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'

const querySchema = z.object({
  action: z.string().optional(),
  entity: z.string().optional(),
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const GET = apiHandler({
  auth: 'admin',
  input: querySchema,
  handler: async ({ input, requestId }) => {
    const where: Record<string, unknown> = {}

    if (input.action) where.action = input.action
    if (input.entity) where.entity = input.entity
    if (input.userId) where.userId = input.userId
    if (input.from || input.to) {
      where.createdAt = {
        ...(input.from && { gte: new Date(input.from) }),
        ...(input.to && { lte: new Date(input.to) }),
      }
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      }),
      prisma.auditLog.count({ where }),
    ])

    return ok({ data, total, limit: input.limit, offset: input.offset }, undefined, requestId)
  },
})
