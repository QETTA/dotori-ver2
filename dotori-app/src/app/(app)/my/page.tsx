"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useUserProfile } from "@/hooks/use-user-profile";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import {
	BellIcon,
	CameraIcon,
	ChevronRightIcon,
	ClipboardDocumentListIcon,
	CogIcon,
	CreditCardIcon,
	DocumentTextIcon,
	InformationCircleIcon,
	LifebuoyIcon,
	MegaphoneIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function calculateAge(birthDate: string) {
	const birth = new Date(birthDate);
	const now = new Date();
	const months =
		(now.getFullYear() - birth.getFullYear()) * 12 +
		(now.getMonth() - birth.getMonth());
	if (months < 12) return `${months}개월`;
	const years = Math.floor(months / 12);
	const rem = months % 12;
	return rem > 0 ? `${years}세 ${rem}개월` : `${years}세`;
}

function formatRegion(region: { sido: string; sigungu: string; dong?: string }) {
	return [region.sido, region.sigungu, region.dong]
		.filter(Boolean)
		.join(" ")
		|| "지역 미설정";
}

const menuSections = [
	{
		items: [
			{
				label: "알림",
				href: "/my/notifications",
				icon: BellIcon,
			},
			{
				label: "알림 설정",
				href: "/my/settings",
				icon: CogIcon,
			},
			{
				label: "플랜 관리",
				href: "/my/settings",
				icon: CreditCardIcon,
			},
		],
	},
	{
		items: [
			{ label: "공지사항", href: "/my/notices", icon: MegaphoneIcon },
			{ label: "이용약관", href: "/my/terms", icon: DocumentTextIcon },
			{ label: "고객센터", href: "/my/support", icon: LifebuoyIcon },
			{ label: "앱 정보", href: "/my/app-info", icon: InformationCircleIcon },
		],
	},
];

const publicMenuSections = menuSections.slice(1);

