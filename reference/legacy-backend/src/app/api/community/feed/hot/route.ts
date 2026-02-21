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

/** GET /api/community/feed/hot — hot feed sorted by weighted score */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const sp = request.nextUrl.searchParams
  const neighborhoodId = sp.get('neighborhoodId')
  const limit = Math.min(Number(sp.get('take') ?? sp.get('limit')) || 20, 50)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const where: any = { createdAt: { gte: sevenDaysAgo } }
  if (neighborhoodId) where.neighborhoodId = neighborhoodId

  try {
    const posts = await prisma.communityPost.findMany({
      where,
      include: {
        aliases: { select: { userId: true, aliasNo: true } },
        neighborhood: { select: { district: true, dong: true } },
      },
      orderBy: [{ likeCount: 'desc' }, { commentCount: 'desc' }, { createdAt: 'desc' }],
      take: limit * 2, // fetch more to re-sort by score
    })

    // Re-sort by weighted score: likeCount*3 + commentCount*2
    posts.sort((a, b) => {
      const scoreA = a.likeCount * 3 + a.commentCount * 2
      const scoreB = b.likeCount * 3 + b.commentCount * 2
      return scoreB - scoreA
    })

    const items = posts.slice(0, limit).map((p) => {
      const authorAlias = p.aliases.find((a) => a.userId === p.authorId)
      return {
        id: p.id,
        neighborhoodId: p.neighborhoodId,
        district: p.neighborhood.district,
        dong: p.neighborhood.dong,
        title: p.title,
        body: p.body.length > 120 ? `${p.body.slice(0, 120)}...` : p.body,
        alias: `익명${authorAlias?.aliasNo ?? 1}`,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        createdAt: p.createdAt.toISOString(),
      }
    })

    return json({ success: true, items })
  } catch {
    return json({ success: true, degraded: true, items: [] })
  }
})
