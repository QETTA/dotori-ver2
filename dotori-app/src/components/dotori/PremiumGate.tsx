'use client'

import { DsButton } from '@/components/ds/DsButton'
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
import { BRAND } from '@/lib/brand-assets'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_TYPOGRAPHY, DS_TEXT, DS_SHADOW } from '@/lib/design-system/tokens'
import { tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { ArrowRight, Lock } from 'lucide-react'
import { motion } from 'motion/react'

export function PremiumGate({
  title = '프리미엄 기능이에요',
  description = '프리미엄으로 업그레이드하면 바로 잠금 해제할 수 있어요.',
  ctaLabel = '프리미엄으로 업그레이드',
  ctaHref = '/my?tab=subscription',
  onCtaClick,
  secondaryLabel,
  secondaryHref,
  className,
}: {
  title?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
  secondaryLabel?: string
  secondaryHref?: string
  className?: string
}) {
  return (
    <section aria-label="프리미엄 안내" className={cn('mx-auto w-full max-w-sm', className)}>
      <div className={cn(DS_CARD.premium.base, DS_CARD.premium.dark, DS_SHADOW.lg, 'relative overflow-hidden')}>
        <NoiseTexture opacity={0.03} />
        <div className="h-1 w-full bg-gradient-to-r from-dotori-500 via-amber-400 to-dotori-400 dark:from-dotori-600 dark:via-amber-500/70 dark:to-dotori-500" />

        <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-dotori-200/35 via-transparent to-amber-200/25 blur-lg dark:from-dotori-800/25 dark:to-amber-800/15" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white ring-1 ring-dotori-200/60 dark:bg-dotori-900 dark:ring-dotori-700/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BRAND.symbol} alt="" aria-hidden="true" className="h-9 w-9 object-contain opacity-90" />
              <div className={cn('absolute -bottom-3 -right-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white via-dotori-50 to-amber-100 ring-1 ring-dotori-400/80', DS_SHADOW.sm, DS_SHADOW.dark.sm, 'dark:from-dotori-950 dark:via-dotori-900 dark:to-dotori-950 dark:ring-dotori-600/50')}>
                <Lock className="h-9 w-9 text-dotori-900 dark:text-dotori-50" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className={cn(DS_TYPOGRAPHY.label, 'font-mono font-semibold uppercase tracking-widest', DS_TEXT.muted)}>
              프리미엄 잠금
            </p>
            <h3 className={cn(DS_TYPOGRAPHY.h3, 'font-bold text-balance', DS_TEXT.gradientHero)}>
              {title}
            </h3>
            <p className={cn(DS_TYPOGRAPHY.bodySm, 'leading-6 text-balance', DS_TEXT.secondary)}>
              {description}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 pt-1">
            <motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-2 rounded-full bg-gradient-to-r from-dotori-400/40 via-amber-400/30 to-dotori-400/40 blur-lg dark:from-dotori-500/30 dark:via-amber-500/25 dark:to-dotori-500/30" />
                <DsButton
                  href={ctaHref}
                  onClick={onCtaClick}
                  tone="dotori"
                  fullWidth
                  className={cn('group relative min-h-11 font-bold ring-1 ring-white/35 dark:ring-dotori-50/10', DS_SHADOW.xl, DS_SHADOW.dark.xl)}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <span>{ctaLabel}</span>
                    <ArrowRight className="h-4 w-4 opacity-90 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </DsButton>
              </div>
            </motion.div>
            {secondaryLabel && secondaryHref ? (
              <DsButton variant="ghost" href={secondaryHref} className={DS_TEXT.muted} fullWidth>
                {secondaryLabel}
              </DsButton>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
