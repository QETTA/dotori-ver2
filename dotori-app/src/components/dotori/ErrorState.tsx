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
import { Surface } from '@/components/dotori/Surface'
import { copy } from '@/lib/brand-copy'
import { DS_STATUS } from '@/lib/design-system/tokens'
import { tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

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
  const statusTone = meta.tone

  return (
    <motion.section
      role="status"
      aria-live="polite"
      className={DOTORI_STATE_TOKENS.container}
      {...DOTORI_STATE_MOTION}
    >
      <Surface className={DOTORI_STATE_TOKENS.surface} tone="muted">
        <span className="pointer-events-none absolute inset-0 isolate overflow-hidden rounded-3xl">
          <span className={DOTORI_STATE_TOKENS.warmPaper} aria-hidden="true" />
        </span>
        <span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
        <span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meta.media} alt="" aria-hidden="true" className={DOTORI_STATE_TOKENS.watermark} />
        <div className={DOTORI_STATE_TOKENS.content}>
          <motion.div
            className={DOTORI_STATE_TOKENS.mediaWrap}
            variants={DOTORI_STATE_ITEM_MOTION.variants}
          >
            <div className={DOTORI_STATE_TOKENS.mediaFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meta.media}
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
                  className={cn('inline-block h-2 w-2 rounded-full', DS_STATUS[statusTone].dot)}
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
                  className={cn(DOTORI_STATE_TOKENS.action, 'min-h-11 w-full rounded-xl')}
                >
                  {action.label}
                </DsButton>
              </motion.div>
            </motion.div>
          ) : null}
        </div>
      </Surface>
    </motion.section>
  )
}
