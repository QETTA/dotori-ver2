import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PROGRESS, DS_TYPOGRAPHY, DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

type ProgressTone = keyof typeof DS_PROGRESS.trackTone

export function UsageCounter({
  used,
  limit,
  label = '이번 달 사용량',
  tone = 'dotori',
  helper,
  className,
}: {
  used: number
  limit: number
  label?: string
  tone?: ProgressTone
  helper?: string
  className?: string
}) {
  const safeUsed = Number.isFinite(used) ? Math.max(0, used) : 0
  const safeLimit = Number.isFinite(limit) ? Math.max(0, limit) : 0
  const resolvedUsed = safeLimit > 0 ? Math.min(safeUsed, safeLimit) : safeUsed
  const progressRatio = safeLimit > 0 ? Math.min(resolvedUsed / safeLimit, 1) : 0
  const remaining = safeLimit > 0 ? Math.max(0, safeLimit - resolvedUsed) : null

  return (
    <section aria-label={label} className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'w-full rounded-2xl p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className={cn(DS_TYPOGRAPHY.label, 'font-semibold tracking-wide', DS_TEXT.secondary, 'text-dotori-800 dark:text-dotori-100')}>
          {label}
        </p>
        <p className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold tabular-nums', DS_TEXT.primary)}>
          {safeLimit > 0 ? `${resolvedUsed}/${safeLimit}` : `${resolvedUsed}`}
        </p>
      </div>

      {safeLimit > 0 ? (
        <>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={safeLimit}
            aria-valuenow={resolvedUsed}
            className={cn(
              'mt-2',
              DS_PROGRESS.base,
              DS_PROGRESS.size.sm,
              DS_PROGRESS.trackTone[tone],
              'ring-1 ring-dotori-200/60 dark:ring-dotori-700/50',
            )}
          >
            <div
              className={cn(DS_PROGRESS.fill, DS_PROGRESS.fillTone[tone], DS_PROGRESS.fillAnimation)}
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>

          <p className={cn(DS_TYPOGRAPHY.caption, 'mt-2', DS_TEXT.secondary, 'text-dotori-800 dark:text-dotori-100')}>
            {helper ?? (remaining === 0 ? '이번 달 사용량을 모두 사용했어요.' : `남은 ${remaining}회`)}
          </p>
        </>
      ) : (
        <p className={cn(DS_TYPOGRAPHY.caption, 'mt-2', DS_TEXT.secondary, 'text-dotori-800 dark:text-dotori-100')}>
          {helper ?? '사용량 제한이 없어요.'}
        </p>
      )}
    </section>
  )
}
