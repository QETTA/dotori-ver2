import { type NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/api-errors'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db/prisma'

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

async function apiGuard() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new UnauthorizedError()
  }
  return session.user
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await apiGuard()

    const body = (await request.json()) as unknown
    const { endpoint } = unsubscribeSchema.parse(body)

    await prisma.deviceToken.deleteMany({
      where: {
        userId: user.id!,
        endpoint,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed',
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(new ValidationError('body', error.errors[0]?.message ?? '입력값이 올바르지 않습니다.'))
    }
    return errorResponse(error instanceof Error ? error : new Error('Unsubscription failed'))
  }
}
