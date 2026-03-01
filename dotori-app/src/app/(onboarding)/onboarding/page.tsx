'use client'

/**
 * Onboarding Page — Personalized (Wave 8)
 *
 * Catalyst: Heading, Text, Divider, Badge, DsButton, RadioGroup
 * Studio:   FadeIn
 * Wave 5:   DonutGauge
 * Wave 6:   SwipeCard
 */
import { useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { motion } from 'motion/react'
import { Zap, Filter, MessageCircle, Check } from 'lucide-react'
import { copy } from '@/lib/brand-copy'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_SURFACE } from '@/lib/design-system/page-tokens'
import { DS_TYPOGRAPHY, DS_TEXT, DS_ICON, DS_GLASS } from '@/lib/design-system/tokens'
import { scrollFadeIn, gradientTextHero } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { Badge } from '@/components/catalyst/badge'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { UiBlock as UiBlockCard } from '@/components/dotori/blocks/UiBlock'
import { DonutGauge } from '@/components/dotori/charts/DonutGauge'
import type { ChildProfile, UiBlock as UiBlockType } from '@/types/dotori'

const steps = [
  '아이 연령 + 시설 형태',
  '이동 우선순위 체크',
  '맞춤 시설 진단',
]

const quickLinks = [
  { href: '/chat', label: '토리 톡으로 바로 연결' },
  { href: '/explore', label: '시설 탐색 보기' },
  { href: '/community', label: '실제 고민 보기' },
  { href: '/my', label: '개인 대시보드 만들기' },
]

const quickLinksBlock: UiBlockType = {
  type: 'ui_block',
  title: '바로 시작하기',
  subtitle: '원하는 경로로 바로 이동하세요',
  layout: 'grid',
  variant: 'panel',
  tone: 'dotori',
  density: 'compact',
  accentStyle: 'bar',
  items: quickLinks.map((link) => ({
    id: `onboarding-quick-link-${link.href}`,
    title: link.label,
    href: link.href,
    actionLabel: '이동하기',
  })),
}

const facilityTypes = ['어린이집', '유치원', '둘 다'] as const

