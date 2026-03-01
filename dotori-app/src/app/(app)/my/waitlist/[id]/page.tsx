'use client'

/**
 * Waitlist Detail Page — 입소 대기 신청 상세 (r1-r22-g)
 *
 * UX: 순위 숫자 → 서피스 카드 내부, 상태 뱃지 우측 정렬
 * Typo: text-h2/h3/body-sm/caption
 */
import { use, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowRight, X } from 'lucide-react'
import { Badge } from '@/components/catalyst/badge'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn } from '@/components/dotori/FadeIn'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { AnimatedNumber } from '@/components/dotori/AnimatedNumber'
import { useToast } from '@/components/dotori/ToastProvider'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { DS_GLASS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { scrollFadeIn } from '@/lib/motion'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useApi } from '@/hooks/use-api'

type WaitlistStatus = 'waiting' | 'accepted' | 'cancelled'

interface WaitlistDoc {
  _id: string
  facilityId: unknown
  position?: number
  status?: string
  appliedAt?: string
  childName?: string
}

const statusConfig: Record<WaitlistStatus, { label: string; color: 'dotori' | 'forest'; accent: string }> = {
  waiting: { label: '대기 중', color: 'dotori', accent: 'bg-amber-500' },
  accepted: { label: '입소 확정', color: 'forest', accent: 'bg-forest-500' },
  cancelled: { label: '취소', color: 'dotori', accent: 'bg-dotori-300' },
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function normalizeStatus(value: unknown): WaitlistStatus {
  const status = typeof value === 'string' ? value : ''
  if (status === 'accepted' || status === 'confirmed') return 'accepted'
  if (status === 'cancelled') return 'cancelled'
  return 'waiting'
}

function toFacilityRouteId(facilityId: unknown): string | null {
  if (typeof facilityId === 'string') return facilityId
  const facility = asRecord(facilityId)
  if (!facility) return null
  if (typeof facility.id === 'string') return facility.id
  if (typeof facility._id === 'string') return facility._id
  return null
}

export default function WaitlistDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = use(paramsPromise)
  const router = useRouter()
  const { addToast } = useToast()

  const { data: waitlist, isLoading, error, refetch } = useApi<WaitlistDoc>(
    `/api/waitlist/${params.id}`,
  )
  const [isCancelling, setIsCancelling] = useState(false)

  const derived = useMemo(() => {
    const facility = asRecord(waitlist?.facilityId)
    const facilityName = typeof facility?.name === 'string' ? facility.name : '시설'
    const facilityType = typeof facility?.type === 'string' ? facility.type : ''
    const facilityAddress = typeof facility?.address === 'string' ? facility.address : ''
    const facilityRouteId = toFacilityRouteId(waitlist?.facilityId)

    const rank =
      typeof waitlist?.position === 'number' && Number.isFinite(waitlist.position)
        ? waitlist.position
        : 0

    const status = normalizeStatus(waitlist?.status)

    const appliedAt =
      typeof waitlist?.appliedAt === 'string'
        ? waitlist.appliedAt.slice(0, 10)
        : ''

    const childName = typeof waitlist?.childName === 'string' ? waitlist.childName : ''

    let estimatedDate: string | null = null
    if (rank > 0 && rank <= 3) {
      const now = new Date()
      const estMonth = new Date(now.getFullYear(), now.getMonth() + rank, 1)
      estimatedDate = `${estMonth.getFullYear()}년 ${estMonth.getMonth() + 1}월 예상`
    }

    return {
      facilityName,
      facilityType,
      facilityAddress,
      facilityRouteId,
      rank,
      status,
      appliedAt,
      childName,
      estimatedDate,
    }
  }, [waitlist])

  const handleCancel = useCallback(async () => {
    if (!waitlist || derived.status === 'cancelled') return
    const ok = window.confirm('대기 신청을 취소할까요?')
    if (!ok) return

    setIsCancelling(true)
    try {
      await apiFetch(`/api/waitlist/${params.id}`, { method: 'DELETE' })
      addToast({ type: 'success', message: '대기 신청을 취소했어요' })
      router.push('/my/waitlist')
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '취소에 실패했어요' })
    } finally {
      setIsCancelling(false)
    }
  }, [addToast, derived.status, params.id, router, waitlist])

  return (
    <div className="relative space-y-6">
      <BrandWatermark className="opacity-30" />

      <BreadcrumbNav
        parent={{ label: '입소 대기', href: '/my/waitlist' }}
        current="대기 신청 상세"
      />

      {/* ══════ INTRO ══════ */}
      <FadeIn>
        <div className={DS_PAGE_HEADER.spacing}>
          <p className={DS_PAGE_HEADER.eyebrow}>
            대기 신청
          </p>
          <h1 className={cn(DS_PAGE_HEADER.title, DS_TYPOGRAPHY.h2, 'mt-3 font-wordmark')}>
            {isLoading ? '대기 신청 상세' : derived.facilityName}
          </h1>
          <Text className={cn(DS_PAGE_HEADER.subtitle, DS_TYPOGRAPHY.bodySm, 'mt-2')}>
            순위와 진행 상태를 확인하고 필요한 다음 단계를 준비하세요.
          </Text>
        </div>
      </FadeIn>

      {/* ══════ CONTENT ══════ */}
      {isLoading ? (
        <Skeleton variant="card" count={2} />
      ) : error || !waitlist ? (
        <ErrorState
          message="대기 신청 정보를 불러오지 못했어요"
          variant="network"
          action={{ label: '다시 시도', onClick: refetch }}
          secondaryAction={{ label: '입소 대기 목록으로', href: '/my/waitlist' }}
        />
      ) : (
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'overflow-hidden')}>
            {/* Status accent bar */}
            <div className={cn('h-1', statusConfig[derived.status].accent)} />

            <div className="px-4 py-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn(DS_TYPOGRAPHY.h3, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
                    {derived.facilityName}
                  </p>
                  <p className={cn(DS_TYPOGRAPHY.caption, 'mt-0.5 text-dotori-500 dark:text-dotori-400')}>
                    {derived.facilityType}
                    {derived.facilityAddress ? ` · ${derived.facilityAddress}` : ''}
                  </p>
                </div>

                <Badge color={statusConfig[derived.status].color} className="shrink-0 self-start">
                  {statusConfig[derived.status].label}
                </Badge>
              </div>

              {/* Rank surface */}
              <div
                className={cn(
                  'mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2 ring-1 ring-dotori-100/70',
                  DS_GLASS.card,
                  DS_GLASS.dark.card,
                  'dark:ring-dotori-800/60',
                  derived.rank > 0 && derived.rank <= 3 && 'motion-safe:animate-pulse',
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-500 dark:text-dotori-300')}>
                    대기 순위
                  </span>
                  <span className={cn(DS_TYPOGRAPHY.h2, 'font-extrabold tabular-nums text-dotori-950 dark:text-dotori-50')}>
                    <AnimatedNumber end={derived.rank} className="tabular-nums" />
                  </span>
                  <span className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-500 dark:text-dotori-300')}>
                    번째
                  </span>
                </div>
                {derived.estimatedDate && (
                  <span className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-forest-600 dark:text-forest-400')}>
                    {derived.estimatedDate}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div className={cn('mt-3 flex flex-wrap items-center gap-x-4 gap-y-2', DS_TYPOGRAPHY.caption)}>
                {derived.appliedAt && (
                  <div>
                    <span className="text-dotori-500">신청일 </span>
                    <span className="font-medium text-dotori-700 dark:text-dotori-200">{derived.appliedAt}</span>
                  </div>
                )}
                {derived.childName && (
                  <div>
                    <span className="text-dotori-500">대상 </span>
                    <span className="font-medium text-dotori-700 dark:text-dotori-200">{derived.childName}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {derived.facilityRouteId ? (
                  <DsButton
                    variant="secondary"
                    href={`/facility/${derived.facilityRouteId}`}
                    className="w-full"
                  >
                    시설 상세
                    <ArrowRight className="h-4 w-4" />
                  </DsButton>
                ) : (
                  <DsButton variant="secondary" href="/explore" className="w-full">
                    시설 탐색
                    <ArrowRight className="h-4 w-4" />
                  </DsButton>
                )}

                <DsButton
                  variant="ghost"
                  className={cn('w-full', derived.status === 'cancelled' && 'pointer-events-none opacity-60')}
                  onClick={handleCancel}
                  disabled={isCancelling || derived.status === 'cancelled'}
                >
                  <X className="h-4 w-4" />
                  대기 취소
                </DsButton>
              </div>
            </div>
          </div>

          {/* Helper link */}
          <div className="mt-4 text-center">
            <Link
              href="/my/support"
              className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-500 hover:text-dotori-700')}
            >
              도움이 필요하신가요? 고객센터로 이동 &rarr;
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
