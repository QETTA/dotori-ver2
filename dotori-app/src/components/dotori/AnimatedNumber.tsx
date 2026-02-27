'use client'

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'
import { useEffect, useRef } from 'react'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

/**
 * AnimatedNumber — Radiant 패턴 포팅 (motion/react)
 * 뷰포트 진입 시 start → end 카운트업 애니메이션
 */
export function AnimatedNumber({
  start = 0,
  end,
  decimals = 0,
  suffix = '',
  className,
}: {
  start?: number
  end: number
  decimals?: number
  suffix?: string
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  const value = useMotionValue(start)
  const spring = useSpring(value, { damping: 30, stiffness: 100 })
  const display = useTransform(spring, (num) =>
    num >= 1000
      ? `${Math.floor(num).toLocaleString('ko-KR')}`
      : num.toFixed(decimals),
  )

  useEffect(() => {
    value.set(isInView ? end : start)
  }, [start, end, isInView, value])

  return (
    <span ref={ref} className={cn(DS_TEXT.primary, className)}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}
