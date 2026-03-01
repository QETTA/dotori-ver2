'use client'

/**
 * Landing Page — R52 Overhaul
 *
 * Visual rhythm: cream hero → white funnel → cream features → white reviews → dark pricing → cream CTA
 *
 * FIX: Replaced FadeIn (whileInView) with motion.div animate for below-fold sections.
 * This ensures content is ALWAYS visible — critical for Playwright screenshots + SSR.
 */
import Link from 'next/link'
import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  ChevronDown,
  MessageCircle,
  Search,
  BarChart3,
  FileCheck,
  Check,
} from 'lucide-react'
import { BRAND } from '@/lib/brand-assets'
import { copy } from '@/lib/brand-copy'
import { getSeasonalHero } from '@/lib/seasonal-config'
import { DS_PAGE_HEADER, DS_SURFACE } from '@/lib/design-system/page-tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_TYPOGRAPHY, DS_TEXT, DS_GLASS } from '@/lib/design-system/tokens'
import { gradientTextHero, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
import { Wallpaper } from '@/components/dotori/Wallpaper'
import { CircleBackground } from '@/components/dotori/CircleBackground'
import { FunnelSteps } from '@/components/dotori/FunnelSteps'
import { ReviewMarquee } from '@/components/dotori/ReviewMarquee'
import { FeatureClipCard } from '@/components/dotori/FeatureClipCard'
import { SocialProofBadge } from '@/components/dotori/SocialProofBadge'
import { Badge } from '@/components/catalyst/badge'
import { Divider } from '@/components/catalyst/divider'
import { DsButton } from '@/components/ds/DsButton'

/* ─── Animation: immediate reveal (not scroll-dependent) ─── */
const reveal = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
}