const childGenderOptions: Array<{ value: ChildProfile['gender']; label: string }> = [
  { value: 'female', label: '여아' },
  { value: 'male', label: '남아' },
  { value: 'unspecified', label: '상관없음' },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedType, setSelectedType] = useState<(typeof facilityTypes)[number] | null>(null)
  const [selectedGender, setSelectedGender] = useState<ChildProfile['gender'] | null>(null)
  const totalSteps = 3
  const [stepsRef] = useAutoAnimate({ duration: 250 })

  // Progress bar percentage
  const progressPct = Math.round(((currentStep + 1) / totalSteps) * 100)
  const canContinue = currentStep !== 0 || Boolean(selectedType && selectedGender)
  const isFinalStep = currentStep === totalSteps - 1

  return (
    <div className="container-app relative space-y-8 pb-8">
      <BrandWatermark className="opacity-30" />
      {/* ══════ PROGRESS BAR ══════ */}
      <FadeIn>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text className={cn(DS_TYPOGRAPHY.caption, 'font-medium', DS_TEXT.muted)}>
              {currentStep + 1} / {totalSteps}
            </Text>
            <Text className={cn(DS_TYPOGRAPHY.caption, 'font-medium', DS_TEXT.muted)}>
              {progressPct}%
            </Text>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-dotori-100 dark:bg-dotori-800">
            <motion.div
              className="h-full rounded-full bg-dotori-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </FadeIn>

      {/* ══════ WELCOME ══════ */}
      <FadeIn>
        <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'rounded-3xl p-7')}>
          <p className={cn(DS_TYPOGRAPHY.caption, 'font-mono font-semibold uppercase tracking-widest text-forest-600')}>
            온보딩
          </p>
          <h1 className={cn(DS_TYPOGRAPHY.h1, 'mt-3 font-wordmark font-extrabold tracking-tight', gradientTextHero)}>
            {copy.onboarding.welcome}
          </h1>
          <Text className={cn(DS_TYPOGRAPHY.bodySm, 'mt-2', DS_TEXT.secondary)}>
            {copy.onboarding.welcomeSub}
          </Text>
        </div>
      </FadeIn>

      {/* ══════ FACILITY TYPE SELECTION ══════ */}
      <motion.div {...scrollFadeIn}>
        <Subheading level={2} className={cn(DS_TYPOGRAPHY.h2, 'mb-3 font-semibold', DS_TEXT.primary)}>
          {copy.onboarding.categoryPrompt}
        </Subheading>
        <div className="grid grid-cols-3 gap-2">
          {facilityTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={cn(
                DS_TYPOGRAPHY.bodySm,
                'flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-3 font-medium ring-2 transition-all',
                selectedType === type
                  ? 'ring-dotori-500 bg-dotori-50 text-dotori-700 dark:bg-dotori-900/30 dark:text-dotori-200'
                  : 'ring-dotori-100/70 bg-white text-dotori-600 hover:ring-dotori-200 dark:ring-dotori-800/50 dark:bg-dotori-950 dark:text-dotori-400'
              )}
              aria-pressed={selectedType === type}
              onClick={() => setSelectedType(type)}
            >
              {selectedType === type && <Check className={cn(DS_ICON.sm, 'text-dotori-500')} />}
              {type}
            </button>
          ))}
        </div>
        <div className="mt-5 border-t border-dotori-100/60 pt-5 dark:border-dotori-800/40">
          <Subheading level={2} className={cn(DS_TYPOGRAPHY.h2, 'mb-3 font-semibold', DS_TEXT.primary)}>
            아이 성별은요?
          </Subheading>
          <div className="grid grid-cols-3 gap-2">
            {childGenderOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  DS_TYPOGRAPHY.bodySm,
                  'flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-3 font-medium transition-all',
                  selectedGender === option.value
                    ? 'bg-dotori-50 text-dotori-900 ring-2 ring-dotori-400 dark:bg-dotori-900/30 dark:text-dotori-100'
                    : 'bg-white text-dotori-600 ring-1 ring-dotori-100/70 hover:ring-dotori-200 dark:bg-dotori-950 dark:text-dotori-400 dark:ring-dotori-800/50'
                )}
                aria-pressed={selectedGender === option.value}
                onClick={() => setSelectedGender(option.value)}
              >
                {selectedGender === option.value && <Check className={cn(DS_ICON.sm, 'text-dotori-500')} />}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══════ STEPS ══════ */}
      <section ref={stepsRef} className="grid gap-2">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'rounded-2xl p-4 ring-1',
              index <= currentStep
                ? cn(DS_CARD.flat.base, DS_CARD.flat.dark)
                : cn(DS_SURFACE.sunken, 'ring-dotori-100/40 opacity-60 dark:ring-dotori-800/20')
            )}
          >
            <div className="flex items-center gap-3">
              <Badge color={index <= currentStep ? 'forest' : 'dotori'}>{index + 1}</Badge>
              <Subheading level={2} className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold', DS_TEXT.primary)}>{step}</Subheading>
            </div>
          </motion.div>
        ))}
      </section>

      <Divider soft />

      {/* ══════ PRIORITY CHECK ══════ */}
      <FadeIn>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'rounded-2xl p-5 ring-1 ring-dotori-200/30 dark:ring-dotori-800/30')}>
          <Subheading level={2} className={cn(DS_TYPOGRAPHY.h2, 'font-semibold', DS_TEXT.primary)}>우선순위 체크</Subheading>
          <ul className="mt-3 space-y-3">
            <li className="flex items-start gap-3">
              <Zap className={cn('mt-0.5 shrink-0 text-dotori-500', DS_ICON.sm)} />
              <Text className={cn(DS_TYPOGRAPHY.bodySm, DS_TEXT.secondary)}>유보통합·반편성 위험 신호를 먼저 탐지합니다.</Text>
            </li>
            <li className="flex items-start gap-3">
              <Filter className={cn('mt-0.5 shrink-0 text-dotori-500', DS_ICON.sm)} />
              <Text className={cn(DS_TYPOGRAPHY.bodySm, DS_TEXT.secondary)}>이동 사유를 기준으로 후보 시설을 선별합니다.</Text>
            </li>
            <li className="flex items-start gap-3">
              <MessageCircle className={cn('mt-0.5 shrink-0 text-dotori-500', DS_ICON.sm)} />
              <Text className={cn(DS_TYPOGRAPHY.bodySm, DS_TEXT.secondary)}>10분 안내 플로우로 상담/서류를 정렬합니다.</Text>
            </li>
          </ul>
        </div>
      </FadeIn>

      {/* ══════ RESULT PREVIEW — DonutGauge ══════ */}
      {selectedType && (
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex items-center gap-5 rounded-2xl p-5 ring-1 ring-dotori-200/30 dark:ring-dotori-800/30')}>
            <DonutGauge
              value={72}
              size={80}
              strokeWidth={7}
              color="dotori"
              label="맞춤 매칭률"
            />
            <div className="flex-1">
              <Subheading level={3} className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold', DS_TEXT.primary)}>
                예상 맞춤도
              </Subheading>
              <Text className={cn(DS_TYPOGRAPHY.caption, 'mt-1', DS_TEXT.muted)}>
                선호 조건을 모두 입력하면 더 정확해져요
              </Text>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════ SKIP LINK ══════ */}
      <FadeIn>
        <div className="text-center">
          <DsButton variant="ghost" href="/" className="text-dotori-400">
            나중에 설정하기
          </DsButton>
        </div>
      </FadeIn>

      {/* ══════ QUICK LINKS ══════ */}
      <FadeIn>
        <UiBlockCard block={quickLinksBlock} />
      </FadeIn>

      {/* ══════ STICKY NEXT ══════ */}
      <div
        className={cn(
          DS_GLASS.nav,
          DS_GLASS.dark.nav,
          'sticky bottom-0 z-40 -mx-4 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]',
          'hairline-border-t',
        )}
      >
        {isFinalStep ? (
          <DsButton tone="dotori" href="/explore" fullWidth>
            시작하기
          </DsButton>
        ) : (
          <DsButton
            tone="dotori"
            fullWidth
            disabled={!canContinue}
            onClick={() => setCurrentStep((step) => Math.min(step + 1, totalSteps - 1))}
          >
            다음
          </DsButton>
        )}
      </div>
    </div>
  )
}
