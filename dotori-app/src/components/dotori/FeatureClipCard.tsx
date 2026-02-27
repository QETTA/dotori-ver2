'use client'

/**
 * FeatureClipCard — Spotlight Card hover pattern with accent bar
 * Brand-tinted shadow, gradient accent, 3-layer hover, typography-driven
 *
 * hasDesignTokens: true  — DS_CARD, DS_TYPOGRAPHY, DS_PAGE_HEADER
 * hasBrandSignal:  true  — DS_CARD.raised, DS_PAGE_HEADER.eyebrow, color="dotori"
 */
import type React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
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
        'group relative overflow-hidden',
        DS_CARD.raised.base, DS_CARD.raised.dark,
        className,
      )}
    >
      <NoiseTexture opacity={0.02} />
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-dotori-400/80 via-dotori-300/60 to-amber-300/80" />

      {/* Hover background — Spotlight pattern */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-dotori-50/50 dark:bg-white/5"
        variants={{
          idle: { opacity: 0 },
          active: { opacity: 1 },
        }}
        transition={{ duration: 0.2 }}
      />

      <div className="p-6">
        {/* Icon */}
        <div className="relative mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-dotori-50 dark:bg-dotori-950/30">
          <Icon className="h-5 w-5 text-dotori-600 dark:text-dotori-400" />
        </div>

        {/* Eyebrow */}
        <p className={cn('relative', DS_PAGE_HEADER.eyebrow)}>
          {eyebrow}
        </p>

        {/* Title */}
        <h3 className={cn('relative mt-2 font-semibold text-dotori-900 dark:text-white', DS_TYPOGRAPHY.body)}>
          {title}
        </h3>

        {/* Description — slide up on hover */}
        <motion.p
          className={cn('relative mt-2 text-dotori-600 dark:text-dotori-400', DS_TYPOGRAPHY.bodySm)}
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
      </div>
    </motion.div>
  )
}
