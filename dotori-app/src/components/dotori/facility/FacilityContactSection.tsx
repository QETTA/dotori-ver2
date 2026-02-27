import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  GlobeAltIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useState } from 'react'

import { MapEmbed } from '@/components/dotori/MapEmbed'
import { DsButton } from '@/components/ds/DsButton'
import { BRAND } from '@/lib/brand-assets'
import { DS_LAYOUT, DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { fadeUp, stagger, tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ActionStatus, Facility } from '@/types/dotori'

const CLS = {
  sectionCard: cn('glass-card', 'relative mb-4 overflow-hidden rounded-2xl border-b border-dotori-100/80 bg-dotori-50/45 px-3 py-3 shadow-sm ring-1 ring-dotori-100/70 dark:border-dotori-800 dark:bg-dotori-950/70'),
  contactLink: cn('glass-card', 'flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-dotori-100 px-3 transition-all hover:bg-dotori-50 dark:border-dotori-800 dark:hover:bg-dotori-900'),
  sectionTitle: cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-900 dark:text-dotori-50'),
} as const

type FacilityContactSectionProps = {
  phone?: string
  address: string
  kakaoMapUrl: string
  websiteUrl: string | null
  copyablePhone?: string
  copyingPhone: boolean
  onCopyPhone: () => void
  copyableAddress?: string
  copyingAddress: boolean
  onCopyAddress: () => void
}

type FacilityLocationMapSectionProps = {
  hasMapLocation: boolean
  facilityId: string
  facilityName: string
  lat: number | null | undefined
  lng: number | null | undefined
  status: Facility['status']
  kakaoMapUrl: string
}

type FacilityActionBarProps = {
  liked: boolean
  isTogglingLike: boolean
  actionStatus: ActionStatus
  error: string | null
  waitingHintText: string
  applyActionLabel: string
  onToggleLike: () => Promise<void>
  onApplyClick: () => Promise<void>
  onResetActionStatus: () => void
}

type FacilityContactMapSectionsProps = FacilityContactSectionProps & FacilityLocationMapSectionProps

export function FacilityContactSection({
  phone,
  address,
  kakaoMapUrl,
  websiteUrl,
  copyablePhone,
  copyingPhone,
  onCopyPhone,
  copyableAddress,
  copyingAddress,
  onCopyAddress,
}: FacilityContactSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <motion.section {...fadeUp} className={CLS.sectionCard}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.watermark}
        alt=""
        aria-hidden="true"
        className={'pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]'}
      />
      <motion.button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="facility-contact-details"
        whileTap={tap.button.whileTap}
        transition={tap.button.transition}
        className={'flex w-full min-h-10 items-center justify-between gap-3 rounded-xl px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-200'}
        >
        <h2
          className={CLS.sectionTitle}
        >
          연락처
        </h2>
        <ChevronDownIcon
          className={cn(
            'h-5 w-5 flex-shrink-0 text-dotori-500 transition-transform duration-200',
            isExpanded
              ? 'rotate-180'
              : undefined,
          )}
        />
      </motion.button>
      {isExpanded ? (
        <motion.div
          id="facility-contact-details"
          {...stagger.container}
          className={cn(
            DS_TYPOGRAPHY.bodySm,
            'mt-3 space-y-3 text-dotori-700 dark:text-dotori-200',
          )}
        >
          {phone ? (
            <motion.div {...stagger.container} className={'flex flex-col gap-2 sm:flex-row'}>
              <motion.a
                href={`tel:${phone}`}
                whileTap={tap.button.whileTap}
                transition={tap.button.transition}
                className={CLS.contactLink}
              >
                <PhoneIcon className={'h-5 w-5 text-dotori-500'} />
                <span>{phone}</span>
              </motion.a>
              <motion.div
                {...stagger.item}
                whileTap={tap.button.whileTap}
                transition={tap.button.transition}
              >
                <DsButton
                  variant="ghost"
                  type="button"
                  onClick={onCopyPhone}
                  disabled={!copyablePhone || copyingPhone}
                  className={cn(DS_TYPOGRAPHY.bodySm, 'min-h-11 min-w-28 px-3')}
                >
                  <ClipboardDocumentIcon className={'h-5 w-5'} />
                  전화 복사
                </DsButton>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              {...stagger.item}
              className={cn(
                DS_TYPOGRAPHY.bodySm,
                'flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-dotori-100 px-3 transition-all hover:bg-dotori-50 dark:border-dotori-800 dark:hover:bg-dotori-900',
                'py-2 text-dotori-500 dark:text-dotori-300',
              )}
            >
              <PhoneIcon className={'h-5 w-5'} />
              <span>전화번호 미제공</span>
            </motion.div>
          )}
          <motion.div {...stagger.container} className={'flex flex-col gap-2 sm:flex-row'}>
            <motion.a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={tap.button.whileTap}
              transition={tap.button.transition}
              className={CLS.contactLink}
            >
              <MapPinIcon className={'h-5 w-5 text-dotori-500'} />
              <span className={'line-clamp-2'}>{address}</span>
            </motion.a>
            <motion.div
              {...stagger.item}
              whileTap={tap.button.whileTap}
              transition={tap.button.transition}
            >
              <DsButton
                variant="ghost"
                type="button"
                onClick={onCopyAddress}
                disabled={!copyableAddress || copyingAddress}
                className={cn(DS_TYPOGRAPHY.bodySm, 'min-h-11 min-w-28 px-3')}
              >
                <ClipboardDocumentIcon className={'h-5 w-5'} />
                주소 복사
              </DsButton>
            </motion.div>
          </motion.div>
          {websiteUrl && (
            <motion.a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={tap.button.whileTap}
              transition={tap.button.transition}
              {...stagger.item}
              className={CLS.contactLink}
            >
              <GlobeAltIcon className={'h-5 w-5 text-dotori-500'} />
              <span>홈페이지 열기</span>
            </motion.a>
          )}
        </motion.div>
      ) : null}
    </motion.section>
  )
}

