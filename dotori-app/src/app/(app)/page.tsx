"use client";

import {
	BellAlertIcon,
	ClipboardDocumentListIcon,
	HomeModernIcon,
	MagnifyingGlassIcon,
	ScaleIcon,
	SparklesIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiBriefingCard } from "@/components/dotori/AiBriefingCard";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { ErrorState } from "@/components/dotori/ErrorState";
import { EmptyState } from "@/components/dotori/EmptyState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { BRAND } from "@/lib/brand-assets";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { generateNBAs, type NBAItem } from "@/lib/engine/nba-engine";
import type { CommunityPost, Facility, UserProfile } from "@/types/dotori";

const quickActions = [
	{ label: "동네 추천", href: "/chat?prompt=동네추천", Icon: HomeModernIcon, bg: "bg-forest-50", iconColor: "text-forest-500" },
	{ label: "시설 비교", href: "/chat?prompt=비교", Icon: ScaleIcon, bg: "bg-dotori-50", iconColor: "text-dotori-600" },
	{ label: "서류 준비", href: "/chat?prompt=서류", Icon: ClipboardDocumentListIcon, bg: "bg-dotori-50", iconColor: "text-dotori-500" },
	{ label: "TO 알림", href: "/my/settings", Icon: BellAlertIcon, bg: "bg-red-50", iconColor: "text-red-400" },
];

interface HomeData {
	user: UserProfile | null;
	nearbyFacilities: Facility[];
	interestFacilities: Facility[];
	hotPosts: CommunityPost[];
	alertCount: number;
	waitlistCount: number;
	bestWaitlistPosition?: number;
	waitlistFacilityName?: string;
	sources: {
		isalang: { name: string; updatedAt: string };
	};
}

