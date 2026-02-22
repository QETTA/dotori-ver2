"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { Surface } from "@/components/dotori/Surface";
import { useUserProfile } from "@/hooks/use-user-profile";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import type { Facility } from "@/types/dotori";
import { stagger } from "@/lib/motion";
import {
	CameraIcon,
	ChevronRightIcon,
	HeartIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { menuSections, publicMenuSections } from "./_lib/my-menu";
import { calculateAge, formatRegion, getBirthYear } from "./_lib/my-utils";

export default function MyPage() {
	const {
		user,
		interestsCount,
		waitlistCount,
		alertCount,
		isLoading,
		error,
		refresh,
	} = useUserProfile();
	const pathname = usePathname();
	const [interestPreview, setInterestPreview] = useState<Facility[]>([]);
	const [isInterestLoading, setIsInterestLoading] = useState(false);
	const menuItemClass =
		"flex min-h-12 items-center justify-between gap-3 px-4 py-4";

	const visibleMenuSections = useMemo(
		() => (user ? menuSections : publicMenuSections),
		[user],
	);

	const isActiveMenuItem = (href: string) =>
		pathname === href || pathname.startsWith(`${href}/`);

	const quickStats = [
		{
			label: "관심",
			ariaLabel: "관심 시설",
			value: interestsCount,
			href: "/my/interests",
		},
		{
			label: "대기",
			ariaLabel: "대기 시설",
			value: waitlistCount,
			href: "/my/waitlist",
		},
		{
			label: "알림",
			ariaLabel: "알림",
			value: alertCount,
			href: "/my/notifications",
		},
	];

	const childDetails = useMemo(
		() =>
			user?.children.map((child) => ({
				child,
				ageLabel: calculateAge(child.birthDate),
				birthYear: getBirthYear(child.birthDate),
			})) ?? [],
		[user?.children],
	);

	const childSummary = useMemo(() => {
		if (!user?.children.length) {
			return "아직 아이 정보를 등록하지 않았어요";
		}

		const shortList = childDetails
			.slice(0, 2)
			.map(
				({ child, ageLabel, birthYear }) =>
					`${child.name} · ${ageLabel} / ${birthYear}`,
			);
		const rest = Math.max(0, childDetails.length - 2);
		return rest > 0 ? `${shortList.join(" · ")} +${rest}명` : shortList.join(" · ");
	}, [childDetails, user?.children.length]);

	const userInterestPreviewIds = useMemo(
		() => (user?.interests ?? []).slice(0, 3),
		[user?.interests],
	);
	const isPremiumUser = user?.plan === "premium";

	useEffect(() => {
		if (!user || userInterestPreviewIds.length === 0) {
			setInterestPreview([]);
			setIsInterestLoading(false);
			return;
		}

		let isActive = true;
		setIsInterestLoading(true);

		(async () => {
			try {
				const ids = userInterestPreviewIds.join(",");
				const res = await apiFetch<{ data: Facility[] }>(
					`/api/facilities?ids=${encodeURIComponent(ids)}`,
				);
				if (!isActive) return;
				setInterestPreview(Array.isArray(res.data) ? res.data.slice(0, 3) : []);
			} catch {
				if (!isActive) return;
				setInterestPreview([]);
			} finally {
				if (!isActive) return;
				setIsInterestLoading(false);
			}
		})();

		return () => {
			isActive = false;
		};
	}, [userInterestPreviewIds, user]);

	async function handleLogout() {
		if (!window.confirm("로그아웃 하시겠어요?")) {
			return;
		}
		await signOut({ callbackUrl: "/login" });
	}

	if (isLoading) {
		return (
			<div className="pb-8 text-dotori-900 dark:text-dotori-50">
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
			<div className="pb-8 text-dotori-900 dark:text-dotori-50">
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

	const planLabel = user?.plan === "premium" ? "프리미엄" : "무료";
	const userLabel = user?.nickname?.trim() ? user.nickname : "도토리 회원";

	if (!user) {
		return (
			<div className="pb-8 text-dotori-900 dark:text-dotori-50">
				<header className="px-5 pt-6 pb-2">
					<div className="rounded-3xl bg-gradient-to-r from-dotori-100 via-dotori-50 to-forest-100 dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-900 px-5 py-5">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.lockupHorizontalKr} alt="도토리" className="mb-3 h-6" />
						<div className="flex items-center gap-4">
							<div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/70 dark:bg-dotori-950/60">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={BRAND.appIconDark}
									alt=""
									className="h-10 w-10"
								/>
							</div>
							<div>
								<h1 className="text-xl font-bold">MY 페이지</h1>
								<p className="mt-0.5 text-sm text-dotori-700 dark:text-dotori-200">
									로그인하면 이동 수요 기준으로 시설 비교와 빈자리 체크를 바로 볼 수 있어요
								</p>
							</div>
						</div>
					</div>
				</header>

				<div className="mt-5 px-5">
					<Button
						href="/login"
						color="amber"
						className="w-full min-h-11 py-4 text-base font-semibold active:scale-[0.97]"
					>
						카카오 로그인
					</Button>
					<p className="mt-2 text-center text-xs text-dotori-500 dark:text-dotori-300">
						로그인 후 관심 시설, 대기 현황, 알림을 한 번에 확인하세요
					</p>
				</div>

				{publicMenuSections.map((section, si) => (
					<section key={si} className="mt-5 px-5">
						<h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-dotori-300 dark:text-dotori-600">
							{section.title}
						</h2>
						<div className="overflow-hidden rounded-3xl bg-white dark:bg-dotori-950 shadow-sm dark:shadow-none">
							<motion.ul
								{...stagger.container}
								className="divide-y divide-dotori-100/40 dark:divide-dotori-800/40"
							>
								{section.items.map((item) => {
									const Icon = item.icon;
									return (
										<motion.li key={item.label} {...stagger.item}>
											<Link
												href={item.href}
												className={cn(
													menuItemClass,
													"transition-colors transition-transform active:scale-[0.99]",
													isActiveMenuItem(item.href) && "bg-dotori-50 dark:bg-dotori-900",
													"active:bg-dotori-50 hover:bg-dotori-50/50 dark:active:bg-dotori-900 dark:hover:bg-dotori-900/60",
												)}
											>
												<div className="flex min-w-0 flex-1 items-center gap-3">
													<Icon className="h-5 w-5 text-dotori-500" />
													<div className="min-w-0 flex-1">
														<p className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
															{item.label}
														</p>
														<p className="mt-0.5 text-xs text-dotori-400">
															{item.description}
														</p>
													</div>
												</div>
												<ChevronRightIcon className="h-5 w-5 text-dotori-300 dark:text-dotori-700" />
											</Link>
										</motion.li>
									);
								})}
							</motion.ul>
						</div>
					</section>
				))}
			</div>
		);
	}

	return (
		<div className="pb-8 text-dotori-900 dark:text-dotori-50">
			{/* 프로필 헤더 */}
			<header className="px-5 pt-6 pb-2">
				<Surface tone="muted" className="px-5 py-5">
					<div className="mb-3 flex items-center justify-between">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.lockupHorizontal} alt="Dotori" className="h-5 opacity-90" />
						<Badge color="dotori" className="text-xs font-semibold">
							MY
						</Badge>
					</div>
					<div className="flex items-start gap-4">
						<div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-dotori-100 via-dotori-50 to-forest-100 dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-900">
							<div className="absolute inset-0 opacity-15" />
							{user.image ? (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img
									src={user.image}
									alt=""
									className="h-full w-full rounded-full object-cover"
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
								<h1 className="text-lg font-bold">{userLabel}</h1>
								<Link
									href="/my/settings"
									aria-label="플랜 설정으로 이동"
									className="inline-flex min-h-11 items-center justify-center rounded-full px-1"
								>
									<Badge
										color={user.plan === "free" ? "dotori" : "forest"}
										className="text-xs"
									>
										{planLabel}
									</Badge>
								</Link>
							</div>
							<p className="mt-0.5 text-sm text-dotori-500 dark:text-dotori-300">{formatRegion(user.region)}</p>
							<p className="mt-1 text-sm text-dotori-500 dark:text-dotori-300">{childSummary}</p>
							<Link
								href="/my/settings"
								className="mt-2 inline-flex min-h-11 items-center justify-center rounded-2xl bg-dotori-50 dark:bg-dotori-900 px-4 text-sm font-semibold text-dotori-700 dark:text-dotori-200 transition-colors hover:bg-dotori-100 dark:hover:bg-dotori-800 active:scale-[0.98]"
							>
								프로필 수정
							</Link>
						</div>
					</div>
				</Surface>
			</header>

			{/* 핵심 지표 */}
			<section className="mt-5 px-5">
				<div className="grid grid-cols-3 gap-2.5">
					{quickStats.map((stat) => (
						<Link
							key={stat.label}
							href={stat.href}
							aria-label={`${stat.ariaLabel} ${stat.value}개`}
							className={cn(
								"rounded-full border border-dotori-200 dark:border-dotori-700 bg-white dark:bg-dotori-950 px-3 py-2.5",
								"flex flex-col items-center justify-center gap-0.5 text-center",
								"transition-colors transition-transform hover:bg-dotori-50/60 dark:hover:bg-dotori-900/60 active:scale-[0.98] active:bg-dotori-50 dark:active:bg-dotori-900",
							)}
						>
							<span className="text-xl font-bold leading-none text-dotori-900 dark:text-dotori-50">
								{stat.value}
							</span>
							<span className="text-xs text-dotori-500 dark:text-dotori-300">
								{stat.label}
							</span>
						</Link>
					))}
				</div>
			</section>

			{!isPremiumUser && (
				<section className="mt-5 px-5">
					<div className="rounded-3xl bg-gradient-to-r from-dotori-100 via-dotori-50 to-forest-100 dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-900 px-4 py-5">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-dotori-500 dark:text-dotori-300">
							프리미엄
						</p>
						<p className="mt-2 text-lg font-bold text-dotori-900 dark:text-dotori-50">
							프리미엄 · 월 1,900원
						</p>
						<div className="mt-2 space-y-1.5 text-sm text-dotori-700 dark:text-dotori-200">
							<p>• 즉시 알림</p>
							<p>• 무제한 AI</p>
							<p>• 우선 매칭</p>
						</div>
						<Button
							href="/my/settings"
							color="dotori"
							className="mt-4 w-full min-h-11"
						>
							지금 시작하기
						</Button>
					</div>
				</section>
			)}

			{/* 관심 시설 미리보기 */}
			<section className="mt-5 px-5">
				<div className="mb-2.5">
					<Link
						href="/my/interests"
						className="flex items-center justify-between"
					>
						<h2 className="text-base font-bold">관심 시설 {interestsCount}곳</h2>
						<span className="inline-flex items-center text-sm text-dotori-500 dark:text-dotori-300">
							자세히 보기
							<ChevronRightIcon className="ml-0.5 h-4 w-4" />
						</span>
					</Link>
				</div>
				{isInterestLoading ? (
					<Skeleton variant="card" count={2} />
				) : interestPreview.length > 0 ? (
					<div className="space-y-2.5">
						{interestPreview.map((facility) => (
							<Link
								key={facility.id}
								href={`/facility/${facility.id}`}
								className="block rounded-3xl bg-white dark:bg-dotori-950 p-4 shadow-sm dark:shadow-none transition-all active:scale-[0.99]"
							>
								<div className="flex items-start gap-3">
									<div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-dotori-50 dark:bg-dotori-900 text-dotori-500">
										<HeartIcon className="h-5 w-5" />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<p className="font-semibold text-dotori-900 dark:text-dotori-50 leading-snug line-clamp-1">
												{facility.name}
											</p>
											<span className="rounded-full bg-dotori-100 dark:bg-dotori-800 px-2 py-0.5 text-xs text-dotori-500">
												{facility.type}
											</span>
										</div>
										<p className="mt-1 text-xs text-dotori-500 dark:text-dotori-300 line-clamp-1">
											{facility.address}
										</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="rounded-3xl bg-dotori-50 dark:bg-dotori-900 px-5 py-5 text-center">
						<div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/70 dark:bg-dotori-950/50">
							<HeartIcon className="h-6 w-6 text-dotori-500" />
						</div>
						<p className="mt-3 text-base font-semibold text-dotori-900 dark:text-dotori-50">
							관심 시설을 저장해두면 비교가 훨씬 쉬워요
						</p>
						<p className="mt-1 text-sm text-dotori-600 dark:text-dotori-300">
							탐색에서 하트를 눌러 관심 목록을 만들어보세요.
						</p>
						<Link
							href="/explore"
							className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-dotori-100 dark:bg-dotori-800 px-4 text-sm font-semibold text-dotori-700 dark:text-dotori-200 active:scale-[0.97]"
						>
							이동할 시설 찾기
						</Link>
					</div>
				)}
			</section>

			{/* 내 아이 */}
			<section className="mt-5 px-5">
				<h2 className="mb-2.5 text-base font-bold">내 아이</h2>
				{user.children.length > 0 ? (
					<div className="space-y-2">
						{childDetails.map(({ child, ageLabel }) => (
							<div
								key={child.id}
								className="flex items-center gap-3.5 rounded-3xl bg-white dark:bg-dotori-950 p-5 shadow-sm dark:shadow-none"
							>
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-dotori-50 dark:bg-dotori-900 text-sm font-bold text-dotori-500">
									{child?.gender === "female"
										? "👧"
										: child?.gender === "male"
											? "👦"
											: "👶"}
								</div>
								<div className="min-w-0 flex-1">
									<span className="text-base font-semibold">{child.name}</span>
									<span className="ml-1.5 text-sm text-dotori-500 dark:text-dotori-300">
										만 {ageLabel}
									</span>
								</div>
								<Link
									href="/my/settings"
									className="py-1 text-sm text-dotori-500 dark:text-dotori-300 transition-colors hover:text-dotori-600 dark:hover:text-dotori-200"
								>
									수정
								</Link>
							</div>
						))}
				</div>
				) : (
					<div className="rounded-2xl bg-dotori-50 dark:bg-dotori-900 p-5 text-center">
						<p className="text-base text-dotori-500 dark:text-dotori-300">
							아이를 등록하면 맞춤 전략을 받을 수 있어요
						</p>
						<Button
							href="/onboarding"
							color="dotori"
							className="mt-3 w-full min-h-11"
						>
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
						"flex items-center gap-3.5 rounded-3xl bg-gradient-to-r from-dotori-50 to-white dark:from-dotori-900 dark:to-dotori-950 p-5 shadow-sm dark:shadow-none transition-all",
						"active:scale-[0.98] hover:shadow-md dark:hover:shadow-none",
					)}
				>
					<div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-dotori-100 dark:bg-dotori-800">
						<CameraIcon className="h-6 w-6 text-dotori-600 dark:text-dotori-300" />
					</div>
					<div className="min-w-0 flex-1">
						<span className="block text-base font-semibold text-dotori-900 dark:text-dotori-50">
							아이사랑 데이터 가져오기
						</span>
						<span className="text-sm text-dotori-500 dark:text-dotori-300">
							스크린샷 AI 분석으로 대기현황 자동 등록
						</span>
					</div>
					<ChevronRightIcon className="h-5 w-5 text-dotori-300 dark:text-dotori-700" />
				</Link>
			</section>

			{/* 메뉴 */}
			{visibleMenuSections.map((section) => (
				<section key={section.title} className="mt-5 px-5">
					<h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-dotori-300 dark:text-dotori-600">
						{section.title}
					</h2>
					<div className="overflow-hidden rounded-3xl bg-white dark:bg-dotori-950 shadow-sm dark:shadow-none">
						<motion.ul
							{...stagger.container}
							className="divide-y divide-dotori-100/40 dark:divide-dotori-800/40"
						>
							{section.items.map((item) => {
								const Icon = item.icon;
								return (
									<motion.li key={item.label} {...stagger.item}>
										<Link
											href={item.href}
											className={cn(
												menuItemClass,
												"transition-colors transition-transform active:scale-[0.99]",
												isActiveMenuItem(item.href) && "bg-dotori-50 dark:bg-dotori-900",
												"active:bg-dotori-50 hover:bg-dotori-50/50 dark:active:bg-dotori-900 dark:hover:bg-dotori-900/60",
											)}
										>
											<div className="flex min-w-0 flex-1 items-center gap-3">
												<Icon className="h-5 w-5 text-dotori-500" />
												<div className="min-w-0 flex-1">
													<p className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
														{item.label}
													</p>
													<p className="mt-0.5 text-xs text-dotori-400">
														{item.description}
													</p>
												</div>
											</div>
											<ChevronRightIcon className="h-5 w-5 text-dotori-300 dark:text-dotori-700" />
										</Link>
									</motion.li>
								);
							})}
						</motion.ul>
					</div>
				</section>
			))}

			{/* 로그아웃 */}
			<div className="mt-6 px-5">
				<Button
					color="dotori"
					onClick={handleLogout}
					className="w-full min-h-11 py-3"
				>
					로그아웃
				</Button>
			</div>
			<p className="mt-2 text-center text-xs text-dotori-300 dark:text-dotori-600">버전 1.0.0</p>
		</div>
	);
}
