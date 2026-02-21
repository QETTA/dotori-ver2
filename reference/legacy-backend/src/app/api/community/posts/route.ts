import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(payload: unknown, status = 200) {
  const res = NextResponse.json(payload, { status })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

/** GET /api/community/posts — list posts */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'anonymous'
  const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.api)
  if (!rateCheck.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
    return Response.json(
      { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const sp = request.nextUrl.searchParams
  const neighborhoodId = sp.get('neighborhoodId')
  const sort = sp.get('sort') ?? 'latest'
  const limit = Math.min(Number(sp.get('take') ?? sp.get('limit')) || 20, 50)
  const cursor = sp.get('cursor') ?? undefined

  const where: any = {}
  if (neighborhoodId) where.neighborhoodId = neighborhoodId

  const orderBy =
    sort === 'hot' ? [{ likeCount: 'desc' as const }, { createdAt: 'desc' as const }] : [{ createdAt: 'desc' as const }]

  try {
    const posts = await prisma.communityPost.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        aliases: { select: { userId: true, aliasNo: true } },
        neighborhood: { select: { district: true, dong: true } },
      },
    })

    const hasMore = posts.length > limit
    if (hasMore) posts.pop()

    const items = posts.map((p) => {
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

    return json({
      success: true,
      items,
      nextCursor: hasMore ? posts[posts.length - 1]?.id : null,
    })
  } catch {
    return json({
      success: true,
      degraded: true,
      items: [],
      nextCursor: null,
    })
  }
})

/** POST /api/community/posts — create post */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'anonymous'
  const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.api)
  if (!rateCheck.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
    return Response.json(
      { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } }, 401)
  }

  const body = await request.json()
  const {
    neighborhoodId,
    title,
    body: postBody,
  } = body as {
    neighborhoodId: string
    title?: string
    body: string
  }

  if (!neighborhoodId || !postBody?.trim()) {
    return json({ success: false, error: { code: 'BAD_REQUEST', message: '필수 항목이 누락되었습니다.' } }, 400)
  }

  try {
    const post = await prisma.communityPost.create({
      data: {
        neighborhoodId,
        authorId: userId,
        title: title?.trim() || null,
        body: postBody.trim(),
      },
    })

    // Create ThreadAlias for author with aliasNo=1
    await prisma.threadAlias.create({
      data: { postId: post.id, userId, aliasNo: 1 },
    })

    return json({ success: true, post: { id: post.id } }, 201)
  } catch {
    return json(
      {
        success: false,
        error: { code: 'DB_UNAVAILABLE', message: '현재 커뮤니티 쓰기 기능을 일시적으로 사용할 수 없습니다.' },
      },
      503,
    )
  }
})
