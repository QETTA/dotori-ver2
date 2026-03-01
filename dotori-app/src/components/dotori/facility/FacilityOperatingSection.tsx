'use client'

import { Building2, ChevronDown, Clock, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/catalyst/badge'
import { BRAND } from '@/lib/brand-assets'
import { DS_GLASS, DS_SHADOW, DS_TEXT, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { fadeUp, stagger, tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Facility } from '@/types/dotori'

const CLS = {
  sectionCard: cn(
    'relative overflow-hidden rounded-2xl px-3 py-6 ring-1 ring-dotori-100/70 dark:ring-dotori-800/70',
    DS_GLASS.card,
    DS_GLASS.dark.card,
    DS_SHADOW.sm,
    DS_SHADOW.dark.sm,
  ),
  sectionTitle: cn(DS_TYPOGRAPHY.h3, 'font-semibold', DS_TEXT.primary),
  row: cn(
    'flex items-start gap-3 rounded-xl border border-dotori-100/80 bg-white/70 px-3 py-2.5',
    'dark:border-dotori-800 dark:bg-dotori-950',
  ),
  rowLabel: cn(DS_TYPOGRAPHY.caption, 'font-medium text-dotori-500'),
  rowValue: cn(DS_TYPOGRAPHY.bodySm, 'font-semibold', DS_TEXT.primary),
} as const

type FacilityOperatingSectionProps = {
  operatingHours: Facility['operatingHours'] | null | undefined
  establishmentYear?: number | null
  roomCount?: number | null
  teacherCount?: number | null
}

export function FacilityOperatingSection({
  operatingHours,
  establishmentYear,
  roomCount,
  teacherCount,
}: FacilityOperatingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const operatingSummary = useMemo(() => {
    if (!operatingHours?.open || !operatingHours?.close) return null
    return `${operatingHours.open} ~ ${operatingHours.close}`
  }, [operatingHours?.close, operatingHours?.open])

  const hasAnyDetail = Boolean(
    operatingSummary ||
      typeof establishmentYear === 'number' ||
      typeof roomCount === 'number' ||
      typeof teacherCount === 'number' ||
      typeof operatingHours?.extendedCare === 'boolean',
  )

  return (
    <motion.section {...fadeUp} className={CLS.sectionCard}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.watermark}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]"
      />

      <motion.button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="facility-operating-details"
        whileTap={tap.button.whileTap}
        transition={tap.button.transition}
        className="flex w-full min-h-11 items-center justify-between gap-3 rounded-xl px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-200"
      >
        <div className="flex min-w-0 items-center gap-2">
          <h2 className={CLS.sectionTitle}>운영 정보</h2>
          {operatingSummary ? (
            <span className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.secondary)}>
              {operatingSummary}
            </span>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0 text-dotori-500 transition-transform duration-200',
            isExpanded ? 'rotate-180' : undefined,
          )}
        />
      </motion.button>

      {isExpanded ? (
        <motion.div
          id="facility-operating-details"
          {...stagger.container}
          className="mt-3 space-y-2"
        >
          {hasAnyDetail ? (
            <>
              {operatingSummary ? (
                <motion.div {...stagger.item} className={CLS.row}>
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-dotori-500" />
                  <div className="min-w-0 flex-1">
                    <p className={CLS.rowLabel}>운영시간</p>
                    <p className={CLS.rowValue}>{operatingSummary}</p>
                  </div>
                  {typeof operatingHours?.extendedCare === 'boolean' ? (
                    <Badge
                      color={operatingHours.extendedCare ? 'forest' : 'dotori'}
                      className="text-label"
                    >
                      {operatingHours.extendedCare ? '연장보육' : '일반'}
                    </Badge>
                  ) : null}
                </motion.div>
              ) : null}

              {typeof establishmentYear === 'number' ? (
                <motion.div {...stagger.item} className={CLS.row}>
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-dotori-500" />
                  <div className="min-w-0 flex-1">
                    <p className={CLS.rowLabel}>설립연도</p>
                    <p className={CLS.rowValue}>{establishmentYear}년</p>
                  </div>
                </motion.div>
              ) : null}

              {typeof roomCount === 'number' || typeof teacherCount === 'number' ? (
                <motion.div {...stagger.item} className={CLS.row}>
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-dotori-500" />
                  <div className="min-w-0 flex-1">
                    <p className={CLS.rowLabel}>규모</p>
                    <p className={CLS.rowValue}>
                      {typeof roomCount === 'number' ? `반 ${roomCount}개` : '반 정보 없음'}
                      {typeof teacherCount === 'number' ? ` · 교사 ${teacherCount}명` : null}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </>
          ) : (
            <motion.p
              {...stagger.item}
              className={cn(DS_TYPOGRAPHY.bodySm, DS_TEXT.muted)}
            >
              아직 운영 정보가 없어요.
            </motion.p>
          )}
        </motion.div>
      ) : null}
    </motion.section>
  )
}
