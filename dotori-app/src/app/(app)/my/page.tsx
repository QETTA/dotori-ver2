"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { Surface } from "@/components/dotori/Surface";
import { useUserProfile } from "@/hooks/use-user-profile";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { DS_GLASS, DS_LAYOUT, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
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
import { menuSections, publicMenuSections, type MenuItem } from "./_lib/my-menu";
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
		"flex min-h-12 items-center justify-between gap-3 px-4 py-3.5";
	const sectionTitleClass = cn(
		DS_TYPOGRAPHY.label,
		"mb-2.5 font-semibold uppercase tracking-[0.2em] text-dotori-400 dark:text-dotori-500",
	);
	const menuPanelClass = cn(
		DS_LAYOUT.CARD_SOFT,
		DS_GLASS.CARD,
		"overflow-hidden rounded-3xl bg-gradient-to-b from-white/85 via-dotori-50/40 to-white/70 ring-1 ring-dotori-100/70 dark:from-dotori-950/90 dark:via-dotori-900/80 dark:to-dotori-900/88 dark:ring-dotori-800/80",
	);
	const cardSurfaceClass = cn(
		DS_LAYOUT.CARD_SOFT,
		"rounded-3xl ring-1 ring-dotori-100/70 shadow-[0_16px_28px_-24px_rgba(122,78,48,0.45)] dark:ring-dotori-800/80 dark:shadow-none",
	);
	const menuItemTitleClass = cn(
		DS_TYPOGRAPHY.h3,
		"font-semibold tracking-tight text-dotori-900 dark:text-dotori-50",
	);
	const menuItemDescriptionClass = cn(
		DS_TYPOGRAPHY.caption,
		"mt-0.5 text-dotori-400 dark:text-dotori-500",
	);

	const visibleMenuSections = useMemo(
		() => (user ? menuSections : publicMenuSections),
		[user],
	);
	const groupedMenuSections = useMemo(() => {
		const grouped: { title: string; items: MenuItem[] }[] = [
			{ title: "계정", items: [] },
			{ title: "앱설정", items: [] },
			{ title: "지원", items: [] },
		];

		visibleMenuSections
			.flatMap((section) => section.items)
			.forEach((item) => {
				if (item.href === "/my/support") {
					grouped[2].items.push(item);
					return;
				}

				if (
					item.href === "/my/notices" ||
					item.href === "/my/terms" ||
					item.href === "/my/app-info"
				) {
					grouped[1].items.push(item);
					return;
				}

				grouped[0].items.push(item);
			});

		return grouped.filter((section) => section.items.length > 0);
	}, [visibleMenuSections]);

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
					<h1 className={cn(DS_TYPOGRAPHY.h2, "font-bold tracking-tight")}>MY</h1>
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
					<div
						className={cn(
							DS_LAYOUT.CARD_SOFT,
							"rounded-3xl bg-gradient-to-r from-dotori-100 via-dotori-50 to-amber-50 px-5 py-5 ring-1 ring-dotori-200/60 shadow-[0_22px_36px_-30px_rgba(122,78,48,0.55)] dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-900 dark:ring-dotori-800/80 dark:shadow-none",
						)}
					>
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
								<h1 className={cn(DS_TYPOGRAPHY.h2, "font-bold tracking-tight")}>
									MY 페이지
								</h1>
								<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-0.5 text-dotori-700 dark:text-dotori-200")}>
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
						className="w-full min-h-11 py-4 text-base font-semibold tracking-tight active:scale-[0.97]"
					>
						카카오 로그인
					</Button>
					<p className={cn(DS_TYPOGRAPHY.caption, "mt-2 text-center text-dotori-500 dark:text-dotori-300")}>
						로그인 후 관심 시설, 대기 현황, 알림을 한 번에 확인하세요
					</p>
				</div>

				<div className="mt-5 space-y-4 px-5">
					{groupedMenuSections.map((section) => (
						<section key={section.title}>
							<h2 className={sectionTitleClass}>
								{section.title}
							</h2>
							<div className={menuPanelClass}>
								<motion.ul
									{...stagger.container}
									className="divide-y divide-dotori-100 dark:divide-dotori-800"
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
															<p className={menuItemTitleClass}>
																{item.label}
															</p>
															<p className={menuItemDescriptionClass}>
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
			</div>
		);
	}

	return (
		<div className="pb-8 text-dotori-900 dark:text-dotori-50">
			{/* 프로필 헤더 */}
			<header className="px-5 pt-6 pb-2">
				<Surface
					tone="muted"
					className="px-5 py-5 ring-1 ring-dotori-100/70 shadow-[0_22px_36px_-30px_rgba(122,78,48,0.48)] dark:ring-dotori-800/80 dark:shadow-none"
				>
					<div className="mb-3 flex items-center justify-between">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.lockupHorizontal} alt="Dotori" className="h-5 opacity-90" />
						<Badge color="dotori" className={cn(DS_TYPOGRAPHY.caption, "font-semibold")}>
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
								<h1 className={cn(DS_TYPOGRAPHY.h2, "font-bold leading-tight tracking-tight")}>
									{userLabel}
								</h1>
								<Link
									href="/my/settings"
									aria-label="플랜 설정으로 이동"
									className="inline-flex min-h-11 items-center justify-center rounded-full px-1"
								>
									<Badge
										color={user.plan === "free" ? "dotori" : "forest"}
										className={DS_TYPOGRAPHY.caption}
									>
										{planLabel}
									</Badge>
								</Link>
							</div>
							<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-0.5 text-dotori-500 dark:text-dotori-300")}>{formatRegion(user.region)}</p>
							<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-1 text-dotori-500 dark:text-dotori-300")}>{childSummary}</p>
							<Link
								href="/my/settings"
								className={cn(
									DS_TYPOGRAPHY.bodySm,
									"mt-2 inline-flex min-h-11 items-center justify-center rounded-2xl bg-dotori-50 px-4 font-semibold text-dotori-700 transition-colors hover:bg-dotori-100 active:scale-[0.98] dark:bg-dotori-900 dark:text-dotori-200 dark:hover:bg-dotori-800",
								)}
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
								DS_LAYOUT.CARD_SOFT,
								"rounded-2xl bg-gradient-to-b from-white/90 to-dotori-50/70 px-3 py-2.5 ring-1 ring-dotori-100/80 dark:from-dotori-950/90 dark:to-dotori-900/75 dark:ring-dotori-800/80",
								"flex flex-col items-center justify-center gap-0.5 text-center",
								"transition-colors transition-transform hover:bg-dotori-50/70 dark:hover:bg-dotori-900/65 active:scale-[0.98] active:bg-dotori-50 dark:active:bg-dotori-900",
							)}
						>
							<span className={cn(DS_TYPOGRAPHY.h2, "font-bold leading-none tabular-nums text-dotori-900 dark:text-dotori-50")}>
								{stat.value}
							</span>
							<span className={cn(DS_TYPOGRAPHY.caption, "text-dotori-500 dark:text-dotori-300")}>
								{stat.label}
							</span>
						</Link>
					))}
				</div>
			</section>

			{!isPremiumUser && (
				<section className="mt-5 px-5">
					<div
						className={cn(
							DS_LAYOUT.CARD_SOFT,
							"rounded-3xl bg-gradient-to-r from-dotori-100 via-dotori-50 to-amber-50 px-4 py-5 ring-1 ring-dotori-200/65 shadow-[0_20px_34px_-28px_rgba(122,78,48,0.55)] dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-900 dark:ring-dotori-800/80 dark:shadow-none",
						)}
					>
						<p className={cn(DS_TYPOGRAPHY.label, "font-semibold uppercase tracking-[0.2em] text-dotori-500 dark:text-dotori-300")}>
							프리미엄
						</p>
						<p className={cn(DS_TYPOGRAPHY.h2, "mt-2 font-bold tracking-tight text-dotori-900 dark:text-dotori-50")}>
							프리미엄 · 월 1,900원
						</p>
						<div className={cn(DS_TYPOGRAPHY.bodySm, "mt-2 space-y-1.5 text-dotori-700 dark:text-dotori-200")}>
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
						<h2 className={cn(DS_TYPOGRAPHY.h3, "font-bold tracking-tight")}>관심 시설 {interestsCount}곳</h2>
						<span className={cn(DS_TYPOGRAPHY.bodySm, "inline-flex items-center text-dotori-500 dark:text-dotori-300")}>
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
								className={cn(
									cardSurfaceClass,
									"block p-4 transition-all active:scale-[0.99]",
								)}
							>
								<div className="flex items-start gap-3">
									<div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-dotori-50 dark:bg-dotori-900 text-dotori-500">
										<HeartIcon className="h-5 w-5" />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<p className={cn(DS_TYPOGRAPHY.body, "font-semibold text-dotori-900 dark:text-dotori-50 leading-snug line-clamp-1")}>
												{facility.name}
											</p>
											<span className={cn(DS_TYPOGRAPHY.caption, "rounded-full bg-dotori-100 dark:bg-dotori-800 px-2 py-0.5 text-dotori-500")}>
												{facility.type}
											</span>
										</div>
										<p className={cn(DS_TYPOGRAPHY.caption, "mt-1 text-dotori-500 dark:text-dotori-300 line-clamp-1")}>
											{facility.address}
										</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div
						className={cn(
							DS_LAYOUT.CARD_SOFT,
							"rounded-3xl px-5 py-5 text-center ring-1 ring-dotori-100/80 dark:ring-dotori-800/80",
						)}
					>
						<div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/70 dark:bg-dotori-950/50">
							<HeartIcon className="h-6 w-6 text-dotori-500" />
						</div>
						<p className={cn(DS_TYPOGRAPHY.h3, "mt-3 font-semibold tracking-tight text-dotori-900 dark:text-dotori-50")}>
							관심 시설을 저장해두면 비교가 훨씬 쉬워요
						</p>
						<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-1 text-dotori-600 dark:text-dotori-300")}>
							탐색에서 하트를 눌러 관심 목록을 만들어보세요.
						</p>
						<Link
							href="/explore"
							className={cn(
								DS_TYPOGRAPHY.bodySm,
								"mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-dotori-100 dark:bg-dotori-800 px-4 font-semibold text-dotori-700 dark:text-dotori-200 active:scale-[0.97]",
							)}
						>
							이동할 시설 찾기
						</Link>
					</div>
				)}
			</section>

			{/* 내 아이 */}
			<section className="mt-5 px-5">
				<h2 className={cn(DS_TYPOGRAPHY.h3, "mb-2.5 font-bold tracking-tight")}>내 아이</h2>
				{user.children.length > 0 ? (
					<div className="space-y-2">
						{childDetails.map(({ child, ageLabel }) => (
							<div
								key={child.id}
								className={cn(cardSurfaceClass, "flex items-center gap-3.5 p-5")}
							>
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-dotori-50 dark:bg-dotori-900 text-body-sm font-bold text-dotori-500">
									{child?.gender === "female"
										? "👧"
										: child?.gender === "male"
											? "👦"
											: "👶"}
								</div>
								<div className="min-w-0 flex-1">
									<span className={cn(DS_TYPOGRAPHY.body, "font-semibold")}>{child.name}</span>
									<span className={cn(DS_TYPOGRAPHY.bodySm, "ml-1.5 text-dotori-500 dark:text-dotori-300")}>
										만 {ageLabel}
									</span>
								</div>
								<Link
									href="/my/settings"
									className={cn(DS_TYPOGRAPHY.bodySm, "py-1 text-dotori-500 dark:text-dotori-300 transition-colors hover:text-dotori-600 dark:hover:text-dotori-200")}
								>
									수정
								</Link>
							</div>
						))}
				</div>
				) : (
					<div
						className={cn(
							DS_LAYOUT.CARD_SOFT,
							"rounded-3xl p-5 text-center ring-1 ring-dotori-100/80 dark:ring-dotori-800/80",
						)}
					>
						<p className={cn(DS_TYPOGRAPHY.h3, "text-dotori-500 dark:text-dotori-300")}>
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
						DS_LAYOUT.CARD_SOFT,
						"flex items-center gap-3.5 rounded-3xl bg-gradient-to-r from-dotori-50 to-white dark:from-dotori-900 dark:to-dotori-950 p-5 ring-1 ring-dotori-100/80 dark:ring-dotori-800/80 transition-all",
						"active:scale-[0.98] hover:bg-dotori-50/70 dark:hover:bg-dotori-900/65",
					)}
				>
					<div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-dotori-100 dark:bg-dotori-800">
						<CameraIcon className="h-6 w-6 text-dotori-600 dark:text-dotori-300" />
					</div>
					<div className="min-w-0 flex-1">
						<span className={cn(DS_TYPOGRAPHY.h3, "block font-semibold tracking-tight text-dotori-900 dark:text-dotori-50")}>
							아이사랑 데이터 가져오기
						</span>
						<span className={cn(DS_TYPOGRAPHY.bodySm, "text-dotori-500 dark:text-dotori-300")}>
							스크린샷 AI 분석으로 대기현황 자동 등록
						</span>
					</div>
					<ChevronRightIcon className="h-5 w-5 text-dotori-300 dark:text-dotori-700" />
				</Link>
			</section>

			{/* 메뉴 */}
			<div className="mt-5 space-y-4 px-5">
				{groupedMenuSections.map((section) => (
					<section key={section.title}>
						<h2 className={sectionTitleClass}>
							{section.title}
						</h2>
						<div className={menuPanelClass}>
							<motion.ul
								{...stagger.container}
								className="divide-y divide-dotori-100 dark:divide-dotori-800"
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
														<p className={menuItemTitleClass}>
															{item.label}
														</p>
														<p className={menuItemDescriptionClass}>
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

			{/* 로그아웃 */}
			<div className="mt-6 px-5">
				<Button
					color="dotori"
					onClick={handleLogout}
					className="w-full min-h-11 py-3 tracking-tight"
				>
					로그아웃
				</Button>
			</div>
			<p className={cn(DS_TYPOGRAPHY.caption, "mt-2 text-center text-dotori-300 dark:text-dotori-600")}>버전 1.0.0</p>
		</div>
	);
}
