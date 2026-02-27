'use client'

/**
 * Interests Page — 관심 시설 (Wave 10 polish)
 *
 * Catalyst: Badge, Heading, Text, DsButton
 * Studio:   FadeIn/FadeInStagger
 * Motion:   hoverLift, scrollFadeIn
 */
import Link from 'next/link'
import { motion } from 'motion/react'
import { Badge } from '@/components/catalyst/badge'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import {
  MagnifyingGlassIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER, DS_EMPTY_STATE } from '@/lib/design-system/page-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { hoverLift, scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useInterests } from '@/hooks/use-interests'
import { ToBadge } from '@/components/dotori/ToBadge'
import { FunnelProgressWidget } from '@/components/dotori/FunnelProgressWidget'

const statusConfig = {
  available: { label: '빈자리 있음', color: 'green' as const, accent: 'bg-forest-500' },
  full: { label: '마감', color: 'zinc' as const, accent: 'bg-dotori-300' },
}

export default function InterestsPage() {
  const { interests, isLoading, error, refetch } = useInterests()

  return (
    <div className="relative space-y-6">
      <BrandWatermark className="opacity-30" />
      <BreadcrumbNav
        parent={{ label: '마이페이지', href: '/my' }}
        current="관심 시설"
      />

      {/* ══════ INTRO ══════ */}
      <FadeIn>
        <div className={DS_PAGE_HEADER.spacing}>
          <p className={DS_PAGE_HEADER.eyebrow}>
            관심 시설
          </p>
          <Heading className={cn(DS_PAGE_HEADER.title, 'mt-3 font-wordmark text-3xl/10')}>
            찜한 시설
          </Heading>
          <Text className={cn(DS_PAGE_HEADER.subtitle, 'mt-2 text-base/7')}>
            관심 시설의 빈자리 현황을 한눈에 확인하세요.
          </Text>
        </div>
      </FadeIn>

      {/* ══════ FUNNEL PROGRESS ══════ */}
      <FunnelProgressWidget step={interests.length > 0 ? 1 : 0} />

      {/* ══════ CONTENT ══════ */}
      {isLoading ? (
        <Skeleton variant="facility-card" count={3} />
      ) : error ? (
        <ErrorState
          message="관심 시설을 불러오지 못했어요"
          variant="network"
          action={{ label: '다시 시도', onClick: refetch }}
        />
      ) : interests.length === 0 ? (
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, DS_EMPTY_STATE.container, 'rounded-2xl')}>
            <BrandEmptyIllustration variant="empty" size={96} className={DS_EMPTY_STATE.illustration} />
            <Text className={DS_EMPTY_STATE.title}>
              아직 관심 시설이 없어요
            </Text>
            <Text className={DS_EMPTY_STATE.description}>
              시설을 탐색하고 하트를 눌러 관심 등록해보세요
            </Text>
            <DsButton href="/explore" className={DS_EMPTY_STATE.action}>
              <MagnifyingGlassIcon className="h-4 w-4" />
              시설 탐색하기
            </DsButton>
          </div>
        </motion.div>
      ) : (
        <FadeInStagger faster className="space-y-3">
          {interests.map((facility) => {
            const config = statusConfig[facility.status]
            const occupancyPct = facility.capacity > 0
              ? Math.round((facility.current / facility.capacity) * 100)
              : 0
            const available = facility.capacity - facility.current
            return (
              <FadeIn key={facility.id}>
                <motion.div {...hoverLift}>
                  <Link
                    href={`/facility/${facility.id}`}
                    className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, DS_CARD.raised.hover, 'block overflow-hidden')}
                  >
                    {/* Status accent bar */}
                    <div className={cn('h-1', config.accent)} />

                    <div className="px-4 py-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Text className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
                              {facility.name}
                            </Text>
                            <ToBadge status={facility.status} vacancy={available} compact />
                          </div>
                          <Text className={cn(DS_TYPOGRAPHY.caption, 'mt-0.5 text-dotori-500 dark:text-dotori-400')}>
                            {facility.type} · {facility.address}
                          </Text>
                        </div>
                        <Badge color={config.color}>{config.label}</Badge>
                      </div>

                      {/* Stats row */}
                      <div className={cn('mt-3 flex items-center gap-4', DS_TYPOGRAPHY.caption)}>
                        <div>
                          <span className="text-dotori-500">입소률 </span>
                          <span className="font-semibold text-dotori-900 dark:text-dotori-50">{occupancyPct}%</span>
                        </div>
                        <span className="text-dotori-200 dark:text-dotori-700">|</span>
                        <div>
                          <span className="text-dotori-500">가용 </span>
                          <span className="font-semibold text-dotori-900 dark:text-dotori-50">{available}석</span>
                        </div>
                        <span className="text-dotori-200 dark:text-dotori-700">|</span>
                        <div>
                          <span className="text-dotori-500">정원 </span>
                          <span className="font-medium text-dotori-700 dark:text-dotori-200">{facility.capacity}명</span>
                        </div>
                      </div>

                      {/* 1-tap 대기 신청 */}
                      <div className="mt-3 border-t border-dotori-100 pt-3 dark:border-dotori-800">
                        <DsButton
                          variant="secondary"
                          className="w-full"
                          href={`/my/waitlist?apply=${facility.id}`}
                        >
                          <ClockIcon className="h-4 w-4" />
                          대기 신청
                        </DsButton>
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
