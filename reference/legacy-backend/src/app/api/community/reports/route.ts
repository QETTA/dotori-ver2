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

/** POST /api/community/reports — report post or comment */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } }, 401)
  }

  const { target, targetId, reason } = (await request.json()) as {
    target: 'post' | 'comment'
    targetId: string
    reason?: string
  }

  if (!target || !targetId) {
    return json({ success: false, error: { code: 'BAD_REQUEST', message: '필수 항목이 누락되었습니다.' } }, 400)
  }

  try {
    if (target === 'post') {
      await prisma.postReport.create({
        data: { postId: targetId, userId, reason: reason ?? null },
      })
      await prisma.communityPost.update({
        where: { id: targetId },
        data: { reportCount: { increment: 1 } },
      })
    } else {
      await prisma.commentReport.create({
        data: { commentId: targetId, userId, reason: reason ?? null },
      })
      await prisma.communityComment.update({
        where: { id: targetId },
        data: { reportCount: { increment: 1 } },
      })
    }
  } catch (e: any) {
    // Duplicate report — unique constraint
    if (e?.code === 'P2002') {
      return json({ success: false, error: { code: 'DUPLICATE', message: '이미 신고한 항목입니다.' } }, 409)
    }
    return json(
      {
        success: false,
        error: { code: 'DB_UNAVAILABLE', message: '현재 신고 기능을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.' },
      },
      503,
    )
  }

  return json({ success: true })
})
