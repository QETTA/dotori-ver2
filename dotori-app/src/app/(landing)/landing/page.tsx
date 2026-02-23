'use client'

import { BoltIcon, CpuChipIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/catalyst/badge'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { PageTransition } from '@/components/dotori/PageTransition'
import { DsButton } from '@/components/ds/DsButton'
import { BRAND } from '@/lib/brand-assets'
import { DS_GLASS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { fadeUp } from '@/lib/motion'

const SPLASH_COOKIE = 'dotori_prehome_splash'
const SPLASH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const AI_SIGNALS = [
  '실시간 TO 변화 감지',
  '교사 교체 리스크 브리핑',
  '입소 가능성 우선순위 업데이트',
] as const

const SPLASH_FACTS = [
  { label: '연동 시설', value: '20,027+' },
  { label: '분석 신호', value: '17개 시도' },
  { label: '응답 속도', value: '3초 요약' },
] as const

const SPLASH_FLOW = [
  {
    title: '상황 입력',
    description: '반편성, 교사 교체, 국공립 당첨 상황을 바로 입력',
    Icon: SparklesIcon,
  },
  {
    title: 'AI 판단',
    description: '이동 리스크와 기회 요인을 우선순위로 정렬',
    Icon: CpuChipIcon,
  },
  {
    title: '즉시 실행',
    description: '홈에서 빈자리 탐색과 상담 플로우를 바로 시작',
    Icon: BoltIcon,
  },
] as const

function markSplashSeen() {
  if (typeof document === 'undefined') return
  document.cookie = `${SPLASH_COOKIE}=1; path=/; max-age=${SPLASH_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
}

export default function LandingPage() {
  const router = useRouter()
  const [signalIndex, setSignalIndex] = useState(0)

  useEffect(() => {
    markSplashSeen()
    const timer = setInterval(() => {
      setSignalIndex((prev) => (prev + 1) % AI_SIGNALS.length)
    }, 2200)

    return () => clearInterval(timer)
  }, [])

  const currentSignal = useMemo(() => AI_SIGNALS[signalIndex], [signalIndex])

  const handleEnterHome = () => {
    markSplashSeen()
    router.push('/')
  }

  return (
    <PageTransition>
      <main className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-dotori-100 via-dotori-50 to-white px-4 pb-8 pt-4 dark:from-dotori-950 dark:via-dotori-900 dark:to-dotori-950">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-dotori-300/25 blur-3xl dark:bg-dotori-700/20" />
          <div className="absolute bottom-20 -right-24 h-80 w-80 rounded-full bg-forest-300/20 blur-3xl dark:bg-forest-800/20" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.watermark} alt="" className="absolute -right-14 top-28 h-52 w-52 opacity-10" />
        </div>

        <div className="relative mx-auto flex w-full max-w-md flex-col gap-4">
          <header className={`rounded-xl border border-dotori-200/60 px-3 py-2.5 dark:border-dotori-800/70 ${DS_GLASS.HEADER}`}>
            <div className="flex items-center justify-between gap-3">
              <Link href="/landing" className="inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={BRAND.lockupHorizontalKr} alt="도토리" width={208} height={56} className="h-6 w-auto" />
              </Link>
              <Badge color="forest">PRE-HOME SPLASH</Badge>
            </div>
          </header>

          <section className="grid items-stretch gap-3">
            <motion.article
              {...fadeUp}
              className={`rounded-2xl border border-dotori-200/70 p-4 dark:border-dotori-800/70 ${DS_GLASS.CARD}`}
            >
              <Text className={`${DS_TYPOGRAPHY.label} font-semibold tracking-[0.2em] text-dotori-600 dark:text-dotori-200`}>
                2026 AI TRANSFER COPILOT
              </Text>
              <Heading
                level={1}
                className={`${DS_TYPOGRAPHY.display} mt-2.5 font-wordmark leading-[1.1] tracking-[-0.03em] text-dotori-900 dark:text-dotori-50`}
              >
                홈 진입 전에
                <br />
                이동 전략부터 맞춥니다
              </Heading>

              <motion.div
                key={currentSignal}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="mt-3 inline-flex min-h-10 items-center rounded-full border border-forest-200/80 bg-forest-50/80 px-3.5 text-xs font-medium text-forest-700 dark:border-forest-700/50 dark:bg-forest-900/30 dark:text-forest-200"
              >
                {currentSignal}
              </motion.div>

              <div className="mt-4 grid gap-2 grid-cols-3">
                {SPLASH_FACTS.map((item) => (
                  <div key={item.label} className="rounded-xl border border-dotori-100/80 bg-white/70 p-2.5 dark:border-dotori-800/70 dark:bg-dotori-950/40">
                    <Text className="font-wordmark text-base font-semibold text-dotori-900 dark:text-dotori-50">{item.value}</Text>
                    <Text className={`${DS_TYPOGRAPHY.caption} mt-1 text-dotori-600 dark:text-dotori-300`}>{item.label}</Text>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <DsButton onClick={handleEnterHome}>홈으로 이동</DsButton>
                <DsButton href="/onboarding" variant="secondary">온보딩 시작</DsButton>
                <DsButton href="/chat" variant="ghost">AI 상담 미리보기</DsButton>
              </div>
            </motion.article>

            <motion.aside
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className={`rounded-2xl border border-dotori-200/70 p-4 dark:border-dotori-800/70 ${DS_GLASS.CARD}`}
            >
              <div className="rounded-xl bg-gradient-to-br from-dotori-900 via-dotori-800 to-dotori-700 p-4 text-white">
                <div className="flex items-center justify-between">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={BRAND.symbolMonoWhite} alt="" className="h-7 w-7" />
                  <Text className="text-xs font-semibold tracking-[0.18em] text-dotori-100">LIVE ENGINE</Text>
                </div>
                <Text className="mt-3 text-xs text-dotori-100">도토리는 홈 진입 전 단계에서 상황을 요약해 첫 탐색 실패를 줄입니다.</Text>
              </div>

              <div className="mt-3 space-y-2">
                {SPLASH_FLOW.map((item, index) => (
                  <article key={item.title} className="rounded-xl border border-dotori-100/80 bg-white/70 p-2.5 dark:border-dotori-800/70 dark:bg-dotori-950/40">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-dotori-100 text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100">
                        <item.Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Text className="font-mono text-xs font-semibold tracking-[0.22em] text-dotori-500">0{index + 1}</Text>
                        <Text className={`${DS_TYPOGRAPHY.h3} mt-1 font-semibold text-dotori-900 dark:text-dotori-50`}>{item.title}</Text>
                        <Text className={`${DS_TYPOGRAPHY.bodySm} mt-1 text-dotori-600 dark:text-dotori-300`}>{item.description}</Text>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </motion.aside>
          </section>
        </div>
      </main>
    </PageTransition>
  )
}
