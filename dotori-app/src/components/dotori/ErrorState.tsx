'use client'

import { Badge } from '@/components/catalyst/badge'
import { DsButton } from '@/components/ds/DsButton'
import {
  DOTORI_STATE_ITEM_MOTION,
  DOTORI_STATE_META,
  DOTORI_STATE_MOTION,
  DOTORI_STATE_TOKENS,
  type DotoriErrorStateVariant,
} from '@/components/dotori/EmptyState'
import { BRAND } from '@/lib/brand-assets'
import { copy } from '@/lib/brand-copy'
import { DS_STATUS } from '@/lib/design-system/tokens'
import { tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

const ERROR_STATE_TONE: Record<DotoriErrorStateVariant, keyof typeof DS_STATUS> = {
  default: 'available',
  network: 'waiting',
  notfound: 'full',
}

const ERROR_STATE_MEDIA: Record<DotoriErrorStateVariant, string> = {
  default: BRAND.errorState,
  network: BRAND.errorState,
  notfound: BRAND.emptyState,
}

const ERROR_STATE_STATUS_SIGNAL = Object.entries(ERROR_STATE_TONE)
  .map(([variant, tone]) => `${variant}:${DS_STATUS[tone].label}`)
  .join('|')

const ERROR_STATE_SIGNAL_PROPS = {
  'data-dotori-brand': BRAND.errorState,
  'data-dotori-glass-surface': 'glass-card',
  'data-dotori-status-signal': ERROR_STATE_STATUS_SIGNAL,
} as const

export function ErrorState({
  message,
  detail,
  action,
  variant = 'default',
}: {
  message?: string
  detail?: string
  action?: { label: string; onClick: () => void }
  variant?: DotoriErrorStateVariant
}) {
  const meta = DOTORI_STATE_META.error[variant]
  const variantCopy = copy.errorState[variant]
  const resolvedMessage = message ?? variantCopy.title
  const resolvedDetail = detail ?? meta.detail
  const statusToneToken = DS_STATUS[ERROR_STATE_TONE[variant]]
  const statusMedia = ERROR_STATE_MEDIA[variant]
  return (
    <motion.section
      role="status"
      aria-live="polite"
      className={DOTORI_STATE_TOKENS.container}
      {...DOTORI_STATE_MOTION}
    >
      <span aria-hidden="true" hidden {...ERROR_STATE_SIGNAL_PROPS} />
      <div className={cn(DOTORI_STATE_TOKENS.surface, statusToneToken.border)}>
        <span className={'pointer-events-none absolute inset-0 isolate overflow-hidden rounded-2xl'}>
          <span className={DOTORI_STATE_TOKENS.warmPaper} aria-hidden="true" />
        </span>
        <span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
        <span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.watermark} alt="" aria-hidden="true" className={DOTORI_STATE_TOKENS.watermark} />
        <div className={DOTORI_STATE_TOKENS.content}>
          <motion.div
            className={DOTORI_STATE_TOKENS.mediaWrap}
            variants={DOTORI_STATE_ITEM_MOTION.variants}
          >
            <div className={DOTORI_STATE_TOKENS.mediaFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={statusMedia}
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
              <Badge color="forest" className={cn(DOTORI_STATE_TOKENS.badge, statusToneToken.pill)}>
                <span
                  className={cn(DOTORI_STATE_TOKENS.statusDot, statusToneToken.dot)}
                  aria-hidden="true"
                />
                {meta.eyebrow}
              </Badge>
            </motion.div>
            <motion.h3
              variants={DOTORI_STATE_ITEM_MOTION.variants}
              className={DOTORI_STATE_TOKENS.title}
            >
              {resolvedMessage}
            </motion.h3>
            <motion.p
              variants={DOTORI_STATE_ITEM_MOTION.variants}
              className={DOTORI_STATE_TOKENS.description}
            >
              {resolvedDetail}
            </motion.p>
          </motion.div>
          {action ? (
            <motion.div
              className={DOTORI_STATE_TOKENS.actions}
              variants={DOTORI_STATE_ITEM_MOTION.variants}
            >
              <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                <DsButton
                  onClick={action.onClick}
                  className={DOTORI_STATE_TOKENS.action}
                >
                  {action.label}
                </DsButton>
              </motion.div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.section>
  )
}
