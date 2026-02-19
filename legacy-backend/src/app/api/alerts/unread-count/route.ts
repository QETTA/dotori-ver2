import { NextResponse } from 'next/server'
import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'

export const GET = apiHandler({
  auth: true,
  handler: async ({ user }) => {
    try {
      const count = await prisma.alert.count({
        where: { userId: user!.id, isRead: false },
      })
      return ok({ count })
    } catch {
      return NextResponse.json({ success: true, data: { count: 0 } })
    }
  },
})
