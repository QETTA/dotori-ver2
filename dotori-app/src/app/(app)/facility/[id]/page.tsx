'use client'

/**
 * Facility Detail — R49: Mock→Real + StickyBottomCTA + ToRiFAB
 *
 * Catalyst: Heading, Text, Divider, Badge, DsButton, DescriptionList
 * Studio:   FadeIn, StatList
 * Charts:   DonutGauge, BarChart
 */
import { use } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  ArrowLeftIcon,
  MapPinIcon,
  ShareIcon,
  HeartIcon,
  VideoCameraIcon,
  TruckIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { copy } from '@/lib/brand-copy'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Heading, Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { DescriptionList, DescriptionTerm, DescriptionDetails } from '@/components/catalyst/description-list'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { FunnelSteps } from '@/components/dotori/FunnelSteps'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import { ToBadge } from '@/components/dotori/ToBadge'
import { StickyBottomCTA } from '@/components/dotori/StickyBottomCTA'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'
import { DonutGauge } from '@/components/dotori/charts/DonutGauge'
import { BarChart } from '@/components/dotori/charts/BarChart'
import { PhotoGallery } from '@/components/dotori/PhotoGallery'
import { useFacilityDetail } from '@/hooks/use-facility-detail'

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CCTV: VideoCameraIcon,
  통학버스: TruckIcon,
  평가인증: StarIcon,
}

