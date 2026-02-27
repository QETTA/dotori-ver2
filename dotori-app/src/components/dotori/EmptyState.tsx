'use client'

import { Badge } from '@/components/catalyst/badge'
import { DsButton } from '@/components/ds/DsButton'
import { BRAND } from '@/lib/brand-assets'
import { copy } from '@/lib/brand-copy'
import { DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
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
  tone: keyof typeof DS_STATUS
  eyebrow: string
  description: string
  media: string
}

type DotoriErrorVisualMeta = {
  tone: keyof typeof DS_STATUS
  eyebrow: string
  detail: string
  media: string
}

export const DOTORI_STATE_META = {
  empty: {
    default: {
      tone: 'available',
      eyebrow: copy.emptyState.default.eyebrow,
      description: copy.emptyState.default.description,
      media: BRAND.emptyState,
    },
    search: {
      tone: 'waiting',
      eyebrow: copy.emptyState.search.eyebrow,
      description: copy.emptyState.search.description,
      media: BRAND.emptyState,
    },
    transfer: {
      tone: 'full',
      eyebrow: copy.emptyState.transfer.eyebrow,
      description: copy.emptyState.transfer.description,
      media: BRAND.symbol,
    },
  } satisfies Record<DotoriEmptyStateVariant, DotoriEmptyVisualMeta>,
  error: {
    default: {
      tone: 'available',
      eyebrow: copy.errorState.default.eyebrow,
      detail: copy.errorState.default.detail,
      media: BRAND.errorState,
    },
    network: {
      tone: 'waiting',
      eyebrow: copy.errorState.network.eyebrow,
      detail: copy.errorState.network.detail,
      media: BRAND.errorState,
    },
    notfound: {
      tone: 'full',
      eyebrow: copy.errorState.notfound.eyebrow,
      detail: copy.errorState.notfound.detail,
      media: BRAND.emptyState,
    },
  } satisfies Record<DotoriErrorStateVariant, DotoriErrorVisualMeta>,
} as const

