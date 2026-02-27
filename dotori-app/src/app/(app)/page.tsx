'use client'

/**
 * Home Page — Dynamic Dashboard (R48 Visual Impact)
 *
 * Catalyst: Heading, Text, Divider, DsButton, Badge, Subheading
 * Studio:   FadeIn/FadeInStagger, Border accent pattern
 * Charts:   DonutGauge, SparkLine
 * Wave 6:   PullToRefresh
 * Wave 8:   RecentFacilities, dynamic stats
 */
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BellAlertIcon,
  ArrowRightIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'
import { copy } from '@/lib/brand-copy'
import { scrollFadeIn, hoverLift, gradientTextHero } from '@/lib/motion'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'
import { Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { Stat } from '@/components/dotori/Stat'
import { AnimatedNumber } from '@/components/dotori/AnimatedNumber'
import { FunnelSteps } from '@/components/dotori/FunnelSteps'
import { DonutGauge } from '@/components/dotori/charts/DonutGauge'
import { PullToRefresh } from '@/components/dotori/PullToRefresh'
import { RecentFacilities } from '@/components/dotori/RecentFacilities'
import { SeasonalBriefing } from '@/components/dotori/SeasonalBriefing'
import { useHomeDashboard } from '@/hooks/use-home-dashboard'
import { ActionCard } from '@/components/dotori/ActionCard'

const quickActions = [
  { href: '/explore', label: '시설 탐색', Icon: MagnifyingGlassIcon, desc: '어린이집·유치원 통합 검색', accent: 'text-dotori-500 dark:text-dotori-400' },
  { href: '/chat', label: '토리 톡', Icon: ChatBubbleLeftRightIcon, desc: 'AI 이동 전략 상담', accent: 'text-violet-500 dark:text-violet-400' },
  { href: '/community', label: '이웃 이야기', Icon: UserGroupIcon, desc: '부모님 이동 후기', accent: 'text-forest-500 dark:text-forest-400' },
  { href: '/my/documents', label: '서류함', Icon: DocumentTextIcon, desc: '입소 서류 체크리스트', accent: 'text-amber-500 dark:text-amber-400' },
]

/** Stats accent — Studio Border 패턴 (before: 의사요소, 2px accent bar) */
const STAT_ACCENTS = [
  'relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-b-full before:bg-dotori-400',
  'relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-b-full before:bg-forest-400',
  'relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-b-full before:bg-amber-400',
] as const

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '오후 브리핑'
  return '저녁 브리핑'
}

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { dashboard, refetch } = useHomeDashboard()

  const handleRefresh = useCallback(async () => {
    refetch()
    setRefreshKey((k) => k + 1)
  }, [refetch])

  const funnelStep = dashboard?.funnelStep ?? 0
  const currentStep = funnelStep
  const funnelPct = [10, 35, 65, 90][currentStep] ?? 10

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-12" key={refreshKey}>
        {/* ══════ HERO ══════ */}
        <div className="relative">
          <BrandWatermark className="opacity-60" />
          <FadeIn>
            <p className={DS_PAGE_HEADER.eyebrow} suppressHydrationWarning>
              {getGreeting()}
            </p>
          </FadeIn>
          <FadeIn>
            <h1 className={cn("mt-4 font-wordmark text-4xl/[1.15] font-bold tracking-tight sm:text-4xl/[1.15]", gradientTextHero)}>
              {copy.home.heroSubtitle}
            </h1>
          </FadeIn>
          <FadeIn>
            <Text className="mt-4 text-base/7 text-dotori-700 dark:text-dotori-400">
              {copy.home.briefingTitle} — 시설 현황과 이동 진행을 한눈에 확인하세요
            </Text>
          </FadeIn>
        </div>

        {/* ══════ ACTION CARD — funnelStep 기반 동적 CTA ══════ */}
        <ActionCard step={funnelStep} />

        {/* ══════ SEASONAL BRIEFING ══════ */}
        <SeasonalBriefing />

        {/* ══════ FUNNEL PROGRESS + DONUT ══════ */}
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6')}>
            <div className="flex items-center gap-5">
              <DonutGauge
                value={funnelPct}
                size={80}
                strokeWidth={7}
                color="dotori"
                sublabel="이동 진행률"
              />
              <div className="flex-1">
                <Subheading level={2} className={cn(DS_PAGE_HEADER.eyebrow, 'sm:text-xs/5')}>
                  이동 진행 상황
                </Subheading>
                <div className="mt-3">
                  <FunnelSteps compact currentStep={currentStep} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════ STATS — color-coded accent bars (before: pseudo) ══════ */}
        <FadeInStagger faster className="grid grid-cols-3 gap-2">
          <FadeIn>
            <Stat
              stat={<AnimatedNumber end={dashboard?.totalFacilities ?? 20027} suffix="개" className="font-wordmark text-dotori-500 dark:text-dotori-400" />}
              text="분석 시설"
              className={STAT_ACCENTS[0]}
            />
          </FadeIn>
          <FadeIn>
            <Stat
              stat={<span className="font-wordmark text-forest-500 dark:text-forest-400">{dashboard?.interestCount ?? 0}건</span>}
              text="관심 시설"
              className={STAT_ACCENTS[1]}
            />
          </FadeIn>
          <FadeIn>
            <Stat
              stat={<span className="font-wordmark text-amber-500 dark:text-amber-400">{dashboard?.waitlistCount ?? 0}건</span>}
              text="대기 중"
              className={STAT_ACCENTS[2]}
            />
          </FadeIn>
        </FadeInStagger>

        {/* ══════ RECENT FACILITIES ══════ */}
        <RecentFacilities />

        {/* ══════ HOT POSTS — 커뮤니티 인기 글 ══════ */}
        {(dashboard?.hotPosts?.length ?? 0) > 0 && (
          <motion.div {...scrollFadeIn}>
            <div className="flex items-center justify-between">
              <Subheading level={3} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
                커뮤니티 인기 글
              </Subheading>
              <Link href="/community" className="text-xs font-medium text-dotori-500 hover:text-dotori-700">
                더보기
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {dashboard!.hotPosts.slice(0, 3).map((post) => (
                <Link key={post.id} href={`/community/${post.id}`} className="block">
                  <motion.div
                    whileTap={{ scale: 0.985 }}
                    className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, DS_CARD.flat.hover, 'px-4 py-3')}
                  >
                    <Text className="line-clamp-1 text-sm/6 font-medium text-dotori-950 dark:text-dotori-50">
                      {post.content}
                    </Text>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-dotori-400">
                        <HeartIcon className="h-3.5 w-3.5" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-dotori-400">
                        <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
                        {post.commentCount}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        <Divider soft />

        {/* ══════ QUICK ACTIONS — color-coded icons ══════ */}
        <FadeInStagger faster className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <FadeIn key={action.href}>
              <Link href={action.href} className="group block">
                <motion.div
                  {...hoverLift}
                  className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, DS_CARD.flat.hover, 'p-6')}
                >
                  <action.Icon className={cn('h-6 w-6', action.accent)} />
                  <Subheading level={3} className="mt-4 text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">{action.label}</Subheading>
                  <Text className="mt-1 text-xs/5 text-dotori-600 sm:text-xs/5 dark:text-dotori-400">{action.desc}</Text>
                </motion.div>
              </Link>
            </FadeIn>
          ))}
        </FadeInStagger>

        {/* ══════ ALERT BANNER — glass + forest accent ══════ */}
        <motion.div {...scrollFadeIn}>
          <div className="flex items-center justify-between rounded-2xl border-l-4 border-forest-400 bg-forest-50/80 p-6 shadow-sm ring-1 ring-forest-200/30 backdrop-blur-sm dark:bg-forest-950/20 dark:ring-forest-800/20">
            <div className="flex items-start gap-4">
              <BellAlertIcon className="mt-0.5 h-6 w-6 shrink-0 text-forest-600 dark:text-forest-400" />
              <div>
                <Subheading level={3} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">빈자리 알림</Subheading>
                <Text className="mt-1 text-xs/5 text-dotori-600 sm:text-xs/5 dark:text-dotori-400">
                  관심 시설에 빈자리가 나면 바로 알려드려요
                </Text>
              </div>
            </div>
            <DsButton tone="forest" href="/explore" className="shrink-0">
              설정
              <ArrowRightIcon className="h-3 w-3" />
            </DsButton>
          </div>
        </motion.div>
      </div>
    </PullToRefresh>
  )
}
