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
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'
import { Heading, Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { cn } from '@/lib/utils'
import { scrollFadeIn, hoverLift } from '@/lib/motion'
import { BRAND_GUIDE } from '@/lib/brand-assets'

const APP_VERSION = '2.49.0'
const BUILD_DATE = '2026-02-27'

const legalLinks = [
  { label: '이용약관', href: '#terms', Icon: DocumentTextIcon },
  { label: '개인정보 처리방침', href: '#privacy', Icon: ShieldCheckIcon },
  { label: '오픈소스 라이선스', href: '#opensource', Icon: CodeBracketIcon },
]

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
          <Heading level={2} className="mt-5 font-wordmark text-2xl/8 font-bold tracking-tight text-dotori-950 sm:text-2xl/8">
            도토리
          </Heading>
          <Text className="mt-1 text-sm/6 text-dotori-500 sm:text-sm/6 dark:text-dotori-400">
            우리 아이 보육·교육 시설 찾기
          </Text>

          <div className="mt-4 flex items-center gap-3 text-caption">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-full bg-dotori-50 px-3 py-1 ring-1 ring-dotori-100/60 dark:bg-dotori-900/60 dark:ring-dotori-800/40"
            >
              <DevicePhoneMobileIcon className="h-3.5 w-3.5 text-dotori-400" />
              <span className="font-medium text-dotori-700 dark:text-dotori-200">v{APP_VERSION}</span>
            </motion.div>
            <span className="text-dotori-300 dark:text-dotori-700">·</span>
            <span className="text-dotori-500">{BUILD_DATE}</span>
          </div>
        </div>
      </FadeIn>

      {/* ══════ LEGAL LINKS (hover lift) ══════ */}
      <FadeInStagger faster className="space-y-2">
        {legalLinks.map((link) => (
          <FadeIn key={link.label}>
            <motion.div {...hoverLift}>
              <DsButton
                variant="secondary"
                fullWidth
                className="justify-start gap-3 rounded-xl"
              >
                <link.Icon className="h-4 w-4" />
                {link.label}
              </DsButton>
            </motion.div>
          </FadeIn>
        ))}
      </FadeInStagger>

      <Divider soft />

      {/* ══════ CREDITS (heart pulse) ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6 text-center')}>
          <div className="flex items-center justify-center gap-1.5 text-sm/6 text-dotori-500">
            <span>Made with</span>
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
            >
              <HeartIcon className="h-4 w-4 text-dotori-400" />
            </motion.span>
            <span>in Korea</span>
          </div>
          <Text className="mt-2 text-caption text-dotori-400 dark:text-dotori-500">
            도토리는 부모님의 보육·교육 시설 이동을 돕기 위해 만들어졌습니다.
          </Text>
        </div>
      </motion.div>

      {/* ══════ FEEDBACK ══════ */}
      <FadeIn>
        <div className="text-center pb-4">
          <Subheading level={3} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
            의견을 들려주세요
          </Subheading>
          <Text className="mt-1 text-caption text-dotori-500 dark:text-dotori-400">
            더 나은 도토리를 만드는 데 도움이 됩니다
          </Text>
          <DsButton variant="secondary" className="mt-3">
            피드백 보내기
          </DsButton>
        </div>
      </FadeIn>
    </div>
  )
}
