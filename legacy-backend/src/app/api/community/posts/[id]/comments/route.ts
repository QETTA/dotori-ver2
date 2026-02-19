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

/** POST /api/community/posts/[id]/comments — create comment */
export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } }, 401)
  }

  const { id: postId } = await params
  const { body } = (await request.json()) as { body: string }

  if (!body?.trim()) {
    return json({ success: false, error: { code: 'BAD_REQUEST', message: '댓글 내용을 입력해주세요.' } }, 400)
  }

  try {
    // Check post exists
    const post = await prisma.communityPost.findUnique({ where: { id: postId } })
    if (!post) {
      return json({ success: false, error: { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } }, 404)
    }

    // Auto-assign ThreadAlias if not exists
    let alias = await prisma.threadAlias.findUnique({
      where: { postId_userId: { postId, userId } },
    })

    if (!alias) {
      // Get max aliasNo for this post
      const maxAlias = await prisma.threadAlias.findFirst({
        where: { postId },
        orderBy: { aliasNo: 'desc' },
      })
      const nextNo = (maxAlias?.aliasNo ?? 0) + 1
      alias = await prisma.threadAlias.create({
        data: { postId, userId, aliasNo: nextNo },
      })
    }

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.communityComment.create({
        data: { postId, authorId: userId, body: body.trim() },
      })
      await tx.communityPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      })
      return created
    })

    return json(
      {
        success: true,
        comment: {
          id: comment.id,
          alias: `익명${alias.aliasNo}`,
          body: comment.body,
          likeCount: 0,
          createdAt: comment.createdAt.toISOString(),
        },
      },
      201,
    )
  } catch {
    return json(
      {
        success: false,
        error: {
          code: 'DB_UNAVAILABLE',
          message: '현재 댓글 작성 기능을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
        },
      },
      503,
    )
  }
})
