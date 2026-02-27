'use client'

/**
 * Home Page — Premium editorial dashboard
 *
 * Design: Gradient text hero, brand-tinted shadows, accent bars,
 * glassmorphism funnel, always-visible sections
 */
import { useState, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
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
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
import { UiBlock as UiBlockCard } from '@/components/dotori/blocks/UiBlock'
import { cn } from '@/lib/utils'
import { DS_TYPOGRAPHY, DS_TEXT, DS_ICON, DS_SPACING } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER, DS_SECTION_RHYTHM, DS_HERO } from '@/lib/design-system/page-tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import type { UiBlock as UiBlockType } from '@/types/dotori'

/* ── Premium elevation tokens (DS_CARD) ── */
const PREMIUM = cn(DS_CARD.premium.base, DS_CARD.premium.dark, 'p-5')
const CARD_SM = cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'p-4')

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
    variant: 'panel',
    tone: 'dotori',
    density: 'compact',
    accentStyle: 'bar',
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
    variant: 'default',
    tone: 'forest',
    accentStyle: 'bar',
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
      <div className={DS_SECTION_RHYTHM.generous} key={refreshKey}>
        {/* ══════ HERO VIEWPORT ══════ */}
        <section className="space-y-4 pt-1">
          <motion.div {...scrollFadeIn}>
            <div className={cn('relative overflow-hidden rounded-3xl border border-dotori-200/70 gradient-mesh-warm px-5 pb-5 pt-4 ring-1 ring-dotori-100/70', DS_HERO.dark, 'dark:border-dotori-900/60 dark:ring-dotori-900/40')}>
              <NoiseTexture opacity={0.02} />
              <BrandWatermark className="pointer-events-none opacity-25" />
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-dotori-500 via-dotori-400 to-amber-400" />
              <FadeIn>
                <p className={DS_PAGE_HEADER.eyebrow} suppressHydrationWarning>
                  {greeting}
                </p>
              </FadeIn>
              <FadeIn>
                <h1 className={cn('mt-3 font-wordmark text-4xl/[1.1] font-extrabold tracking-tight sm:text-5xl/[1.06]', gradientTextHero)}>
                  {copy.home.heroSubtitle}
                </h1>
              </FadeIn>
              <FadeIn>
                <Text className={cn(DS_PAGE_HEADER.subtitle, 'mt-3 text-base/7')}>
                  시설 현황과 이동 진행을 한눈에 확인하세요
                </Text>
              </FadeIn>
              <FadeInStagger faster className="mt-5 grid grid-cols-3 gap-2 border-t border-dotori-100/80 pt-4 dark:border-dotori-900/40">
                <FadeIn>
                  <div className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'shadow-micro px-3 py-2')}>
                    <p className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>분석 시설</p>
                    <p className={cn(DS_TYPOGRAPHY.bodySm, 'mt-1 font-semibold tabular-nums', DS_TEXT.primary)}>
                      <AnimatedNumber end={dashboard?.totalFacilities ?? 20027} suffix="" className="" />
                    </p>
                  </div>
                </FadeIn>
                <FadeIn>
                  <div className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'shadow-micro px-3 py-2')}>
                    <p className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>관심 시설</p>
                    <p className={cn(DS_TYPOGRAPHY.bodySm, 'mt-1 font-semibold tabular-nums', DS_TEXT.primary)}>
                      {dashboard?.interestCount ?? 0}
                      <span className={cn(DS_TYPOGRAPHY.caption, 'ml-0.5', DS_TEXT.disabled)}>건</span>
                    </p>
                  </div>
                </FadeIn>
                <FadeIn>
                  <div className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'shadow-micro px-3 py-2')}>
                    <p className={cn(DS_TYPOGRAPHY.caption, 'text-forest-500 dark:text-forest-300')}>대기 중</p>
                    <p className={cn(DS_TYPOGRAPHY.bodySm, 'mt-1 font-semibold tabular-nums', DS_TEXT.primary)}>
                      {dashboard?.waitlistCount ?? 0}
                      <span className={cn(DS_TYPOGRAPHY.caption, 'ml-0.5', DS_TEXT.disabled)}>건</span>
                    </p>
                  </div>
                </FadeIn>
              </FadeInStagger>
            </div>
          </motion.div>

          {/* ══════ ACTION CARD ══════ */}
          <ActionCard step={funnelStep} />
        </section>

        {/* ══════ SEASONAL BRIEFING ══════ */}
        <SeasonalBriefing />

        {/* ══════ FUNNEL + DONUT — glassmorphism ══════ */}
        <motion.div {...scrollFadeIn}>
          <div className={cn(PREMIUM, 'relative overflow-hidden')}>
            <NoiseTexture />
            {/* Subtle gradient accent bar */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-dotori-500 via-amber-400 to-dotori-400" />
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
        <FadeIn>
          <p className={cn(DS_PAGE_HEADER.eyebrow, 'mb-3')}>실시간 현황</p>
        </FadeIn>
        <FadeInStagger faster className={cn('grid grid-cols-3', DS_SPACING.md)}>
          <FadeIn>
            <div className={cn(CARD_SM, 'group/card relative overflow-hidden shadow-micro')}>
              <div className="absolute left-0 top-0 h-full w-0.5 bg-dotori-400/60" />
              <div className={cn(DS_TYPOGRAPHY.h2, 'font-wordmark font-bold tabular-nums text-dotori-600 dark:text-dotori-400')}>
                <AnimatedNumber end={dashboard?.totalFacilities ?? 20027} suffix="" className="" />
              </div>
              <p className={cn(DS_TYPOGRAPHY.caption, 'mt-1', DS_TEXT.muted)}>분석 시설</p>
            </div>
          </FadeIn>
          <FadeIn>
            <div className={cn(CARD_SM, 'relative overflow-hidden')}>
              <div className="absolute left-0 top-0 h-full w-0.5 bg-dotori-400/60" />
              <div className={cn(DS_TYPOGRAPHY.h2, 'font-wordmark font-bold tabular-nums text-dotori-600 dark:text-dotori-400')}>
                {dashboard?.interestCount ?? 0}<span className={cn(DS_TYPOGRAPHY.bodySm, 'font-medium', DS_TEXT.disabled)}>건</span>
              </div>
              <p className={cn(DS_TYPOGRAPHY.caption, 'mt-1', DS_TEXT.muted)}>관심 시설</p>
            </div>
          </FadeIn>
          <FadeIn>
            <div className={cn(CARD_SM, 'relative overflow-hidden')}>
              <div className="absolute left-0 top-0 h-full w-0.5 bg-forest-400/60" />
              <div className={cn(DS_TYPOGRAPHY.h2, 'font-wordmark font-bold tabular-nums text-forest-600 dark:text-forest-400')}>
                {dashboard?.waitlistCount ?? 0}<span className={cn(DS_TYPOGRAPHY.bodySm, 'font-medium', DS_TEXT.disabled)}>건</span>
              </div>
              <p className={cn(DS_TYPOGRAPHY.caption, 'mt-1', DS_TEXT.muted)}>대기 중</p>
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
        <motion.div {...scrollFadeIn}>
          <UiBlockCard block={quickActionsBlock} />
        </motion.div>

        {/* ══════ ALERT BANNER — forest accent ══════ */}
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'group/card relative overflow-hidden bg-forest-50/80 p-5 dark:bg-forest-950/20 ring-forest-200/40 dark:ring-forest-800/20')}>
            <NoiseTexture opacity={0.025} />
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-forest-500 via-forest-400 to-forest-500" />
            <p className={cn(DS_TYPOGRAPHY.bodySm, 'pt-1 font-semibold', DS_TEXT.primary)}>빈자리 알림</p>
            <Text className={cn(DS_TYPOGRAPHY.caption, 'mt-1', DS_TEXT.muted)}>
              관심 시설에 빈자리가 나면 바로 알려드려요
            </Text>
            <DsButton tone="forest" href="/explore" className="mt-3">
              설정하기
              <ArrowRight className={DS_ICON.xs} />
            </DsButton>
          </div>
        </motion.div>
      </div>
    </PullToRefresh>
  )
}