export default function HomePage() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [data, setData] = useState<HomeData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dismissedNBAs, setDismissedNBAs] = useState<Set<string>>(new Set());
	const [locationError, setLocationError] = useState<string | null>(null);
	const [isRequestingLocation, setIsRequestingLocation] = useState(false);

	const fetchHome = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await apiFetch<{ data: HomeData }>("/api/home");
			setData(res.data);
		} catch {
			setError("홈 정보를 불러오지 못했어요");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchHome();
	}, [fetchHome]);

	const user = data?.user ?? null;

	const nbas = useMemo(
		() =>
			data
				? generateNBAs({
						user,
						interestFacilities: data.interestFacilities,
						alertCount: data.alertCount,
						waitlistCount: data.waitlistCount,
						bestWaitlistPosition: data.bestWaitlistPosition,
						waitlistFacilityName: data.waitlistFacilityName,
					}).filter((n) => !dismissedNBAs.has(n.id))
				: [],
		[data, user, dismissedNBAs],
	);

	const urgentFacility = data?.nearbyFacilities.find(
		(f) =>
			f.status === "available" &&
			!data.interestFacilities.some((i) => i.id === f.id),
	);

	const hotPost = data?.hotPosts[0] ?? null;
	const nearbyFacilities = data?.nearbyFacilities ?? [];
	const hasAiBriefingContent = Boolean(
		data &&
			(data.interestFacilities.length > 0 ||
				data.alertCount > 0 ||
				data.waitlistCount > 0),
	);

	function dismissNBA(id: string) {
		setDismissedNBAs((prev) => new Set(prev).add(id));
	}

	const requestLocationAccess = useCallback(() => {
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			setLocationError("이 브라우저에서는 위치 권한을 요청할 수 없어요.");
			return;
		}

		setIsRequestingLocation(true);
		setLocationError(null);
		navigator.geolocation.getCurrentPosition(
			() => {
				void fetchHome().finally(() => {
					setIsRequestingLocation(false);
				});
			},
			() => {
				setIsRequestingLocation(false);
				setLocationError(
					"위치 권한이 아직 허용되지 않았어요. 브라우저 설정에서 허용 후 다시 시도해 주세요.",
				);
			},
		);
	}, [fetchHome]);

	if (isLoading) {
		return (
			<div className="pb-4">
				<header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm px-4 pb-3 pt-[env(safe-area-inset-top)]">
					<div className="flex items-center gap-2 pt-4 pb-3">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.symbol} alt="" aria-hidden="true" className="h-6 w-6" />
						<h1 className="text-lg font-bold tracking-tight">도토리</h1>
					</div>
				</header>
				<div className="px-4 mt-5">
					<Skeleton variant="home" />
				</div>
			</div>
		);
	}

	if (error && !data) {
		return (
			<div className="pb-4">
				<header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm px-4 pb-3 pt-[env(safe-area-inset-top)]">
					<div className="flex items-center gap-2 pt-4 pb-3">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.symbol} alt="" aria-hidden="true" className="h-6 w-6" />
						<h1 className="text-lg font-bold tracking-tight">도토리</h1>
					</div>
				</header>
				<div className="px-5 pt-8">
					<ErrorState
						message={error}
						action={{ label: "다시 시도", onClick: fetchHome }}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="pb-4">
			{/* ── 상단 헤더 + 검색 ── */}
			<header className="sticky top-0 z-20 bg-white/80 px-5 pb-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
				<div className="flex items-center justify-between pt-4 pb-3">
					<div className="flex items-center gap-2.5">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.symbol} alt="" aria-hidden="true" className="h-7 w-7" />
						<h1 className="text-xl font-bold tracking-tight">
							{user?.onboardingCompleted
								? `${user.nickname}님`
								: "도토리"}
						</h1>
					</div>
					<Link
						href="/my/notifications"
						aria-label="알림"
						className="relative p-2.5 text-dotori-500 transition-colors hover:text-dotori-600"
					>
						<BellAlertIcon className="h-6 w-6" />
						{(data?.alertCount ?? 0) > 0 && (
							<span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-dotori-500" />
						)}
					</Link>
				</div>

				{/* 검색바 — 탭하면 탐색으로 이동 */}
				<Link
					href="/explore"
					aria-label="검색"
					className={cn(
						"flex items-center gap-3 rounded-3xl bg-white/70 px-5 py-3.5 ring-1 ring-dotori-200/40 backdrop-blur-sm",
						"transition-colors active:bg-dotori-50",
					)}
				>
					<MagnifyingGlassIcon className="h-5 w-5 text-dotori-500" />
					<span className="text-[15px] text-dotori-500">
						어린이집 이름, 지역 검색
					</span>
				</Link>
			</header>

			<div className="px-5">
				{/* ── AI 오늘의 브리핑 ── */}
				<section
					className={cn(
						"mt-5",
						"space-y-3",
						"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 duration-500",
					)}
				>
					<h2 className="text-[17px] font-bold">오늘의 할 일</h2>
					{hasAiBriefingContent ? (
						<AiBriefingCard
							source="아이사랑"
							updatedAt={
								data?.sources?.isalang?.updatedAt ??
								new Date().toISOString()
							}
						>
							{data?.interestFacilities.some(
								(f) => f.status === "available",
							) ? (
								<ul className="space-y-1.5 text-[15px] text-dotori-800">
									{data.interestFacilities
										.filter((f) => f.status === "available")
										.slice(0, 2)
										.map((f) => {
											const toCount =
												f.capacity.total - f.capacity.current;
											return (
												<li
													key={f.id}
													className="flex items-start gap-1.5"
												>
													<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" />
													<span>
														{f.name}{" "}
														<strong className="text-forest-700">
															TO {toCount}석
														</strong>
														<span className="ml-1 text-[13px] text-dotori-400">
															(정원 {f.capacity.total}명)
														</span>
													</span>
												</li>
											);
										})}
								</ul>
							) : data?.interestFacilities.some(
									(f) => f.capacity.waiting > 0,
								) ? (
								<p className="text-[15px] text-dotori-800">
									관심 시설 {data.interestFacilities.length}곳 모두 대기 중이에요.
									{data.waitlistCount > 0 &&
										` 나의 대기 ${data.waitlistCount}건 진행 중`}
								</p>
							) : (
								<p className="text-[15px] text-dotori-800">
									현재 관심 시설에 새로운 변동은 없어요
								</p>
							)}
							<Link
								href="/chat"
								className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-dotori-600 transition-colors hover:text-dotori-700"
							>
								<SparklesIcon className="h-3.5 w-3.5" />
								토리에게 자세히 물어보기
							</Link>
						</AiBriefingCard>
					) : (
						<div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-dotori-200/20">
							<p className="text-[15px] text-dotori-700">
								오늘의 브리핑을 준비 중이에요
							</p>
						</div>
					)}
				</section>

				{/* ── NBA 카드 ── */}
				{nbas.length > 0 && (
					<section className="mt-5 space-y-2">
						{nbas.map((nba) => (
							<NBACard
								key={nba.id}
								nba={nba}
								onDismiss={() => dismissNBA(nba.id)}
							/>
						))}
					</section>
				)}

				{/* ── 빠른 액션 칩 ── */}
				<section className="mt-6">
					<div className="relative">
						<div
							ref={scrollRef}
							className="hide-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5"
						>
							{quickActions.map((action, i) => (
								<Link
									key={action.label}
									href={action.href}
									className={cn(
										"flex shrink-0 items-center gap-2.5 rounded-full bg-white px-5 py-3.5 shadow-sm",
										"text-[15px] font-medium text-dotori-700 transition-all",
										"active:scale-[0.97] hover:bg-dotori-100",
										"motion-safe:animate-in motion-safe:fade-in duration-300",
									)}
									style={{
										animationDelay: `${i * 60}ms`,
										animationFillMode: "both",
									}}
								>
									<span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", action.bg)}>
										<action.Icon className={cn("h-4.5 w-4.5", action.iconColor)} />
									</span>
									{action.label}
								</Link>
							))}
							<div className="w-2 shrink-0" />
						</div>
						<div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-dotori-50 via-dotori-50/80 to-transparent" />
					</div>
				</section>

				{/* ── 관심 시설 변동 ── */}
				{data && data.interestFacilities.length > 0 && (
					<section className="mt-8">
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-[17px] font-bold">관심 시설</h2>
							<Link
								href="/explore"
								className="flex items-center gap-0.5 py-1 text-[14px] text-dotori-500 transition-colors hover:text-dotori-600"
							>
								더보기
								<ChevronRightIcon className="h-4 w-4" />
							</Link>
						</div>
						<div className="space-y-3">
							{urgentFacility && (
								<div
									className={cn(
										"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300",
									)}
								>
									<Link href={`/facility/${urgentFacility.id}`}>
										<div className="relative">
											<span className="absolute -top-1.5 left-3 z-10 rounded-full bg-forest-500 px-2.5 py-1 text-[11px] font-bold text-white">
												NEW TO
											</span>
											<FacilityCard
												facility={urgentFacility}
												compact
											/>
										</div>
									</Link>
								</div>
							)}
							{data.interestFacilities.slice(0, 3).map((f, i) => (
								<div
									key={f.id}
									className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300"
									style={{
										animationDelay: `${(i + 1) * 80}ms`,
										animationFillMode: "both",
									}}
								>
									<Link href={`/facility/${f.id}`}>
										<FacilityCard facility={f} compact />
									</Link>
								</div>
							))}
						</div>
					</section>
				)}

				{/* ── 커뮤니티 소식 프리뷰 ── */}
				{data && (
					<section className="mt-8">
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-[17px] font-bold">커뮤니티 소식</h2>
							<Link
								href="/community"
								className="flex items-center gap-0.5 py-1 text-[14px] text-dotori-500 transition-colors hover:text-dotori-600"
							>
								더보기
								<ChevronRightIcon className="h-4 w-4" />
							</Link>
						</div>
						{hotPost ? (
							<Link
								href="/community"
								className={cn(
									"block rounded-3xl bg-white p-5 shadow-sm ring-1 ring-dotori-100/40 transition-all active:scale-[0.98] hover:shadow-md",
									"motion-safe:animate-in motion-safe:fade-in duration-400",
								)}
							>
								<div className="flex items-center gap-2.5">
									<div className="grid h-10 w-10 place-items-center rounded-full bg-dotori-100 text-[14px] font-bold text-dotori-600">
										{hotPost.author.nickname[0]}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-1.5">
											<span className="text-[14px] font-semibold text-dotori-800">
												{hotPost.author.nickname}
											</span>
											{hotPost.author.verified && (
												<span className="rounded bg-forest-100 px-1.5 py-0.5 text-[11px] font-medium text-forest-700">
													인증
												</span>
											)}
										</div>
									</div>
									<ChevronRightIcon className="h-4 w-4 text-dotori-300" />
								</div>
								<p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-dotori-700">
									{hotPost.content}
								</p>
								<div className="mt-3 flex items-center gap-3 text-[13px] text-dotori-500">
									<span>❤️ {hotPost.likes}</span>
									<span>💬 {hotPost.commentCount}</span>
								</div>
							</Link>
						) : (
							<EmptyState
								title="아직 커뮤니티 소식이 없어요"
								description="이웃이 올린 소식이 없어요. 새 글을 작성해 이웃들과 나눠보세요."
							/>
						)}
					</section>
				)}

				{/* ── 근처 어린이집 ── */}
				{data && (
					<section
						className={cn(
							"mt-8",
							"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 duration-500",
						)}
					>
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-[17px] font-bold">근처 어린이집</h2>
							<Link
								href="/explore"
								className="flex items-center gap-0.5 py-1 text-[14px] text-dotori-500 transition-colors hover:text-dotori-600"
							>
								더보기
								<ChevronRightIcon className="h-4 w-4" />
							</Link>
						</div>
						{nearbyFacilities.length > 0 ? (
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{nearbyFacilities.slice(0, 3).map((f, i) => (
									<Link
										key={f.id}
										href={`/facility/${f.id}`}
										className="rounded-2xl transition-all active:scale-[0.97] hover:shadow-md"
										style={{
											animationDelay: `${i * 80}ms`,
											animationFillMode: "both",
										}}
									>
										<FacilityCard facility={f} compact />
									</Link>
								))}
							</div>
						) : (
							<div className="rounded-2xl bg-white p-5 ring-1 ring-dotori-100">
								<p className="text-[15px] leading-relaxed text-dotori-800">
									위치 권한 허용 후 주변 시설을 볼 수 있어요
								</p>
								<button
									type="button"
									onClick={requestLocationAccess}
									disabled={isRequestingLocation}
									className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-dotori-500 px-4 py-2 text-[14px] font-semibold text-white transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-dotori-300"
								>
									{isRequestingLocation ? "요청 중..." : "위치 허용"}
								</button>
								{locationError ? (
									<p className="mt-2 text-[13px] text-dotori-600">
										{locationError}
									</p>
								) : null}
							</div>
						)}
					</section>
				)}

				{/* ── 오늘의 팁 ── */}
				<section
					className={cn(
						"mt-8",
						"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 duration-500",
					)}
				>
					<div className="rounded-3xl bg-gradient-to-br from-forest-50 to-dotori-50 p-5">
						<div className="flex items-center gap-2 text-[13px] font-semibold text-forest-600">
							<SparklesIcon className="h-4 w-4" />
							오늘의 팁
						</div>
						<p className="mt-2 text-[15px] leading-relaxed text-dotori-800">
							국공립 어린이집 대기 신청은 아이사랑포털에서 온라인으로 가능해요.
							대기 순번은 신청 시점 기준이므로 빠른 신청이 유리합니다.
						</p>
						<Link
							href="/chat?prompt=대기신청"
							className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-forest-600 transition-colors hover:text-forest-700"
						>
							자세히 알아보기
							<ChevronRightIcon className="h-3.5 w-3.5" />
						</Link>
					</div>
				</section>

				{/* ── 빠른 시작 (비로그인) ── */}
				{!user && (
					<motion.section
						initial={{ opacity: 0, x: 16 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.35 }}
						className={cn(
							"mt-8",
							"motion-safe:animate-in motion-safe:fade-in duration-400",
						)}
					>
						<div className="rounded-2xl bg-dotori-900 p-5">
							<div className="flex items-center justify-between gap-4">
								<div className="flex min-w-0 items-center gap-3">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={BRAND.symbol}
										alt=""
										className="h-8 w-8 shrink-0"
									/>
									<p className="text-[15px] leading-snug font-semibold">
										토리와 함께라면
										<br />
										어린이집 찾기가 쉬워요
									</p>
								</div>
								<Link
									href="/login"
									className="inline-flex shrink-0 rounded-xl bg-dotori-400 px-4 py-2 text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
								>
									시작하기 →
								</Link>
							</div>
						</div>
					</motion.section>
				)}

				{/* ── 온보딩 미완료시 CTA (로그인 CTA는 NBA 카드에서 처리) ── */}
				{user && !user.onboardingCompleted && (
					<section
						className={cn(
							"mt-8 rounded-2xl bg-dotori-900 p-5 text-white",
							"motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-400",
						)}
					>
						<h3 className="text-base font-bold">
							아이 정보를 등록해보세요
						</h3>
						<p className="mt-1.5 text-[14px] leading-snug text-white/70">
							맞춤 입소 전략과 실시간 알림을 받을 수 있어요
						</p>
						<Link
							href="/onboarding"
							className="mt-4 inline-block rounded-xl bg-white px-6 py-3 text-[15px] font-semibold text-dotori-900 transition-all active:scale-[0.97]"
						>
							등록하기
						</Link>
					</section>
				)}
			</div>
		</div>
	);
}

function NBACard({
	nba,
	onDismiss,
}: {
	nba: NBAItem;
	onDismiss: () => void;
}) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-3xl bg-gradient-to-r from-dotori-50 to-white p-5 shadow-sm ring-1 ring-dotori-200/30",
				"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300",
			)}
		>
			<button
				onClick={onDismiss}
				aria-label="닫기"
				className="absolute right-2 top-2 rounded-full p-2 text-dotori-500 transition-colors hover:bg-dotori-100 hover:text-dotori-600"
			>
				<XMarkIcon className="h-5 w-5" />
			</button>
			<div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-dotori-200/30 blur-2xl" />
			<h3 className="relative pr-8 text-[14px] font-semibold text-dotori-800">
				{nba.title}
			</h3>
			<p className="relative mt-1 text-[13px] leading-snug text-dotori-500">{nba.description}</p>
			{nba.action && (
				<Link
					href={nba.action.href}
					className="relative mt-3 inline-block rounded-xl bg-dotori-500 px-5 py-2.5 text-[14px] font-semibold text-white transition-all active:scale-[0.97] hover:bg-dotori-600"
				>
					{nba.action.label}
				</Link>
			)}
		</div>
	);
}
