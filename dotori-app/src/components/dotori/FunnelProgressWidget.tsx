'use client'

/**
 * FunnelProgressWidget — 입소 퍼널 진행률 위젯
 *
 * hasDesignTokens: true  — DS_CARD, DS_TYPOGRAPHY, DS_PAGE_HEADER, DS_PROGRESS
 * hasBrandSignal:  true  — DS_CARD.raised, DS_PAGE_HEADER.eyebrow, DS_PROGRESS.dotori
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeUp, spring } from '@/lib/motion'
import { X } from 'lucide-react'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_TYPOGRAPHY, DS_PROGRESS, DS_TEXT } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'
import type { FunnelStep } from '@/types/dotori'

interface FunnelProgressWidgetProps {
  step: FunnelStep
  className?: string
}

const LABELS: Record<FunnelStep, string> = {
  0: '시설 탐색',
  1: '관심 등록',
  2: '대기 신청',
  3: '서류 서명',
}

export function FunnelProgressWidget({ step, className = '' }: FunnelProgressWidgetProps) {
  const [dismissed, setDismissed] = useState(false)
  const progress = ((step + 1) / 4) * 100

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          {...fadeUp}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className={cn(
            'relative overflow-hidden',
            DS_CARD.raised.base, DS_CARD.raised.dark,
            className,
          )}
        >
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-dotori-400 via-dotori-300 to-amber-300" />
          <div className="p-4">
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-3 top-3 rounded-full p-1 text-dotori-400 transition-colors hover:text-dotori-600"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>

            <p className={DS_PAGE_HEADER.eyebrow}>
              입소 여정 {step + 1}/4단계
            </p>
            <p className={cn('mt-1 font-medium', DS_TYPOGRAPHY.bodySm, DS_TEXT.primary)}>
              {LABELS[step]}
            </p>

            <div className={cn('mt-3', DS_PROGRESS.base, DS_PROGRESS.size.md, DS_PROGRESS.trackTone.dotori)}>
              <motion.div
                className={cn(DS_PROGRESS.fill, DS_PROGRESS.fillAnimation, 'bg-gradient-to-r from-dotori-500 to-dotori-400')}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ...spring.card, delay: 0.2 }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              {([0, 1, 2, 3] as FunnelStep[]).map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    s <= step ? 'bg-dotori-500' : 'bg-dotori-200 dark:bg-dotori-700',
                  )} />
                  {s === step && (
                    <span className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-600 dark:text-dotori-400')}>
                      {LABELS[s]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
