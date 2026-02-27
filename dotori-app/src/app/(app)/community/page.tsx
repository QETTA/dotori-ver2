'use client'

/**
 * Community Page — Catalyst UI + Spotlight 카드 패턴
 *
 * Catalyst: Heading, Text, Divider, Badge, BadgeButton, DsButton
 * Studio:   FadeIn/FadeInStagger
 */
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  PencilSquareIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import { Heading, Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { Badge, BadgeButton } from '@/components/catalyst/badge'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { hoverLift, tap, pulse } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useCommunityPosts } from '@/hooks/use-community-posts'
import { TrendingRegionChips } from '@/components/dotori/TrendingRegionChips'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'

const categoryFilters = ['전체', '이동 후기', '시설 정보', '유보통합', '자유글']

const CATEGORY_ACCENT: Record<string, { border: string; badge: 'dotori' | 'lime' | 'violet' | 'zinc' }> = {
  '이동 후기': { border: 'border-l-dotori-400', badge: 'dotori' },
  '시설 정보': { border: 'border-l-forest-400', badge: 'lime' },
  '유보통합':  { border: 'border-l-violet-400', badge: 'violet' },
  '자유글':    { border: 'border-l-zinc-300 dark:border-l-zinc-600', badge: 'zinc' },
}
const DEFAULT_ACCENT = { border: 'border-l-zinc-300 dark:border-l-zinc-600', badge: 'zinc' as const }

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const { posts, isLoading, error, refetch } = useCommunityPosts(activeCategory)

  return (
    <div className="relative space-y-10">
      <BrandWatermark className="opacity-30" />
      <ToRiFAB prompt="이웃 커뮤니티 추천해줘" />
      {/* ══════ HEADER ══════ */}
      <div className="flex items-end justify-between">
        <div>
          <FadeIn>
            <p className="font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-500">
              커뮤니티
            </p>
          </FadeIn>
          <FadeIn>
            <Heading className="mt-4 font-wordmark text-4xl/[1.15] font-bold tracking-tight text-dotori-950 sm:text-4xl/[1.15]">
              이웃 이야기
            </Heading>
          </FadeIn>
        </div>
        <FadeIn>
          <DsButton href="/community/write">
            <PencilSquareIcon className="h-4 w-4" />
            글쓰기
          </DsButton>
        </FadeIn>
      </div>

      {/* ══════ TRENDING ══════ */}
      {posts.length > 0 && (
        <FadeIn>
          <div className="flex items-center gap-3 rounded-2xl border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 shadow-sm dark:from-amber-950/20 dark:to-orange-950/10">
            <motion.div {...pulse}>
              <ArrowTrendingUpIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            </motion.div>
            <Text className="text-sm/6 text-dotori-950 sm:text-sm/6 dark:text-white">
              <span className="font-semibold text-amber-700 dark:text-amber-300">인기</span>
              {' '}{posts[0].title}
            </Text>
          </div>
        </FadeIn>
      )}

      {/* ══════ TRENDING REGION CHIPS ══════ */}
      <TrendingRegionChips />

      {/* ══════ CATEGORY CHIPS — Snap-Scroll (TP5 Pattern 4) ══════ */}
      <FadeIn>
        <div className="relative">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent dark:from-dotori-950" />
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hidden px-0.5 py-1">
            {categoryFilters.map((cat) => (
              <motion.div key={cat} whileTap={tap.chip.whileTap} className="snap-start shrink-0">
                <BadgeButton
                  color={activeCategory === cat ? 'dotori' : 'zinc'}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </BadgeButton>
              </motion.div>
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
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex flex-col items-center py-14 text-center')}>
            <Text className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
              아직 게시글이 없어요
            </Text>
            <Text className="mt-1.5 text-sm/6 text-dotori-500 sm:text-sm/6 dark:text-dotori-400">
              첫 번째 글을 작성해보세요
            </Text>
            <DsButton href="/community/write" className="mt-5">
              <PencilSquareIcon className="h-4 w-4" />
              글쓰기
            </DsButton>
          </div>
        </FadeIn>
      ) : (
        <FadeInStagger className="space-y-2">
          {posts.map((post, i) => {
            const accent = CATEGORY_ACCENT[post.category] ?? DEFAULT_ACCENT
            return (
              <FadeIn key={post.id}>
                <div className="group/card relative">
                  <motion.article {...hoverLift} className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'relative overflow-hidden border-l-3 p-5 transition-all group-hover/card:shadow-[0_8px_32px_rgba(176,122,74,0.12)]', accent.border)}>
                    {/* Border Accent — gradient top bar */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-dotori-400 via-amber-400 to-dotori-500 opacity-0 transition-opacity group-hover/card:opacity-100" />
                    {/* Layer 1: Content — z-10 */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <Text className="font-mono text-xs/5 text-dotori-500 sm:text-xs/5" suppressHydrationWarning>
                          {post.author} · {post.time}
                        </Text>
                        <Badge color={accent.badge}>{post.category}</Badge>
                      </div>
                      <Subheading level={3} className="mt-3 text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
                        {post.title}
                      </Subheading>
                      <Text className="mt-1 line-clamp-2 text-sm/6 text-dotori-600 sm:text-sm/6 dark:text-dotori-400">
                        {post.preview}
                      </Text>
                      <div className="mt-4 flex items-center gap-4 font-mono text-xs/5 text-dotori-500">
                        <span className="inline-flex items-center gap-1">
                          <HeartIcon className="h-3.5 w-3.5" /> {post.likes}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ChatBubbleLeftIcon className="h-3.5 w-3.5" /> {post.comments}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                  {/* Layer 2: Click zone — z-20 */}
                  <Link href={`/community/${post.id}`} className="absolute inset-0 z-20" aria-label={post.title} />
                </div>
                {i < posts.length - 1 && <Divider soft className="mt-2" />}
              </FadeIn>
            )
          })}
        </FadeInStagger>
      )}
    </div>
  )
}