export function FacilityLocationMapSection({
  hasMapLocation,
  facilityId,
  facilityName,
  lat,
  lng,
  status,
  kakaoMapUrl,
}: FacilityLocationMapSectionProps) {
  if (!hasMapLocation) {
    return null
  }
  const safeLat = Number(lat)
  const safeLng = Number(lng)
  const statusTone = DS_STATUS[status]

  return (
    <motion.section {...fadeUp} className={CLS.sectionCard}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.socialCream}
        alt=""
        aria-hidden="true"
        className={'pointer-events-none absolute top-2 right-2 h-10 w-10 opacity-[0.16]'}
      />
      <div className={'flex flex-wrap items-center gap-2'}>
        <h2
          className={CLS.sectionTitle}
        >
          지도
        </h2>
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-label font-semibold',
            statusTone.pill,
          )}
        >
          <span className={cn('size-2 rounded-full', statusTone.dot)} />
          <span>{statusTone.label}</span>
        </div>
      </div>
      <div className={'mt-3 overflow-hidden rounded-2xl border border-dotori-100 dark:border-dotori-800'}>
        <MapEmbed
          facilities={[
            {
              id: facilityId,
              name: facilityName,
              lat: safeLat,
              lng: safeLng,
              status,
            },
          ]}
          center={{ lat: safeLat, lng: safeLng }}
          height="h-56"
        />
      </div>
      <motion.a
        href={kakaoMapUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={tap.button.whileTap}
        transition={tap.button.transition}
        variants={stagger.item.variants}
        initial="hidden"
        animate="show"
        className={cn(
          DS_TYPOGRAPHY.bodySm,
          'inline-flex min-h-11 items-center gap-1 rounded-xl px-3 py-2.5 font-semibold text-dotori-700 transition-all hover:bg-dotori-50 hover:text-dotori-900 dark:text-dotori-200 dark:hover:bg-dotori-900 dark:hover:text-dotori-50',
        )}
      >
        카카오맵에서 자세히 보기
      </motion.a>
    </motion.section>
  )
}

