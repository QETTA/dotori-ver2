'use client'

/**
 * Home Page — Premium editorial dashboard
 *
 * Design: Gradient text hero, brand-tinted shadows, accent bars,
 * glassmorphism funnel, always-visible sections
 */
import { useState, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { copy } from '@/lib/brand-copy'
import { scrollFadeIn, gradientTextHero } from '@/lib/motion'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { AnimatedNumber } from '@/components/dotori/AnimatedNumber'
import { FunnelSteps } from '@/components/dotori/FunnelSteps'
import { DonutGauge } from '@/components/dotori/charts/DonutGauge'
import { PullToRefresh } from '@/components/dotori/PullToRefresh'
import { RecentFacilities } from '@/components/dotori/RecentFacilities'
import { SeasonalBriefing } from '@/components/dotori/SeasonalBriefing'
import { useHomeDashboard } from '@/hooks/use-home-dashboard'
import { ActionCard } from '@/components/dotori/ActionCard'
import { UiBlock as UiBlockCard } from '@/components/dotori/blocks/UiBlock'
import { cn } from '@/lib/utils'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import type { UiBlock as UiBlockType } from '@/types/dotori'

/* ── Premium elevation tokens (DS_CARD) ── */
const PREMIUM = cn(DS_CARD.premium.base, DS_CARD.premium.dark, 'p-5')
const CARD_SM = cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-4')

const quickActions = [
  { href: '/explore', label: '시설 탐색', desc: '어린이집·유치원 통합 검색' },
  { href: '/chat', label: '토리 톡', desc: 'AI 이동 전략 상담' },
  { href: '/community', label: '이웃 이야기', desc: '부모님 이동 후기' },
  { href: '/my/documents', label: '서류함', desc: '입소 서류 체크리스트' },
]

const DEFAULT_GREETING = '오늘의 브리핑'

function getGreeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '오후 브리핑'
  return '저녁 브리핑'
}

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [greeting, setGreeting] = useState(DEFAULT_GREETING)
  const { dashboard, refetch } = useHomeDashboard()

  useEffect(() => {
    const greetingUpdateTimer = window.setTimeout(() => {
      setGreeting(getGreeting(new Date()))
    }, 0)
    return () => window.clearTimeout(greetingUpdateTimer)
  }, [])

  const handleRefresh = useCallback(async () => {
    refetch()
    setRefreshKey((k) => k + 1)
  }, [refetch])

  const funnelStep = dashboard?.funnelStep ?? 0
  const currentStep = funnelStep
  const funnelPct = [10, 35, 65, 90][currentStep] ?? 10
  const hotPosts = dashboard?.hotPosts ?? []
  const quickActionsBlock: UiBlockType = {
    type: 'ui_block',
    title: '바로가기',
    subtitle: '자주 쓰는 기능으로 바로 이동하세요',
    layout: 'grid',
    items: quickActions.map((action) => ({
      id: `home-quick-${action.href}`,
      title: action.label,
      description: action.desc,
      href: action.href,
      actionLabel: '이동하기',
    })),
  }

  const hotPostsBlock: UiBlockType = {
    type: 'ui_block',
    title: '커뮤니티 인기 글',
    subtitle: '요즘 부모님이 많이 보는 글이에요',
    layout: 'list',
    items:
      hotPosts.length > 0
        ? hotPosts.slice(0, 3).map((post) => ({
            id: `home-hot-post-${post.id}`,
            title: post.content,
            description: `좋아요 ${post.likes} · 댓글 ${post.commentCount}`,
            badge: '실시간',
            href: `/community/${post.id}`,
            actionLabel: '글 보기',
          }))
        : [
            { title: '우리 동네 어린이집 이동 후기', meta: '좋아요 24 · 댓글 8' },
            { title: '유보통합 대비 — 부모가 알아야 할 5가지', meta: '좋아요 41 · 댓글 15' },
            { title: '대기 신청부터 입소까지 2주 경험담', meta: '좋아요 33 · 댓글 12' },
          ].map((item, index) => ({
            id: `home-hot-post-fallback-${index}`,
            title: item.title,
            description: item.meta,
            badge: '추천',
            href: '/community',
            actionLabel: '글 보기',
          })),
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-8" key={refreshKey}>
        {/* ══════ HERO ══════ */}
        <div className="relative pt-2">
          <BrandWatermark className="opacity-20" />
          <FadeIn>
            <p className={DS_PAGE_HEADER.eyebrow}>
              {greeting}
            </p>
          </FadeIn>
          <FadeIn>
            <h1 className={cn(DS_PAGE_HEADER.title, 'mt-4 font-wordmark text-3xl/[1.2]', gradientTextHero)}>
              {copy.home.heroSubtitle}
            </h1>
          </FadeIn>
          <FadeIn>
            <Text className={cn(DS_PAGE_HEADER.subtitle, 'mt-3 text-base/7')}>
              시설 현황과 이동 진행을 한눈에 확인하세요
            </Text>
          </FadeIn>
        </div>

        {/* ══════ ACTION CARD ══════ */}
        <ActionCard step={funnelStep} />

        {/* ══════ SEASONAL BRIEFING ══════ */}
        <SeasonalBriefing />

        {/* ══════ FUNNEL + DONUT — glassmorphism ══════ */}
        <motion.div {...scrollFadeIn}>
          <div className={cn(PREMIUM, 'relative overflow-hidden')}>
            {/* Subtle gradient accent bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-dotori-400 via-dotori-300 to-amber-300" />
            <div className="flex items-center gap-5 pt-1">
              <DonutGauge
                value={funnelPct}
                size={72}
                strokeWidth={6}
                color="dotori"
                sublabel="진행률"
              />
              <div className="flex-1">
                <p className={DS_PAGE_HEADER.eyebrow}>
                  이동 진행 상황
                </p>
                <div className="mt-3">
                  <FunnelSteps compact currentStep={currentStep} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════ STATS ══════ */}
        <FadeInStagger faster className="grid grid-cols-3 gap-3">
          <FadeIn>
            <div className={CARD_SM}>
              <div className={cn(DS_TYPOGRAPHY.h2, 'font-wordmark font-bold tabular-nums text-gray-950 dark:text-white')}>
                <AnimatedNumber end={dashboard?.totalFacilities ?? 20027} suffix="" className="" />
              </div>
              <p className={cn(DS_TYPOGRAPHY.caption, 'mt-1 text-gray-500')}>분석 시설</p>
            </div>
          </FadeIn>
          <FadeIn>
            <div className={CARD_SM}>
              <div className={cn(DS_TYPOGRAPHY.h2, 'font-wordmark font-bold tabular-nums text-dotori-600 dark:text-dotori-400')}>
                {dashboard?.interestCount ?? 0}<span className={cn(DS_TYPOGRAPHY.bodySm, 'font-medium text-gray-400')}>건</span>
              </div>
              <p className={cn(DS_TYPOGRAPHY.caption, 'mt-1 text-gray-500')}>관심 시설</p>
            </div>
          </FadeIn>
          <FadeIn>
            <div className={CARD_SM}>
              <div className={cn(DS_TYPOGRAPHY.h2, 'font-wordmark font-bold tabular-nums text-forest-600 dark:text-forest-400')}>
                {dashboard?.waitlistCount ?? 0}<span className={cn(DS_TYPOGRAPHY.bodySm, 'font-medium text-gray-400')}>건</span>
              </div>
              <p className={cn(DS_TYPOGRAPHY.caption, 'mt-1 text-gray-500')}>대기 중</p>
            </div>
          </FadeIn>
        </FadeInStagger>

        {/* ══════ RECENT FACILITIES ══════ */}
        <RecentFacilities />

        {/* ══════ HOT POSTS — always visible ══════ */}
        <motion.div {...scrollFadeIn}>
          <UiBlockCard block={hotPostsBlock} />
        </motion.div>

        {/* ══════ QUICK ACTIONS — 3-Layer Hover + Icon Accent ══════ */}
        <div>
          <UiBlockCard block={quickActionsBlock} />
        </div>

        {/* ══════ ALERT BANNER — forest accent ══════ */}
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'relative overflow-hidden bg-forest-50/80 p-5 dark:bg-forest-950/20 ring-forest-200/40 dark:ring-forest-800/20')}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-forest-400 via-forest-500 to-forest-300" />
            <p className={cn(DS_TYPOGRAPHY.bodySm, 'pt-1 font-semibold text-gray-950 dark:text-white')}>빈자리 알림</p>
            <Text className={cn(DS_TYPOGRAPHY.caption, 'mt-1 text-gray-600 dark:text-gray-400')}>
              관심 시설에 빈자리가 나면 바로 알려드려요
            </Text>
            <DsButton tone="forest" href="/explore" className="mt-3">
              설정하기
              <ArrowRightIcon className="h-3 w-3" />
            </DsButton>
          </div>
        </motion.div>
      </div>
    </PullToRefresh>
  )
}
