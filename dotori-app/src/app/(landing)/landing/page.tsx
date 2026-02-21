'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'motion/react'
import {
	UserGroupIcon,
	AcademicCapIcon,
	BuildingOffice2Icon,
} from '@heroicons/react/24/outline'

import { Badge } from '@/components/catalyst/badge'
import { Button } from '@/components/catalyst/button'
import { Field, Fieldset, Label, Description } from '@/components/catalyst/fieldset'
import { Input } from '@/components/catalyst/input'
import { Select } from '@/components/catalyst/select'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { AiBriefingCard } from '@/components/dotori/AiBriefingCard'
import { EmptyState } from '@/components/dotori/EmptyState'
import { ErrorState } from '@/components/dotori/ErrorState'
import { FacilityCard } from '@/components/dotori/FacilityCard'
import { Skeleton } from '@/components/dotori/Skeleton'
import { Wallpaper } from '@/components/dotori/Wallpaper'
import { PageTransition } from '@/components/dotori/PageTransition'
import { BRAND } from '@/lib/brand-assets'
import type { Facility } from '@/types/dotori'

const SCENARIOS = [
	{ value: '반편성 불만', label: '반편성 불만' },
	{ value: '교사 교체 대응', label: '교사 교체 대응' },
	{ value: '국공립 당첨 비교', label: '국공립 당첨 비교' },
]

const HERO_STATS = [
	{ value: '20,027+', label: '시설' },
	{ value: '17개', label: '시도' },
]

const FEATURE_CARDS = [
	{
		title: '빈자리 실시간 확인',
		description: '관심 지역의 입소 가능 변동을 빠르게 확인하고 우선순위를 잡아요',
		Icon: UserGroupIcon,
	},
	{
		title: 'AI 이동 상담',
		description: '이동 사유를 입력하면 체크리스트와 추천 순서를 AI가 정리해드려요',
		Icon: AcademicCapIcon,
	},
	{
		title: '맞춤 알림',
		description: '원하는 조건에 맞는 변화가 생기면 즉시 알려줘서 기회를 놓치지 않아요',
		Icon: BuildingOffice2Icon,
	},
]

const TESTIMONIALS = [
	{
		name: '강남맘',
		content: '반편성 불만으로 이동 고민하다 도토리로 3일 만에 새 시설을 찾았어요',
		location: '강남구',
	},
	{
		name: '성동맘',
		content: '국공립 당첨 후에도 현재 시설과 조건 비교를 AI가 깔끔하게 정리해줬어요',
		location: '성동구',
	},
	{
		name: '서초맘',
		content: '교사 교체 후에도 안정적으로 공고한 곳을 찾아 이동할 수 있었어요',
		location: '서초구',
	},
]

const FAQ_ITEMS = [
	{
		question: '이동하려면 어떻게 하나요?',
		answer:
			'우선 시나리오를 선택하고 지역·연령을 입력하세요. 바로 후보 시설 리스트와 이동 체크리스트를 순차적으로 보여드립니다.',
	},
	{
		question: '반편성 후 이동 가능한가요?',
		answer:
			'네. 반편성 종료 시점 기준을 반영해 이동 적기, 공백 기간 관리, 대기 절차를 함께 안내해드려요.',
	},
	{
		question: '국공립 당첨 후에도 상담이 필요한가요?',
		answer:
				'네. 당첨 시점의 좌석 정책·전환일정을 함께 검토해 민간 대체 시설과 비교 체크를 마무리해야 해요.',
	},
	{
		question: '월 1,900원은 어떤 혜택인가요?',
		answer:
			'빈자리 실시간 알림, 토리브리핑 강화, 이동 우선 추천이 포함돼요. 기본 기능은 계속 무료로 쓸 수 있어요.',
	},
]

