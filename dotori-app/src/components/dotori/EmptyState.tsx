'use client'

import { DsButton } from '@/components/ds/DsButton'
import { BRAND } from '@/lib/brand-assets'
import { copy } from '@/lib/brand-copy'
import { DS_TYPOGRAPHY, DS_TEXT } from '@/lib/design-system/tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_EMPTY_STATE, DS_SURFACE } from '@/lib/design-system/page-tokens'
import { spring, tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export type DotoriEmptyStateVariant = 'search' | 'transfer' | 'default'
export type DotoriErrorStateVariant = 'default' | 'network' | 'notfound'

export const DOTORI_STATE_MOTION = {
  initial: 'hidden' as const,
  animate: 'show' as const,
  variants: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  },
} as const

export const DOTORI_STATE_ITEM_MOTION = {
  variants: {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: spring.card,
    },
  },
} as const

type DotoriEmptyVisualMeta = {
  eyebrow: string
  description: string
  media: string
}

type DotoriErrorVisualMeta = {
  eyebrow: string
  detail: string
  media: string
}

export const DOTORI_STATE_META = {
  empty: {
    default: {
      eyebrow: copy.emptyState.default.eyebrow,
      description: copy.emptyState.default.description,
      media: BRAND.emptyState,
    },
    search: {
      eyebrow: copy.emptyState.search.eyebrow,
      description: copy.emptyState.search.description,
      media: BRAND.emptyState,
    },
    transfer: {
      eyebrow: copy.emptyState.transfer.eyebrow,
      description: copy.emptyState.transfer.description,
      media: BRAND.symbol,
    },
  } satisfies Record<DotoriEmptyStateVariant, DotoriEmptyVisualMeta>,
  error: {
    default: {
      eyebrow: copy.errorState.default.eyebrow,
      detail: copy.errorState.default.detail,
      media: BRAND.errorState,
    },
    network: {
      eyebrow: copy.errorState.network.eyebrow,
      detail: copy.errorState.network.detail,
      media: BRAND.errorState,
    },
    notfound: {
      eyebrow: copy.errorState.notfound.eyebrow,
      detail: copy.errorState.notfound.detail,
      media: BRAND.emptyState,
    },
  } satisfies Record<DotoriErrorStateVariant, DotoriErrorVisualMeta>,
} as const

interface EmptyStateSimpleProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyStateFallback({
  title = copy.emptyState.default.title,
  message,
  actionLabel,
  onAction,
}: EmptyStateSimpleProps) {
  const baseMeta = DOTORI_STATE_META.empty.default
  const resolvedMessage = message ?? baseMeta.description

  return (
    <motion.section
      role="status"
      aria-live="polite"
      className={DS_EMPTY_STATE.container}
      {...DOTORI_STATE_MOTION}
    >
      <div className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'mx-auto flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden gradient-mesh-cool')}>
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-dotori-200 via-dotori-400/60 to-dotori-200 dark:from-dotori-700 dark:via-dotori-500/30 dark:to-dotori-700" />
        <div className="flex flex-col items-center gap-4 px-6 pb-6">
          <motion.div className={DS_EMPTY_STATE.illustration} variants={DOTORI_STATE_ITEM_MOTION.variants}>
            <div className={cn(DS_SURFACE.sunken, 'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={baseMeta.media} alt="" aria-hidden="true" className="h-10 w-10 object-contain opacity-80" />
            </div>
          </motion.div>
          <motion.div className="space-y-2" variants={DOTORI_STATE_ITEM_MOTION.variants}>
            <p className={cn(DS_TYPOGRAPHY.caption, 'font-mono leading-5 font-semibold uppercase tracking-widest text-dotori-500')}>
              {baseMeta.eyebrow}
            </p>
            <h3 className={cn(DS_TEXT.gradient, 'text-h3 font-bold')}>
              {title}
            </h3>
            <p className={cn(DS_EMPTY_STATE.description)}>
              {resolvedMessage}
            </p>
          </motion.div>
          {actionLabel && onAction ? (
            <motion.div className={cn(DS_EMPTY_STATE.action, 'w-full')} variants={DOTORI_STATE_ITEM_MOTION.variants}>
              <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                <DsButton onClick={onAction} className="w-full">
                  {actionLabel}
                </DsButton>
              </motion.div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.section>
  )
}

export function EmptyState({
  icon,
  title,
  variant = 'default',
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
}: {
  icon?: ReactNode
  title: string
  variant?: DotoriEmptyStateVariant
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  secondaryLabel?: string
  secondaryHref?: string
}) {
  const variantMeta = DOTORI_STATE_META.empty[variant]
  const resolvedDescription = description ?? variantMeta.description

  return (
    <motion.section
      role="status"
      aria-live="polite"
      className={DS_EMPTY_STATE.container}
      {...DOTORI_STATE_MOTION}
    >
      <div className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'mx-auto flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden gradient-mesh-cool')}>
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-dotori-200 via-dotori-400/60 to-dotori-200 dark:from-dotori-700 dark:via-dotori-500/30 dark:to-dotori-700" />
        <div className="flex flex-col items-center gap-4 px-6 pb-6">
          <motion.div className={DS_EMPTY_STATE.illustration} variants={DOTORI_STATE_ITEM_MOTION.variants}>
            <div className={cn(
              DS_SURFACE.sunken,
              'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl',
              icon ? 'text-dotori-600 dark:text-dotori-300' : undefined,
            )}>
              {icon ? (
                icon
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={variantMeta.media} alt="" aria-hidden="true" className="h-10 w-10 object-contain opacity-80" />
              )}
            </div>
          </motion.div>
          <motion.div className="space-y-2" variants={DOTORI_STATE_ITEM_MOTION.variants}>
            <p className={cn(DS_TYPOGRAPHY.caption, 'font-mono leading-5 font-semibold uppercase tracking-widest text-dotori-500')}>
              {variantMeta.eyebrow}
            </p>
            <h3 className={cn(DS_TEXT.gradient, 'text-h3 font-bold')}>
              {title}
            </h3>
            {resolvedDescription ? (
              <p className={cn(DS_EMPTY_STATE.description)}>
                {resolvedDescription}
              </p>
            ) : null}
          </motion.div>
          {actionLabel || (secondaryLabel && secondaryHref) ? (
            <motion.div className={cn(DS_EMPTY_STATE.action, 'flex w-full flex-col gap-2')} variants={DOTORI_STATE_ITEM_MOTION.variants}>
              {actionLabel ? (
                <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                  {actionHref ? (
                    <DsButton href={actionHref} onClick={onAction} className="w-full">
                      {actionLabel}
                    </DsButton>
                  ) : (
                    <DsButton onClick={onAction} className="w-full">
                      {actionLabel}
                    </DsButton>
                  )}
                </motion.div>
              ) : null}
              {secondaryLabel && secondaryHref ? (
                <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                  <DsButton variant="secondary" href={secondaryHref} className="w-full">
                    {secondaryLabel}
                  </DsButton>
                </motion.div>
              ) : null}
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.section>
  )
}