const staggerContainer = {
  initial: { opacity: 1 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const staggerItem = {
  variants: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  },
}

/* ── Shared CTA styles (extracted from 2x inline) ── */
const CTA_PRIMARY = cn(
  'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all duration-200',
  'bg-dotori-500 text-sm/7 text-white hover:bg-dotori-600 hover:-translate-y-0.5',
  'shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.14),0_8px_24px_rgba(176,122,74,0.30)]',
  'hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.18),0_16px_40px_rgba(176,122,74,0.35)]',
)
const CTA_SECONDARY = 'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-dotori-100 px-5 py-2.5 text-sm/7 font-medium text-dotori-700 hover:bg-dotori-200'

/* ── Gradient heading ── */
const GRADIENT_HEADING = cn('font-wordmark text-fluid-xl font-bold tracking-tight text-balance', gradientTextHero)

const HERO_STORY_BEATS = [
  {
    icon: Search,
    title: '통합 탐색',
    description: '어린이집·유치원 2만+ 시설을 한 번에 비교',
  },
  {
    icon: BarChart3,
    title: 'TO 예측',
    description: '졸업·전출 흐름으로 빈자리 가능성을 먼저 확인',
  },
  {
    icon: FileCheck,
    title: '전자서명',
    description: '복잡한 입소 서류를 모바일에서 10분 완결',
  },
] as const

const HERO_METRICS = [
  { value: '20,000+개', label: '어린이집·유치원 연동' },
  { value: '17개 시도', label: '전국 분석 범위' },
  { value: '10분', label: '풀퍼널 완결' },
] as const

const FAQ_ITEMS = [
  {
    question: '도토리는 학부모에게 정말 무료인가요?',
    answer:
      '네. 학부모 개인 사용은 영구 무료예요. 필요하시면 빈자리 알림을 설정하고, 토리톡으로 이동 루트까지 같이 정리해드려요.',
  },
  {
    question: '빈자리 알림은 어떻게 받을 수 있나요?',
    answer:
      '관심 시설을 등록하면, 변화가 감지될 때 알림으로 알려드려요. 여러 시설을 한 번에 관리할 수 있어서 “기다리기만” 하는 시간을 줄여줘요.',
  },
  {
    question: '시설 프리미엄은 누가 쓰나요?',
    answer:
      '어린이집·유치원 원장님을 위한 기능이에요. 시설 프로필 강화, 대기자 관리, 전자서명 계약을 하나의 흐름으로 묶어 운영 부담을 줄여요.',
  },
] as const

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const triggerId = useId()
  const panelId = useId()

  return (
    <div
      className={cn(
        'rounded-2xl ring-1 shadow-sm transition-all',
        DS_GLASS.card,
        DS_GLASS.dark.card,
        open
          ? 'ring-dotori-300/60'
          : 'ring-dotori-200/40 hover:ring-dotori-300/50 dark:hover:ring-dotori-600/40',
      )}
    >
      <motion.button
        id={triggerId}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        whileTap={{ scale: 0.97 }}
        transition={spring.chip}
        className="flex w-full min-h-12 items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors hover:bg-dotori-950/[0.03] dark:hover:bg-white/[0.03]"
      >
        <span className={cn('pr-4 font-semibold text-dotori-950 dark:text-dotori-50', DS_TYPOGRAPHY.bodySm)}>
          {question}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring.chip}>
          <ChevronDown className="h-4 w-4 shrink-0 text-dotori-400" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <p className={cn(DS_TYPOGRAPHY.bodySm, 'leading-relaxed text-dotori-600 dark:text-dotori-300')}>
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════ Pricing Data — Salient 2-tier ═══════ */
const PRICING_TIERS = [
  {
    name: '무료',
    price: '₩0',
    period: '영구 무료',
    description: '학부모 개인 사용',
    features: [
      '어린이집·유치원 통합 검색',
      '빈자리 알림 3건',
      'AI 이동 상담 (토리톡)',
      '커뮤니티 참여',
    ],
    cta: '무료로 시작',
    href: '/onboarding',
    featured: false,
  },
  {
    name: '시설 프리미엄',
    price: '₩44,000',
    period: '/월',
    description: '어린이집·유치원 원장님',
    features: [
      '프리미엄 시설 프로필',
      '입소 대기자 관리',
      '전자서명 계약 (무제한)',
      '학부모 데이터 인사이트',
      '전용 고객 지원',
    ],
    cta: '프리미엄 시작',
    href: '/onboarding',
    featured: true,
  },
]

export default function LandingPage() {
  const seasonalHero = getSeasonalHero()
  return (
    <div className="relative">
      {/* ═══════════════════════════════════════════
          HERO — Wallpaper cream + CircleBackground
          FadeIn OK here (in initial viewport)
          ═══════════════════════════════════════════ */}
      <Wallpaper color="cream" className="overflow-hidden gradient-mesh-warm py-10 sm:pb-20 sm:pt-16 lg:pb-24">
        <CircleBackground
          color="var(--color-dotori-400)"
          className="absolute right-[-12%] top-[-14%] h-[40rem] w-[40rem] opacity-20"
        />
        <CircleBackground
          color="var(--color-dotori-300)"
          className="absolute left-[-16%] top-[22%] h-[26rem] w-[26rem] opacity-20"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-dotori-100/80 via-dotori-50/30 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end"
          >
            <div>
              <motion.div variants={staggerItem}>
                <p
                  className={cn(
                    DS_PAGE_HEADER.eyebrow,
                    DS_GLASS.card,
                    DS_GLASS.dark.card,
                    'inline-flex rounded-full border border-dotori-200/80 px-4 py-1.5 shadow-sm ring-1 ring-dotori-100/70',
                  )}
                >
                  {copy.landing.badge} · {copy.landing.badgeSub}
                </p>
              </motion.div>

              <motion.div variants={staggerItem}>
                <h1
                  className={cn(
                    'mt-4 whitespace-pre-line font-wordmark font-bold tracking-tight text-balance sm:mt-6 sm:text-display',
                    DS_TYPOGRAPHY.h1,
                    gradientTextHero,
                  )}
                >
                  {seasonalHero.title}
                </h1>
              </motion.div>

              <motion.div variants={staggerItem}>
                <p
                  className={cn(
                    DS_PAGE_HEADER.subtitle,
                    DS_TYPOGRAPHY.body,
                    'mt-4 max-w-xl leading-8 text-pretty sm:mt-6',
                  )}
                >
                  {seasonalHero.subtitle}
                </p>
              </motion.div>

              <motion.div variants={staggerItem}>
                <SocialProofBadge count={20000} className="mt-4 w-fit sm:mt-6" />
              </motion.div>

              <motion.div variants={staggerItem}>
                <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
                  <Link href="/onboarding" className={CTA_PRIMARY}>
                    {seasonalHero.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/chat" className={CTA_SECONDARY}>
                    <MessageCircle className="h-4 w-4" />
                    토리 톡 시작
                  </Link>
                </div>
              </motion.div>
            </div>

            <motion.div variants={staggerItem} className="lg:pb-2">
              <div
                className={cn(
                  'relative overflow-hidden rounded-3xl border border-dotori-200/80 p-6 ring-1 ring-dotori-100/70 sm:p-7',
                  DS_GLASS.card,
                  DS_GLASS.dark.card,
                  'shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.12),0_18px_44px_rgba(176,122,74,0.18)]',
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/80 to-transparent dark:from-dotori-900/80" />
                <p className="relative font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-500">
                  10분 완결 루트
                </p>
                <h2
                  className={cn(
                    'relative mt-3 font-wordmark font-bold leading-9',
                    DS_TYPOGRAPHY.h1,
                    'text-dotori-900 dark:text-dotori-50',
                  )}
                >
                  탐색부터 서류까지<br />지금 바로 시작
                </h2>
                <div className="relative mt-6 space-y-4">
                  {HERO_STORY_BEATS.map((beat) => (
                    <div key={beat.title} className="flex items-start gap-3 rounded-2xl border border-dotori-200/70 bg-white/75 p-3.5 ring-1 ring-dotori-100/60 dark:border-dotori-700/50 dark:bg-dotori-900/70 dark:ring-dotori-700/40">
                      <beat.icon className="mt-0.5 h-5 w-5 shrink-0 text-dotori-500" />
                      <div>
                        <p
                          className={cn(
                            DS_TYPOGRAPHY.bodySm,
                            'font-semibold leading-6 text-dotori-900 dark:text-dotori-50',
                          )}
                        >
                          {beat.title}
                        </p>
                        <p
                          className={cn(
                            DS_TYPOGRAPHY.bodySm,
                            'mt-0.5 leading-6 text-dotori-700 dark:text-dotori-300',
                          )}
                        >
                          {beat.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.25 }}
            className="mt-10 rounded-3xl border border-dotori-200/80 bg-white/90 p-5 shadow-sm ring-1 ring-dotori-100/70 backdrop-blur-sm sm:p-6"
          >
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {HERO_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-dotori-200/70 bg-dotori-50/70 p-3 text-left"
                >
                  <dt className={cn(DS_TYPOGRAPHY.caption, 'font-semibold leading-5 tracking-wide text-dotori-500')}>
                    {metric.label}
                  </dt>
                  <dd className={cn(DS_TYPOGRAPHY.h2, 'mt-1 font-wordmark font-bold leading-8 text-dotori-900')}>
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </Wallpaper>

      {/* ── Section transition ── */}
      <div className="relative h-20 bg-gradient-to-b from-dotori-200/70 via-dotori-50/50 to-white">
        <div className="absolute inset-x-0 bottom-0 h-px bg-dotori-200/80" />
      </div>

      {/* ═══════════════════════════════════════════
          FUNNEL — 풀퍼널 플로우
          ★ motion.div animate (NOT whileInView)
          ═══════════════════════════════════════════ */}
      <section className={cn('relative border-b border-dotori-100/80 px-6 pb-16 pt-14', DS_SURFACE.primary)}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div>
              <motion.div {...reveal}>
                <p className={DS_PAGE_HEADER.eyebrow}>
                  풀퍼널 플로우
                </p>
              </motion.div>
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
                <h2 className={cn('mt-4', GRADIENT_HEADING)}>
                  {copy.landing.funnelTitle}
                </h2>
              </motion.div>
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
                <p className={cn(DS_PAGE_HEADER.subtitle, 'mt-4 text-base/7 text-pretty')}>
                  {copy.landing.funnelSub} — 2026 유보통합 시대, 어린이집·유치원 통합 플랫폼
                </p>
              </motion.div>
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.3 }}>
                <p
                  className={cn(
                    DS_TYPOGRAPHY.bodySm,
                    'mt-6 border-l-2 border-dotori-300/70 pl-4 leading-6 text-dotori-600 dark:text-dotori-300',
                  )}
                >
                  관심 등록 → TO 예측 확인 → 견학 신청 → 전자서명까지
                  <br />
                  하나의 흐름으로 끊김 없이 연결됩니다.
                </p>
              </motion.div>
            </div>

            <motion.div
              {...reveal}
              transition={{ ...reveal.transition, delay: 0.25 }}
              className="rounded-3xl border border-dotori-200/80 bg-dotori-50/55 p-3 shadow-sm ring-1 ring-dotori-100/70 sm:p-6"
            >
              <FunnelSteps currentStep={0} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section transition ── */}
      <div className="h-2 bg-gradient-to-r from-dotori-500/0 via-dotori-400/80 to-dotori-500/0" />

      {/* ═══════════════════════════════════════════
          FEATURES — FeatureClipCard
          ═══════════════════════════════════════════ */}
      <section className={'relative px-6 py-16 bg-dotori-50/80 dark:bg-dotori-950/20'}>
        <div className="mx-auto max-w-2xl">
          <motion.div {...reveal}>
            <p className={DS_PAGE_HEADER.eyebrow}>
              왜 도토리인가
            </p>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <h2 className={cn('mt-4', GRADIENT_HEADING)}>
              이동의 모든 단계를 하나로
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
            <p className={cn(DS_PAGE_HEADER.subtitle, 'mt-4 text-base/7 text-pretty')}>
              어린이집·유치원 2만+ 시설 데이터를 분석하고, TO 예측부터 전자서명까지 한 번에 해결해요.
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="mt-10 grid gap-4 sm:grid-cols-2">
            <motion.div {...staggerItem}>
              <FeatureClipCard
                eyebrow="통합 검색"
                title="어린이집·유치원 한 번에"
                description="2만+ 시설 데이터를 실시간으로 검색하고 비교해요. 유보통합 시대, 어린이집과 유치원을 한 번에."
                icon={Search}
              />
            </motion.div>
            <motion.div {...staggerItem}>
              <FeatureClipCard
                eyebrow="TO 예측"
                title="빈자리 가능성 분석"
                description="졸업·전출 데이터 기반으로 TO 발생 시점을 예측합니다. 이동 대상 시설을 먼저 읽어요."
                icon={BarChart3}
              />
            </motion.div>
            <motion.div {...staggerItem} className="sm:col-span-2">
              <FeatureClipCard
                eyebrow="전자서명"
                title="서류 10분 완결"
                description="입소 서류부터 전자서명까지 모바일에서 한 번에. 2~3시간 걸리던 입소 프로세스를 10분으로."
                icon={FileCheck}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Section transition ── */}
      <div className="h-2 bg-gradient-to-r from-dotori-500/0 via-dotori-400/80 to-dotori-500/0" />

      {/* ═══════════════════════════════════════════
          REVIEWS — ReviewMarquee
          ═══════════════════════════════════════════ */}
      <section className={cn('relative px-6 py-16', DS_SURFACE.primary)}>
        <div className="mx-auto max-w-2xl">
          <motion.div {...reveal}>
            <p className={DS_PAGE_HEADER.eyebrow}>
              부모님 후기
            </p>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <h2 className={cn('mt-4', GRADIENT_HEADING)}>
              {copy.landing.reviewTitle}
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
            <p className={cn(DS_PAGE_HEADER.subtitle, 'mt-4 text-base/7 text-pretty')}>
              {copy.landing.reviewSub}
            </p>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.3 }}>
            <div className="mt-8">
              <ReviewMarquee fadeBg="white" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FAQ — Landing quick answers
          ═══════════════════════════════════════════ */}
      <section className="relative bg-dotori-50/80 px-6 py-16 dark:bg-dotori-950/20">
        <div className="mx-auto max-w-2xl">
          <motion.div {...reveal}>
            <p className={DS_PAGE_HEADER.eyebrow}>
              FAQ
            </p>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <h2 className={cn('mt-3 font-wordmark font-bold', DS_TYPOGRAPHY.h2, DS_PAGE_HEADER.title)}>
              자주 묻는 질문
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
            <p className={cn('mt-2', DS_TYPOGRAPHY.bodySm, DS_PAGE_HEADER.subtitle)}>
              빠르게 확인하고, 첫 CTA까지 바로 이어지도록 정리했어요.
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="mt-8 space-y-2"
          >
            {FAQ_ITEMS.map((item) => (
              <motion.div key={item.question} {...staggerItem}>
                <FaqItem question={item.question} answer={item.answer} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PRICING — Dark panel + Salient featured card
          ═══════════════════════════════════════════ */}
      <section className="px-3 py-16 sm:px-4">
        <div
          className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl bg-dotori-950 px-6 py-16 sm:px-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 70% 20%, rgba(200,149,106,0.07) 0%, transparent 60%)',
          }}
        >
          <NoiseTexture opacity={0.04} />
          <motion.div {...reveal}>
            <p className={cn(DS_PAGE_HEADER.eyebrow, 'text-dotori-400')}>
              요금제
            </p>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <h2 className={cn(DS_PAGE_HEADER.title, 'mt-4 font-wordmark text-3xl/10 text-balance text-white')}>
              학부모는 무료, 시설은 프리미엄
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
            <p className={cn("mt-4 text-base/7 text-pretty", DS_TEXT.muted)}>
              학부모 개인 사용은 영구 무료. 시설 관리 기능이 필요하면 프리미엄을 선택하세요.
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="mt-10 grid gap-6 sm:grid-cols-2">
            {PRICING_TIERS.map((tier) => (
              <motion.div key={tier.name} {...staggerItem}>
                <div
                  className={cn(
                    'relative rounded-2xl p-6 ring-1',
                    tier.featured
                      ? cn(DS_CARD.raised.base, 'text-dotori-950 shadow-xl shadow-dotori-950/20 ring-white/20')
                      : 'bg-dotori-900/50 text-white ring-dotori-800/60'
                  )}
                >
                  {tier.featured && (
                    <Badge color="dotori" className="absolute right-6 top-6">
                      추천
                    </Badge>
                  )}
                  <p className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold', tier.featured ? 'text-dotori-500' : 'text-dotori-400')}>
                    {tier.name}
                  </p>
                  <p className="mt-3 flex items-baseline gap-1">
                    <span className={cn(DS_TYPOGRAPHY.display, 'font-wordmark', tier.featured ? 'text-dotori-950' : 'text-white')}>
                      {tier.price}
                    </span>
                    <span className={cn(DS_TYPOGRAPHY.bodySm, tier.featured ? 'text-dotori-500' : 'text-dotori-400')}>
                      {tier.period}
                    </span>
                  </p>
                  <p className={cn(DS_TYPOGRAPHY.bodySm, 'mt-2', tier.featured ? 'text-dotori-600' : 'text-dotori-400')}>
                    {tier.description}
                  </p>

                  <Divider soft className="my-6" />

                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={cn('mt-0.5 h-4 w-4 shrink-0', tier.featured ? 'text-forest-500' : 'text-dotori-400')} />
                        <span className={cn(DS_TYPOGRAPHY.bodySm, tier.featured ? 'text-dotori-700' : 'text-dotori-300')}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <DsButton
                    href={tier.href}
                    fullWidth
                    variant={tier.featured ? 'primary' : 'secondary'}
                    className="mt-8"
                  >
                    {tier.cta}
                  </DsButton>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>{/* close pricing panel */}
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Final conversion section
          ═══════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-b from-dotori-50 to-white py-16">
        <BrandWatermark className="opacity-30" />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <motion.div {...reveal}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.lockupHorizontalKr} alt="도토리" className="mx-auto h-8 w-auto" />
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <h2 className={cn('mt-6', GRADIENT_HEADING)}>
              아이의 공간, 지금 다시 선택하세요
            </h2>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
            <p className={cn(DS_PAGE_HEADER.subtitle, 'mt-4 text-base/7 text-pretty')}>
              온보딩부터 채팅, 견학 신청, 입소 서류까지 — 이동의 모든 단계를 한 곳에서
            </p>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.3 }}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/onboarding" className={CTA_PRIMARY}>
                지금 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/explore" className={CTA_SECONDARY}>
                시설 탐색
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
