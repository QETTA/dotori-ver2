'use client'

/**
 * SparkLine — Mini trend line (Pocket AppDemo SVG polyline pattern)
 * 시설 카드 미니 트렌드 (7일 TO 추세), 홈 브리핑
 *
 * "Breathing Data" — draws like a vine growing
 */
import { motion, useReducedMotion, useInView } from 'motion/react'
import { useRef, useMemo, useId } from 'react'
import { DS_SHADOW } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

export function SparkLine({
  data,
  width = 80,
  height = 32,
  color = 'var(--color-forest-500)',
  showDot = true,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  showDot?: boolean
  className?: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const shouldReduceMotion = useReducedMotion()
  const gradientId = useId()

  const { points, lastPoint } = useMemo(() => {
    if (data.length < 2) return { points: '', lastPoint: { x: 0, y: 0 } }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 4

    const pts = data.map((val, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (1 - (val - min) / range) * (height - padding * 2),
    }))

    const pointStr = pts.map((p) => `${p.x},${p.y}`).join(' ')
    return { points: pointStr, lastPoint: pts[pts.length - 1] }
  }, [data, width, height])

  const fillPoints = useMemo(() => {
    if (!points) return ''
    const padding = 4
    return `${padding},${height - padding} ${points} ${width - padding},${height - padding}`
  }, [points, width, height])

  if (data.length < 2) return null

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block', DS_SHADOW.sm, className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <motion.polygon
        points={fillPoints}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.4 }}
      />
      {/* Line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={0}
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 40, damping: 18, delay: 0.1 }
        }
      />
      {/* Last dot — pulse */}
      {showDot && (
        <motion.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={color}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            isInView
              ? { scale: [1, 1.4, 1], opacity: 1 }
              : { scale: 0, opacity: 0 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  scale: { repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.8 },
                  opacity: { duration: 0.3, delay: 0.6 },
                }
          }
        />
      )}
    </svg>
  )
}
