import { type NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/api-errors'
import { auth } from '@/lib/auth'
import { sendPushToUser } from '@/lib/push'

const pushRequestSchema = z.object({
  userId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  url: z.string().trim().optional(),
})

async function apiGuard() {
  const session = await auth()
  if (!session?.user?.email || session.user.role !== 'admin') {
    throw new UnauthorizedError()
  }
  return session.user
}

export async function POST(request: NextRequest) {
  try {
    await apiGuard()

    const body = (await request.json()) as unknown
    const payload = pushRequestSchema.parse(body)

    const sent = await sendPushToUser(payload.userId, {
      title: payload.title,
      body: payload.body,
      url: payload.url,
    })

    return NextResponse.json({
      success: true,
      message: `Push notification sent to ${sent} device(s)`,
      sent,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(new ValidationError('body', error.errors[0]?.message ?? '입력값이 올바르지 않습니다.'))
    }
    return errorResponse(error instanceof Error ? error : new Error('Push notification request failed'))
  }
}
