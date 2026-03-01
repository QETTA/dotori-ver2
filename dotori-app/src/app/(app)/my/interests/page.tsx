'use client'

/**
 * Interests Page — 관심 시설 (Wave 10 polish)
 *
 * Catalyst: Badge, Text, DsButton
 * Studio:   FadeIn/FadeInStagger
 * Motion:   hoverLift, scrollFadeIn
 */
import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Badge } from '@/components/catalyst/badge'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import {
  Search,
  Clock,
  Trash2,
} from 'lucide-react'
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
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/dotori/ToastProvider'

const statusConfig = {
  available: { label: '빈자리 있음', color: 'forest' as const, accent: 'bg-forest-500' },
  full: { label: '마감', color: 'dotori' as const, accent: 'bg-dotori-300' },
}

export default function InterestsPage() {
  const { interests, isLoading, error, refetch } = useInterests()
  const { addToast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const visibleInterests = useMemo(
    () => interests.filter((facility) => !removedIds.has(facility.id)),
    [interests, removedIds],
  )

  const handleRemoveInterest = useCallback(async (facilityId: string) => {
    if (removingId) return
    const ok = window.confirm('관심 시설에서 삭제할까요?')
    if (!ok) return

    setRemovingId(facilityId)
    try {
      await apiFetch('/api/users/me/interests', {
        method: 'DELETE',
        body: JSON.stringify({ facilityId }),
      })
      setRemovedIds(prev => {
        const next = new Set(prev)
        next.add(facilityId)
        return next
      })
      addToast({ type: 'success', message: '관심 시설에서 삭제했어요' })
      refetch()
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '삭제에 실패했어요' })
    } finally {
      setRemovingId(null)
    }
  }, [addToast, refetch, removingId])

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
          <h1 className={cn(DS_PAGE_HEADER.title, DS_TYPOGRAPHY.h2, 'mt-3 font-wordmark')}>
            찜한 시설
          </h1>
          <Text className={cn(DS_PAGE_HEADER.subtitle, DS_TYPOGRAPHY.bodySm, 'mt-2')}>
            관심 시설의 빈자리 현황을 한눈에 확인하세요.
          </Text>
        </div>
      </FadeIn>

      {/* ══════ FUNNEL PROGRESS ══════ */}
      <FunnelProgressWidget step={visibleInterests.length > 0 ? 1 : 0} />

      {/* ══════ CONTENT ══════ */}
      {isLoading ? (
        <Skeleton variant="facility-card" count={3} />
      ) : error ? (
        <ErrorState
          message="관심 시설을 불러오지 못했어요"
          variant="network"
          action={{ label: '다시 시도', onClick: refetch }}
        />
      ) : visibleInterests.length === 0 ? (
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
              <Search className="h-4 w-4" />
              시설 탐색하기
            </DsButton>
          </div>
        </motion.div>
      ) : (
        <FadeInStagger faster className="space-y-6">
          {visibleInterests.map((facility) => {
            const config = statusConfig[facility.status]
            const occupancyPct = facility.capacity > 0
              ? Math.round((facility.current / facility.capacity) * 100)
              : 0
            const available = facility.capacity - facility.current
            return (
              <FadeIn key={facility.id}>
                <motion.div {...hoverLift}>
                  <div
                    className={cn(
                      'group/card relative overflow-hidden',
                      DS_CARD.raised.base,
                      DS_CARD.raised.dark,
                      DS_CARD.raised.hover,
                    )}
                  >
                    {/* Status accent bar */}
                    <div className={cn('h-1', config.accent)} />

                    <div className="relative z-10 px-4 py-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Text className={cn(DS_TYPOGRAPHY.h3, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
                              {facility.name}
                            </Text>
                            <ToBadge status={facility.status} vacancy={available} compact />
                          </div>
                          <Text className={cn(DS_TYPOGRAPHY.caption, 'mt-0.5 text-dotori-500 dark:text-dotori-400')}>
                            {facility.type} · {facility.address}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge color={config.color}>{config.label}</Badge>
                          <DsButton
                            variant="ghost"
                            aria-label="관심 삭제"
                            className="relative z-30 min-h-11 min-w-11 items-center justify-center p-0"
                            disabled={removingId === facility.id}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRemoveInterest(facility.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </DsButton>
                        </div>
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
                      <div className="relative z-30 mt-3 border-t border-dotori-100 pt-3 dark:border-dotori-800">
                        <DsButton
                          variant="secondary"
                          className="w-full"
                          href={`/my/waitlist?apply=${facility.id}`}
                        >
                          <Clock className="h-4 w-4" />
                          대기 신청
                        </DsButton>
                      </div>
                    </div>

                    <Link
                      href={`/facility/${facility.id}`}
                      aria-label={`${facility.name} 상세보기`}
                      className="absolute inset-0 z-20"
                    >
                      <span className="sr-only">{facility.name} 상세보기</span>
                    </Link>
                  </div>
                </motion.div>
              </FadeIn>
            )
          })}
        </FadeInStagger>
      )}
    </div>
  )
}
