'use client'

import { DsButton } from '@/components/ds/DsButton'
import {
  DOTORI_STATE_ITEM_MOTION,
  DOTORI_STATE_META,
  DOTORI_STATE_MOTION,
  type DotoriErrorStateVariant,
} from '@/components/dotori/EmptyState'
import { copy } from '@/lib/brand-copy'
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
import { DS_TYPOGRAPHY, DS_TEXT, DS_SHADOW } from '@/lib/design-system/tokens'
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
  secondaryAction,
}: {
  message?: string
  detail?: string
  action?: { label: string; onClick: () => void }
  variant?: DotoriErrorStateVariant
  secondaryAction?: { label: string; href: string }
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
      <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, DS_SHADOW.lg, 'relative mx-auto flex w-full max-w-sm flex-col items-center gap-0 overflow-hidden')}>
        <NoiseTexture opacity={0.025} />
        {/* Gradient accent bar */}
        <div className="h-2 w-full bg-gradient-to-r from-dotori-500 via-amber-400 to-dotori-500 dark:from-dotori-600 dark:via-amber-500/60 dark:to-dotori-600" />

        {/* Gradient background header area */}
        <div className="w-full bg-gradient-to-b from-dotori-50/80 via-dotori-50/30 to-transparent px-6 pt-8 pb-2 dark:from-dotori-900/40 dark:via-dotori-900/20 dark:to-transparent">
          <motion.div className="flex justify-center" variants={DOTORI_STATE_ITEM_MOTION.variants}>
            <div className="relative">
              {/* Glow ring behind illustration */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-dotori-200/40 via-transparent to-amber-200/30 blur-md dark:from-dotori-800/30 dark:to-amber-800/20" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white ring-1 ring-dotori-200/60 dark:bg-dotori-900 dark:ring-dotori-700/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meta.media} alt="" aria-hidden="true" className="h-14 w-14 object-contain opacity-90" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-2">
          <motion.div className="w-full space-y-3 text-center" variants={DOTORI_STATE_ITEM_MOTION.variants}>
            <p className={cn(DS_TYPOGRAPHY.caption, 'font-mono font-semibold uppercase tracking-widest', DS_TEXT.muted)}>
              {meta.eyebrow}
            </p>
            <h3 className={cn(DS_EMPTY_STATE.title, 'text-balance')}>
              {resolvedMessage}
            </h3>
            <div
              className={cn(
                DS_SURFACE.sunken,
                'w-full rounded-2xl bg-dotori-50/60 px-4 py-3 text-left ring-1 ring-dotori-200/70 dark:bg-dotori-950/40 dark:ring-dotori-700/60',
              )}
            >
              <p
                className={cn(
                  DS_TYPOGRAPHY.bodySm,
                  'whitespace-pre-line leading-6 text-pretty break-words',
                  DS_TEXT.secondary,
                  'text-dotori-800 dark:text-dotori-100',
                )}
              >
                {resolvedDetail}
              </p>
            </div>
          </motion.div>

          <motion.div className="flex w-full flex-col gap-2 pt-2" variants={DOTORI_STATE_ITEM_MOTION.variants}>
            {action ? (
              <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
                <DsButton onClick={action.onClick} tone="dotori" fullWidth>
                  {action.label}
                </DsButton>
              </motion.div>
            ) : null}
            {secondaryAction ? (
              <DsButton variant="ghost" href={secondaryAction.href} className={DS_TEXT.muted} fullWidth>
                {secondaryAction.label}
              </DsButton>
            ) : null}
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
