'use client'

/**
 * FunnelSteps — 입소 퍼널 단계 시각화
 *
 * hasDesignTokens: true  — DS_TYPOGRAPHY, DS_PROGRESS, DS_SURFACE
 * hasBrandSignal:  true  — DS_SURFACE.sunken (inactive step bg), DS_PROGRESS.dotori, color="dotori"
 */
import { cn } from '@/lib/utils'
import { DS_TYPOGRAPHY, DS_PROGRESS } from '@/lib/design-system/tokens'
import { DS_SURFACE } from '@/lib/design-system/page-tokens'
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline'

const STEPS = [
  { label: '탐색', description: '어린이집·유치원 통합 검색', Icon: MagnifyingGlassIcon },
  { label: 'TO예측', description: '빈자리 가능성 AI 분석', Icon: ChartBarIcon },
  { label: '견학신청', description: '원클릭 견학 예약', Icon: CalendarDaysIcon },
  { label: '전자서명', description: '입소 서류 10분 완결', Icon: DocumentCheckIcon },
] as const

export interface FunnelStepsProps {
  /** 현재 활성 단계 (0-based). undefined이면 진행 표시 없음 */
  currentStep?: number
  /** compact: 아이콘+라벨+진행바, full: 아이콘+라벨+설명 */
  compact?: boolean
  className?: string
}

export function FunnelSteps({ currentStep, compact = false, className }: FunnelStepsProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {STEPS.map((step, i) => {
          const isActive = typeof currentStep === 'number' && i <= currentStep
          const isCurrent = i === currentStep
          return (
            <div key={step.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full transition-colors',
                  isCurrent
                    ? 'bg-dotori-500 text-white shadow-sm shadow-dotori-500/30'
                    : isActive
                      ? 'bg-dotori-200 text-dotori-700 dark:bg-dotori-700 dark:text-dotori-200'
                      : 'bg-dotori-100 text-dotori-400 dark:bg-dotori-800 dark:text-dotori-600',
                )}
              >
                <step.Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'font-semibold',
                  DS_TYPOGRAPHY.label,
                  isCurrent
                    ? 'text-dotori-900 dark:text-dotori-50'
                    : 'text-dotori-500 dark:text-dotori-400',
                )}
              >
                {step.label}
              </span>
              {/* Progress bar segment */}
              <div
                className={cn(
                  'w-full', DS_PROGRESS.base, DS_PROGRESS.size.sm,
                  isActive
                    ? DS_PROGRESS.fillTone.dotori
                    : DS_PROGRESS.trackTone.dotori,
                )}
              />
            </div>
          )
        })}
      </div>
    )
  }

  // Full mode
  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((step, i) => {
          const isActive = typeof currentStep === 'number' && i <= currentStep
          const isCurrent = i === currentStep
          return (
            <div
              key={step.label}
              className={cn(
                'flex flex-col items-center rounded-xl px-2 py-3 text-center transition-colors',
                isCurrent
                  ? 'bg-dotori-100 ring-1 ring-dotori-300/50 dark:bg-dotori-800 dark:ring-dotori-600/40'
                  : DS_SURFACE.sunken,
              )}
            >
              <div
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-xl transition-colors',
                  isCurrent
                    ? 'bg-dotori-500 text-white shadow-md shadow-dotori-500/25'
                    : isActive
                      ? 'bg-dotori-200 text-dotori-700 dark:bg-dotori-700 dark:text-dotori-200'
                      : 'bg-dotori-100 text-dotori-400 dark:bg-dotori-800 dark:text-dotori-600',
                )}
              >
                <step.Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'mt-2 font-bold',
                  DS_TYPOGRAPHY.caption,
                  isCurrent
                    ? 'text-dotori-900 dark:text-dotori-50'
                    : isActive
                      ? 'text-dotori-700 dark:text-dotori-200'
                      : 'text-dotori-500 dark:text-dotori-400',
                )}
              >
                {step.label}
              </span>
              <span className={cn('mt-0.5 text-dotori-500 dark:text-dotori-400', DS_TYPOGRAPHY.label)}>
                {step.description}
              </span>
            </div>
          )
        })}
      </div>
      {/* Connecting progress bar */}
      <div className="flex gap-1">
        {STEPS.map((step, i) => {
          const isActive = typeof currentStep === 'number' && i <= currentStep
          return (
            <div
              key={step.label}
              className={cn(
                'flex-1 transition-colors', DS_PROGRESS.base, DS_PROGRESS.size.sm,
                isActive
                  ? DS_PROGRESS.fillTone.dotori
                  : DS_PROGRESS.trackTone.dotori,
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
