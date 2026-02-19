import { type NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/api-errors'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db/prisma'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

async function apiGuard() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new UnauthorizedError()
  }
  return session.user
}

export async function POST(request: NextRequest) {
  try {
    const user = await apiGuard()

    const body = (await request.json()) as unknown
    const { endpoint, keys } = subscribeSchema.parse(body)

    await prisma.deviceToken.upsert({
      where: {
        userId_endpoint: {
          userId: user.id!,
          endpoint,
        },
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get('user-agent') ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id!,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        platform: 'web',
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered',
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(new ValidationError('body', error.errors[0]?.message ?? '입력값이 올바르지 않습니다.'))
    }
    return errorResponse(error instanceof Error ? error : new Error('Subscription failed'))
  }
}
