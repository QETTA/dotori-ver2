'use client'

import { ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/catalyst/badge'
import { DsButton } from '@/components/ds/DsButton'
import { apiFetch } from '@/lib/api'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { scrollFadeIn, stagger } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { TOConfidenceLevel, TOPredictionResult } from '@/types/dotori'

const CONFIDENCE_BADGE: Record<TOConfidenceLevel, { color: 'green' | 'zinc' | 'yellow'; label: string }> = {
  high: { color: 'green', label: '높음' },
  medium: { color: 'yellow', label: '보통' },
  low: { color: 'zinc', label: '낮음' },
}

const GAUGE_SIZE = 80
const GAUGE_STROKE = 6
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

function TOScoreGauge({ score }: { score: number }) {
  const clampedScore = Math.min(100, Math.max(0, score))
  const toneClass = score >= 70
    ? 'stroke-forest-500 dark:stroke-forest-400'
    : score >= 40
      ? 'stroke-dotori-500 dark:stroke-dotori-400'
      : 'stroke-dotori-300 dark:stroke-dotori-600'

  return (
    <div className="relative flex items-center justify-center">
      <svg width={GAUGE_SIZE} height={GAUGE_SIZE} className="-rotate-90">
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          fill="none"
          strokeWidth={GAUGE_STROKE}
          className="stroke-dotori-100 dark:stroke-dotori-800"
        />
        <motion.circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          fill="none"
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
          className={toneClass}
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          initial={{ strokeDashoffset: GAUGE_CIRCUMFERENCE }}
          whileInView={{ strokeDashoffset: GAUGE_CIRCUMFERENCE * (1 - clampedScore / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <span className={cn(DS_TYPOGRAPHY.h2, 'absolute font-bold text-dotori-900 dark:text-dotori-50')}>
        {score}
      </span>
    </div>
  )
}

export function FacilityTOPrediction({ facilityId }: { facilityId: string }) {
  const [data, setData] = useState<TOPredictionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchPrediction = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch<{ data: TOPredictionResult }>(
        `/api/facilities/${facilityId}/to-prediction`,
      )
      setData(res.data)
      setNotFound(false)
    } catch (err: unknown) {
      const status = (err as { status?: number }).status
      if (status === 404) {
        setNotFound(true)
      }
    } finally {
      setLoading(false)
    }
  }, [facilityId])

  useEffect(() => {
    fetchPrediction()
  }, [fetchPrediction])

  if (loading) {
    return (
      <div className="space-y-3 p-4" role="status" aria-busy aria-label="TO 예측 로딩 중">
        <div className="h-5 w-32 animate-pulse rounded-lg bg-dotori-100/80 dark:bg-dotori-800/60" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-dotori-100/80 dark:bg-dotori-800/60" />
          ))}
        </div>
        <div className="h-2 animate-pulse rounded-full bg-dotori-100/80 dark:bg-dotori-800/60" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-2.5">
          <ChartBarIcon className="mt-0.5 h-5 w-5 shrink-0 text-dotori-400" />
          <div>
            <p className={cn(DS_TYPOGRAPHY.h3, 'font-semibold text-dotori-900 dark:text-dotori-50')}>
              TO 예측
            </p>
            <p className={cn(DS_TYPOGRAPHY.bodySm, 'mt-1 text-dotori-600 dark:text-dotori-300')}>
              스냅샷을 수집 중이에요. 데이터가 충분히 쌓이면 자동으로 예측이 시작됩니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const conf = CONFIDENCE_BADGE[data.confidence]
  const calculatedDate = new Date(data.calculatedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div {...scrollFadeIn} className="p-4">
      {/* Header + Gauge */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-dotori-500" />
            <h3 className={cn(DS_TYPOGRAPHY.h3, 'font-semibold text-dotori-900 dark:text-dotori-50')}>
              4주 후 TO 예측
            </h3>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge color={conf.color}>
              신뢰도 {conf.label}
            </Badge>
          </div>
        </div>
        <TOScoreGauge score={data.overallScore} />
      </div>

      {/* Stat row */}
      <motion.div {...stagger.container} className="mt-4 grid grid-cols-2 gap-2">
        <motion.div {...stagger.item} className="rounded-xl bg-dotori-50/95 p-3 text-center ring-1 ring-dotori-200/70 dark:bg-dotori-900/45 dark:ring-dotori-700/40">
          <p className={cn(DS_TYPOGRAPHY.h2, 'font-bold text-forest-700 dark:text-forest-300')}>
            {data.predictedVacancies}
            <span className={cn(DS_TYPOGRAPHY.caption, 'ml-0.5 font-normal text-dotori-500')}>석</span>
          </p>
          <p className={cn(DS_TYPOGRAPHY.caption, 'mt-0.5 text-dotori-600 dark:text-dotori-300')}>
            예상 빈자리
          </p>
        </motion.div>
        <motion.div {...stagger.item} className="rounded-xl bg-dotori-50/95 p-3 text-center ring-1 ring-dotori-200/70 dark:bg-dotori-900/45 dark:ring-dotori-700/40">
          <p className={cn(DS_TYPOGRAPHY.h2, 'font-bold text-dotori-900 dark:text-dotori-50')}>
            {data.byAgeClass.length}
            <span className={cn(DS_TYPOGRAPHY.caption, 'ml-0.5 font-normal text-dotori-500')}>반</span>
          </p>
          <p className={cn(DS_TYPOGRAPHY.caption, 'mt-0.5 text-dotori-600 dark:text-dotori-300')}>
            분석 대상
          </p>
        </motion.div>
      </motion.div>

      {/* Age class breakdown */}
      {data.byAgeClass.length > 0 && (
        <motion.div {...stagger.item} className="mt-4">
          <p className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-600 dark:text-dotori-300')}>
            연령반별 예측
          </p>
          <div className="mt-2 space-y-1.5">
            {data.byAgeClass.map((ac) => {
              const acConf = CONFIDENCE_BADGE[ac.confidence]
              return (
                <div
                  key={ac.className}
                  className="flex items-center justify-between rounded-lg bg-dotori-50/60 px-3 py-2 ring-1 ring-dotori-100/70 dark:bg-dotori-900/30 dark:ring-dotori-800/40"
                >
                  <span className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-800 dark:text-dotori-100')}>
                    {ac.className}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-600 dark:text-dotori-300')}>
                      {ac.currentVacancy}석 → {ac.predictedVacancy}석
                    </span>
                    <Badge color={acConf.color} className="text-label">
                      {acConf.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Factors */}
      {data.factors.length > 0 && (
        <motion.div {...stagger.item} className="mt-4">
          <p className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-600 dark:text-dotori-300')}>
            영향 요인
          </p>
          <div className="mt-2 space-y-1.5">
            {data.factors.map((factor) => (
              <div
                key={factor.name}
                className="flex items-center gap-2.5 rounded-lg bg-dotori-50/60 px-3 py-2 ring-1 ring-dotori-100/70 dark:bg-dotori-900/30 dark:ring-dotori-800/40"
              >
                <span
                  className={cn(
                    DS_TYPOGRAPHY.bodySm,
                    'shrink-0 font-semibold',
                    factor.impact > 0
                      ? 'text-forest-600 dark:text-forest-400'
                      : factor.impact < 0
                        ? 'text-danger'
                        : 'text-dotori-500',
                  )}
                >
                  {factor.impact > 0 ? `+${factor.impact}` : factor.impact}
                </span>
                <span className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-700 dark:text-dotori-200')}>
                  {factor.description}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer info */}
      <motion.div {...stagger.item} className="mt-4 flex items-start gap-2">
        <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-dotori-400" />
        <p className={cn(DS_TYPOGRAPHY.caption, 'text-dotori-500 dark:text-dotori-400')}>
          {calculatedDate} 기준 · 4주 후 전망
        </p>
      </motion.div>

      {/* Premium CTA */}
      <motion.div {...stagger.item} className="mt-3">
        <DsButton
          href="/my?tab=subscription"
          variant="secondary"
          className="min-h-10 w-full justify-center rounded-xl text-body-sm"
        >
          프리미엄 구독 시 매주 업데이트
        </DsButton>
      </motion.div>
    </motion.div>
  )
}
