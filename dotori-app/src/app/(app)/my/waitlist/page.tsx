'use client'

/**
 * Waitlist Page — Card-based layout (Wave 10 polish)
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
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { hoverLift, scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useWaitlist } from '@/hooks/use-waitlist'
import { ToBadge } from '@/components/dotori/ToBadge'
import { AnimatedNumber } from '@/components/dotori/AnimatedNumber'

const statusConfig = {
  waiting: { label: '대기 중', color: 'zinc' as const, accent: 'bg-amber-500' },
  accepted: { label: '입소 확정', color: 'green' as const, accent: 'bg-forest-500' },
  cancelled: { label: '취소', color: 'red' as const, accent: 'bg-dotori-300' },
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
        <div>
          <p className="font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-500">
            대기 현황
          </p>
          <Heading className="mt-3 font-wordmark text-3xl/10 font-bold tracking-tight text-dotori-950 sm:text-3xl/10">
            입소 대기 목록
          </Heading>
          <Text className="mt-2 text-base/7 text-dotori-600 dark:text-dotori-400">
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
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex flex-col items-center rounded-2xl py-14 text-center')}>
            <BrandEmptyIllustration variant="empty" size={96} className="mb-2" />
            <Text className="mt-5 text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
              아직 대기 중인 시설이 없어요
            </Text>
            <Text className="mt-1.5 text-sm/6 text-dotori-500 sm:text-sm/6 dark:text-dotori-400">
              시설을 탐색하고 빈자리 알림을 신청해보세요
            </Text>
            <DsButton href="/explore" className="mt-5">
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
                    href={`/facility/${item.id}`}
                    className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-dotori-100/80 transition-shadow hover:shadow-md dark:bg-dotori-900/80 dark:ring-dotori-800/60"
                  >
                    {/* Status accent bar */}
                    <div className={cn('h-1', config.accent)} />

                    <div className="px-4 py-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Text className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6 dark:text-dotori-50">
                            {item.facilityName}
                          </Text>
                          <Text className="mt-0.5 text-caption text-dotori-500 dark:text-dotori-400">
                            {item.type}
                          </Text>
                        </div>
                        <Badge color={config.color}>{config.label}</Badge>
                      </div>

                      {/* Stats row */}
                      <div className="mt-3 flex items-center gap-4 text-caption">
                        <div className={item.rank <= 3 ? 'motion-safe:animate-pulse' : ''}>
                          <span className="text-dotori-500">순위 </span>
                          <span className="font-semibold text-dotori-900 dark:text-dotori-50">
                            <AnimatedNumber end={item.rank} className="tabular-nums" />번째
                          </span>
                        </div>
                        <span className="text-dotori-200 dark:text-dotori-700">|</span>
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

                      {/* TO Badge */}
                      <div className="mt-2">
                        <ToBadge status={item.status === 'accepted' ? 'available' : 'waiting'} compact />
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