export const DOTORI_STATE_TOKENS = {
  container: 'px-4 py-7 text-center sm:px-5',
  surface: cn('relative isolate mx-auto flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-2xl border border-dotori-100/70 bg-dotori-50/90 p-6 shadow-sm', 'glass-card'),
  accentTop: 'pointer-events-none absolute inset-x-6 -top-10 h-24 rounded-full blur-2xl bg-dotori-200/45 dark:bg-dotori-700/25',
  accentBottom: 'pointer-events-none absolute -bottom-10 left-1/2 h-20 w-36 -translate-x-1/2 rounded-full blur-2xl bg-dotori-100/55 dark:bg-dotori-800/30',
  watermark: 'pointer-events-none absolute -right-10 -top-10 h-28 w-28 opacity-[0.08] dark:opacity-[0.12]',
  warmPaper: 'pointer-events-none absolute inset-0 opacity-55 bg-gradient-to-b from-amber-50/30 via-forest-50/8 to-transparent',
  content: 'relative z-10 flex w-full flex-col gap-4',
  mediaWrap: 'w-full border-b border-dotori-100/70 pb-4',
  mediaFrame: 'mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br from-dotori-100 via-dotori-50 to-dotori-50 ring-1 ring-dotori-200/70 dark:from-dotori-800/80 dark:via-dotori-900/70 dark:to-dotori-900/90 dark:ring-dotori-700/70',
  image: 'h-14 w-14 object-contain opacity-90',
  copyWrap: 'w-full border-b border-dotori-100/70 pb-4',
  badge: 'text-label inline-flex items-center gap-2 rounded-full border border-dotori-100/70 bg-dotori-100/75 px-2.5 py-1 font-semibold text-dotori-700 shadow-sm dark:border-dotori-800/70 dark:bg-dotori-900/70 dark:text-dotori-200',
  title: cn(DS_TYPOGRAPHY.h3, 'leading-snug font-semibold text-dotori-900 dark:text-dotori-50'),
  description: cn(DS_TYPOGRAPHY.bodySm, 'leading-relaxed text-dotori-700 dark:text-dotori-200'),
  statusDot: 'inline-block h-2 w-2 rounded-full',
  actions: 'mt-2 flex w-full flex-col gap-2.5',
  action: 'min-h-11 w-full rounded-xl border-dotori-200/80 bg-dotori-50/90 text-dotori-700 shadow-sm ring-1 ring-dotori-100/70 transition-all duration-150 hover:bg-dotori-100/80 dark:bg-dotori-900/70 dark:text-dotori-100 dark:hover:bg-dotori-900 text-body-sm',
  secondaryAction: 'min-h-11 w-full rounded-xl text-body-sm',
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
  const statusTone = DOTORI_STATE_META.empty.default.tone

  return (
    <motion.section
      role="status"
      aria-live="polite"
      className={DOTORI_STATE_TOKENS.container}
      {...DOTORI_STATE_MOTION}
    >
      <div className={DOTORI_STATE_TOKENS.surface}>
        <span className={'pointer-events-none absolute inset-0 isolate overflow-hidden rounded-2xl'} aria-hidden="true">
          <span className={DOTORI_STATE_TOKENS.warmPaper} aria-hidden="true" />
        </span>
        <span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
        <span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.watermark}
          alt=""
          aria-hidden="true"
          className={DOTORI_STATE_TOKENS.watermark}
        />
        <div className={DOTORI_STATE_TOKENS.content}>
          <motion.div
            className={DOTORI_STATE_TOKENS.mediaWrap}
            variants={DOTORI_STATE_ITEM_MOTION.variants}
          >
            <div className={DOTORI_STATE_TOKENS.mediaFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={baseMeta.media}
                alt=""
                aria-hidden="true"
                className={DOTORI_STATE_TOKENS.image}
              />
            </div>
          </motion.div>
          <motion.div
            className={DOTORI_STATE_TOKENS.copyWrap}
            variants={DOTORI_STATE_ITEM_MOTION.variants}
          >
            <motion.div variants={DOTORI_STATE_ITEM_MOTION.variants}>
              <Badge color="forest" className={DOTORI_STATE_TOKENS.badge}>
                <span
                  className={cn(DOTORI_STATE_TOKENS.statusDot, DS_STATUS[statusTone].dot)}
                  aria-hidden="true"
                />
                {baseMeta.eyebrow}
              </Badge>
            </motion.div>
            <motion.h3
              variants={DOTORI_STATE_ITEM_MOTION.variants}
              className={DOTORI_STATE_TOKENS.title}
            >
              {title}
            </motion.h3>
            <motion.p
              variants={DOTORI_STATE_ITEM_MOTION.variants}
              className={DOTORI_STATE_TOKENS.description}
            >
              {resolvedMessage}
            </motion.p>
          </motion.div>
          {actionLabel && onAction ? (
            <motion.div
              className={DOTORI_STATE_TOKENS.actions}
              variants={DOTORI_STATE_ITEM_MOTION.variants}
            >
              <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                <DsButton onClick={onAction} className={DOTORI_STATE_TOKENS.action}>
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
  const statusTone = DOTORI_STATE_META.empty[variant].tone

  const transferIcon = (
    <span className={'inline-flex items-center gap-1.5 text-dotori-700 dark:text-dotori-100'} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.symbol}
        alt=""
        aria-hidden="true"
        className={'h-4 w-4 opacity-80'}
      />
      <span className={cn('text-caption font-semibold', DS_TYPOGRAPHY.caption)}>
        ↔
      </span>
    </span>
  )

  const resolvedIcon = icon ?? (variant === 'transfer' ? transferIcon : null)

  return (
    <motion.section
      role="status"
      aria-live="polite"
      className={DOTORI_STATE_TOKENS.container}
      {...DOTORI_STATE_MOTION}
    >
      <div className={DOTORI_STATE_TOKENS.surface}>
        <span className={'pointer-events-none absolute inset-0 isolate overflow-hidden rounded-2xl'}>
          <span className={DOTORI_STATE_TOKENS.warmPaper} aria-hidden="true" />
        </span>
        <span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
        <span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.watermark}
          alt=""
          aria-hidden="true"
          className={DOTORI_STATE_TOKENS.watermark}
        />
        <div className={DOTORI_STATE_TOKENS.content}>
          <motion.div
            className={DOTORI_STATE_TOKENS.mediaWrap}
            variants={DOTORI_STATE_ITEM_MOTION.variants}
          >
            <div
              className={cn(
                DOTORI_STATE_TOKENS.mediaFrame,
                resolvedIcon ? 'text-2xl text-dotori-700 dark:text-dotori-100' : undefined,
              )}
            >
              {resolvedIcon ? (
                resolvedIcon
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={variantMeta.media}
                  alt=""
                  aria-hidden="true"
                  className={DOTORI_STATE_TOKENS.image}
                />
              )}
            </div>
          </motion.div>
          <motion.div
            className={DOTORI_STATE_TOKENS.copyWrap}
            variants={DOTORI_STATE_ITEM_MOTION.variants}
          >
            <motion.div variants={DOTORI_STATE_ITEM_MOTION.variants}>
              <Badge color="forest" className={DOTORI_STATE_TOKENS.badge}>
                <span
                  className={cn(DOTORI_STATE_TOKENS.statusDot, DS_STATUS[statusTone].dot)}
                  aria-hidden="true"
                />
                {variantMeta.eyebrow}
              </Badge>
            </motion.div>
            <motion.h3
              variants={DOTORI_STATE_ITEM_MOTION.variants}
              className={DOTORI_STATE_TOKENS.title}
            >
              {title}
            </motion.h3>
            {resolvedDescription ? (
              <motion.p
                variants={DOTORI_STATE_ITEM_MOTION.variants}
                className={DOTORI_STATE_TOKENS.description}
              >
                {resolvedDescription}
              </motion.p>
            ) : null}
          </motion.div>
          {actionLabel || (secondaryLabel && secondaryHref) ? (
            <motion.div
              className={DOTORI_STATE_TOKENS.actions}
              variants={DOTORI_STATE_ITEM_MOTION.variants}
            >
              {actionLabel ? (
                <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                  {actionHref ? (
                    <DsButton
                      href={actionHref}
                      onClick={onAction}
                      className={DOTORI_STATE_TOKENS.action}
                    >
                      {actionLabel}
                    </DsButton>
                  ) : (
                    <DsButton
                      onClick={onAction}
                      className={DOTORI_STATE_TOKENS.action}
                    >
                      {actionLabel}
                    </DsButton>
                  )}
                </motion.div>
              ) : null}
              {secondaryLabel && secondaryHref ? (
                <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                  <DsButton
                    variant="secondary"
                    href={secondaryHref}
                    className={DOTORI_STATE_TOKENS.secondaryAction}
                  >
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
