'use client'

/**
 * Login Page — Premium auth (Wave 10 polish)
 *
 * Catalyst: Heading, Text, Divider, DsButton, AuthLayout
 * Studio:   FadeIn
 * Motion:   scrollFadeIn
 */
import { signIn } from 'next-auth/react'
import { motion } from 'motion/react'
import { copy } from '@/lib/brand-copy'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand-assets'
import { AuthLayout } from '@/components/catalyst/auth-layout'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { scrollFadeIn, gradientText, spring } from '@/lib/motion'
import { SocialProofBadge } from '@/components/dotori/SocialProofBadge'

export default function LoginPage() {
  return (
    <AuthLayout>
      <section className="relative grid h-full w-full max-w-md min-h-0 self-stretch grid-rows-[1fr_auto] gap-5">
        <BrandWatermark className="opacity-30" />
        <FadeIn className="h-full w-full">
          <div
            className={cn(
              DS_CARD.premium.base,
              DS_CARD.premium.dark,
              'flex h-full min-h-0 flex-col rounded-3xl p-6',
            )}
          >
            {/* Warm ambient glow */}
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-12 -right-8 h-24 w-24 rounded-full bg-dotori-200/30 blur-3xl dark:bg-dotori-600/10"
              />
            </div>

            <div className="relative flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BRAND.symbol} alt="도토리" className="h-9 w-9" />
              <p className={cn(DS_PAGE_HEADER.eyebrow, 'text-forest-600')}>로그인</p>
            </div>
            <h1
              className={cn(
                'relative mt-1.5 font-wordmark font-extrabold tracking-tight',
                DS_TYPOGRAPHY.display,
                gradientText,
              )}
            >
              {copy.auth.login.titleMain}
            </h1>
            <Text className={cn('relative mt-0.5', DS_TYPOGRAPHY.body, DS_PAGE_HEADER.subtitle)}>
              {copy.auth.login.subtitle}
            </Text>

            <SocialProofBadge count={20000} suffix="명이 시작했어요" className="relative mt-1" />

            <div className="relative mt-5 flex flex-1 flex-col justify-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.card, delay: 0.3 }}
                className="space-y-3"
              >
                <DsButton
                  tone="amber"
                  fullWidth
                  className="rounded-2xl shadow-sm"
                  onClick={() => signIn('kakao', { callbackUrl: '/' })}
                >
                  카카오 로그인
                </DsButton>
              </motion.div>
              <DsButton variant="ghost" fullWidth href="/" className="rounded-2xl">
                {copy.auth.login.guestBrowse}
              </DsButton>
            </div>
            <Text className={cn('pt-1 text-center', DS_TYPOGRAPHY.caption)}>
              {copy.auth.login.quickHint}
            </Text>
          </div>
        </FadeIn>

        <div className="flex flex-col justify-end gap-5">
          <motion.div {...scrollFadeIn}>
            <div
              className={cn(
                DS_CARD.flat.base,
                DS_CARD.flat.dark,
                'rounded-2xl p-4 ring-1 ring-dotori-200/30 dark:ring-dotori-800/30',
              )}
            >
              <Text className={cn(DS_TYPOGRAPHY.caption, 'dark:text-dotori-400')}>
                {copy.auth.login.termsPrefix} {copy.auth.login.termsService} ·{' '}
                {copy.auth.login.termsPrivacy} {copy.auth.login.termsSuffix}
              </Text>
            </div>
          </motion.div>

          <Divider soft />

          <FadeIn>
            <div className="text-center">
              <DsButton variant="ghost" href="/onboarding">
                회원가입 없이 체험하기
              </DsButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </AuthLayout>
  )
}