const FEATURE_BRIEFING = {
	message: '반편성/교사 교체/국공립 당첨 시나리오를 하나의 워크플로로 정리해 이동 판단 시간을 줄였어요.',
	insightItems: [
		{
			label: '희망 반영률 높은 시설 후보를 우선 노출',
			sentiment: 'positive' as const,
			source: 'AI분석',
		},
		{
			label: '교체 이력·대기 순번으로 계약 위험 최소화',
			sentiment: 'positive' as const,
			source: 'AI분석',
		},
		{
			label: '국공립 당첨 우선순위는 추정 오차가 있을 수 있어요',
			sentiment: 'caution' as const,
			source: 'AI분석',
		},
	],
}

const DEMO_FACILITY: Facility = {
	id: 'landing-demo-facility',
	name: '해오름 어린이집',
	type: '국공립',
	status: 'available',
	address: '서울 강남구 도곡동 123-4',
	lat: 37.494,
	lng: 127.034,
	distance: '1.8km',
	phone: '02-000-0000',
	capacity: {
		total: 120,
		current: 84,
		waiting: 6,
	},
	features: ['어린이 인원 맞춤 수업', '교사 연속 근무'],
	rating: 4.8,
	reviewCount: 64,
	lastSyncedAt: new Date().toISOString(),
}

