'use client'

/**
 * Community Page — Premium editorial with accent bars + gradient hero
 *
 * Design: Gradient text, accent bars on cards, colored category badges,
 * 3-layer hover, snap-scroll chips
 */
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  PenSquare,
  Heart,
  TrendingUp,
} from 'lucide-react'
import { Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Badge } from '@/components/catalyst/badge'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { hoverLift, scrollFadeIn, gradientTextHero } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { DS_TYPOGRAPHY, DS_CHIP, DS_TEXT } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER, DS_EMPTY_STATE } from '@/lib/design-system/page-tokens'
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { useCommunityPosts } from '@/hooks/use-community-posts'
import { TrendingRegionChips } from '@/components/dotori/TrendingRegionChips'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'

const categoryFilters = ['전체', '이동 후기', '시설 정보', '유보통합', '자유글']

const CATEGORY_BADGE: Record<string, 'dotori' | 'forest'> = {
  '이동 후기': 'dotori',
  '시설 정보': 'forest',
  '유보통합': 'forest',
  '자유글': 'dotori',
}

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [visibleCount, setVisibleCount] = useState(10)
  const { posts, isLoading, error, refetch } = useCommunityPosts(activeCategory)

  return (
    <div className="relative space-y-8">
      <BrandWatermark className="opacity-20" />
      <ToRiFAB prompt="이웃 커뮤니티 추천해줘" />

      {/* ══════ HEADER — gradient text ══════ */}
      <div className="flex items-end justify-between">
        <div>
          <FadeIn>
            <p className={DS_PAGE_HEADER.eyebrow}>
              커뮤니티
            </p>
          </FadeIn>
          <FadeIn>
            <h1 className={cn('mt-3 font-wordmark font-extrabold tracking-tight', DS_TYPOGRAPHY.display, gradientTextHero)}>
              이웃 이야기
            </h1>
          </FadeIn>
        </div>
        <FadeIn>
          <DsButton href="/community/write">
            <PenSquare className="h-4 w-4" />
            글쓰기
          </DsButton>
        </FadeIn>
      </div>

      {/* ══════ TRENDING ══════ */}
      {posts.length > 0 && (
        <FadeIn>
          <div className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'relative overflow-hidden bg-amber-50/80 dark:bg-amber-950/20 ring-amber-200/40 dark:ring-amber-800/20')}>
            <NoiseTexture opacity={0.02} />
            <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-dotori-400" />
            <div className="flex items-center gap-3 px-4 py-3">
              <TrendingUp className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <Text className={cn(DS_TYPOGRAPHY.bodySm, 'text-gray-950 dark:text-white')}>
                <span className="font-semibold text-amber-700 dark:text-amber-300">인기</span>
                {' '}{posts[0].title}
              </Text>
            </div>
          </div>
        </FadeIn>
      )}

      {/* ══════ TRENDING REGION CHIPS ══════ */}
      <TrendingRegionChips />

      {/* ══════ CATEGORY CHIPS — snap-scroll (TP5 Pattern 4) ══════ */}
      <FadeIn>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent dark:from-dotori-950" />
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory px-0.5 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categoryFilters.map((cat) => (
              <motion.button
                key={cat}
                type="button"
                whileTap={{ scale: 0.975 }}
                className={cn(
                  'snap-start shrink-0 min-h-11 whitespace-nowrap rounded-full px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-500/40',
                  DS_TYPOGRAPHY.bodySm,
                  activeCategory === cat ? DS_CHIP.active : DS_CHIP.inactive,
                )}
                onClick={() => { setActiveCategory(cat); setVisibleCount(10) }}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ══════ CONTENT ══════ */}
      {isLoading ? (
        <Skeleton variant="community-post" count={3} />
      ) : error ? (
        <ErrorState
          message="게시글을 불러오지 못했어요"
          variant="network"
          action={{ label: '다시 시도', onClick: refetch }}
        />
      ) : posts.length === 0 ? (
        <FadeIn>
          <div className={cn(DS_CARD.premium.base, DS_CARD.premium.dark, 'relative overflow-hidden py-14 text-center')}>
            <NoiseTexture opacity={0.03} />
            <div className="h-1 absolute inset-x-0 top-0 bg-gradient-to-r from-dotori-400/60 via-amber-400/40 to-violet-400/60" />
            <p className={DS_EMPTY_STATE.title}>
              아직 게시글이 없어요
            </p>
            <Text className={DS_EMPTY_STATE.description}>
              첫 번째 글을 작성해보세요
            </Text>
            <DsButton href="/community/write" className="mt-5">
              <PenSquare className="h-4 w-4" />
              글쓰기
            </DsButton>
          </div>
        </FadeIn>
      ) : (
        <motion.div {...scrollFadeIn}>
        <FadeInStagger className="space-y-3">
          {posts.slice(0, visibleCount).map((post) => {
            const badgeColor = CATEGORY_BADGE[post.category] ?? 'dotori'
            return (
              <FadeIn key={post.id}>
                <Link
                  href={`/community/${post.id}`}
                  aria-label={post.title}
                  className="group/card relative block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dotori-950"
                >
                  {/* z-0: hover background (Spotlight pattern) */}
                  <div className="absolute -inset-px rounded-2xl bg-dotori-50/80 opacity-0 transition duration-200 group-hover/card:opacity-100 dark:bg-dotori-900/30" />
                  {/* z-10: content */}
                  <motion.article
                    {...hoverLift}
                    className="relative z-10 overflow-hidden rounded-2xl bg-white ring-1 ring-dotori-100/70 shadow-sm dark:bg-dotori-950/40 dark:ring-dotori-800/40"
                  >
                    {/* Brand-tinted accent line */}
                    <div className="h-1 bg-gradient-to-r from-dotori-200/60 via-dotori-400/80 to-dotori-200/60 dark:from-dotori-700/40 dark:via-dotori-600/60 dark:to-dotori-700/40" />
                    <div className="p-5">
                      <div className="flex items-start gap-2">
                        <Badge color={badgeColor} className="shrink-0">
                          {post.category}
                        </Badge>
                        <Subheading level={3} className={cn(DS_TYPOGRAPHY.h3, 'min-w-0 flex-1 line-clamp-1 font-semibold', DS_TEXT.primary)}>
                          {post.title}
                        </Subheading>
                      </div>
                      <Text className={cn(DS_TYPOGRAPHY.bodySm, 'mt-2 line-clamp-2', DS_TEXT.secondary)}>
                        {post.preview}
                      </Text>
                      <div className={cn(DS_TYPOGRAPHY.caption, 'mt-3 flex items-center justify-between', DS_TEXT.muted)}>
                        <span suppressHydrationWarning>
                          {post.author} · {post.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {post.likes}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              </FadeIn>
            )
          })}
        </FadeInStagger>
        {visibleCount < posts.length && (
          <FadeIn>
            <div className="pt-2 text-center">
              <DsButton
                variant="ghost"
                onClick={() => setVisibleCount(prev => prev + 10)}
              >
                더 보기 ({posts.length - visibleCount}건 남음)
              </DsButton>
            </div>
          </FadeIn>
        )}
        </motion.div>
      )}
    </div>
  )
}
