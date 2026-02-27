import { cn } from "@/lib/utils";
import {
  DS_PROGRESS,
} from "@/lib/design-system/tokens";

type ProgressTone = keyof typeof DS_PROGRESS.fillTone
type ProgressSize = keyof typeof DS_PROGRESS.size

export interface DsProgressBarProps {
  value: number
  tone?: ProgressTone
  size?: ProgressSize
  ariaLabel?: string
  ariaValueMin?: number
  ariaValueMax?: number
  ariaValueNow?: number
  trackClassName?: string
  fillClassName?: string
  animated?: boolean
}

export function DsProgressBar({
  value,
  tone = "dotori",
  size = "sm",
  ariaLabel = "진행률",
  ariaValueMin = 0,
  ariaValueMax = 100,
  ariaValueNow,
  trackClassName,
  fillClassName,
  animated = true,
}: DsProgressBarProps) {
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  const accessibleNow = Math.max(
    ariaValueMin,
    Math.min(ariaValueMax, Math.round(ariaValueNow ?? percent)),
  )

  return (
    <div
      className={cn(
        DS_PROGRESS.base,
        DS_PROGRESS.size[size],
        DS_PROGRESS.trackTone[tone],
        trackClassName,
      )}
      role="progressbar"
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
      aria-valuenow={accessibleNow}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          DS_PROGRESS.fill,
          DS_PROGRESS.fillTone[tone],
          animated && DS_PROGRESS.fillAnimation,
          fillClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
