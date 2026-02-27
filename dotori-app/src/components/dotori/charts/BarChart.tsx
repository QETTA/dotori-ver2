'use client'

/**
 * BarChart — Animated bar chart (sections/stats-with-graph pattern)
 * 정원 vs 현원 비교, 지역별 빈자리 현황
 *
 * "Breathing Data" — bars emerge like roots growing from soil
 */
import { motion, useReducedMotion, useInView } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { Subheading } from '@/components/catalyst/heading'

export interface BarData {
  label: string
  value: number
  maxValue?: number
  color?: string
}

const DEFAULT_COLORS = [
  'bg-forest-500',
  'bg-dotori-500',
  'bg-amber-500',
  'bg-forest-400',
  'bg-dotori-400',
] as const

export function BarChart({
  bars,
  orientation = 'horizontal',
  className,
}: {
  bars: BarData[]
  orientation?: 'horizontal' | 'vertical'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const shouldReduceMotion = useReducedMotion()
  const globalMax = Math.max(...bars.map((b) => b.maxValue ?? b.value), 1)

  if (orientation === 'vertical') {
    return (
      <div
        ref={ref}
        className={cn('flex items-end gap-3', className)}
        role="img"
        aria-label="막대 차트"
      >
        {bars.map((bar, i) => {
          const pct = (bar.value / (bar.maxValue ?? globalMax)) * 100
          const barColor = bar.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
          return (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className={cn('font-wordmark text-xs font-semibold', DS_TEXT.secondary)}>
                {bar.value}
              </span>
              <div className="relative h-24 w-full overflow-hidden rounded-t-lg bg-dotori-100/60 dark:bg-dotori-800/40">
                <motion.div
                  className={cn('absolute inset-x-0 bottom-0 rounded-t-lg', barColor)}
                  initial={{ scaleY: 0 }}
                  animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                  style={{ height: `${pct}%`, originY: 1 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 80, damping: 18, delay: i * 0.1 }
                  }
                />
              </div>
              <span className="text-center text-xs text-dotori-500 dark:text-dotori-400">
                {bar.label}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal (default)
  return (
    <div
      ref={ref}
      className={cn('space-y-3', className)}
      role="img"
      aria-label="막대 차트"
    >
      {bars.map((bar, i) => {
        const pct = (bar.value / (bar.maxValue ?? globalMax)) * 100
        const barColor = bar.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        return (
          <div key={bar.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <Subheading
                level={4}
                className="text-xs font-medium text-dotori-700 dark:text-dotori-300"
              >
                {bar.label}
              </Subheading>
              <span className="font-wordmark text-xs font-semibold text-dotori-900 dark:text-dotori-100">
                {bar.value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-dotori-100/60 dark:bg-dotori-800/40">
              <motion.div
                className={cn('h-full rounded-full', barColor)}
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                style={{ width: `${pct}%`, originX: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 80, damping: 18, delay: i * 0.08 }
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
