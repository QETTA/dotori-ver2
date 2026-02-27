'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { spring } from '@/lib/motion'

interface SocialProofBadgeProps {
  count: number
  suffix?: string
  className?: string
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, value])

  return <span ref={ref} className="tabular-nums">{displayed.toLocaleString()}</span>
}

export function SocialProofBadge({ count, suffix = '시설', className = '' }: SocialProofBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.chip}
      className={`inline-flex items-center gap-1 rounded-full bg-dotori-100/80 px-3 py-1 text-caption font-semibold text-dotori-700 dark:bg-dotori-800/40 dark:text-dotori-200 ${className}`}
    >
      <AnimatedNumber value={count} />+ {suffix}
    </motion.span>
  )
}
