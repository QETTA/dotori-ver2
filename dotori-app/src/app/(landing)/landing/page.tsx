'use client'

import { FAQ } from '@/components/landing/FAQ'
import { Wallpaper } from '@/components/dotori/Wallpaper'
import { Button } from '@/components/catalyst/button'
import { PageTransition } from '@/components/dotori/PageTransition'
import { BRAND } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import {
	BellAlertIcon,
	SparklesIcon,
	ClipboardDocumentCheckIcon,
	CheckIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

type CountStat = {
	label: string
	subLabel?: string
	target: number
	suffix: string
	decimals: number
	animated: boolean
	staticValue?: string
}

const STATS: CountStat[] = [
	{ label: '전국 시설', target: 20027, suffix: ' 시설', decimals: 0, animated: true },
	{ label: '이동 성공률', target: 89, suffix: '%', decimals: 0, animated: true },
	{ label: '평균 대기', target: 14, suffix: '개월', decimals: 0, animated: true },
	{ label: '무료', target: 0, suffix: '', decimals: 0, animated: false, staticValue: '무료' },
]

const FAQ_ITEMS = [
	{
		question: '이미 어린이집에 다니고 있는데 이동할 수 있나요?',
		answer: '가능하며, 도토리로 빈자리 시설을 먼저 확인한 뒤 현 시설 퇴소 + 신규 입소 신청을 진행하면 됩니다.',
	},
	{
		question: '현재 다니는 어린이집에서 이동할 수 있나요?',
		answer: '네, 가능합니다. 퇴소 절차를 준비하면서 입소 신청서를 먼저 진행하면 이동할 수 있는 여유를 확보할 수 있어요.',
	},
	{
		question: '반편성이 마음에 안 들면 어떻게 해야 하나요?',
		answer: '3월 첫 2주가 이동 골든타임이에요. 바로 토리와 함께 빈자리 시설 탐색을 시작해 지금 떠나야 할지 판단해 보세요.',
	},
	{
		question: '국공립 대기 당첨됐는데 지금 다니는 곳이랑 어떻게 비교해요?',
		answer: '토리 AI로 거리, 비용, 교사비율을 기준해 지금 시설과 국공립 시설을 즉시 비교해드려요.',
	},
	{
		question: '이동 시 서류는 어떻게 되나요?',
		answer: '현 시설 퇴소 통보(1개월 전)와 새 시설 입소 신청서류를 순서대로 안내드려요. 토리가 단계별로 체크리스트를 관리해드려요.',
	},
	{
		question: '어떤 지역을 지원하나요?',
		answer: '수도권(서울·경기·인천) 기준 20,027개 시설로 운영 중이며 전국 확대를 진행 중입니다.',
	},
	{
		question: '개인정보는 안전한가요?',
		answer: '모든 데이터는 암호화되어 저장되며, 개인정보보호법을 준수합니다. 아이 정보는 입소 전략 분석에만 사용되며 제3자에게 제공되지 않아요.',
	},
]

const features = [
	{
		title: '이동 이유 분석',
		description:
			'반편성 불만, 교사 교체, 시설 노후화... 이동을 고민하는 이유가 무엇인지 토리에게 말해보세요. 맞춤 탐색 전략을 세워드려요.',
		Icon: SparklesIcon,
	},
	{
		title: '빈자리 실시간 알림',
		description: '관심 시설에 자리가 나면 즉시 알려드려요. 대기 번호 없이 빠르게 이동할 수 있어요.',
		Icon: BellAlertIcon,
	},
	{
		title: '이동 서류 체크리스트',
		description:
			'이동 확정 후 필요한 서류를 AI가 정리해드려요. 현재 시설 퇴소부터 새 시설 입소까지 단계별 안내.',
		Icon: ClipboardDocumentCheckIcon,
	},
]

const testimonials = [
	{
		name: '서연맘',
		region: '마포구 성산동',
		content: '반편성 발표 후 너무 실망했는데, 도토리로 바로 다른 어린이집 빈자리 찾아서 이동했어요! 전화 한 통도 안 하고 해결됐어요.',
	},
	{
		name: '민준맘',
		region: '서초구 방배동',
		content: '선생님이 세 달 만에 또 바뀌어서 이동 결심했어요. 도토리 탐색으로 교사 교체 이력 적은 국공립 찾았어요.',
	},
	{
		name: '하은맘',
		region: '분당구 정자동',
		content: '국공립 대기 당첨됐는데 지금 다니는 곳이랑 비교가 너무 어려웠어요. 토리한테 물어봤더니 5분 만에 정리해줬어요.',
	},
]

const pricingPlans = [
	{
		name: '일반',
		price: '월 0원',
		features: ['기본 등록', '시설 정보 노출'],
		cta: '무료 등록',
		highlighted: false,
	},
	{
		name: '인증 파트너',
		price: '월 33,000원',
		features: [
			'실시간 빈자리 알림 (무제한)',
			'AI 이동 전략 리포트',
			'교사 교체 이력 조회',
			'국공립 대기 비교',
			'카카오톡 즉시 알림',
		],
		cta: '파트너 시작',
		highlighted: true,
	},
]

function formatStatValue(value: number, decimals: number, suffix: string) {
	const normalizedValue =
		decimals === 0 ? Math.round(value).toLocaleString('ko-KR') : value.toFixed(decimals)

	return `${normalizedValue}${suffix}`
}

export default function LandingPage() {
	const [animatedStats, setAnimatedStats] = useState(() =>
		STATS.map((stat) =>
			stat.animated ? formatStatValue(0, stat.decimals, stat.suffix) : stat.staticValue ?? '',
		),
	)

	useEffect(() => {
		const duration = 1600
		const startTime = performance.now()
		let frameId: number

		const tick = (timestamp: number) => {
			const elapsed = Math.min((timestamp - startTime) / duration, 1)
			const easedProgress = 1 - Math.pow(1 - elapsed, 3)

			setAnimatedStats(
				STATS.map((stat) => {
					if (!stat.animated) {
						return stat.staticValue ?? ''
					}

					return formatStatValue(
						stat.target * easedProgress,
						stat.decimals,
						stat.suffix,
					)
				}),
			)

			if (elapsed < 1) {
				frameId = requestAnimationFrame(tick)
			}
		}

		frameId = requestAnimationFrame(tick)
		return () => {
			if (frameId) {
				cancelAnimationFrame(frameId)
			}
		}
	}, [])

	return (
		<PageTransition>
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
				<section className="relative overflow-hidden px-6 py-28 text-center md:py-40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-600">
					<div className="pointer-events-none absolute inset-0">
						<motion.div
							className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-dotori-300/30 blur-3xl"
							animate={{ scale: [1, 1.06, 1], opacity: [0.2, 0.45, 0.2] }}
							transition={{
								duration: 4,
								repeat: Number.POSITIVE_INFINITY,
								ease: 'easeInOut',
							}}
						/>
						<motion.div
							className="absolute right-0 bottom-10 h-52 w-52 rounded-full bg-dotori-200/28 blur-3xl"
							animate={{ scale: [1, 1.07, 1], opacity: [0.18, 0.42, 0.18] }}
							transition={{
								duration: 4,
								repeat: Number.POSITIVE_INFINITY,
								ease: 'easeInOut',
								delay: 0.8,
							}}
						/>
					</div>
					<div className="relative mx-auto max-w-3xl">
						<div className="mb-6 flex justify-center">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={BRAND.lockupHorizontalKr}
								alt="도토리"
								className="h-9 md:h-10"
							/>
						</div>
						<h1 className="text-4xl font-bold leading-tight md:text-5xl">
							지금 다니는 어린이집,
							<br />
							정말 괜찮으신가요?
						</h1>
						<p className="mx-auto mt-6 max-w-xl text-lg text-dotori-600">
							이미 어린이집에 다니고 있지만 이동을 고민 중이라면, 도토리가 더 나은 곳을 찾아드려요.
						</p>
						<div className="mt-8 flex justify-center gap-4">
							<Button href="/explore" color="dotori" className="px-8 py-3">
								내 아이 맞는 시설 찾기
							</Button>
							<Button href="/chat" color="dotori" className="px-8 py-3">
								토리에게 물어보기
							</Button>
						</div>
					</div>
				</section>

				{/* Stats */}
				<Wallpaper color="warm" className="py-16">
					<div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 text-center text-white md:grid-cols-4">
						{STATS.map((stat, index) => (
							<div key={stat.label}>
								<span className="block text-3xl font-bold md:text-4xl">{animatedStats[index]}</span>
								<span className="mt-1 text-[15px] opacity-80">{stat.label}</span>
								{stat.subLabel && <span className="mt-0.5 block text-[12px] opacity-75">{stat.subLabel}</span>}
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
							이동 중심으로 필요한 기능만 빠르게 모았어요
						</p>
						<div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4">
							{features.map((feat, i) => (
								<div
									key={feat.title}
									className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-dotori-100/60 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 md:p-6"
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
						<h2 className="text-center text-2xl font-bold md:text-3xl">이동 성공 스토리</h2>
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
						<h2 className="text-center text-2xl font-bold md:text-3xl">어린이집 파트너 플랜</h2>
						<div className="mt-6 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-6">
							{pricingPlans.map((plan) => (
								<div
									key={plan.name}
									className={cn(
										'rounded-2xl p-6 transition-all duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-400 hover:-translate-y-0.5',
										plan.highlighted ? 'bg-dotori-900 text-white' : 'bg-dotori-50',
									)}
									style={{ animationDelay: `${plan.name === '인증 파트너' ? 200 : 0}ms` }}
								>
									<h3
										className={cn(
											'text-lg font-semibold',
											plan.highlighted ? 'text-white' : '',
										)}
									>
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
												/>
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
						<h2 className="text-3xl font-bold">지금 이동을 고민 중이라면</h2>
						<p className="mt-3 text-lg opacity-90">전화 돌리지 마세요. 토리가 빈자리 찾아드릴게요.</p>
						<Button
							href="/explore"
							color="dotori"
							className="mt-8 inline-block rounded-full px-8 py-3 font-medium shadow-md transition-all duration-200 active:scale-[0.97]"
						>
							이동할 곳 찾아보기
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
		</PageTransition>
	)
}
