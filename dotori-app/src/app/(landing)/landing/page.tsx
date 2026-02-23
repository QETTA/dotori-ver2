'use client'

import { BoltIcon, CpuChipIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { motion, type Variants } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/catalyst/badge'
import { Button } from '@/components/catalyst/button'
import { PageTransition } from '@/components/dotori/PageTransition'
import { BRAND } from '@/lib/brand-assets'
import { DS_GLASS, DS_STATUS } from '@/lib/design-system/tokens'

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

const SPLASH_STATUSES = ['available', 'waiting', 'full'] as const

const splashStagger = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 84,
      damping: 16,
      delayChildren: 0.06,
      staggerChildren: 0.1,
    },
  },
} satisfies Variants

const splashItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 160, damping: 16 },
  },
} satisfies Variants

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
      <motion.main
        initial="hidden"
        animate="show"
        variants={splashStagger}
        className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-dotori-100 via-dotori-50/90 to-white px-4 pb-8 pt-4"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-dotori-300/25 blur-3xl dark:bg-dotori-700/20" />
          <div className="absolute bottom-20 -right-24 h-80 w-80 rounded-full bg-forest-300/20 blur-3xl dark:bg-forest-800/20" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.watermark} alt="" className="absolute -right-14 top-28 h-52 w-52 opacity-10" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-4">
          <motion.header
            variants={splashItem}
            className={`rounded-2xl border border-dotori-100/80 px-4 py-3 shadow-sm ring-1 ring-dotori-100/70 dark:border-dotori-800/70 ${DS_GLASS.HEADER}`}
          >
            <div className="flex items-center justify-between gap-3">
              <Link href="/landing" className="inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BRAND.lockupHorizontalKr}
                  alt="도토리"
                  width={208}
                  height={56}
                  className="h-6 w-auto"
                />
              </Link>
              <Badge color="forest">PRE-HOME SPLASH</Badge>
            </div>
          </motion.header>

          <motion.section variants={splashItem} className="grid gap-4">
            <motion.article
              variants={splashItem}
              className={`rounded-3xl border border-dotori-100/80 p-5 shadow-sm ring-1 ring-dotori-100/70 ${DS_GLASS.CARD}`}
            >
              <p className="text-label font-semibold tracking-[0.16em] text-dotori-600">HOME READY FRAME</p>
              <h1 className="text-display mt-2 leading-tight text-dotori-950">
                홈 진입 전에
                <br />
                이동 전략부터 맞춥니다
              </h1>
              <p className="mt-3 text-body text-dotori-700">
                반편성, 교체 이슈, 국공립 변화를 한 번에 묶어
                <br />
                빠르게 판단하고 탐색을 시작하세요.
              </p>

              <motion.p
                key={currentSignal}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                className="mt-4 inline-flex min-h-11 w-fit items-center rounded-full border border-forest-200/80 bg-forest-50 px-3.5 py-2.5 text-label font-medium text-forest-700"
              >
                {currentSignal}
              </motion.p>

              <div className="mt-4 grid gap-2 grid-cols-3">
                {SPLASH_FACTS.map((item) => (
                  <motion.div
                    variants={splashItem}
                    key={item.label}
                    className="rounded-2xl border border-dotori-100/80 bg-white/80 p-2.5 shadow-sm ring-1 ring-dotori-100/70 dark:bg-dotori-950/40"
                  >
                    <p className="text-h3 text-dotori-900">{item.value}</p>
                    <p className="mt-1 text-caption text-dotori-600">{item.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 space-y-2.5">
                <motion.div whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 360, damping: 20 }}>
                  <Button
                    color="dotori"
                    onClick={handleEnterHome}
                    className="min-h-11 w-full justify-center rounded-full border border-transparent"
                  >
                    홈으로 이동
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 360, damping: 20 }}>
                  <Button href="/onboarding" outline className="min-h-11 w-full justify-center rounded-full">
                    온보딩 시작
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 360, damping: 20 }}>
                  <Button href="/chat" plain className="min-h-11 w-full justify-center rounded-full">
                    AI 상담 미리보기
                  </Button>
                </motion.div>
              </div>
            </motion.article>

            <motion.section
              variants={splashItem}
              className="rounded-2xl border-b border-dotori-200/70 p-4 pb-6 shadow-sm ring-1 ring-dotori-100/70 dark:border-dotori-800/70"
            >
              <p className="text-label font-semibold text-dotori-600">작동 순서</p>
              <h2 className="mt-1 text-h2 text-dotori-900">3단계로 바로 시작</h2>
              <div className="mt-4 space-y-2">
                {SPLASH_FLOW.map((item, index) => (
                  <motion.article
                    whileTap={{ scale: 0.995 }}
                    variants={splashItem}
                    key={item.title}
                    className={`rounded-2xl border border-dotori-100/80 bg-white/70 p-3 shadow-sm ring-1 ring-dotori-100/70 ${DS_GLASS.CARD} dark:bg-dotori-950/35`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-label inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dotori-100 text-dotori-700">
                        <item.Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-caption text-dotori-500">0{index + 1}</p>
                        <p className="text-h3 mt-1 text-dotori-900">{item.title}</p>
                        <p className="text-body-sm mt-1 text-dotori-600">{item.description}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>

            <motion.section
              variants={splashItem}
              className="rounded-2xl border border-dotori-100/80 p-4 shadow-sm ring-1 ring-dotori-100/70 dark:border-dotori-800/70"
            >
              <p className="text-label font-semibold text-dotori-600">현재 운영 상태</p>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {SPLASH_STATUSES.map((statusKey) => {
                  const status = DS_STATUS[statusKey]

                  return (
                    <p
                      key={statusKey}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-label ${status.pill} ring-1 ring-dotori-200/70`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </p>
                  )
                })}
              </div>
            </motion.section>
          </motion.section>
        </div>
      </motion.main>
    </PageTransition>
  )
}
