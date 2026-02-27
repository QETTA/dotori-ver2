'use client'

/**
 * PullToRefresh — Native app pull-to-refresh gesture
 * 홈, 탐색, 커뮤니티 리스트 상단
 */
import { useState, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

const THRESHOLD = 60
const MAX_PULL = 80

export function PullToRefresh({
  onRefresh,
  children,
  className,
}: {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
}) {
  const [refreshing, setRefreshing] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const y = useMotionValue(0)
  const indicatorOpacity = useTransform(y, [0, THRESHOLD * 0.5, THRESHOLD], [0, 0.5, 1])
  const indicatorRotate = useTransform(y, [0, MAX_PULL], [0, 360])
  const indicatorScale = useTransform(y, [0, THRESHOLD], [0.6, 1])
  const ready = useTransform(y, (v) => v >= THRESHOLD)

  const handleDragEnd = async () => {
    if (ready.get() && !refreshing) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Pull indicator */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        style={{ opacity: indicatorOpacity }}
      >
        <motion.div
          className={cn(
            'mt-2 grid h-8 w-8 place-items-center rounded-full',
            refreshing ? 'bg-forest-100 dark:bg-forest-900/30' : 'bg-dotori-100 dark:bg-dotori-800/40',
          )}
          style={{ scale: indicatorScale }}
        >
          <motion.div
            style={shouldReduceMotion ? undefined : { rotate: indicatorRotate }}
            className={refreshing ? 'animate-spin' : undefined}
          >
            <ArrowPathIcon
              className={cn(
                'h-4 w-4',
                refreshing ? 'text-forest-600' : 'text-dotori-500',
              )}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        style={{ y: refreshing ? 40 : y }}
        drag={refreshing ? false : 'y'}
        dragConstraints={{ top: 0, bottom: MAX_PULL }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        animate={refreshing ? { y: 40 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
