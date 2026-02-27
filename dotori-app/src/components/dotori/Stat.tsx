'use client'

/**
 * Stat — shared sections stats 직접 포팅
 * 원본: tailwind plus/components/sections/stats-four-columns.tsx
 * 변경: olive → dotori, DS_CARD.flat 토큰 사용
 */
import { DS_CARD } from '@/lib/design-system/card-tokens'
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
      className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6', className)}
      {...props}
    >
      <div className="text-2xl/10 tracking-tight text-dotori-950 dark:text-white">
        {stat}
      </div>
      <p className="mt-2 text-sm/7 text-dotori-700 dark:text-dotori-400">
        {text}
      </p>
    </div>
  )
}
