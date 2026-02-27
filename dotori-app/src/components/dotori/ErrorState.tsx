'use client'

import { DsButton } from '@/components/ds/DsButton'
import {
  DOTORI_STATE_ITEM_MOTION,
  DOTORI_STATE_META,
  DOTORI_STATE_MOTION,
  type DotoriErrorStateVariant,
} from '@/components/dotori/EmptyState'
import { BRAND } from '@/lib/brand-assets'
import { copy } from '@/lib/brand-copy'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_EMPTY_STATE, DS_SURFACE } from '@/lib/design-system/page-tokens'
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

  return (
    <motion.section
      role="status"
      aria-live="polite"
      className={DS_EMPTY_STATE.container}
      {...DOTORI_STATE_MOTION}
    >
      <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'mx-auto flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden')}>
        {/* Error accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-dotori-200 via-red-400/60 to-dotori-200 dark:from-dotori-700 dark:via-red-600/30 dark:to-dotori-700" />
        <div className="flex flex-col items-center gap-4 px-6 pb-6">
          <motion.div className={DS_EMPTY_STATE.illustration} variants={DOTORI_STATE_ITEM_MOTION.variants}>
            <div className={cn(DS_SURFACE.sunken, 'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BRAND.errorState} alt="" aria-hidden="true" className="h-10 w-10 object-contain opacity-80" />
            </div>
          </motion.div>
          <motion.div className="space-y-2" variants={DOTORI_STATE_ITEM_MOTION.variants}>
            <p className={cn(DS_TYPOGRAPHY.caption, 'leading-5 font-mono font-semibold uppercase tracking-widest text-dotori-500')}>
              {meta.eyebrow}
            </p>
            <h3 className={cn(DS_EMPTY_STATE.title)}>
              {resolvedMessage}
            </h3>
            <p className={cn(DS_EMPTY_STATE.description)}>
              {resolvedDetail}
            </p>
          </motion.div>
          {action ? (
            <motion.div className={cn(DS_EMPTY_STATE.action, 'w-full')} variants={DOTORI_STATE_ITEM_MOTION.variants}>
              <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                <DsButton onClick={action.onClick} className="w-full">
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
