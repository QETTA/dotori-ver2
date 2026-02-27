'use client'

/**
 * Documents Page — 서류함 (Wave 10 polish)
 *
 * Catalyst: Badge, Heading, Text, DsButton
 * Studio:   FadeIn/FadeInStagger
 * Motion:   hoverLift, scrollFadeIn
 */
import { motion } from 'motion/react'
import { Badge } from '@/components/catalyst/badge'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER, DS_EMPTY_STATE } from '@/lib/design-system/page-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { hoverLift, scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useDocuments } from '@/hooks/use-documents'
import { BundleSignCTA } from '@/components/dotori/BundleSignCTA'
import { FunnelProgressWidget } from '@/components/dotori/FunnelProgressWidget'
import { DonutGauge } from '@/components/dotori/charts/DonutGauge'

const statusConfig = {
  submitted: { label: '제출 완료', color: 'green' as const, accent: 'bg-forest-500', Icon: CheckCircleIcon },
  due_soon: { label: '마감 임박', color: 'amber' as const, accent: 'bg-amber-500', Icon: ExclamationTriangleIcon },
  pending: { label: '미제출', color: 'zinc' as const, accent: 'bg-dotori-300', Icon: ClockIcon },
}

export default function DocumentsPage() {
  const { documents, completionRate, pendingCount, isLoading, error, refetch } = useDocuments()

  return (
    <div className="relative space-y-6">
      <BrandWatermark className="opacity-30" />
      <BreadcrumbNav
        parent={{ label: '마이페이지', href: '/my' }}
        current="서류함"
      />

      {/* ══════ INTRO ══════ */}
      <FadeIn>
        <div>
          <p className={DS_PAGE_HEADER.eyebrow}>
            서류 관리
          </p>
          <h1 className={cn('mt-3 font-wordmark text-3xl/10', DS_PAGE_HEADER.title)}>
            서류함
          </h1>
          <Text className={cn('mt-2', DS_TYPOGRAPHY.body, DS_PAGE_HEADER.subtitle)}>
            입소에 필요한 서류를 한 곳에서 관리하세요.
          </Text>
          <DsButton href="/my/documents/sign" className="mt-4">
            <PencilSquareIcon className="h-4 w-4" />
            서류 서명하기
          </DsButton>
        </div>
      </FadeIn>

      {/* ══════ FUNNEL + BUNDLE CTA ══════ */}
      <FunnelProgressWidget step={3} />
      <BundleSignCTA pendingCount={pendingCount} />

      {/* ══════ COMPLETION RATE ══════ */}
      {documents.length > 0 && (
        <FadeIn>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex items-center gap-4 p-4')}>
            <DonutGauge value={completionRate} size={56} strokeWidth={5} color="forest" />
            <div>
              <Text className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">
                서류 완료율 {completionRate}%
              </Text>
              <Text className="text-caption text-dotori-500">
                {documents.length - pendingCount}/{documents.length}건 완료
              </Text>
            </div>
          </div>
        </FadeIn>
      )}

      {/* ══════ CONTENT ══════ */}
      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : error ? (
        <ErrorState
          message="서류 목록을 불러오지 못했어요"
          variant="network"
          action={{ label: '다시 시도', onClick: refetch }}
        />
      ) : documents.length === 0 ? (
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, DS_EMPTY_STATE.container, 'rounded-2xl')}>
            <BrandEmptyIllustration variant="empty" size={96} className={DS_EMPTY_STATE.illustration} />
            <Text className={DS_EMPTY_STATE.title}>
              아직 등록한 서류가 없어요
            </Text>
            <Text className={DS_EMPTY_STATE.description}>
              입소 서류를 미리 준비하면 지원이 더 빨라져요
            </Text>
            <DsButton className={DS_EMPTY_STATE.action}>
              <ArrowUpTrayIcon className="h-4 w-4" />
              서류 등록하기
            </DsButton>
          </div>
        </motion.div>
      ) : (
        <FadeInStagger faster className="space-y-3">
          {documents.map((doc) => {
            const config = statusConfig[doc.status]
            return (
              <FadeIn key={doc.id}>
                <motion.div {...hoverLift}>
                  <div className={cn('overflow-hidden', DS_CARD.raised.base, DS_CARD.raised.dark, 'transition-shadow hover:shadow-md')}>
                    {/* Status accent bar */}
                    <div className={cn('h-1', config.accent)} />

                    <div className="px-4 py-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', DS_CARD.flat.base, DS_CARD.flat.dark)}>
                            <DocumentTextIcon className="h-4 w-4 text-dotori-500" />
                          </div>
                          <div className="min-w-0">
                            <Text className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
                              {doc.name}
                            </Text>
                            <Text className={cn('mt-0.5', DS_TYPOGRAPHY.caption)}>
                              {doc.description}
                            </Text>
                          </div>
                        </div>
                        <Badge color={config.color}>{config.label}</Badge>
                      </div>

                      {/* Stats row */}
                      <div className="mt-3 flex items-center gap-4 text-caption">
                        {doc.submittedAt && (
                          <>
                            <div>
                              <span className="text-dotori-500">제출일 </span>
                              <span className="font-medium text-dotori-700 dark:text-dotori-200">{doc.submittedAt}</span>
                            </div>
                            <span className="text-dotori-200 dark:text-dotori-700">|</span>
                          </>
                        )}
                        {doc.dueDate && (
                          <div>
                            <span className="text-dotori-500">마감일 </span>
                            <span className="font-semibold text-dotori-900 dark:text-dotori-50">{doc.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
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
