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

/** POST /api/community/reactions — toggle like */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } }, 401)
  }

  const { type, target, targetId } = (await request.json()) as {
    type: 'like' | 'unlike'
    target: 'post' | 'comment'
    targetId: string
  }

  if (!type || !target || !targetId) {
    return json({ success: false, error: { code: 'BAD_REQUEST', message: '필수 항목이 누락되었습니다.' } }, 400)
  }

  try {
    if (target === 'post') {
      if (type === 'like') {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.postLike.findUnique({
            where: { postId_userId: { postId: targetId, userId } },
            select: { postId: true },
          })
          if (!existing) {
            await tx.postLike.create({ data: { postId: targetId, userId } })
            await tx.communityPost.update({
              where: { id: targetId },
              data: { likeCount: { increment: 1 } },
            })
          }
        })
      } else {
        await prisma.$transaction(async (tx) => {
          const deleted = await tx.postLike.deleteMany({
            where: { postId: targetId, userId },
          })
          if (deleted.count > 0) {
            await tx.communityPost.update({
              where: { id: targetId },
              data: { likeCount: { decrement: 1 } },
            })
          }
        })
      }
    } else {
      if (type === 'like') {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.commentLike.findUnique({
            where: { commentId_userId: { commentId: targetId, userId } },
            select: { commentId: true },
          })
          if (!existing) {
            await tx.commentLike.create({ data: { commentId: targetId, userId } })
            await tx.communityComment.update({
              where: { id: targetId },
              data: { likeCount: { increment: 1 } },
            })
          }
        })
      } else {
        await prisma.$transaction(async (tx) => {
          const deleted = await tx.commentLike.deleteMany({
            where: { commentId: targetId, userId },
          })
          if (deleted.count > 0) {
            await tx.communityComment.update({
              where: { id: targetId },
              data: { likeCount: { decrement: 1 } },
            })
          }
        })
      }
    }

    return json({ success: true })
  } catch {
    return json(
      {
        success: false,
        error: {
          code: 'DB_UNAVAILABLE',
          message: '현재 반응 처리 기능을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
        },
      },
      503,
    )
  }
})
