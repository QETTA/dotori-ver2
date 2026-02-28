'use client'

/**
 * Community Detail Page — Real data (R38)
 */
import { useState, use } from 'react'
import { motion } from 'motion/react'
import { Heart } from 'lucide-react'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { Badge } from '@/components/catalyst/badge'
import { Avatar } from '@/components/catalyst/avatar'
import { Textarea } from '@/components/catalyst/textarea'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import { FacilityTagLink } from '@/components/dotori/FacilityTagLink'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'
import { scrollFadeIn } from '@/lib/motion'
import { useCommunityDetail } from '@/hooks/use-community-detail'
import { useComments } from '@/hooks/use-comments'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/dotori/ToastProvider'

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { post, isLoading: postLoading, error: postError, refetch: refetchPost } = useCommunityDetail(id)
  const { comments, total: commentTotal, isLoading: commentsLoading, postComment } = useComments(id)
  const { addToast } = useToast()
  const [comment, setComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  const handleLikeToggle = async () => {
    const prevLiked = liked
    setLiked(!liked) // optimistic: 즉시 UI 반영
    try {
      await apiFetch(`/api/community/posts/${id}/like`, {
        method: prevLiked ? 'DELETE' : 'POST',
      })
      refetchPost()
    } catch {
      setLiked(prevLiked) // rollback on failure
      addToast({ type: 'error', message: '좋아요에 실패했어요' })
    }
  }

  const handleCommentSubmit = async () => {
    if (!comment.trim() || submittingComment) return
    setSubmittingComment(true)
    try {
      await postComment(comment.trim())
      setComment('')
      addToast({ type: 'success', message: '댓글이 등록되었어요' })
    } catch {
      addToast({ type: 'error', message: '댓글 등록에 실패했어요' })
    } finally {
      setSubmittingComment(false)
    }
  }

  if (postLoading) {
    return (
      <div className="space-y-8">
        <BreadcrumbNav parent={{ label: '커뮤니티', href: '/community' }} current="글" />
        <Skeleton variant="card" count={2} />
      </div>
    )
  }

  if (postError || !post) {
    return (
      <div className="space-y-8">
        <BreadcrumbNav parent={{ label: '커뮤니티', href: '/community' }} current="글" />
        <ErrorState
          message="게시물을 불러오지 못했어요"
          variant="network"
          action={{ label: '다시 시도', onClick: refetchPost }}
        />
      </div>
    )
  }

  return (
    <div className="relative space-y-8">
      <BrandWatermark className="opacity-30" />
      <BreadcrumbNav
        parent={{ label: '커뮤니티', href: '/community' }}
        current="글"
      />

      {/* POST HEADER */}
      <FadeIn>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge color="zinc">{post.categoryLabel}</Badge>
            <Text className={DS_TYPOGRAPHY.caption} suppressHydrationWarning>
              {post.author} · {post.time}
            </Text>
          </div>
          <h1 className={cn('font-wordmark text-2xl/9', DS_PAGE_HEADER.title)}>
            {post.title}
          </h1>
        </div>
      </FadeIn>

      {/* FACILITY TAGS */}
      {post.facilityTags.length > 0 && (
        <FadeIn>
          <div className="flex flex-wrap gap-2">
            {post.facilityTags.map((tag) => (
              <FacilityTagLink key={tag} facilityId="" facilityName={tag} />
            ))}
          </div>
        </FadeIn>
      )}

      {/* POST BODY */}
      <FadeIn>
        <div className={cn('whitespace-pre-line', DS_TYPOGRAPHY.body, DS_PAGE_HEADER.subtitle)}>
          {post.content}
        </div>
      </FadeIn>

      {/* LIKE */}
      <FadeIn>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleLikeToggle}
            aria-label={liked ? '좋아요 취소' : '좋아요'}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm/6 text-dotori-500 transition-colors hover:text-dotori-700"
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-red-400 text-red-400' : ''}`} />
            <span>{post.likes + (liked ? 1 : 0)}</span>
          </button>
        </div>
      </FadeIn>

      <Divider soft />

      {/* COMMENTS */}
      <div className="space-y-6">
        <FadeIn>
          <h2 className={cn(DS_TYPOGRAPHY.h3)}>
            댓글 {commentTotal}개
          </h2>
        </FadeIn>

        {commentsLoading ? (
          <Skeleton variant="card" count={2} />
        ) : (
          <FadeInStagger className="space-y-4">
            {comments.map((c) => (
              <FadeIn key={c.id}>
                <div className="flex gap-3">
                  <Avatar
                    initials={c.initials}
                    className="h-8 w-8 shrink-0 bg-dotori-100 text-xs text-dotori-700 dark:bg-dotori-900 dark:text-dotori-300"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Text className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
                        {c.author}
                      </Text>
                      <Text className={DS_TYPOGRAPHY.caption} suppressHydrationWarning>
                        {c.time}
                      </Text>
                    </div>
                    <Text className={cn('mt-1', DS_TYPOGRAPHY.bodySm, DS_PAGE_HEADER.subtitle)}>
                      {c.body}
                    </Text>
                  </div>
                </div>
              </FadeIn>
            ))}
          </FadeInStagger>
        )}
      </div>

      <Divider soft />

      {/* COMMENT INPUT */}
      <FadeIn>
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <Textarea
              rows={2}
              resizable={false}
              placeholder="댓글을 입력하세요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <DsButton
            disabled={!comment.trim() || submittingComment}
            onClick={handleCommentSubmit}
          >
            {submittingComment ? '등록 중...' : '등록'}
          </DsButton>
        </div>
      </FadeIn>

      {/* 나도 이동 시작하기 CTA (이동후기·시설정보 카테고리) */}
      {(post.categoryLabel === '이동 후기' || post.categoryLabel === '시설 정보') && (
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6 text-center')}>
            <Text className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
              나도 이동 시작하기
            </Text>
            <Text className={cn('mt-1', DS_TYPOGRAPHY.bodySm, 'text-dotori-500 dark:text-dotori-400')}>
              우리 아이에게 맞는 시설을 찾아보세요
            </Text>
            <DsButton href="/explore" className="mt-4">
              시설 탐색하기
            </DsButton>
          </div>
        </motion.div>
      )}

      {/* ToRI FAB */}
      <ToRiFAB prompt="이 글에 대해 알려줘" />
    </div>
  )
}
