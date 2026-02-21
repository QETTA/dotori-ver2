'use client'

import { FAQ } from '@/components/landing/FAQ'
import { Wallpaper } from '@/components/dotori/Wallpaper'
import { Button } from '@/components/catalyst/button'
import { BRAND } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'
const FAQ_ITEMS = [
  {
    question: '도토리는 무료인가요?',
    answer: '기본 기능은 모두 무료입니다. 실시간 빈자리 알림, AI 맞춤 전략 리포트 등 프리미엄 기능은 월 9,900원에 이용하실 수 있어요.',
  },
  {
    question: '어떤 데이터를 사용하나요?',
    answer: '아이사랑포털, 정부24, 각 지자체 공공데이터 등 공식 출처의 데이터를 실시간으로 수집·분석합니다. 20,000개 이상의 전국 어린이집 정보를 제공해요.',
  },
  {
    question: 'AI 분석은 얼마나 정확한가요?',
    answer: '과거 3년간의 입소 데이터와 현재 대기 현황을 기반으로 분석합니다. 예측 정확도는 평균 85% 이상이며, 지속적으로 개선되고 있어요.',
  },
  {
    question: '대기 신청을 직접 해주나요?',
    answer: '현재는 아이사랑포털로 연결하여 직접 신청하실 수 있도록 안내합니다. 자동 대기 신청 기능은 곧 출시 예정이에요.',
  },
  {
    question: '어떤 지역을 지원하나요?',
    answer: '현재 서울, 경기, 인천 등 수도권을 중심으로 서비스하고 있으며, 전국으로 확대 중입니다.',
  },
  {
    question: '개인정보는 안전한가요?',
    answer: '모든 데이터는 암호화되어 저장되며, 개인정보보호법을 준수합니다. 아이 정보는 입소 전략 분석에만 사용되며 제3자에게 제공되지 않아요.',
  },
  {
    question: '카카오톡으로 알림을 받을 수 있나요?',
    answer: '네! 카카오 로그인 후 알림 설정에서 카카오톡 알림을 활성화하면 빈자리 발생 시 즉시 카카오톡으로 알려드려요.',
  },
]
import {
  BellAlertIcon,
  SparklesIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const stats = [
  { value: '20,027', label: '전국 시설' },
  { value: '93.8%', label: '시간 절감' },
  { value: '24h', label: 'AI 모니터링' },
  { value: '무료', label: '기본 요금' },
]

const features = [
  {
    title: '실시간 빈자리 알림',
    description: '관심 시설에 TO가 생기면 즉시 알려드려요. 아이사랑포털 데이터를 실시간으로 모니터링합니다.',
    Icon: BellAlertIcon,
  },
  {
    title: 'AI 맞춤 입소 전략',
    description: '아이 나이, 지역, 시설 유형을 분석해 최적의 입소 전략을 제안합니다.',
    Icon: SparklesIcon,
  },
  {
    title: '동네 이웃 커뮤니티',
    description: 'GPS 인증된 동네 학부모들과 실시간 정보를 공유하세요.',
    Icon: UserGroupIcon,
  },
  {
    title: '서류 체크리스트',
    description: '시설 유형별 필요 서류를 자동으로 정리해드려요.',
    Icon: ClipboardDocumentCheckIcon,
  },
]

const testimonials = [
  {
    name: '서연맘',
    region: '강남구 역삼동',
    content: '토리 덕분에 국공립 어린이집에 입소 성공했어요! 대기 순번 변동을 실시간으로 알려줘서 타이밍을 놓치지 않았어요.',
  },
  {
    name: '준서맘',
    region: '서초구 반포동',
    content: 'AI가 추천해준 시설이 정말 우리 아이에게 딱 맞았어요. 통학 거리, 프로그램, 평가 등급까지 꼼꼼하게 분석해주더라고요.',
  },
  {
    name: '하은맘',
    region: '송파구 잠실동',
    content: '이웃 커뮤니티에서 실시간 정보를 얻을 수 있어서 좋아요. 어린이집 고민이 줄었어요.',
  },
]

const pricingPlans = [
  {
    name: '무료',
    price: '0원',
    features: ['시설 검색 & 정보 조회', '기본 AI 분석', '커뮤니티 참여', '시설 비교 (2곳)'],
    cta: '무료로 시작',
    highlighted: false,
  },
  {
    name: '프리미엄',
    price: '9,900원/월',
    features: [
      '실시간 빈자리 알림',
      'AI 맞춤 전략 리포트',
      '무제한 시설 비교',
      '우선 대기 신청 지원',
      '카카오톡 알림',
    ],
    cta: '프리미엄 시작',
    highlighted: true,
  },
]

export default function LandingPage() {
  return (
    <div className="bg-dotori-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-dotori-100/30 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:gap-6 md:px-6 md:py-4">
          <Link href="/landing" className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.lockupHorizontalKr} alt="도토리" className="h-7 md:h-8" />
          </Link>
          <nav className="hidden items-center gap-6 text-[15px] md:flex">
            <a href="#features" className="text-dotori-600 transition-all duration-200 hover:text-dotori-700">
              기능
            </a>
            <a href="#testimonials" className="text-dotori-600 transition-all duration-200 hover:text-dotori-700">
              후기
            </a>
            <a href="#pricing" className="text-dotori-600 transition-all duration-200 hover:text-dotori-700">
              가격
            </a>
            <a href="#faq" className="text-dotori-600 transition-all duration-200 hover:text-dotori-700">
              FAQ
            </a>
          </nav>
          <Button
            href="/onboarding"
            color="dotori"
            className="shrink-0 rounded-full px-4 py-2 text-sm font-medium md:px-5 md:text-[15px]"
          >
            시작하기
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-28 text-center md:py-40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-600">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND.lockupHorizontalKr}
              alt="도토리"
              className="h-9 md:h-10"
            />
          </div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            우리 아이 어린이집,
            <br />
            <span className="text-dotori-500">AI가 찾아드려요</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-dotori-600">
            20,000+ 시설 데이터 기반 실시간 입소 전략.
            빈자리 알림부터 대기 신청까지, 토리가 도와드려요.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              href="/onboarding"
              color="dotori"
              className="px-8 py-3 text-white"
            >
              무료로 시작하기
            </Button>
            <Button
              href="/explore"
              color="dotori"
              className="px-8 py-3"
            >
              둘러보기
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <Wallpaper color="warm" className="py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 text-center text-white md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <span className="block text-3xl font-bold md:text-4xl">{stat.value}</span>
              <span className="mt-1 text-[15px] opacity-80">{stat.label}</span>
            </div>
          ))}
        </div>
      </Wallpaper>

      {/* Features */}
      <section id="features" className="relative px-6 py-12 md:py-20">
        {/* Subtle watermark background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.watermark}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 h-64 w-64 -translate-y-1/2 translate-x-1/4 opacity-[0.04] md:h-80 md:w-80"
        />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-center gap-2.5 md:mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.appIconWarm} alt="" className="h-9 w-9 rounded-lg shadow-sm" />
            <h2 className="text-center text-3xl font-bold">주요 기능</h2>
          </div>
          <p className="mx-auto mt-0 max-w-lg text-center text-dotori-600">
            어린이집 입소의 모든 과정을 AI가 도와드립니다
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-dotori-100/60 transition-all duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 hover:-translate-y-0.5 md:p-6"
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-dotori-100">
                    <feat.Icon className="h-5 w-5 text-dotori-500" />
                  </span>
                  <h3 className="text-[16px] font-semibold">{feat.title}</h3>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-dotori-600">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-white px-6 py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">학부모 후기</h2>
          <div className="mt-6 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="rounded-2xl border-none bg-dotori-50 p-6 transition-all duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 160}ms`, animationFillMode: 'both' }}
              >
                <p className="text-[15px] leading-relaxed text-dotori-700">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="mt-4">
                  <span className="font-medium">{t.name}</span>
                  <span className="ml-2 text-[11px] text-dotori-500">{t.region}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white px-6 py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">가격</h2>
          <div className="mt-6 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'rounded-2xl p-6 transition-all duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-400 hover:-translate-y-0.5',
                  plan.highlighted
                    ? 'bg-dotori-900 text-white'
                    : 'bg-dotori-50',
                )}
              >
                <h3 className={cn('text-lg font-semibold', plan.highlighted ? 'text-white' : '')}>
                  {plan.name}
                </h3>
                <p
                  className={cn(
                    'mt-2 text-3xl font-bold',
                    plan.highlighted ? 'text-white' : '',
                  )}
                >
                  {plan.price}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={cn(
                        'flex items-center gap-2 text-[15px]',
                        plan.highlighted ? 'text-white/90' : '',
                      )}
                    >
                      <CheckIcon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          plan.highlighted ? 'text-white' : 'text-forest-500',
                        )}
                      />{' '}
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  href="/onboarding"
                  color="dotori"
                  className={cn(
                    'mt-6 block w-full rounded-full py-3 text-center font-medium transition-all duration-200 active:scale-[0.97]',
                  )}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white px-6 py-12 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">자주 묻는 질문</h2>
          <div className="mt-8 md:mt-16">
            <FAQ items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <Wallpaper color="green" className="py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND.symbolMonoWhite}
            alt=""
            aria-hidden="true"
            className="mx-auto mb-5 h-12 w-12 opacity-80"
          />
          <h2 className="text-3xl font-bold">지금 시작하세요</h2>
          <p className="mt-3 text-lg opacity-90">
            우리 아이에게 맞는 어린이집, 토리가 찾아드릴게요
          </p>
          <Button
            href="/onboarding"
            color="dotori"
            className="mt-8 inline-block rounded-full px-8 py-3 font-medium shadow-md transition-all duration-200 active:scale-[0.97]"
          >
            무료로 시작하기
          </Button>
        </div>
      </Wallpaper>

      {/* Footer */}
      <footer className="border-t border-dotori-100/30 bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BRAND.lockupHorizontal} alt="dotori" className="h-7" />
            </div>
            <nav className="flex gap-6 text-[15px] text-dotori-300">
              <a href="#features">기능</a>
              <a href="#pricing">가격</a>
              <a href="#faq">FAQ</a>
              <a href="/my/terms">이용약관</a>
              <a href="/my/terms">개인정보처리방침</a>
            </nav>
          </div>
          <p className="mt-8 text-center text-[11px] text-dotori-400">
            © 2026 도토리. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
