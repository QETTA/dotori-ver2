'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PROGRESS } from '@/lib/design-system/tokens'
import { fadeUp, spring } from '@/lib/motion'
import { XMarkIcon } from '@heroicons/react/24/solid'
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
          className={`${DS_CARD.flat.base} ${DS_CARD.flat.dark} relative p-4 ${className}`}
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 rounded-full p-1 text-dotori-400 transition-colors hover:text-dotori-600"
            aria-label="닫기"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>

          <p className="text-caption font-semibold text-dotori-700 dark:text-dotori-300">
            입소 여정 {step + 1}/4단계
          </p>
          <p className="mt-0.5 text-body-sm font-medium text-dotori-900 dark:text-dotori-50">
            {LABELS[step]}
          </p>

          <div className={`mt-3 ${DS_PROGRESS.base} ${DS_PROGRESS.size.sm} ${DS_PROGRESS.trackTone.dotori}`}>
            <motion.div
              className={`${DS_PROGRESS.fill} ${DS_PROGRESS.fillTone.dotori} ${DS_PROGRESS.fillAnimation}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ...spring.card, delay: 0.2 }}
            />
          </div>

          <div className="mt-2 flex justify-between">
            {([0, 1, 2, 3] as FunnelStep[]).map((s) => (
              <span
                key={s}
                className={`text-caption ${
                  s <= step
                    ? 'font-semibold text-dotori-700 dark:text-dotori-300'
                    : 'text-dotori-400 dark:text-dotori-600'
                }`}
              >
                {LABELS[s]}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