export function FacilityActionBar({
  liked,
  isTogglingLike,
  actionStatus,
  error,
  waitingHintText,
  applyActionLabel,
  onToggleLike,
  onApplyClick,
  onResetActionStatus,
}: FacilityActionBarProps) {
  return (
    <motion.section
      {...stagger.container}
      className={cn(
        'fixed inset-x-3 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-md rounded-[1.4rem] border border-dotori-200/75 bg-white/92 backdrop-blur-lg px-3 py-2.5 shadow-lg ring-1 ring-dotori-200/65 dark:border-dotori-700/80 dark:bg-dotori-950/92 md:static md:w-full',
        'glass-float',
        DS_LAYOUT.SAFE_AREA_FLOATING_ACTION,
      )}
    >
      <div className={'mx-auto flex w-full max-w-md flex-col space-y-2 px-0.5'}>
        <motion.div {...stagger.container} className={'flex gap-3'}>
            <motion.div
              {...stagger.item}
              whileTap={tap.button.whileTap}
              transition={tap.button.transition}
              className={'flex-1'}
            >
            <DsButton
              variant="ghost"
              disabled={isTogglingLike}
              onClick={onToggleLike}
              aria-label="관심 시설 추가/제거"
              className={cn(
                DS_TYPOGRAPHY.bodySm,
                'flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dotori-200 bg-white px-3 font-semibold text-dotori-700 dark:border-dotori-700 dark:bg-dotori-950 dark:text-dotori-100',
              )}
            >
              {liked ? (
                <HeartSolid className={'h-5 w-5 text-dotori-500'} />
              ) : (
                <HeartIcon className={'h-5 w-5'} />
              )}
              {liked ? '관심 추가됨' : '관심 추가'}
            </DsButton>
          </motion.div>
          <div className={'flex-1'}>
            {actionStatus === 'executing' ? (
              <motion.div {...stagger.item} className={'min-h-11 rounded-xl border border-dotori-100 bg-dotori-50 dark:border-dotori-800 dark:bg-dotori-900'}>
                <div className={'flex h-full items-center justify-center gap-2'}>
                  <ArrowPathIcon className={'h-5 w-5 animate-spin text-dotori-700 dark:text-dotori-100'} />
                  <span
                    className={cn(
                      DS_TYPOGRAPHY.bodySm,
                      'font-semibold text-dotori-700 dark:text-dotori-100',
                    )}
                  >
                    신청 처리 중...
                  </span>
                </div>
              </motion.div>
            ) : actionStatus === 'success' ? (
              <motion.div {...stagger.item} className={'rounded-xl border border-forest-200 bg-forest-50 dark:border-forest-800 dark:bg-forest-950/30'}>
                <CheckCircleIcon className={'mx-auto h-6 w-6 animate-in text-forest-600 duration-300 zoom-in dark:text-forest-200'} />
                <p
                  className={cn(
                    DS_TYPOGRAPHY.bodySm,
                    'mt-2 font-semibold text-dotori-900 dark:text-dotori-50',
                  )}
                >
                  대기 신청 완료!
                </p>
                <Link
                  href="/my/waitlist"
                  className={cn(
                    DS_TYPOGRAPHY.bodySm,
                    'mt-1 inline-flex min-h-11 items-center font-semibold text-dotori-700 underline underline-offset-4 transition-colors hover:text-dotori-900 dark:text-dotori-200 dark:hover:text-dotori-50',
                  )}
                >
                  MY &gt; 대기 현황에서 확인하세요
                </Link>
                <motion.div
                  {...stagger.item}
                  whileTap={tap.button.whileTap}
                  transition={tap.button.transition}
                  className={'mt-2'}
                >
                  <DsButton
                    variant="ghost"
                    onClick={onResetActionStatus}
                  className={cn(
                    DS_TYPOGRAPHY.bodySm,
                    'min-h-11 w-full rounded-xl',
                  )}
                  >
                    확인
                  </DsButton>
                </motion.div>
              </motion.div>
            ) : actionStatus === 'error' ? (
              <motion.div {...stagger.item} className={'rounded-xl border border-danger/30 bg-danger/5 dark:bg-danger/10'}>
                <p className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-danger')}>
                  {error ?? '대기 신청 중 오류가 발생했어요.'}
                </p>
                <div className={'mt-2 flex gap-2'}>
                  <motion.div
                    {...stagger.item}
                    whileTap={tap.button.whileTap}
                    transition={tap.button.transition}
                    className={'flex-1'}
                  >
                    <DsButton
                      variant="ghost"
                      onClick={onResetActionStatus}
                      className={cn(DS_TYPOGRAPHY.bodySm, 'min-h-11 w-full rounded-xl')}
                    >
                      닫기
                    </DsButton>
                  </motion.div>
                  <motion.div
                    {...stagger.item}
                    whileTap={tap.button.whileTap}
                    transition={tap.button.transition}
                    className={'flex-1'}
                  >
                    <DsButton
                      onClick={onApplyClick}
                      className={cn(DS_TYPOGRAPHY.bodySm, 'min-h-11 w-full rounded-xl')}
                    >
                      다시 신청
                    </DsButton>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div
                  {...stagger.item}
                  whileTap={tap.button.whileTap}
                  transition={tap.button.transition}
                >
                  <DsButton
                    onClick={onApplyClick}
                    className={cn(
                      DS_TYPOGRAPHY.bodySm,
                      'min-h-11 w-full rounded-xl py-2.5 font-semibold shadow-sm shadow-dotori-900/5',
                    )}
                  >
                    {applyActionLabel}
                  </DsButton>
                </motion.div>
                <p
                  className={cn(DS_TYPOGRAPHY.caption, 'mt-1 text-dotori-500 dark:text-dotori-300')}
                >
                  {waitingHintText}
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export function FacilityContactMapSections({
  phone,
  address,
  kakaoMapUrl,
  websiteUrl,
  copyablePhone,
  copyingPhone,
  onCopyPhone,
  copyableAddress,
  copyingAddress,
  onCopyAddress,
  hasMapLocation,
  facilityId,
  facilityName,
  lat,
  lng,
  status,
}: FacilityContactMapSectionsProps) {
  return (
    <div className={DS_LAYOUT.SAFE_AREA_BOTTOM}>
      <FacilityContactSection
        phone={phone}
        address={address}
        kakaoMapUrl={kakaoMapUrl}
        websiteUrl={websiteUrl}
        copyablePhone={copyablePhone}
        copyingPhone={copyingPhone}
        onCopyPhone={onCopyPhone}
        copyableAddress={copyableAddress}
        copyingAddress={copyingAddress}
        onCopyAddress={onCopyAddress}
      />
      <FacilityLocationMapSection
        hasMapLocation={hasMapLocation}
        facilityId={facilityId}
        facilityName={facilityName}
        lat={lat}
        lng={lng}
        status={status}
        kakaoMapUrl={kakaoMapUrl}
      />
    </div>
  )
}