export default function FacilityDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = use(paramsPromise)
  const { facility, isLoading, error, refetch } = useFacilityDetail(params.id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="facility-card" count={3} />
      </div>
    )
  }

  if (error || !facility) {
    return (
      <ErrorState
        message="시설 정보를 불러오지 못했어요"
        variant="network"
        action={{ label: '다시 시도', onClick: refetch }}
      />
    )
  }

  const vacancies = Math.max(0, facility.capacity.total - facility.capacity.current)
  const toScore = facility.toScore ?? Math.round((vacancies / Math.max(facility.capacity.total, 1)) * 100)

  const facilityPhotos = facility.images?.length
    ? facility.images.map((src, i) => ({ src, alt: `${facility.name} 사진 ${i + 1}` }))
    : [{ src: '/brand/dotori-og-wide.png', alt: '시설 대표 이미지' }]

  const features = facility.features ?? []

  return (
    <div className="relative space-y-10 pb-24">
      <BrandWatermark className="opacity-30" />

      {/* ══════ NAV ══════ */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm/6 text-dotori-600 hover:text-dotori-950 dark:text-dotori-400 dark:hover:text-white">
            <ArrowLeftIcon className="h-4 w-4" />
            목록으로
          </Link>
          <div className="flex gap-2">
            <DsButton variant="ghost" aria-label="공유하기" className={cn('grid h-9 w-9 place-items-center rounded-lg p-0', DS_CARD.flat.base, DS_CARD.flat.dark)}>
              <ShareIcon className="h-4 w-4 text-dotori-600 dark:text-dotori-400" />
            </DsButton>
            <DsButton variant="ghost" aria-label="관심 등록" className={cn('grid h-9 w-9 place-items-center rounded-lg p-0', DS_CARD.flat.base, DS_CARD.flat.dark)}>
              <HeartIcon className="h-4 w-4 text-dotori-600 dark:text-dotori-400" />
            </DsButton>
          </div>
        </div>
      </FadeIn>

      {/* ══════ PHOTO GALLERY ══════ */}
      <FadeIn>
        <PhotoGallery images={facilityPhotos} />
      </FadeIn>

      {/* ══════ HERO ══════ */}
      <div>
        <FadeIn>
          <div className="flex items-center gap-2">
            <ToBadge status={facility.status} vacancy={vacancies} />
            <Text className="font-mono text-xs/5 text-dotori-500 sm:text-xs/5">{facility.type}</Text>
          </div>
        </FadeIn>
        <FadeIn>
          <Heading className="mt-4 font-wordmark text-4xl/[1.15] font-bold tracking-tight text-dotori-950 sm:text-4xl/[1.15]">
            {facility.name}
          </Heading>
        </FadeIn>
        <FadeIn>
          <div className="mt-3 flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 shrink-0 text-dotori-600 dark:text-dotori-400" />
            <Text className="text-sm/6 text-dotori-600 sm:text-sm/6 dark:text-dotori-400">{facility.address}</Text>
          </div>
        </FadeIn>
      </div>

      {/* ══════ TO SCORE — DonutGauge (상단 배치) ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className="rounded-xl bg-forest-50 p-6 dark:bg-forest-950/20">
          <div className="flex items-center gap-6">
            <DonutGauge
              value={toScore}
              size={100}
              strokeWidth={8}
              color="forest"
              label="입소 가능성"
              sublabel="TO 예측 엔진"
            />
            <div className="flex-1 space-y-2">
              <Subheading level={2} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
                빈자리 {vacancies}석
              </Subheading>
              <Text className="text-caption text-dotori-600 dark:text-dotori-400">
                정원 {facility.capacity.total}명 중 {facility.capacity.current}명 재원
              </Text>
              {facility.capacity.waiting > 0 && (
                <Text className="text-caption text-amber-600 dark:text-amber-400">
                  대기 {facility.capacity.waiting}명
                </Text>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════ CAPACITY BarChart ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6')}>
          <Subheading level={3} className="mb-4 text-sm/6 font-medium text-dotori-950 sm:text-sm/6">
            정원 현황
          </Subheading>
          <BarChart
            bars={[
              { label: '정원', value: facility.capacity.total, color: 'bg-dotori-300 dark:bg-dotori-600' },
              { label: '현원', value: facility.capacity.current, color: 'bg-forest-500' },
              { label: '빈자리', value: vacancies, color: 'bg-forest-300 dark:bg-forest-400' },
            ]}
            orientation="horizontal"
          />
        </div>
      </motion.div>

      <Divider soft />

      {/* ══════ DESCRIPTION LIST ══════ */}
      <motion.div {...scrollFadeIn}>
        <Subheading level={2} className="mb-4 text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">시설 정보</Subheading>
        <DescriptionList>
          {facility.establishmentYear && (
            <>
              <DescriptionTerm>설립연도</DescriptionTerm>
              <DescriptionDetails>{facility.establishmentYear}년</DescriptionDetails>
            </>
          )}
          {facility.operatingHours && (
            <>
              <DescriptionTerm>운영시간</DescriptionTerm>
              <DescriptionDetails>{facility.operatingHours.open} ~ {facility.operatingHours.close}</DescriptionDetails>
            </>
          )}
          {facility.phone && (
            <>
              <DescriptionTerm>전화</DescriptionTerm>
              <DescriptionDetails>{facility.phone}</DescriptionDetails>
            </>
          )}
          <DescriptionTerm>주소</DescriptionTerm>
          <DescriptionDetails>{facility.address}</DescriptionDetails>
        </DescriptionList>
      </motion.div>

      {/* ══════ FEATURES / AMENITIES ══════ */}
      {features.length > 0 && (
        <motion.div {...scrollFadeIn}>
          <Subheading level={2} className="mb-3 text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
            편의시설
          </Subheading>
          <div className="flex flex-wrap gap-2">
            {features.map((feat) => {
              const Icon = amenityIcons[feat]
              return (
                <div
                  key={feat}
                  className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5', DS_CARD.flat.base, DS_CARD.flat.dark)}
                >
                  {Icon && <Icon className="h-4 w-4 text-forest-600 dark:text-forest-400" />}
                  <span className="text-xs font-medium text-dotori-700 dark:text-dotori-300">{feat}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ══════ LOCATION ══════ */}
      <motion.div {...scrollFadeIn}>
        <Subheading level={2} className="mb-3 text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
          위치
        </Subheading>
        <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-dotori-100/60 dark:bg-dotori-800/30">
          <div className="text-center">
            <MapPinIcon className="mx-auto h-8 w-8 text-dotori-400" />
            <Text className="mt-2 text-xs text-dotori-500">지도 준비 중</Text>
          </div>
        </div>
      </motion.div>

      {/* ══════ REVIEWS ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className="flex items-center justify-between">
          <Subheading level={2} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
            리뷰
          </Subheading>
          <DsButton variant="ghost" className="text-xs text-dotori-500">
            리뷰 쓰기
          </DsButton>
        </div>
        <div className={cn('mt-3 flex items-center gap-3 p-4', DS_CARD.flat.base, DS_CARD.flat.dark)}>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon
                key={i}
                className={cn('h-4 w-4', i < Math.round(facility.rating) ? 'text-amber-400' : 'text-dotori-200 dark:text-dotori-700')}
              />
            ))}
          </div>
          <Text className="text-sm font-medium text-dotori-700 dark:text-dotori-300">
            {facility.rating.toFixed(1)}
          </Text>
          <Text className="text-xs text-dotori-500">(리뷰 {facility.reviewCount}개)</Text>
        </div>
      </motion.div>

      {/* ══════ FUNNEL STEPS ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6')}>
          <Subheading level={2} className="font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-500 sm:text-xs/5">
            {copy.facility.funnelLabel}
          </Subheading>
          <div className="mt-4">
            <FunnelSteps currentStep={0} />
          </div>
        </div>
      </motion.div>

      {/* ══════ STICKY BOTTOM CTA ══════ */}
      <StickyBottomCTA
        facilityName={facility.name}
        phone={facility.phone}
      />

      {/* ══════ ToRI FAB ══════ */}
      <ToRiFAB prompt={`${facility.name}에 대해 알려줘`} />
    </div>
  )
}
