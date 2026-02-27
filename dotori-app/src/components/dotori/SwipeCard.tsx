'use client'

/**
 * SwipeCard — Tinder-style swipe (drag + exit)
 * 시설 빠른 비교, 온보딩 선호도 카드
 */
import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { spring } from '@/lib/motion'

export function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  className,
}: {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  className?: string
}) {
  const [exited, setExited] = useState(false)
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12])
  const leftOpacity = useTransform(x, [-threshold, 0], [1, 0])
  const rightOpacity = useTransform(x, [0, threshold], [0, 1])

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipe = Math.abs(info.velocity.x) > 500 || Math.abs(info.offset.x) > threshold

    if (swipe) {
      const dir = info.offset.x > 0 ? 'right' : 'left'
      setExitDir(dir)
      setExited(true)
      if (dir === 'left') onSwipeLeft?.()
      else onSwipeRight?.()
    }
  }

  return (
    <AnimatePresence>
      {!exited && (
        <motion.div
          className={cn('relative touch-none', className)}
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 1, scale: 1 }}
          exit={{
            x: exitDir === 'left' ? -300 : 300,
            opacity: 0,
            rotate: exitDir === 'left' ? -20 : 20,
            transition: shouldReduceMotion ? { duration: 0 } : { ...spring.card, duration: 0.3 },
          }}
        >
          {/* Hint overlays */}
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-danger/40 bg-danger/5"
            style={{ opacity: leftOpacity }}
          >
            <span className={cn('text-lg font-bold', DS_TEXT.secondary, 'text-danger/60')}>별로</span>
          </motion.div>
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-forest-400/40 bg-forest-50/30"
            style={{ opacity: rightOpacity }}
          >
            <span className="text-lg font-bold text-forest-600/60">좋아요</span>
          </motion.div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