export default function LandingPage() {
	const [scenario, setScenario] = useState(SCENARIOS[0].value)
	const [district, setDistrict] = useState('서울 강남구')
	const [ageRange, setAgeRange] = useState('3세')
	const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

	const shouldShowFacility = scenario !== '교사 교체 대응'
	const shouldShowError = scenario === '교사 교체 대응'

	return (
		<PageTransition>
			<div className="bg-dotori-50">
				<header className="sticky top-0 z-50 border-b border-dotori-100/30 bg-white/80 backdrop-blur">
					<div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
						<Link href="/landing" className="flex shrink-0 items-center gap-2">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={BRAND.lockupHorizontalKr} alt="도토리" className="h-7" />
						</Link>
						<nav className="hidden items-center gap-6 text-sm text-dotori-600 sm:flex">
							<a href="#features" className="transition-colors hover:text-dotori-700">
								기능
							</a>
							<a href="#testimonials" className="transition-colors hover:text-dotori-700">
								후기
							</a>
							<a href="#faq" className="transition-colors hover:text-dotori-700">
								FAQ
							</a>
						</nav>
						<Button href="/onboarding" color="dotori" className="shrink-0">
							무료로 시작하기
						</Button>
					</div>
				</header>

				<section className="relative overflow-hidden px-6 py-16 text-center sm:py-20">
					<div className="pointer-events-none absolute inset-0">
						<motion.div
							className="absolute left-0 top-10 h-52 w-52 rounded-full bg-dotori-300/20 blur-3xl"
							animate={{ y: [0, -10, 0], opacity: [0.2, 0.35, 0.2] }}
							transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
						/>
					</div>
					<div className="relative mx-auto max-w-3xl">
						<Heading level={1} className="text-3xl font-semibold leading-tight sm:text-4xl">
							아이에게 맞는 어린이집, 더 빨리 찾으세요
						</Heading>
						<Text className="mx-auto mt-4 max-w-2xl text-base text-dotori-700">
							빈자리 확인부터 AI 이동 상담까지, 도토리에서 한 번에 진행해요.
						</Text>
						<div className="mt-6 flex flex-wrap justify-center gap-2">
							<Badge color="forest">무료로 시작</Badge>
							<Text className="text-base font-semibold text-forest-700">월 1,900원</Text>
						</div>
						<div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3">
							{HERO_STATS.map((stat) => (
								<div
									key={stat.label}
									className="rounded-2xl bg-white/85 p-4 ring-1 ring-dotori-100/80"
								>
									<Text className="text-2xl font-semibold text-dotori-900">{stat.value}</Text>
									<Text className="mt-1 text-sm text-dotori-600">{stat.label}</Text>
								</div>
							))}
						</div>
						<div className="mt-8 flex flex-wrap justify-center gap-3">
							<Button href="/onboarding" color="dotori">
								무료로 시작하기
							</Button>
							<Button href="/chat" plain={true}>
								토리에게 먼저 질문하기
							</Button>
						</div>
					</div>
				</section>

				<section className="px-6 pb-2">
					<div className="mx-auto max-w-4xl rounded-2xl bg-white p-4 shadow-sm ring-1 ring-dotori-100/80">
						<Text className="font-semibold text-dotori-900">이동 우선순위 입력</Text>
						<Fieldset className="mt-4">
							<div className="grid gap-3 md:grid-cols-3">
								<Field>
									<Label>이동 시나리오</Label>
									<Select value={scenario} onChange={(event) => setScenario(event.target.value)}>
										{SCENARIOS.map((item) => (
											<option key={item.value} value={item.value}>
												{item.label}
											</option>
										))}
									</Select>
									<Description>현재 고민 중인 이동 사유를 먼저 고르면 브리핑이 더 정확해져요.</Description>
								</Field>
								<Field>
									<Label>거주 지역</Label>
									<Input
										value={district}
										placeholder="예: 서울 강남구"
										onChange={(event) => setDistrict(event.target.value)}
									/>
								</Field>
								<Field>
									<Label>자녀 연령</Label>
									<Input
										value={ageRange}
										placeholder="예: 3세"
										onChange={(event) => setAgeRange(event.target.value)}
									/>
								</Field>
							</div>
						</Fieldset>
						<Text className="mt-4 text-sm text-dotori-600">
							선택 내용: {scenario} · {district} · {ageRange}
						</Text>
					</div>
				</section>

				<section id="features" className="px-6 py-12">
					<div className="mx-auto max-w-4xl">
						<div className="mb-6 text-center">
							<Heading level={2} className="text-2xl">
								이동 시나리오별 핵심 기능
							</Heading>
							<Text className="mt-2 text-base text-dotori-600">3단계로 이동 준비 시간을 줄입니다.</Text>
						</div>
						<div className="grid gap-3 md:grid-cols-3">
							{FEATURE_CARDS.map((feature) => (
								<article key={feature.title} className="rounded-2xl bg-dotori-50 p-4">
									<div className="flex items-start gap-3">
										<span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dotori-100">
											<feature.Icon className="h-5 w-5 text-forest-500" aria-hidden="true" />
										</span>
										<div className="min-w-0 flex-1">
											<Text className="text-base font-semibold text-dotori-900">{feature.title}</Text>
											<Text className="mt-1 text-sm text-dotori-600">{feature.description}</Text>
										</div>
									</div>
								</article>
							))}
						</div>
					</div>
				</section>

				<section className="bg-dotori-50 px-6 py-12">
					<div className="mx-auto max-w-4xl">
						<div className="mb-6 text-center">
							<Heading level={2} className="text-2xl">
								실전 이동 브리핑
							</Heading>
							<Text className="mt-2 text-base text-dotori-600">
								시나리오 입력 즉시 확인 가능한 이동 요약입니다.
							</Text>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<AiBriefingCard
								message={FEATURE_BRIEFING.message}
								source="AI분석"
								updatedAt="지금"
								insightItems={FEATURE_BRIEFING.insightItems}
							/>
							<div className="space-y-3">
								<div className="rounded-2xl bg-white p-4 ring-1 ring-dotori-100/70">
									<Text className="text-sm text-dotori-700">
										최신 추천 반영 상태를 실시간 점검하고 있어요.
									</Text>
									<Skeleton variant="text" count={2} />
								</div>
								{shouldShowFacility ? (
									<FacilityCard facility={DEMO_FACILITY} compact />
								) : (
									<EmptyState
										title="조건에 맞는 후보가 아직 없어요"
										description="지역/연령/사유를 바꿔보면 다른 시설이 제안돼요."
										variant="transfer"
									/>
								)}
								{shouldShowError ? (
									<ErrorState
										message="교사 교체 전환은 상담형 플로우가 정확해요"
										variant="default"
										detail="상담 채팅에서 전환 문서를 함께 정리해드릴게요."
									/>
								) : null}
							</div>
						</div>
					</div>
				</section>

				<section id="testimonials" className="px-6 py-12">
					<div className="mx-auto max-w-4xl">
						<div className="text-center">
							<Heading level={2} className="text-2xl">
								이동 성공 후기
							</Heading>
							<Text className="mt-2 text-base text-dotori-600">
								강남·성동·서초 부모님들의 실제 이동 사례
							</Text>
						</div>
						<div className="mt-6 grid gap-4 md:grid-cols-3">
							{TESTIMONIALS.map((item) => (
								<article
									key={item.name}
									className="rounded-2xl border border-dotori-100 bg-white p-4"
								>
									<Text className="font-semibold text-dotori-900">{item.name}</Text>
									<Text className="text-sm text-dotori-500">{item.location}</Text>
									<Text className="mt-3 text-sm leading-relaxed text-dotori-700">&ldquo;{item.content}&rdquo;</Text>
								</article>
							))}
						</div>
					</div>
				</section>

				<section id="faq" className="bg-white px-6 py-12">
					<div className="mx-auto max-w-2xl">
						<div className="mb-6 text-center">
							<Badge color="dotori">이동 FAQ</Badge>
							<Heading level={2} className="mt-2 text-2xl">
								자주 묻는 질문
							</Heading>
						</div>
						<div className="space-y-3">
							{FAQ_ITEMS.map((item, index) => {
								const isOpen = openFaqIndex === index
								return (
									<div
										key={item.question}
										className="overflow-hidden rounded-2xl border border-dotori-100 bg-white"
									>
										<button
											type="button"
											onClick={() => setOpenFaqIndex(isOpen ? null : index)}
											aria-expanded={isOpen}
											aria-controls={`faq-answer-${index}`}
											className="flex w-full items-center justify-between px-4 py-3 text-left"
										>
											<Text className="text-sm font-semibold text-dotori-900">{item.question}</Text>
											<Text className={`text-lg text-dotori-500 ${isOpen ? 'rotate-45' : ''}`}>＋</Text>
										</button>
										{isOpen && (
											<div
												id={`faq-answer-${index}`}
												className="border-t border-dotori-100 px-4 py-3"
											>
												<Text className="text-sm text-dotori-600">{item.answer}</Text>
											</div>
										)}
									</div>
								)
							})}
						</div>
					</div>
				</section>

				<Wallpaper color="warm" className="py-14">
					<div className="mx-auto max-w-2xl px-6 text-center text-white">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.symbolMonoWhite}
							alt=""
							className="mx-auto mb-4 h-12 w-12 opacity-80"
						/>
						<Heading level={2} className="text-3xl">
							지금 바로 이동을 시작해 보세요
						</Heading>
						<Text className="mt-3 text-base text-white/90">
							AI 브리핑으로 이동 전략을 정리하고, 빈자리 탐색까지 한 번에 진행하세요.
						</Text>
						<Button href="/onboarding" color="dotori" className="mt-6">
							이동 시작하기
						</Button>
					</div>
				</Wallpaper>

				<footer className="border-t border-dotori-100/30 bg-white px-6 py-10">
					<div className="mx-auto max-w-4xl">
						<div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
							<div className="flex items-center gap-2">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={BRAND.lockupHorizontal} alt="도토리" className="h-7" />
							</div>
							<nav className="flex gap-6 text-sm text-dotori-500">
								<a href="#features" className="hover:text-dotori-700">
									기능
								</a>
								<a href="#testimonials" className="hover:text-dotori-700">
									후기
								</a>
								<a href="#faq" className="hover:text-dotori-700">
									FAQ
								</a>
								<a href="/my/terms" className="hover:text-dotori-700">
									이용약관
								</a>
								<a href="/my/terms" className="hover:text-dotori-700">
									개인정보처리방침
								</a>
							</nav>
						</div>
						<Text className="mt-6 text-center text-sm text-dotori-400">
							© 2026 도토리. All rights reserved.
						</Text>
					</div>
				</footer>
			</div>
		</PageTransition>
	)
}
