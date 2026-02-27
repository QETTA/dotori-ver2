'use client'

/**
 * App Info Page — 앱 정보 (R41 Premium Polish)
 *
 * Catalyst: Heading, Subheading, Text, Divider, DsButton
 * Studio:   FadeIn/FadeInStagger
 * Motion:   scrollFadeIn, hoverLift, tap, spring
 * DS:       DS_CARD, DS_PAGE_HEADER, BrandWatermark
 */
import { motion } from 'motion/react'
import {
  Smartphone,
  Heart,
} from 'lucide-react'
import { Heading, Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { UiBlock as UiBlockCard } from '@/components/dotori/blocks/UiBlock'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'
import { scrollFadeIn } from '@/lib/motion'
import { BRAND_GUIDE } from '@/lib/brand-assets'
import type { UiBlock as UiBlockType } from '@/types/dotori'

const APP_VERSION = '2.49.0'
const BUILD_DATE = '2026-02-27'

const legalLinks = [
  { label: '이용약관', href: '#terms', actionLabel: '약관 보기' },
  { label: '개인정보 처리방침', href: '#privacy', actionLabel: '정책 보기' },
  { label: '오픈소스 라이선스', href: '#opensource', actionLabel: '라이선스 보기' },
]
const legalLinksBlock: UiBlockType = {
  type: 'ui_block',
  title: '정책 및 라이선스',
  subtitle: '서비스 이용에 필요한 문서를 확인하세요',
  layout: 'list',
  items: legalLinks.map((link) => ({
    id: `app-info-legal-${link.label}`,
    title: link.label,
    href: link.href,
    actionLabel: link.actionLabel,
  })),
}

export default function AppInfoPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav
        parent={{ label: '마이페이지', href: '/my' }}
        current="앱 정보"
      />

      {/* ══════ APP IDENTITY (spring entrance) ══════ */}
      <FadeIn>
        <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'relative flex flex-col items-center overflow-hidden py-10')}>
          <BrandWatermark className="opacity-30" />
          {/* Brand icon with spring bounce */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
            className="relative"
          >
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-md ring-1 ring-dotori-100/60 dark:bg-dotori-900 dark:ring-dotori-800/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_GUIDE.inApp}
                alt="도토리"
                className="h-10 w-10"
              />
            </div>
          </motion.div>
          <Heading level={2} className={cn('mt-5 font-wordmark font-bold', DS_PAGE_HEADER.title)}>
            도토리
          </Heading>
          <Text className={cn('mt-1', DS_TYPOGRAPHY.bodySm, 'text-dotori-500 dark:text-dotori-400')}>
            우리 아이 보육·교육 시설 찾기
          </Text>

          <div className={cn('mt-4 flex items-center gap-3', DS_TYPOGRAPHY.caption)}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-full bg-dotori-50 px-3 py-1 ring-1 ring-dotori-100/60 dark:bg-dotori-900/60 dark:ring-dotori-800/40"
            >
              <Smartphone className="h-3.5 w-3.5 text-dotori-400" />
              <span className="font-medium text-dotori-700 dark:text-dotori-200">v{APP_VERSION}</span>
            </motion.div>
            <span className="text-dotori-300 dark:text-dotori-700">·</span>
            <span className="text-dotori-500">{BUILD_DATE}</span>
          </div>
        </div>
      </FadeIn>

      {/* ══════ LEGAL LINKS ══════ */}
      <FadeIn>
        <UiBlockCard block={legalLinksBlock} />
      </FadeIn>

      <section className="space-y-3" aria-label="정책 문서 요약">
        <div id="terms" className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-4')}>
          <Subheading level={3} className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
            이용약관
          </Subheading>
          <Text className={cn('mt-1', DS_TYPOGRAPHY.caption, 'text-dotori-500 dark:text-dotori-400')}>
            서비스 이용 범위, 책임 제한, 계정 정책 등 기본 약관을 안내합니다.
          </Text>
        </div>
        <div id="privacy" className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-4')}>
          <Subheading level={3} className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
            개인정보 처리방침
          </Subheading>
          <Text className={cn('mt-1', DS_TYPOGRAPHY.caption, 'text-dotori-500 dark:text-dotori-400')}>
            수집 항목, 보관 기간, 이용 목적과 권리 행사 방법을 설명합니다.
          </Text>
        </div>
        <div id="opensource" className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-4')}>
          <Subheading level={3} className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
            오픈소스 라이선스
          </Subheading>
          <Text className={cn('mt-1', DS_TYPOGRAPHY.caption, 'text-dotori-500 dark:text-dotori-400')}>
            앱에 포함된 오픈소스 구성요소와 라이선스 고지 정보를 제공합니다.
          </Text>
        </div>
      </section>

      <Divider soft />

      {/* ══════ CREDITS (heart pulse) ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6 text-center')}>
          <div className={cn('flex items-center justify-center gap-1.5', DS_TYPOGRAPHY.bodySm, 'text-dotori-500')}>
            <span>Made with</span>
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
            >
              <Heart className="h-4 w-4 text-dotori-400" />
            </motion.span>
            <span>in Korea</span>
          </div>
          <Text className={cn('mt-2', DS_TYPOGRAPHY.caption, 'text-dotori-400 dark:text-dotori-500')}>
            도토리는 부모님의 보육·교육 시설 이동을 돕기 위해 만들어졌습니다.
          </Text>
        </div>
      </motion.div>

      {/* ══════ FEEDBACK ══════ */}
      <FadeIn>
        <div className="text-center pb-4">
          <Subheading level={3} className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
            의견을 들려주세요
          </Subheading>
          <Text className={cn('mt-1', DS_TYPOGRAPHY.caption, 'text-dotori-500 dark:text-dotori-400')}>
            더 나은 도토리를 만드는 데 도움이 됩니다
          </Text>
          <DsButton variant="secondary" href="/my/support" className="mt-3">
            피드백 보내기
          </DsButton>
        </div>
      </FadeIn>
    </div>
  )
}
