'use client'

/**
 * Landing Page — R42 Major Refactoring
 *
 * Visual rhythm: dark → white → cream → white → dark-panel → forest
 *
 * Deep template patterns:
 * - Radiant:  Dark rounded panel (mx-3 rounded-3xl bg-dotori-950)
 * - Salient:  Pricing featured card emphasis (white-on-dark inversion)
 * - Studio:   FadeIn/FadeInStagger scroll reveal, text-balance headings
 * - Pocket:   ReviewMarquee infinite scroll columns (gradient fade fix)
 * - Commit:   StarFieldBg hero star particles
 * - Keynote:  FeatureClipCard clipPath hover reveal
 */
import Link from 'next/link'
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { BRAND } from '@/lib/brand-assets'
import { copy } from '@/lib/brand-copy'
import { getSeasonalHero } from '@/lib/seasonal-config'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { StatList, StatListItem } from '@/components/dotori/StatList'
import { Wallpaper } from '@/components/dotori/Wallpaper'
import { CircleBackground } from '@/components/dotori/CircleBackground'
import { FunnelSteps } from '@/components/dotori/FunnelSteps'
import { ReviewMarquee } from '@/components/dotori/ReviewMarquee'
import { FeatureClipCard } from '@/components/dotori/FeatureClipCard'
import { SocialProofBadge } from '@/components/dotori/SocialProofBadge'
import { Badge } from '@/components/catalyst/badge'
import { Divider } from '@/components/catalyst/divider'
import { DsButton } from '@/components/ds/DsButton'

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
          HERO — Wallpaper dark + GradientBackground + StarFieldBg
          ═══════════════════════════════════════════ */}
      <Wallpaper color="cream" className="pb-24 pt-16">
        <CircleBackground
          color="var(--color-dotori-400)"
          className="absolute right-[-20%] top-[-10%] h-[36rem] w-[36rem] opacity-15"
        />

        <div className="relative mx-auto max-w-2xl px-6">
          <FadeIn>
            <p className="font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-500">
              {copy.landing.badge} · {copy.landing.badgeSub}
            </p>
          </FadeIn>

          <FadeIn>
            <h1 className="mt-6 whitespace-pre-line font-wordmark text-5xl/[1.15] font-bold tracking-tight text-balance bg-gradient-to-r from-dotori-700 via-dotori-500 to-amber-500 bg-clip-text text-transparent sm:text-6xl/[1.1]">
              {seasonalHero.title}
            </h1>
          </FadeIn>

          <FadeIn>
            <p className="mt-6 max-w-lg text-lg/8 text-pretty text-dotori-700">
              {seasonalHero.subtitle}
            </p>
          </FadeIn>

          <FadeIn>
            <SocialProofBadge count={20000} className="mt-4" />
          </FadeIn>

          <FadeIn>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/onboarding"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-dotori-500 px-5 py-2.5 text-sm/7 font-medium text-white shadow-[0_4px_16px_rgba(176,122,74,0.25)] hover:bg-dotori-600"
              >
                {seasonalHero.cta}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-dotori-100 px-5 py-2.5 text-sm/7 font-medium text-dotori-700 hover:bg-dotori-200"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                토리 톡 시작
              </Link>
            </div>
          </FadeIn>

          <div className="mt-16">
            <StatList>
              <StatListItem value="20,000+개" label="어린이집·유치원 연동" />
              <StatListItem value="17개 시도" label="전국 분석 범위" />
              <StatListItem value="10분" label="풀퍼널 완결" />
            </StatList>
          </div>
        </div>
      </Wallpaper>

      {/* ═══════════════════════════════════════════
          FUNNEL — 풀퍼널 플로우
          bg-white for visual contrast after dark hero
          ═══════════════════════════════════════════ */}
      <section className="bg-white px-6 py-20 dark:bg-dotori-900">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <p className={DS_PAGE_HEADER.eyebrow}>
              풀퍼널 플로우
            </p>
          </FadeIn>
          <FadeIn>
            <h2 className="mt-4 font-wordmark text-3xl/10 font-bold tracking-tight text-balance bg-gradient-to-r from-dotori-600 via-dotori-500 to-amber-500 bg-clip-text text-transparent dark:from-dotori-400 dark:via-amber-400 dark:to-dotori-300">
              {copy.landing.funnelTitle}
            </h2>
          </FadeIn>
          <FadeIn>
            <p className="mt-4 text-base/7 text-pretty text-dotori-700 dark:text-dotori-400">
              {copy.landing.funnelSub} — 2026 유보통합 시대, 어린이집·유치원 통합 플랫폼
            </p>
          </FadeIn>
          <FadeIn>
            <div className="mt-10">
              <FunnelSteps currentStep={0} />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES — FeatureClipCard (Keynote clipPath hover)
          bg-dotori-50 for cream shift
          ═══════════════════════════════════════════ */}
      <section className="bg-dotori-50 px-6 py-20 dark:bg-dotori-950">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <p className={DS_PAGE_HEADER.eyebrow}>
              왜 도토리인가
            </p>
          </FadeIn>
          <FadeIn>
            <h2 className="mt-4 font-wordmark text-3xl/10 font-bold tracking-tight text-balance bg-gradient-to-r from-dotori-700 via-dotori-500 to-amber-500 bg-clip-text text-transparent dark:from-dotori-400 dark:via-amber-400 dark:to-dotori-300">
              이동의 모든 단계를 하나로
            </h2>
          </FadeIn>
          <FadeIn>
            <p className="mt-4 text-base/7 text-pretty text-dotori-700 dark:text-dotori-400">
              어린이집·유치원 2만+ 시설 데이터를 분석하고, TO 예측부터 전자서명까지 한 번에 해결해요.
            </p>
          </FadeIn>

          <FadeInStagger faster className="mt-10 grid gap-4 sm:grid-cols-2">
            <FadeIn>
              <FeatureClipCard
                eyebrow="통합 검색"
                title="어린이집·유치원 한 번에"
                description="2만+ 시설 데이터를 실시간으로 검색하고 비교해요. 유보통합 시대, 어린이집과 유치원을 한 번에."
                icon={MagnifyingGlassIcon}
              />
            </FadeIn>
            <FadeIn>
              <FeatureClipCard
                eyebrow="TO 예측"
                title="빈자리 가능성 분석"
                description="졸업·전출 데이터 기반으로 TO 발생 시점을 예측합니다. 이동 대상 시설을 먼저 읽어요."
                icon={ChartBarIcon}
              />
            </FadeIn>
            <FadeIn>
              <FeatureClipCard
                eyebrow="전자서명"
                title="서류 10분 완결"
                description="입소 서류부터 전자서명까지 모바일에서 한 번에. 2~3시간 걸리던 입소 프로세스를 10분으로."
                icon={DocumentCheckIcon}
                className="sm:col-span-2"
              />
            </FadeIn>
          </FadeInStagger>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          REVIEWS — Pocket ReviewMarquee
          bg-white for visual shift (gradient fade matches)
          ═══════════════════════════════════════════ */}
      <section className="bg-white px-6 py-20 dark:bg-dotori-950">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <p className={DS_PAGE_HEADER.eyebrow}>
              부모님 후기
            </p>
          </FadeIn>
          <FadeIn>
            <h2 className="mt-4 font-wordmark text-3xl/10 font-bold tracking-tight text-balance bg-gradient-to-r from-dotori-700 via-dotori-500 to-amber-500 bg-clip-text text-transparent dark:from-dotori-400 dark:via-amber-400 dark:to-dotori-300">
              {copy.landing.reviewTitle}
            </h2>
          </FadeIn>
          <FadeIn>
            <p className="mt-4 text-base/7 text-pretty text-dotori-700 dark:text-dotori-400">
              {copy.landing.reviewSub}
            </p>
          </FadeIn>
          <FadeIn>
            <div className="mt-8">
              <ReviewMarquee fadeBg="white" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PRICING — Radiant dark rounded panel + Salient featured card
          Standalone dark panel for visual drama
          ═══════════════════════════════════════════ */}
      <section className="px-3 py-20 sm:px-4">
        <div
          className="mx-auto max-w-2xl rounded-3xl bg-dotori-950 px-6 py-16 sm:px-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 70% 20%, rgba(200,149,106,0.07) 0%, transparent 60%)',
          }}
        >
          <FadeIn>
            <p className="font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-400">
              요금제
            </p>
          </FadeIn>
          <FadeIn>
            <h2 className="mt-4 font-wordmark text-3xl/10 font-bold tracking-tight text-balance text-white">
              학부모는 무료, 시설은 프리미엄
            </h2>
          </FadeIn>
          <FadeIn>
            <p className="mt-4 text-base/7 text-pretty text-dotori-400">
              학부모 개인 사용은 영구 무료. 시설 관리 기능이 필요하면 프리미엄을 선택하세요.
            </p>
          </FadeIn>

          <FadeInStagger faster className="mt-10 grid gap-6 sm:grid-cols-2">
            {PRICING_TIERS.map((tier) => (
              <FadeIn key={tier.name}>
                <div
                  className={`relative rounded-2xl p-6 ring-1 ${
                    tier.featured
                      ? 'bg-white text-dotori-950 shadow-xl shadow-dotori-950/20 ring-white/20'
                      : 'bg-dotori-900/50 text-white ring-dotori-800/60'
                  }`}
                >
                  {tier.featured && (
                    <Badge color="dotori" className="absolute right-6 top-6">
                      추천
                    </Badge>
                  )}
                  <p className={`text-sm/6 font-semibold ${tier.featured ? 'text-dotori-500' : 'text-dotori-400'}`}>
                    {tier.name}
                  </p>
                  <p className="mt-3 flex items-baseline gap-1">
                    <span className={`font-wordmark text-4xl/10 font-bold tracking-tight ${tier.featured ? 'text-dotori-950' : 'text-white'}`}>
                      {tier.price}
                    </span>
                    <span className={`text-sm/6 ${tier.featured ? 'text-dotori-500' : 'text-dotori-400'}`}>
                      {tier.period}
                    </span>
                  </p>
                  <p className={`mt-2 text-sm/6 ${tier.featured ? 'text-dotori-600' : 'text-dotori-400'}`}>
                    {tier.description}
                  </p>

                  <Divider soft className="my-6" />

                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${tier.featured ? 'text-forest-500' : 'text-dotori-400'}`} />
                        <span className={`text-sm/6 ${tier.featured ? 'text-dotori-700' : 'text-dotori-300'}`}>
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
              </FadeIn>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Wallpaper forest + centered layout
          ═══════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-b from-dotori-50 to-white py-20">
        <BrandWatermark className="opacity-30" />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <FadeIn>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.lockupHorizontalKr} alt="도토리" className="mx-auto h-8 w-auto" />
          </FadeIn>
          <FadeIn>
            <h2 className="mt-6 font-wordmark text-3xl/10 font-bold tracking-tight bg-gradient-to-r from-dotori-700 via-dotori-500 to-amber-500 bg-clip-text text-transparent">
              아이의 공간, 지금 다시 선택하세요
            </h2>
          </FadeIn>
          <FadeIn>
            <p className="mt-4 text-base/7 text-pretty text-dotori-600">
              온보딩부터 채팅, 견학 신청, 입소 서류까지 — 이동의 모든 단계를 한 곳에서
            </p>
          </FadeIn>
          <FadeIn>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/onboarding"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-dotori-500 px-5 py-2.5 text-sm/7 font-medium text-white shadow-[0_4px_16px_rgba(176,122,74,0.25)] hover:bg-dotori-600"
              >
                지금 시작하기
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-dotori-100 px-5 py-2.5 text-sm/7 font-medium text-dotori-700 hover:bg-dotori-200"
              >
                시설 탐색
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
