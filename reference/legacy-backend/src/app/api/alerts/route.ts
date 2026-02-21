import { NextResponse } from 'next/server'
import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import {
  alertFilterSchema,
  alertListResponseSchema,
  alertMarkReadResponseSchema,
  markAlertReadSchema,
} from '@/lib/validations'

export const GET = apiHandler({
  auth: true,
  input: alertFilterSchema,
  handler: async ({ input, user }) => {
    const { type, page = 1, pageSize = 20 } = input
    try {
      const where: any = { userId: user!.id }
      if (type) where.type = type

      const [alerts, total] = await Promise.all([
        prisma.alert.findMany({
          where,
          include: { facility: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.alert.count({ where }),
      ])

      const responseData = alertListResponseSchema.parse(
        alerts.map((a: any) => ({
          id: a.id,
          type: a.type,
          title: a.type === 'to' ? 'TO 발생!' : a.type === 'probability' ? '확률 변동' : '공지',
          body: a.body,
          facilityName: a.facility?.name,
          isRead: a.isRead,
          createdAt: a.createdAt.toISOString(),
        })),
      )
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

export const PATCH = apiHandler({
  auth: true,
  input: markAlertReadSchema,
  handler: async ({ input, user }) => {
    try {
      if (input.markAllRead) {
        await prisma.alert.updateMany({
          where: { userId: user!.id, isRead: false },
          data: { isRead: true },
        })
        return ok(alertMarkReadResponseSchema.parse({ marked: 'all' }))
      }
      if (input.alertId) {
        await prisma.alert.update({
          where: { id: input.alertId, userId: user!.id },
          data: { isRead: true },
        })
        return ok(alertMarkReadResponseSchema.parse({ marked: input.alertId }))
      }
      return ok(alertMarkReadResponseSchema.parse({ marked: null }))
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
