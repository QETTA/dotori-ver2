'use client'

/**
 * Stat — shared sections stats 직접 포팅
 * 원본: tailwind plus/components/sections/stats-four-columns.tsx
 * 변경: olive → dotori, DS_CARD.flat 토큰 사용
 */
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_SURFACE } from '@/lib/design-system/page-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

export function Stat({
  stat,
  text,
  className,
  ...props
}: { stat: ReactNode; text: ReactNode } & ComponentProps<'div'>) {
  return (
    <div
      className={cn(DS_SURFACE.primary, DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6', className)}
      {...props}
    >
      <div className={cn(DS_TYPOGRAPHY.h2, 'tabular-nums tracking-tight text-dotori-950 dark:text-white')}>
        {stat}
      </div>
      <p className={cn(DS_TYPOGRAPHY.caption, 'mt-1.5 text-dotori-700 dark:text-dotori-400')}>
        {text}
      </p>
    </div>
  )
}
