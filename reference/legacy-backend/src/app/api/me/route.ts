import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function withNoStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store')
  return response
}

function json(payload: unknown, status = 200) {
  return withNoStore(NextResponse.json(payload, { status }))
}

export const GET = withErrorHandling(async () => {
  const session = await auth()
  const email = session?.user?.email?.trim()

  if (!email) {
    return json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      },
      401,
    )
  }

  const fallbackResponse = {
    success: true,
    degraded: true,
    source: 'session-only',
    user: {
      id: (session?.user as any)?.id ?? email,
      name: session?.user?.name ?? email.split('@')[0],
      email,
      avatar: session?.user?.image ?? null,
    },
    firstChoice: null,
    toAlerts: [],
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        firstChoices: {
          select: {
            daycareId: true,
            age: true,
            updatedAt: true,
            daycare: {
              select: {
                id: true,
                name: true,
                district: true,
                dong: true,
              },
            },
          },
        },
        toAlertSubscriptions: {
          where: { enabled: true },
          orderBy: { updatedAt: 'desc' },
          select: {
            daycareId: true,
            age: true,
            enabled: true,
            updatedAt: true,
            daycare: {
              select: {
                id: true,
                name: true,
                district: true,
                dong: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return json(fallbackResponse)
    }

    const firstChoiceSource = user.firstChoices[0] ?? null
    const firstChoice = firstChoiceSource
      ? {
          daycareId: firstChoiceSource.daycare?.id ?? firstChoiceSource.daycareId,
          age: firstChoiceSource.age,
          updatedAt: firstChoiceSource.updatedAt.toISOString(),
          name: firstChoiceSource.daycare?.name ?? null,
          district: firstChoiceSource.daycare?.district ?? null,
          dong: firstChoiceSource.daycare?.dong ?? null,
        }
      : null

    const toAlerts = user.toAlertSubscriptions.map((item) => ({
      daycareId: item.daycare?.id ?? item.daycareId,
      age: item.age,
      enabled: item.enabled,
      updatedAt: item.updatedAt.toISOString(),
      name: item.daycare?.name ?? null,
      district: item.daycare?.district ?? null,
      dong: item.daycare?.dong ?? null,
    }))

    return json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
      },
      firstChoice,
      toAlerts,
    })
  } catch {
    return json(fallbackResponse)
  }
})
