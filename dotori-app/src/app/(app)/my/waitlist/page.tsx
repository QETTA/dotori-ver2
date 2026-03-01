'use client'

/**
 * Waitlist Page — Card-based layout (Wave 10 polish)
 *
 * Catalyst: Badge, Text, DsButton
 * Studio:   FadeIn/FadeInStagger
 * Motion:   hoverLift, scrollFadeIn
 */
import Link from 'next/link'
import { motion } from 'motion/react'
import { Badge } from '@/components/catalyst/badge'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER, DS_EMPTY_STATE } from '@/lib/design-system/page-tokens'
import { DS_GLASS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { hoverLift, scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useWaitlist } from '@/hooks/use-waitlist'
import { ToBadge } from '@/components/dotori/ToBadge'
import { AnimatedNumber } from '@/components/dotori/AnimatedNumber'

const statusConfig = {
  waiting: { label: '대기 중', color: 'dotori' as const, accent: 'bg-amber-500' },
  accepted: { label: '입소 확정', color: 'forest' as const, accent: 'bg-forest-500' },
  cancelled: { label: '취소', color: 'dotori' as const, accent: 'bg-dotori-300' },
}

export default function WaitlistPage() {
  const { waitlist, isLoading, error, refetch } = useWaitlist()

  return (
    <div className="relative space-y-6">
      <BrandWatermark className="opacity-30" />
      <BreadcrumbNav
        parent={{ label: '마이페이지', href: '/my' }}
        current="입소 대기"
      />

      {/* ══════ INTRO ══════ */}
      <FadeIn>
        <div className={DS_PAGE_HEADER.spacing}>
          <p className={DS_PAGE_HEADER.eyebrow}>
            대기 현황
          </p>
          <h1 className={cn(DS_PAGE_HEADER.title, DS_TYPOGRAPHY.h2, 'mt-3 font-wordmark')}>
            입소 대기 목록
          </h1>
          <Text className={cn(DS_PAGE_HEADER.subtitle, DS_TYPOGRAPHY.bodySm, 'mt-2')}>
            신청한 시설의 대기 순위와 진행 상태를 확인하세요.
          </Text>
        </div>
      </FadeIn>

      {/* ══════ CONTENT ══════ */}
      {isLoading ? (
        <Skeleton variant="card" count={2} />
      ) : error ? (
        <ErrorState
          message="대기 목록을 불러오지 못했어요"
          variant="network"
          action={{ label: '다시 시도', onClick: refetch }}
        />
      ) : waitlist.length === 0 ? (
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, DS_EMPTY_STATE.container, 'rounded-2xl')}>
            <BrandEmptyIllustration variant="empty" size={96} className={DS_EMPTY_STATE.illustration} />
            <Text className={DS_EMPTY_STATE.title}>
              아직 대기 중인 시설이 없어요
            </Text>
            <Text className={DS_EMPTY_STATE.description}>
              시설을 탐색하고 빈자리 알림을 신청해보세요
            </Text>
            <DsButton href="/explore" className={DS_EMPTY_STATE.action}>
              시설 탐색하기
            </DsButton>
          </div>
        </motion.div>
      ) : (
        <FadeInStagger faster className="space-y-3">
          {waitlist.map((item) => {
            const config = statusConfig[item.status]
            return (
              <FadeIn key={item.id}>
                <motion.div {...hoverLift}>
                  <Link
                    href={`/my/waitlist/${item.id}`}
                    className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, DS_CARD.raised.hover, 'block overflow-hidden')}
                  >
                    {/* Status accent bar */}
                    <div className={cn('h-1', config.accent)} />

                    <div className="px-4 py-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Text className={cn(DS_TYPOGRAPHY.h3, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
                            {item.facilityName}
                          </Text>
                          <Text className={cn(DS_TYPOGRAPHY.caption, 'mt-0.5 text-dotori-500 dark:text-dotori-400')}>
                            {item.type}
                          </Text>
                        </div>
                        <Badge color={config.color} className="shrink-0 self-start">
                          {config.label}
                        </Badge>
                      </div>

                      {/* Rank surface */}
                      <div
                        className={cn(
                          'mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2 ring-1 ring-dotori-100/70',
                          DS_GLASS.card,
                          DS_GLASS.dark.card,
                          'dark:ring-dotori-800/60',
                          item.rank <= 3 && 'motion-safe:animate-pulse',
                        )}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-500 dark:text-dotori-300')}>
                            대기 순위
                          </span>
                          <span className={cn(DS_TYPOGRAPHY.h2, 'font-extrabold tabular-nums text-dotori-950 dark:text-dotori-50')}>
                            <AnimatedNumber end={item.rank} className="tabular-nums" />
                          </span>
                          <span className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-500 dark:text-dotori-300')}>
                            번째
                          </span>
                        </div>

                        <ToBadge
                          status={item.status === 'accepted' ? 'available' : 'waiting'}
                          compact
                          className="shrink-0"
                        />
                      </div>

                      {/* Stats row */}
                      <div className={cn('mt-3 flex items-center gap-4', DS_TYPOGRAPHY.caption)}>
                        <div>
                          <span className="text-dotori-500">신청일 </span>
                          <span className="font-medium text-dotori-700 dark:text-dotori-200">{item.appliedAt}</span>
                        </div>
                        {item.estimatedDate && (
                          <>
                            <span className="text-dotori-200 dark:text-dotori-700">|</span>
                            <div>
                              <span className="text-forest-600 font-medium dark:text-forest-400">{item.estimatedDate}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </FadeIn>
            )
          })}
        </FadeInStagger>
      )}
    </div>
  )
}
