import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(payload: unknown, status = 200) {
  const res = NextResponse.json(payload, { status })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

/** POST /api/community/neighborhoods — find or create neighborhood */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } }, 401)
  }

  const { district, dong } = (await request.json()) as { district: string; dong: string }

  if (!district?.trim() || !dong?.trim()) {
    return json({ success: false, error: { code: 'BAD_REQUEST', message: '구와 동을 입력해주세요.' } }, 400)
  }

  try {
    const neighborhood = await prisma.neighborhood.upsert({
      where: { city_district_dong: { city: '서울', district: district.trim(), dong: dong.trim() } },
      create: { city: '서울', district: district.trim(), dong: dong.trim() },
      update: {},
    })

    return json({ success: true, id: neighborhood.id })
  } catch {
    return json(
      {
        success: false,
        error: {
          code: 'DB_UNAVAILABLE',
          message: '현재 동네 설정 기능을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
        },
      },
      503,
    )
  }
})
