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
      <section className="relative w-full max-w-md space-y-5">
        <BrandWatermark className="opacity-30" />
        <FadeIn>
          <div className={cn(DS_CARD.premium.base, DS_CARD.premium.dark, 'rounded-3xl p-7')}>
            {/* Warm ambient glow */}
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-12 -right-8 h-24 w-24 rounded-full bg-dotori-200/30 blur-3xl dark:bg-dotori-600/10"
              />
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.symbol} alt="도토리" className="relative h-10 w-10" />
            <p className={cn('relative mt-3', DS_PAGE_HEADER.eyebrow, 'text-forest-600')}>
              로그인
            </p>
            <h1 className={cn('relative mt-3 font-wordmark text-3xl/10 font-extrabold tracking-tight', gradientText)}>
              {copy.auth.login.titleMain}
            </h1>
            <Text className={cn('relative mt-2', DS_TYPOGRAPHY.body, DS_PAGE_HEADER.subtitle)}>
              {copy.auth.login.subtitle}
            </Text>

            <SocialProofBadge count={20000} suffix="명이 시작했어요" className="relative mt-4" />

            <div className="relative mt-7 space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.card, delay: 0.3 }}
                className="space-y-3"
              >
                <DsButton tone="amber" fullWidth className="rounded-2xl shadow-sm"
                  onClick={() => signIn('kakao', { callbackUrl: '/' })}>
                  카카오 로그인
                </DsButton>
              </motion.div>
              <DsButton variant="ghost" fullWidth href="/" className="rounded-2xl">
                {copy.auth.login.guestBrowse}
              </DsButton>
              <Text className={cn('pt-1 text-center', DS_TYPOGRAPHY.caption)}>
                {copy.auth.login.quickHint}
              </Text>
            </div>
          </div>
        </FadeIn>

        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'rounded-2xl p-4 ring-1 ring-dotori-200/30 dark:ring-dotori-800/30')}>
            <Text className={cn(DS_TYPOGRAPHY.caption, 'dark:text-dotori-400')}>
              {copy.auth.login.termsPrefix} {copy.auth.login.termsService} · {copy.auth.login.termsPrivacy} {copy.auth.login.termsSuffix}
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
      </section>
    </AuthLayout>
  )
}
