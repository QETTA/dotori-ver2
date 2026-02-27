'use client'

/**
 * DonutGauge — Organic circular gauge (Pocket AppDemo SVG pathLength pattern)
 * TO 예측 점수 시각화, 홈 대시보드 진행률
 *
 * "Breathing Data" — fills like water rising, organic spring physics
 */
import { motion, useReducedMotion, useInView } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/components/dotori/AnimatedNumber'

const COLOR_MAP = {
  forest: {
    stroke: 'stroke-forest-500',
    track: 'stroke-forest-100 dark:stroke-forest-900/30',
    text: 'text-forest-600 dark:text-forest-400',
    glow: 'drop-shadow(0 0 8px rgba(74,122,66,0.3))',
  },
  dotori: {
    stroke: 'stroke-dotori-500',
    track: 'stroke-dotori-100 dark:stroke-dotori-800/40',
    text: 'text-dotori-600 dark:text-dotori-400',
    glow: 'drop-shadow(0 0 8px rgba(176,122,74,0.3))',
  },
  amber: {
    stroke: 'stroke-amber-500',
    track: 'stroke-amber-100 dark:stroke-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'drop-shadow(0 0 8px rgba(251,191,36,0.3))',
  },
} as const

export function DonutGauge({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color = 'forest',
  className,
}: {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  color?: 'forest' | 'dotori' | 'amber'
  className?: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const shouldReduceMotion = useReducedMotion()
  const colors = COLOR_MAP[color]

  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const normalizedValue = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block -rotate-90"
          style={{ filter: isInView ? colors.glow : undefined }}
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={colors.track}
            strokeLinecap="round"
          />
          {/* Fill — pathLength animation */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={colors.stroke}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={0}
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: normalizedValue / 100 } : { pathLength: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 60, damping: 20, delay: 0.2 }
            }
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <AnimatedNumber
            end={normalizedValue}
            suffix="%"
            className={cn('font-wordmark text-2xl font-bold', colors.text)}
          />
        </div>
      </div>
      {label && (
        <span className="text-sm font-semibold text-dotori-950 dark:text-dotori-50">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-xs text-dotori-500 dark:text-dotori-400">
          {sublabel}
        </span>
      )}
    </div>
  )
}