export default function MyPage() {
	const { user, interestsCount, waitlistCount, alertCount, isLoading, error, refresh } =
		useUserProfile();
	const pathname = usePathname();
	const menuItemClass = "min-h-12 flex items-center gap-3 px-4 py-4";

	async function handleLogout() {
		await signOut({ callbackUrl: "/login" });
	}

	const isActiveMenuItem = (href: string) =>
		pathname === href || pathname.startsWith(`${href}/`);

	if (isLoading) {
		return (
			<div className="pb-8">
				<header className="px-5 pt-6 pb-2">
					<Skeleton variant="text" count={2} />
				</header>
				<div className="mt-4 px-5">
					<Skeleton variant="card" count={2} />
				</div>
			</div>
		);
	}

	if (error && !user) {
		return (
			<div className="pb-8">
				<header className="px-5 pt-8 pb-2">
					<h1 className="text-xl font-bold">MY</h1>
				</header>
				<div className="px-5 pt-4">
					<ErrorState
						message={error}
						action={{ label: "다시 시도", onClick: refresh }}
					/>
				</div>
			</div>
		);
	}

	// 수도권 DB 기준 육아맘 실제 pain → Dotori 솔루션 카드
	const painCards = [
		{
			emoji: "😮‍💨",
			pain: "어린이집 찾다가 다 마감이에요",
			stat: "수도권 국공립 평균 대기 14개월",
			statColor: "text-danger",
			solution: "빈 자리 알림으로 TO 나오면 바로 알림",
			icon: BellIcon,
			iconBg: "bg-forest-50",
			iconColor: "text-forest-500",
			accent: "border-l-forest-400",
		},
		{
			emoji: "🤯",
			pain: "20,000개 어린이집 어떻게 비교해요?",
			stat: "전국 시설 20,027개 · 17개 시도 실데이터",
			statColor: "text-dotori-500",
			solution: "AI 토리가 나이·주소 기반 맞춤 추천",
			icon: SparklesIcon,
			iconBg: "bg-dotori-50",
			iconColor: "text-dotori-500",
			accent: "border-l-dotori-400",
		},
		{
			emoji: "😰",
			pain: "대기 순번이 언제 올라가는지 몰라요",
			stat: "서울 주요 구 평균 복수 대기 3.2개소",
			statColor: "text-dotori-500",
			solution: "순번 변동 즉시 알림 · 한 화면 관리",
			icon: ClipboardDocumentListIcon,
			iconBg: "bg-dotori-50",
			iconColor: "text-dotori-500",
			accent: "border-l-dotori-300",
		},
	];

	// Not logged in
	if (!user) {
		return (
			<div className="pb-8">
				<header className="px-5 pt-8 pb-2">
					<div className="flex items-center gap-4">
						<div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-dotori-100">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={BRAND.appIconDark}
								alt=""
								aria-hidden="true"
								className="h-10 w-10 blur-[1px]"
							/>
							<div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
						</div>
						<div>
							<h1 className="text-xl font-bold">어린이집 찾고 계신가요?</h1>
							<p className="mt-0.5 text-[15px] text-dotori-500">
								도토리가 수도권 20,027개 시설을 분석해드려요

							</p>
						</div>
					</div>
				</header>

				{/* 육아맘 Pain Point 카드 */}
				<section className="mt-5 px-5">
					<h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-dotori-300">
						많은 분들이 이런 어려움을 겪고 있어요
					</h2>
					<div className="flex flex-col gap-3">
						{painCards.map((card) => {
							const Icon = card.icon;
							return (
								<div
									key={card.pain}
									className={cn(
										"rounded-2xl bg-white shadow-sm border-l-[3px] px-4 py-4",
										card.accent,
									)}
								>
									<div className="flex items-start gap-3">
										<div
											className={cn(
												"mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
												card.iconBg,
											)}
										>
											<Icon className={cn("h-5 w-5", card.iconColor)} />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-[14px] font-semibold text-dotori-900 leading-snug">
												<span className="mr-1">{card.emoji}</span>
												{card.pain}
											</p>
											<p className={cn("mt-1 text-[12px] font-medium tabular-nums", card.statColor)}>
												{card.stat}
											</p>
											<p className="mt-1.5 text-[13px] text-dotori-500 leading-snug">
												→ {card.solution}
											</p>
										</div>
									</div>

								</div>
							);
						})}
					</div>
				</section>

				<div className="mt-5 px-5">
					<Button
						href="/login"
						color="amber"
						className="w-full py-4 text-[16px] font-semibold active:scale-[0.97]"
					>
						카카오로 로그인하고 해결하기
					</Button>
					<p className="mt-2 text-center text-[12px] text-dotori-300">
						무료 · 3초 로그인 · 20,027개 시설 즉시 검색
					</p>
				</div>

				{publicMenuSections.map((section, si) => (
					<section key={si} className="mt-5 px-5">
						<div className="rounded-3xl bg-white shadow-sm">
							{section.items.map((item, i) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.label}
										href={item.href}
										className={cn(
											menuItemClass,
											"transition-colors",
											isActiveMenuItem(item.href) && "bg-dotori-50",
											"active:bg-dotori-50 hover:bg-dotori-50/50",
											i < section.items.length - 1 &&
												"border-b border-dotori-100/40",
										)}
									>
										<Icon className="h-5 w-5 text-dotori-500" />

										<span className="flex-1 text-[15px]">{item.label}</span>
										<ChevronRightIcon className="h-5 w-5 text-dotori-300" />
									</Link>
								);
							})}
						</div>
					</section>
				))}
			</div>
		);
	}

	const quickStats = [
		{
			label: "관심",
			value: interestsCount,
			href: "/my/interests",
		},
		{
			label: "대기",
			value: waitlistCount,
			href: "/my/waitlist",
		},
		{
			label: "알림",
			value: alertCount,
			href: "/my/notifications",
		},
	];

	const planLabel = user.plan === "free" ? "무료" : "프리미엄";
	const userLabel = user.nickname?.trim() ? user.nickname : "도토리 회원";

	return (
		<div className="pb-8">
			{/* 프로필 헤더 */}
			<header className="px-5 pt-8 pb-2">
				<div className="flex items-center gap-4">
					<div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-dotori-100">
						{user.image ? (
							/* eslint-disable-next-line @next/next/no-img-element */
							<img
								src={user.image}
								alt=""
								className="h-full w-full object-cover"
							/>
						) : (
							/* eslint-disable-next-line @next/next/no-img-element */
							<img
								src={BRAND.appIconDark}
								alt=""
								className="h-9 w-9 rounded-full"
							/>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-bold">{userLabel}</h1>
							<Badge
								color={user.plan === "free" ? "dotori" : "forest"}
								className="text-[10px]"
							>
								{planLabel}
							</Badge>
						</div>
						<p className="mt-0.5 text-[14px] text-dotori-500">
							{formatRegion(user.region)}
						</p>
					</div>
				</div>
			</header>

			{/* 핵심 지표 */}
			<section className="mt-5 px-5">
				<div className="grid grid-cols-3 gap-2.5">
					{quickStats.map((stat) => (
						<Link
							key={stat.label}
							href={stat.href}
							className={cn(
								"rounded-full border border-dotori-200 bg-white px-3 py-2.5",
								"flex flex-col items-center justify-center gap-0.5 text-center",
								"active:scale-[0.98] active:bg-dotori-50",
							)}
						>
							<span className="text-[20px] font-bold leading-none text-dotori-900">
								{stat.value}
							</span>
							<span className="text-[12px] text-dotori-500">
								{stat.label} {stat.value}개
							</span>
						</Link>
					))}
				</div>
			</section>

			{/* 내 아이 */}
			<section className="mt-5 px-5">
				<h2 className="mb-2.5 text-[15px] font-bold">내 아이</h2>
				{user.children.length > 0 ? (
					<div className="space-y-2">
						{user.children.map((child) => (
							<div
								key={child.id}
								className="flex items-center gap-3.5 rounded-3xl bg-white p-5 shadow-sm"
							>
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-dotori-50 text-[13px] font-bold text-dotori-500">
									{child?.gender === "female"
										? "👧"
										: child?.gender === "male"
											? "👦"
											: "👶"}
								</div>
								<div className="min-w-0 flex-1">
									<span className="text-[15px] font-semibold">
										{child.name}
									</span>
									<span className="ml-1.5 text-[14px] text-dotori-500">
										{calculateAge(child.birthDate)}
									</span>
								</div>
								<Link
									href="/my/settings"
									className="py-1 text-[14px] text-dotori-500 transition-colors hover:text-dotori-600"
								>
									수정
								</Link>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-2xl bg-dotori-50 p-5 text-center">
						<p className="text-[15px] text-dotori-500">
							아이를 등록하면 맞춤 전략을 받을 수 있어요
						</p>
						<Button href="/onboarding" color="dotori" className="mt-3">
							등록하기
						</Button>
					</div>
				)}
			</section>

			{/* 아이사랑 데이터 가져오기 */}
			<section className="mt-5 px-5">
				<Link
					href="/my/import"
					className={cn(
						"flex items-center gap-3.5 rounded-3xl bg-gradient-to-r from-dotori-50 to-white p-5 shadow-sm transition-all",
						"active:scale-[0.98] hover:shadow-md",
					)}
				>
					<div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-dotori-100">
						<CameraIcon className="h-6 w-6 text-dotori-600" />
					</div>
					<div className="min-w-0 flex-1">
						<span className="block text-[15px] font-semibold text-dotori-900">
							아이사랑 데이터 가져오기
						</span>
						<span className="text-[13px] text-dotori-500">
							스크린샷 AI 분석으로 대기현황 자동 등록
						</span>
					</div>
					<ChevronRightIcon className="h-5 w-5 text-dotori-300" />
				</Link>
			</section>

			{/* 메뉴 */}
			{menuSections.map((section, si) => (
				<section key={si} className="mt-5 px-5">
					<div className="overflow-hidden rounded-3xl bg-white shadow-sm">
						{section.items.map((item, i) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.label}
									href={item.href}
									className={cn(
										menuItemClass,
										"transition-colors",
										isActiveMenuItem(item.href) && "bg-dotori-50",
										"active:bg-dotori-50 hover:bg-dotori-50/50",
										i < section.items.length - 1 &&
											"border-b border-dotori-100/40",
									)}
								>
									<Icon className="h-5 w-5 text-dotori-500" />

									<span className="flex-1 text-[15px]">{item.label}</span>
									<ChevronRightIcon className="h-5 w-5 text-dotori-300" />
								</Link>
							);
						})}
					</div>
				</section>
			))}

			{/* 로그아웃 */}
			<div className="mt-6 px-5">
				<Button
					color="amber"
					onClick={handleLogout}
					className="w-full py-3"
				>
					카카오 로그아웃
				</Button>
			</div>
			<p className="mt-2 text-center text-[12px] text-dotori-300">버전 1.0.0</p>
		</div>
	);
}
