import type { Prisma } from '@prisma/client'
import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import prisma from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(payload: unknown, status = 200) {
  const res = NextResponse.json(payload, { status })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

/** GET /api/community/posts/[id] — single post with comments */
type CommunityPostWithRelations = Prisma.CommunityPostGetPayload<{
  include: {
    aliases: {
      select: {
        userId: true
        aliasNo: true
      }
    }
    neighborhood: {
      select: {
        district: true
        dong: true
      }
    }
    comments: {
      orderBy: {
        createdAt: 'asc'
      }
      select: {
        id: true
        authorId: true
        body: true
        likeCount: true
        reportCount: true
        createdAt: true
      }
    }
  }
}>

export const GET = withErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  let post: CommunityPostWithRelations | null = null
  try {
    post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        aliases: { select: { userId: true, aliasNo: true } },
        neighborhood: { select: { district: true, dong: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            authorId: true,
            body: true,
            likeCount: true,
            reportCount: true,
            createdAt: true,
          },
        },
      },
    })
  } catch {
    return json({
      success: true,
      degraded: true,
      post: null,
      comments: [],
    })
  }

  if (!post) {
    return json({ success: false, error: { code: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } }, 404)
  }

  const aliasMap = new Map(post.aliases.map((a) => [a.userId, a.aliasNo]))

  const comments = post.comments.map((c) => ({
    id: c.id,
    alias: `익명${aliasMap.get(c.authorId) ?? '?'}`,
    body: c.body,
    likeCount: c.likeCount,
    createdAt: c.createdAt.toISOString(),
  }))

  const authorAlias = aliasMap.get(post.authorId) ?? 1

  return json({
    success: true,
    post: {
      id: post.id,
      neighborhoodId: post.neighborhoodId,
      district: post.neighborhood.district,
      dong: post.neighborhood.dong,
      title: post.title,
      body: post.body,
      alias: `익명${authorAlias}`,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
    },
    comments,
  })
})
