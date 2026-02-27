'use client'

/**
 * FeatureClipCard — Keynote clipPath + Spotlight Card hover-reveal
 * motion/react whileHover idle→active, description slide-up, spring stiffness 300
 */
import type React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export function FeatureClipCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  graphic,
  className,
}: {
  eyebrow: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  graphic?: React.ReactNode
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial="idle"
      whileHover={shouldReduceMotion ? undefined : 'active'}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-dotori-100/70 transition-shadow hover:shadow-lg dark:bg-dotori-950/50 dark:ring-dotori-800/40',
        className,
      )}
    >
      {/* Clip overlay — Keynote clipPath reveal */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dotori-50/50 to-transparent dark:from-dotori-900/30"
        variants={{
          idle: { clipPath: 'circle(0% at 50% 0%)' },
          active: { clipPath: 'circle(150% at 50% 0%)' },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      {/* Icon */}
      <div className="relative mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-dotori-950/[0.025] dark:bg-white/5">
        <Icon className="h-5 w-5 text-dotori-500" />
      </div>

      {/* Eyebrow */}
      <p className="relative font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-500">
        {eyebrow}
      </p>

      {/* Title */}
      <h3 className="relative mt-2 text-base/7 font-semibold text-dotori-950 dark:text-white">
        {title}
      </h3>

      {/* Description — slide up on hover */}
      <motion.p
        className="relative mt-2 text-sm/6 text-dotori-600 dark:text-dotori-400"
        variants={{
          idle: { opacity: 0.9, y: shouldReduceMotion ? 0 : 2 },
          active: { opacity: 1, y: 0 },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {description}
      </motion.p>

      {/* Optional graphic */}
      {graphic && (
        <div className="relative mt-4">{graphic}</div>
      )}
    </motion.div>
  )
}
