'use client'

import { FadeIn } from '@/components/dotori/FadeIn'
import { DS_TEXT, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

function formatDateLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = today.getTime() - target.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]
  return `${month}월 ${day}일 (${weekday})`
}

export function DateDivider({ date }: { date: Date }) {
  return (
    <FadeIn>
      <div className="flex items-center gap-3 px-4 py-3" suppressHydrationWarning>
        <div className="h-px flex-1 bg-dotori-200/50 dark:bg-dotori-700/40" />
        <span className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.muted, 'shrink-0')}>
          {formatDateLabel(date)}
        </span>
        <div className="h-px flex-1 bg-dotori-200/50 dark:bg-dotori-700/40" />
      </div>
    </FadeIn>
  )
}
