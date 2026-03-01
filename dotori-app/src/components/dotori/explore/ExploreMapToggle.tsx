'use client'

/**
 * ExploreMapToggle — 리스트↔지도 뷰 토글 (pill + layoutId)
 */
import { useId } from 'react'
import { motion } from 'motion/react'
import { List, Map } from 'lucide-react'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'

type ExploreView = 'list' | 'map'

const VIEWS: { key: ExploreView; label: string; Icon: typeof List }[] = [
  { key: 'list', label: '목록', Icon: List },
  { key: 'map', label: '지도', Icon: Map },
]

const MAP_DISABLED_FALLBACK_MESSAGE =
  '지도 기능이 비활성화되어 있어요. 운영 설정을 확인해주세요.'

export function ExploreMapToggle({
  view,
  onToggle,
  isMapAvailable,
  mapDisabledReason,
  onRetryMapAvailability,
  className,
}: {
  view: ExploreView
  onToggle: (view: ExploreView) => void
  isMapAvailable: boolean
  mapDisabledReason?: string | null
  onRetryMapAvailability?: () => void
  className?: string
}) {
  const mapDisabledDescriptionId = useId()
  const mapUnavailableMessage = mapDisabledReason || MAP_DISABLED_FALLBACK_MESSAGE

  return (
    <div className="inline-flex flex-col">
      <div
        className={cn(
          'inline-flex rounded-xl bg-dotori-100/60 p-1 dark:bg-dotori-800/40',
          className,
        )}
        role="group"
        aria-label="보기 전환"
        aria-describedby={!isMapAvailable ? mapDisabledDescriptionId : undefined}
      >
        {VIEWS.map(({ key, label, Icon }) => {
          const isSelected = view === key
          const isMapTab = key === 'map'
          const isMapTabDisabled = isMapTab && !isMapAvailable

          return (
            <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              disabled={isMapTabDisabled}
              aria-label={isMapTabDisabled ? `${label} (사용 불가)` : label}
              aria-describedby={
                isMapTabDisabled ? mapDisabledDescriptionId : undefined
              }
              className={cn(
                'relative flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isSelected
                  ? 'text-dotori-950 dark:text-white'
                  : isMapTabDisabled
                    ? cn(DS_TEXT.disabled, 'cursor-not-allowed')
                    : cn(
                        DS_TEXT.muted,
                        'hover:text-dotori-700 dark:hover:text-dotori-200',
                      ),
              )}
              onClick={() => {
                if (isMapTabDisabled) return
                onToggle(key)
              }}
            >
              {isSelected && (
                <motion.span
                  layoutId="explore-view-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-dotori-700/60"
                  transition={spring.chip}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {label}
              </span>
            </button>
          )
        })}
      </div>
      {!isMapAvailable && (
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <p
            id={mapDisabledDescriptionId}
            role="status"
            aria-live="polite"
            className={cn('text-xs', DS_TEXT.muted)}
          >
            {mapUnavailableMessage}
          </p>
          {onRetryMapAvailability ? (
            <button
              type="button"
              onClick={onRetryMapAvailability}
              className={cn(
                'min-h-11 rounded-lg border border-dotori-200 px-3 text-xs font-semibold text-dotori-700 transition-colors',
                'hover:bg-dotori-100/70 dark:border-dotori-700 dark:text-dotori-200 dark:hover:bg-dotori-800/50',
              )}
            >
              다시 확인
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
