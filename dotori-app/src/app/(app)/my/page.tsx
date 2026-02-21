"use client";

import { Badge } from "@/components/catalyst/badge";
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
	HeartIcon,
	InformationCircleIcon,
	LifebuoyIcon,
	MegaphoneIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import Link from "next/link";

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

const menuSections = [
	{
		items: [
			{
				label: "알림",
				href: "/my/notifications",
				icon: BellIcon,
				badgeKey: "alertCount" as const,
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

	async function handleLogout() {
		await signOut({ callbackUrl: "/login" });
	}

	if (isLoading) {
		return (
			<div className="pb-8">
				<header className="px-4 pt-6 pb-2">
					<Skeleton variant="text" count={2} />
				</header>
				<div className="mt-4 px-4">
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

	// Not logged in
	if (!user) {
		const benefits = [
			{
				icon: BellIcon,
				title: "실시간 TO 알림",
				subtitle: "빈자리 즉시 알림 받기",
				bg: "bg-forest-50",
				iconColor: "text-forest-500",
			},
			{
				icon: SparklesIcon,
				title: "AI 맞춤 추천",
				subtitle: "우리 아이에 맞는 어린이집",
				bg: "bg-dotori-50",
				iconColor: "text-dotori-500",
			},
			{
				icon: ClipboardDocumentListIcon,
				title: "대기순번 관리",
				subtitle: "한눈에 대기 현황 확인",
				bg: "bg-blue-50",
				iconColor: "text-blue-500",
			},
		];

		return (
			<div className="pb-8">
				<header className="px-5 pt-8 pb-2">
					<div className="flex items-center gap-4">
						<div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-dotori-100">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={BRAND.appIconDark} alt="" className="h-10 w-10" />
						</div>
						<div>
							<h1 className="text-xl font-bold">로그인해주세요</h1>
							<p className="mt-0.5 text-[15px] text-dotori-400">
								맞춤 서비스를 이용할 수 있어요
							</p>
						</div>
					</div>
				</header>

				{/* 카카오 로그인 버튼 */}
				<div className="mt-6 px-5">
					<Link
						href="/login"
						className="block w-full rounded-3xl bg-[#FEE500] py-4 text-center text-[16px] font-semibold text-[#191919] transition-all active:scale-[0.97]"
					>
						카카오로 로그인
					</Link>
				</div>

				{/* 회원 혜택 카드 */}
				<section className="mt-6 px-5">
					<h2 className="mb-3 text-[15px] font-bold text-dotori-900">
						회원 혜택
					</h2>
					<div className="grid grid-cols-3 gap-2.5">
						{benefits.map((b) => {
							const Icon = b.icon;
							return (
								<div
									key={b.title}
									className="flex flex-col items-center rounded-2xl bg-white px-2 py-5 shadow-sm"
								>
									<div
										className={cn(
											"grid h-11 w-11 place-items-center rounded-xl",
											b.bg,
										)}
									>
										<Icon className={cn("h-5.5 w-5.5", b.iconColor)} />
									</div>
									<span className="mt-3 text-center text-[13px] font-semibold leading-tight text-dotori-900">
										{b.title}
									</span>
									<span className="mt-1 text-center text-[11px] leading-tight text-dotori-400">
										{b.subtitle}
									</span>
								</div>
							);
						})}
					</div>
				</section>

				{/* 메뉴 (비로그인도 접근 가능한 항목) */}
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
											"flex min-h-12 items-center gap-3 px-4 py-4 transition-colors",
											"active:bg-dotori-50 hover:bg-dotori-50/50",
											i < section.items.length - 1 &&
												"border-b border-dotori-100/40",
										)}
									>
										<Icon className="h-6 w-6 text-dotori-400" />
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

	const badgeValues: Record<string, number> = { alertCount };

	return (
		<div className="pb-8">
			{/* ── 프로필 헤더 ── */}
			<header className="px-5 pt-8 pb-2">
				<div className="flex items-center gap-4">
					<div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-dotori-100 text-2xl font-bold text-dotori-600">
						{user.nickname[0]}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-bold">{user.nickname}</h1>
							<Badge
								color={user.plan === "free" ? "dotori" : "forest"}
								className="text-[10px]"
							>
								{user.plan === "free" ? "무료" : "프리미엄"}
							</Badge>
						</div>
						{user.region.sigungu && (
							<p className="text-[14px] text-dotori-400">
								{user.region.sigungu} {user.region.dong}
							</p>
						)}
					</div>
				</div>
			</header>

			{/* ── 주요 수치 ── */}
			<section className="mt-5 px-5">
				<div className="flex gap-3">
					<Link
						href="/my/interests"
						className={cn(
							"flex flex-1 items-center gap-3.5 rounded-3xl bg-white p-5 shadow-sm transition-all",
							"active:scale-[0.98] hover:shadow-md",
						)}
					>
						<div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50">
							<HeartIcon className="h-6 w-6 text-red-400" />
						</div>
						<div>
							<span className="block text-2xl font-bold text-dotori-900">
								{interestsCount}
							</span>
							<span className="text-[14px] text-dotori-400">관심 시설</span>
						</div>
					</Link>
					<Link
						href="/my/waitlist"
						className={cn(
							"flex flex-1 items-center gap-3.5 rounded-3xl bg-white p-5 shadow-sm transition-all",
							"active:scale-[0.98] hover:shadow-md",
						)}
					>
						<div className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50">
							<BellIcon className="h-6 w-6 text-forest-500" />
						</div>
						<div>
							<span className="block text-2xl font-bold text-dotori-900">
								{waitlistCount}
							</span>
							<span className="text-[14px] text-dotori-400">대기 신청</span>
						</div>
					</Link>
				</div>
			</section>

			{/* ── 내 아이 ── */}
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
									<span className="ml-1.5 text-[14px] text-dotori-400">
										{calculateAge(child.birthDate)}
									</span>
								</div>
								<Link
									href="/my/settings"
									className="py-1 text-[14px] text-dotori-400 transition-colors hover:text-dotori-600"
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
						<Link
							href="/onboarding"
							className="mt-3 inline-block rounded-xl bg-dotori-900 px-6 py-3 text-[15px] font-semibold text-white transition-all active:scale-[0.97]"
						>
							등록하기
						</Link>
					</div>
				)}
			</section>

			{/* ── 아이사랑 데이터 가져오기 ── */}
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
						<span className="text-[13px] text-dotori-400">
							스크린샷 AI 분석으로 대기현황 자동 등록
						</span>
					</div>
					<ChevronRightIcon className="h-5 w-5 text-dotori-300" />
				</Link>
			</section>

			{/* ── 메뉴 ── */}
			{menuSections.map((section, si) => (
				<section key={si} className="mt-5 px-5">
					<div className="rounded-3xl bg-white shadow-sm">
						{section.items.map((item, i) => {
							const Icon = item.icon;
							const badgeCount =
								"badgeKey" in item && item.badgeKey
									? badgeValues[item.badgeKey]
									: 0;
							return (
								<Link
									key={item.label}
									href={item.href}
									className={cn(
										"flex min-h-12 items-center gap-3 px-4 py-4 transition-colors",
										"active:bg-dotori-50 hover:bg-dotori-50/50",
										i < section.items.length - 1 &&
											"border-b border-dotori-100/40",
									)}
								>
									<Icon className="h-6 w-6 text-dotori-400" />
									<span className="flex-1 text-[15px]">{item.label}</span>
									{badgeCount > 0 && (
										<span className="grid h-5 min-w-5 place-items-center rounded-full bg-dotori-500 px-1.5 text-[11px] font-bold text-white">
											{badgeCount}
										</span>
									)}
									<ChevronRightIcon className="h-5 w-5 text-dotori-300" />
								</Link>
							);
						})}
					</div>
				</section>
			))}

			{/* ── 로그아웃 + 버전 ── */}
			<div className="mt-6 px-5 text-center">
				<button
					onClick={handleLogout}
					className="py-2 text-[14px] text-dotori-400 transition-colors hover:text-dotori-500"
				>
					로그아웃
				</button>
				<p className="mt-2 text-[12px] text-dotori-300">버전 1.0.0</p>
			</div>
		</div>
	);
}
