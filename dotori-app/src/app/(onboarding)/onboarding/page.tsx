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
import { motion } from 'motion/react'
import { BoltIcon, FunnelIcon, ChatBubbleLeftRightIcon, CheckIcon } from '@heroicons/react/24/outline'
import { copy } from '@/lib/brand-copy'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Heading, Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { Badge } from '@/components/catalyst/badge'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { DonutGauge } from '@/components/dotori/charts/DonutGauge'

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

const facilityTypes = ['어린이집', '유치원', '둘 다'] as const

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const totalSteps = 3

  // Progress bar percentage
  const progressPct = Math.round(((currentStep + 1) / totalSteps) * 100)

  return (
    <div className="relative space-y-8 pb-8">
      <BrandWatermark className="opacity-30" />
      {/* ══════ PROGRESS BAR ══════ */}
      <FadeIn>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text className="text-xs/5 font-medium text-dotori-500 sm:text-xs/5">
              {currentStep + 1} / {totalSteps}
            </Text>
            <Text className="text-xs/5 font-medium text-dotori-500 sm:text-xs/5">
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
        <div className="rounded-3xl bg-white p-7 shadow-md ring-1 ring-dotori-100/60 dark:bg-dotori-950 dark:ring-dotori-800/40 dark:shadow-lg">
          <p className="font-mono text-xs/5 font-semibold uppercase tracking-widest text-forest-600">
            온보딩
          </p>
          <Heading className="mt-3 font-wordmark text-3xl/10 font-bold tracking-tight text-dotori-950 sm:text-3xl/10">
            {copy.onboarding.welcome}
          </Heading>
          <Text className="mt-2 text-base/7 text-dotori-700 dark:text-dotori-400">
            {copy.onboarding.welcomeSub}
          </Text>
        </div>
      </FadeIn>

      {/* ══════ FACILITY TYPE SELECTION ══════ */}
      <motion.div {...scrollFadeIn}>
        <Subheading level={2} className="mb-3 text-base/7 font-semibold text-dotori-950 sm:text-base/7">
          {copy.onboarding.categoryPrompt}
        </Subheading>
        <div className="grid grid-cols-3 gap-2">
          {facilityTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm/6 font-medium ring-2 transition-all ${
                selectedType === type
                  ? 'ring-dotori-500 bg-dotori-50 text-dotori-700 dark:bg-dotori-900/30 dark:text-dotori-200'
                  : 'ring-dotori-100/70 bg-white text-dotori-600 hover:ring-dotori-200 dark:ring-dotori-800/50 dark:bg-dotori-950 dark:text-dotori-400'
              }`}
              onClick={() => { setSelectedType(type); setCurrentStep(1) }}
            >
              {selectedType === type && <CheckIcon className="h-4 w-4 text-dotori-500" />}
              {type}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ══════ STEPS ══════ */}
      <section className="grid gap-2">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-2xl p-4 ring-1 ${
              index <= currentStep
                ? 'bg-white ring-dotori-200/30 shadow-sm dark:bg-dotori-950 dark:ring-dotori-700/30'
                : 'bg-dotori-950/[0.015] ring-dotori-100/40 opacity-60 dark:bg-white/[0.01] dark:ring-dotori-800/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <Badge color={index <= currentStep ? 'forest' : 'zinc'}>{index + 1}</Badge>
              <Subheading level={2} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">{step}</Subheading>
            </div>
          </motion.div>
        ))}
      </section>

      <Divider soft />

      {/* ══════ PRIORITY CHECK ══════ */}
      <FadeIn>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'rounded-2xl p-5 ring-1 ring-dotori-200/30 dark:ring-dotori-800/30')}>
          <Subheading level={2} className="text-base/7 font-semibold text-dotori-950 sm:text-base/7">우선순위 체크</Subheading>
          <ul className="mt-3 space-y-3">
            <li className="flex items-start gap-3">
              <BoltIcon className="mt-0.5 h-4 w-4 shrink-0 text-dotori-500" />
              <Text className="text-sm/6 text-dotori-700 sm:text-sm/6 dark:text-dotori-400">유보통합·반편성 위험 신호를 먼저 탐지합니다.</Text>
            </li>
            <li className="flex items-start gap-3">
              <FunnelIcon className="mt-0.5 h-4 w-4 shrink-0 text-dotori-500" />
              <Text className="text-sm/6 text-dotori-700 sm:text-sm/6 dark:text-dotori-400">이동 사유를 기준으로 후보 시설을 선별합니다.</Text>
            </li>
            <li className="flex items-start gap-3">
              <ChatBubbleLeftRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-dotori-500" />
              <Text className="text-sm/6 text-dotori-700 sm:text-sm/6 dark:text-dotori-400">10분 안내 플로우로 상담/서류를 정렬합니다.</Text>
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
              <Subheading level={3} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
                예상 맞춤도
              </Subheading>
              <Text className="mt-1 text-xs/5 text-dotori-500 sm:text-xs/5 dark:text-dotori-400">
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
      <section className="grid gap-2 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <DsButton key={link.href} variant="secondary" fullWidth href={link.href} className="rounded-2xl">
            {link.label}
          </DsButton>
        ))}
      </section>
    </div>
  )
}
