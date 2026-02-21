"use client";

import {
	BellAlertIcon,
	MagnifyingGlassIcon,
	SparklesIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { Input } from "@/components/catalyst/input";
import { Select } from "@/components/catalyst/select";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiBriefingCard } from "@/components/dotori/AiBriefingCard";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { ErrorState } from "@/components/dotori/ErrorState";
import { EmptyState } from "@/components/dotori/EmptyState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useToast } from "@/components/dotori/ToastProvider";
import { BRAND } from "@/lib/brand-assets";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { generateNBAs, type NBAItem } from "@/lib/engine/nba-engine";
import type { CommunityPost, Facility, UserProfile } from "@/types/dotori";

const AI_BRIEFING_MONTHLY_LIMIT = 5;
const AI_BRIEFING_USAGE_KEY = "dotori-ai-briefing-usage";
const PREMIUM_BANNER_DISMISSED_KEY_PREFIX = "dotori-premium-upgrade-banner-dismissed";
const SERVICE_FACILITY_COUNT = "20,027";
const MOVE_CONCERN_PROMPT = "/chat?prompt=%EC%9D%B4%EB%8F%99";
const MOVE_CONCERN_NBA: NBAItem = {
	id: "move-concern",
	title: "이동 고민 중이세요?",
	description: "AI 토리가 인근 빈자리 시설을 바로 찾아드려요",
	action: {
		label: "이동 고민 시작",
		href: MOVE_CONCERN_PROMPT,
	},
	priority: 10,
};

const quickActions = [
	{ icon: "🔍", label: "내 주변 탐색", href: "/explore" },
	{ icon: "💬", label: "토리에게 물어보기", href: "/chat" },
	{
		icon: "📋",
		label: "입소 체크리스트",
		href: "/chat",
		prompt: "체크리스트",
	},
	{ icon: "🔔", label: "대기 현황", href: "/my/waitlist" },
];

const heroScenarios = [
	"반편성 시즌엔 지금 움직이면 유리해요",
	"교사 교체 신호가 보이면 바로 점검해요",
	"국공립 당첨 후, 이동 전략을 바로 계획해요",
] as const;

const suggestPrompts = ["반편성", "교사교체", "국공립당첨"] as const;

const serviceStats = [
	{
		label: "시설 수",
		value: `${SERVICE_FACILITY_COUNT}개 시설`,
		emphasized: true,
	},
	{
		label: "시도 수",
		value: "17개 시도",
	},
	{
		label: "업데이트",
		value: "실시간 업데이트",
	},
] as const;

const getCurrentMonthKey = (): string => {
	return new Date().toISOString().slice(0, 7);
};

const sectionStagger: Variants = {
	hidden: { opacity: 1 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.04,
		},
	},
};

const cardReveal: Variants = {
	hidden: { opacity: 0, y: 18 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.42,
			ease: "easeOut",
		},
	},
};

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

interface FacilitiesResponse {
	data: Facility[];
}

export default function HomePage() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [heroScenarioIndex, setHeroScenarioIndex] = useState(0);
	const [heroPrompt, setHeroPrompt] = useState("");
	const [scenarioFilter, setScenarioFilter] = useState("all");
	const [data, setData] = useState<HomeData | null>(null);
	const [liveInterestFacilities, setLiveInterestFacilities] = useState<Facility[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dismissedNBAs, setDismissedNBAs] = useState<Set<string>>(new Set());
	const [locationError, setLocationError] = useState<string | null>(null);
	const [isRequestingLocation, setIsRequestingLocation] = useState(false);
	const [isPremiumBannerVisible, setIsPremiumBannerVisible] = useState(false);
	const [freeAiUsageThisMonth, setFreeAiUsageThisMonth] = useState(0);
	const [isInterestStatusReady, setIsInterestStatusReady] = useState(false);
	const { addToast } = useToast();
	const availableInterestToastShown = useRef(false);

	const fetchInterestStatuses = useCallback(async (interests: Facility[]) => {
		setIsInterestStatusReady(false);

		if (interests.length === 0) {
			setLiveInterestFacilities([]);
			setIsInterestStatusReady(true);
			return;
		}

		const ids = [...new Set(interests.map((facility) => facility.id))];
		if (ids.length === 0) {
			setLiveInterestFacilities([]);
			setIsInterestStatusReady(true);
			return;
		}

		try {
			const params = new URLSearchParams({ ids: ids.join(",") });
			const response = await apiFetch<FacilitiesResponse>(`/api/facilities?${params}`);
			const facilityMap = new Map(response.data.map((facility) => [facility.id, facility]));
			const synced = ids
				.map((id) => facilityMap.get(id))
				.filter((facility): facility is Facility => facility !== undefined);
			setLiveInterestFacilities(synced.length > 0 ? synced : interests);
		} catch {
			setLiveInterestFacilities(interests);
		} finally {
			setIsInterestStatusReady(true);
		}
	}, []);

	const fetchHome = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		setIsInterestStatusReady(false);
		try {
			const res = await apiFetch<{ data: HomeData }>("/api/home");
			setData(res.data);
			await fetchInterestStatuses(res.data.interestFacilities);
		} catch {
			setError("홈 정보를 불러오지 못했어요");
		} finally {
			setIsInterestStatusReady(true);
			setIsLoading(false);
		}
	}, [fetchInterestStatuses]);

	useEffect(() => {
		fetchHome();
	}, [fetchHome]);

	const user = data?.user ?? null;
	const isPremiumUser = user?.plan === "premium";
	const isFreeUser = user?.plan === "free";
	const premiumBannerStorageKey = user?.id
		? `${PREMIUM_BANNER_DISMISSED_KEY_PREFIX}:${user.id}`
		: null;
	const aiBriefingUsageHint = isPremiumUser
		? "프리미엄 이용 중 · 무제한 AI 대화"
		: `이번 달 ${freeAiUsageThisMonth}/${AI_BRIEFING_MONTHLY_LIMIT}회 사용 · 프리미엄은 무제한`;

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
	const moveConcernNBA = useMemo(
		() => nbas.find((nba) => nba.id === MOVE_CONCERN_NBA.id) ?? MOVE_CONCERN_NBA,
		[nbas],
	);
	const orderedNBAs = useMemo(
		() => nbas.filter((nba) => nba.id !== MOVE_CONCERN_NBA.id),
		[nbas],
	);
	const heroScenario = heroScenarios[heroScenarioIndex % heroScenarios.length];
	const interestFacilities = useMemo(
		() =>
			liveInterestFacilities.length > 0
				? liveInterestFacilities
				: data?.interestFacilities ?? [],
		[liveInterestFacilities, data?.interestFacilities],
	);

	const urgentFacility = data?.nearbyFacilities.find(
		(f) =>
			f.status === "available" &&
			!interestFacilities.some((i) => i.id === f.id),
	);
	const realtimeAvailableFacilities = useMemo(() => {
		if (!data) return [];
		const available = [...data.nearbyFacilities, ...data.interestFacilities].filter(
			(f) => f.status === "available",
		);
		const seen = new Set<string>();
		return available.filter((facility) => {
			if (seen.has(facility.id)) return false;
			seen.add(facility.id);
			return true;
		});
	}, [data]);

	const hotPost = data?.hotPosts[0] ?? null;
	const nearbyFacilities = data?.nearbyFacilities ?? [];
	const greetingTitle = user?.nickname
		? `${user.nickname}맘, 관심 시설 현황을 확인해보세요`
		: "어린이집 이동 고민, 도토리가 해결해드려요";
	const hasAiBriefingContent = Boolean(
		data &&
			(interestFacilities.length > 0 ||
				data.alertCount > 0 ||
				data.waitlistCount > 0),
	);
	const aiUpdatedAt =
		data?.sources?.isalang?.updatedAt ?? new Date().toISOString();
	const waitingInterests = interestFacilities.filter(
		(f) => f.status === "waiting",
	);
	const todayTip = (() => {
		const month = new Date().getMonth() + 1;
		if (month === 2 || month === 3) {
			return "반편성 시즌이에요. 이동 고민이 있다면 지금이 골든타임이에요";
		}
		if (month === 4 || month === 5) {
			return "봄 입소 시즌이에요. 국공립 대기 현황을 확인해보세요";
		}
		if (month === 9 || month === 10) {
			return "2학기 반편성 전에 미리 체크하세요";
		}
		return "어린이집 정보를 AI로 분석해보세요";
	})();

	const availableInterestCount = interestFacilities.filter(
		(facility) => facility.status === "available",
	).length;
	const hasAvailableInterestFacility = availableInterestCount > 0;
	useEffect(() => {
		const timer = setInterval(() => {
			setHeroScenarioIndex((prev) => (prev + 1) % heroScenarios.length);
		}, 2600);

		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (!hasAvailableInterestFacility || interestFacilities.length === 0) {
			availableInterestToastShown.current = false;
			return;
		}

		if (availableInterestToastShown.current) {
			return;
		}

		addToast({
			type: "success",
			message: "빈자리 있어요!",
		});
		availableInterestToastShown.current = true;
	}, [addToast, hasAvailableInterestFacility, interestFacilities.length]);

	const handleDismiss = useCallback((id: string) => {
		setDismissedNBAs((prev) => new Set(prev).add(id));
	}, []);

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

	useEffect(() => {
		if (typeof window === "undefined" || !user) {
			setFreeAiUsageThisMonth(0);
			setIsPremiumBannerVisible(false);
			return;
		}

		try {
			const usageRaw = window.localStorage.getItem(
				`${AI_BRIEFING_USAGE_KEY}:${getCurrentMonthKey()}`,
			);
			const usageCount = Number.parseInt(usageRaw ?? "0", 10);
			setFreeAiUsageThisMonth(
				Number.isFinite(usageCount)
					? Math.max(0, Math.min(usageCount, AI_BRIEFING_MONTHLY_LIMIT))
					: 0,
			);

			if (isFreeUser && premiumBannerStorageKey) {
				const dismissed =
					window.localStorage.getItem(premiumBannerStorageKey) === "1";
				setIsPremiumBannerVisible(!dismissed);
			} else {
				setIsPremiumBannerVisible(false);
			}
		} catch {
			setFreeAiUsageThisMonth(0);
			setIsPremiumBannerVisible(isFreeUser);
		}
	}, [isFreeUser, premiumBannerStorageKey, user]);

	const handleDismissPremiumBanner = useCallback(() => {
		if (!isFreeUser || !premiumBannerStorageKey || typeof window === "undefined") {
			return;
		}
		window.localStorage.setItem(premiumBannerStorageKey, "1");
		setIsPremiumBannerVisible(false);
	}, [isFreeUser, premiumBannerStorageKey]);

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

	if (false) {
		return (
		<div className="pb-4">
			<header className="sticky top-0 z-20 bg-white/80 px-5 pb-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
				<div className="flex items-center justify-between pt-4 pb-3">
					<div className="flex items-center gap-2.5">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.symbol}
							alt=""
							aria-hidden="true"
							className="h-7 w-7"
						/>
						<h1 className="text-xl font-bold tracking-tight">
							{user?.onboardingCompleted ? `${user.nickname}님` : "도토리"}
						</h1>
					</div>
					<Link
						href="/my/notifications"
						aria-label="알림"
						className="relative rounded-full p-2.5 text-dotori-500 transition-colors hover:bg-dotori-50 hover:text-dotori-600"
					>
						<BellAlertIcon className="h-6 w-6" />
						{(data?.alertCount ?? 0) > 0 && (
							<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-dotori-500" />
						)}
					</Link>
				</div>

				<Fieldset className="space-y-2">
					<Field>
						<Input
							type="search"
							value={heroPrompt}
							onChange={(event) => setHeroPrompt(event.target.value)}
							placeholder="반편성, 교사 교체, 국공립 당첨 고민을 입력해보세요"
						/>
					</Field>
					<Field>
						<Select
							value={scenarioFilter}
							onChange={(event) => setScenarioFilter(event.target.value)}
							aria-label="관심 시나리오"
						>
							<option value="all">전체 시나리오</option>
							<option value="반편성">반편성</option>
							<option value="교사교체">교사교체</option>
							<option value="국공립당첨">국공립당첨</option>
						</Select>
					</Field>
				</Fieldset>
			</header>

			<div className="px-5">
				<motion.section
					className="mt-5 rounded-3xl bg-gradient-to-br from-dotori-50 to-white px-5 py-6"
					initial="hidden"
					animate="show"
					variants={sectionStagger}
				>
					<motion.div variants={cardReveal}>
						<Heading level={1} className="text-2xl font-extrabold leading-tight text-dotori-900">
							어린이집 이동, 이제 묻혀 있던 마음을 바로 꺼내보세요
						</Heading>
						<motion.div
							key={heroScenario}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.35 }}
							className="mt-4"
						>
							<Badge color="dotori" className="rounded-full px-3 py-1 text-xs">
								{heroScenario}
							</Badge>
						</motion.div>
						<Text className="mt-3 text-sm text-dotori-600">
							이동 고민 3가지 핵심 시나리오를 빠르게 점검해
							지금 바로 다음 결정을 내려보세요
						</Text>
					</motion.div>
				</motion.section>

				<motion.section
					className="mt-4"
					initial="hidden"
					animate="show"
					variants={sectionStagger}
				>
					<motion.div variants={cardReveal}>
						<Link
							href="/chat"
							className="block rounded-3xl bg-dotori-900 px-5 py-4 text-white"
						>
							<div className="flex items-center gap-2">
								<SparklesIcon className="h-5 w-5 text-white/90" />
								<Heading level={3} className="font-semibold text-white">
									토리에게 물어보세요
								</Heading>
							</div>
							<Text className="mt-2 text-sm text-white/85">
								반편성/교사교체/국공립당첨 고민을
								지금 바로 정리해드려요
							</Text>
							<div className="mt-3 flex flex-wrap gap-2">
								{suggestPrompts.map((prompt) => (
									<Link
										key={prompt}
										href={`/chat?prompt=${encodeURIComponent(prompt)}`}
										className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs text-white"
									>
										{prompt}
									</Link>
								))}
							</div>
						</Link>
					</motion.div>
				</motion.section>

				<section className="mt-5">
					<motion.div
						ref={scrollRef}
						className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5"
						initial="hidden"
						animate="show"
						variants={sectionStagger}
					>
						{quickActions.map((action) => {
							const href = action.prompt
								? `${action.href}?prompt=${encodeURIComponent(action.prompt)}`
								: action.href;
							return (
								<motion.div key={action.label} variants={cardReveal}>
									<Link
										href={href}
										className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-dotori-100 bg-white px-4 py-2.5 text-sm font-medium shadow-sm"
									>
										<span aria-hidden="true">{action.icon}</span>
										<span>{action.label}</span>
									</Link>
								</motion.div>
							);
						})}
						<div className="w-2 shrink-0" />
					</motion.div>
				</section>

				<motion.section
					className="mt-5"
					initial="hidden"
					animate="show"
					variants={sectionStagger}
				>
					<Heading level={2} className="text-base font-semibold text-dotori-900">
						서비스 통계
					</Heading>
					<motion.div
						variants={cardReveal}
						className="mt-3 flex gap-2.5 overflow-x-auto pb-1"
					>
						{serviceStats.map((stat) => (
							<div
								key={stat.label}
								className="min-w-[170px] rounded-full border border-dotori-100 bg-white px-4 py-3 shadow-sm"
							>
								<Text className="text-xs text-dotori-500">{stat.label}</Text>
								<Text
									className={cn(
										"mt-1.5 text-sm font-semibold text-dotori-900",
										stat.emphasized ? "text-3xl" : "text-base",
									)}
								>
									{stat.value}
								</Text>
							</div>
						))}
					</motion.div>
				</motion.section>

				{data && (
					<motion.section
						className="mt-5 space-y-2.5"
						initial="hidden"
						animate="show"
						variants={sectionStagger}
					>
						<Heading level={2} className="text-base font-semibold text-dotori-900">
							이동 고민 AI 제안
						</Heading>
						<motion.div variants={cardReveal}>
							<NBACard nba={moveConcernNBA} onDismiss={handleDismiss} />
						</motion.div>
					</motion.section>
				)}

				<motion.section
					className="mt-6 space-y-3"
					initial="hidden"
					animate="show"
					variants={sectionStagger}
				>
					<motion.div variants={cardReveal}>
						<AiBriefingCard source="아이사랑" updatedAt={aiUpdatedAt}>
							<Text className="text-sm text-dotori-700">{aiBriefingUsageHint}</Text>
							<Text className="mt-2 text-base font-semibold leading-snug text-dotori-900">
								{hasAiBriefingContent
									? "토리와 함께 이동 기준을 지금 점검해보세요"
									: "AI 브리핑을 준비 중이에요"}
							</Text>
							<Button href="/chat" color="dotori" className="mt-3">
								지금 바로 토리와 이어보기
							</Button>
						</AiBriefingCard>
					</motion.div>
				</motion.section>

				{data && (
					<motion.section
						className="mt-5"
						initial="hidden"
						animate="show"
						variants={sectionStagger}
					>
						<div className="mb-2 flex items-center justify-between">
							<Heading level={2} className="text-base font-semibold text-dotori-900">
								실시간 입소 가능 시설
							</Heading>
							<Link
								href="/explore"
								className="flex items-center gap-1 text-sm text-dotori-500"
							>
								실시간 확인
								<ChevronRightIcon className="h-4 w-4" />
							</Link>
						</div>
						{realtimeAvailableFacilities.length > 0 ? (
							<div className="space-y-2.5">
								{realtimeAvailableFacilities.slice(0, 2).map((facility) => (
									<motion.div key={facility.id} variants={cardReveal}>
										<Link href={`/facility/${facility.id}`}>
											<FacilityCard facility={facility} compact />
										</Link>
									</motion.div>
								))}
							</div>
						) : (
							<EmptyState
								title="현재 입소 가능한 시설이 없어요"
								description="주변 시설 업데이트를 잠시만 기다려주세요."
							/>
						)}
					</motion.section>
				)}

				{orderedNBAs.length > 0 && (
					<motion.section
						className="mt-4 space-y-2"
						initial="hidden"
						animate="show"
						variants={sectionStagger}
					>
						{orderedNBAs.map((nba) => (
							<motion.div key={nba.id} variants={cardReveal}>
								<NBACard nba={nba} onDismiss={handleDismiss} />
							</motion.div>
						))}
					</motion.section>
				)}

				{data && (
					<section className="mt-5">
						<Link
							href="/community"
							className="flex items-center gap-2 rounded-full border border-dotori-100 bg-white px-4 py-2.5"
						>
							<Text className="min-w-0 flex-1 truncate text-sm text-dotori-700">
								커뮤니티 소식: {hotPost ? `${hotPost.author.nickname} · ${hotPost.content}` : "아직 소식이 없어요"}
							</Text>
							<ChevronRightIcon className="h-4 w-4 text-dotori-300" />
						</Link>
					</section>
				)}

				{!user && (
					<section className="mt-5">
						<div className="flex items-center justify-between gap-3 rounded-full border border-dotori-100 bg-dotori-50 px-4 py-2.5">
							<Text className="text-sm text-dotori-700">
								로그인하면 이동 우선 추천을 받을 수 있어요
							</Text>
							<Button href="/login" color="dotori">
								로그인
							</Button>
						</div>
					</section>
				)}
			</div>
		</div>
	);

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
							이동할 어린이집 탐색...
						</span>
					</Link>
				</header>

			<div className="px-5">
				{/* ── HERO ── */}
				<motion.section
					className="mt-5 space-y-1"
					initial="hidden"
					animate="show"
					variants={sectionStagger}
				>
					<motion.h1
						variants={cardReveal}
						className="text-[26px] font-extrabold leading-tight text-dotori-900"
					>
						{greetingTitle}
					</motion.h1>
					<motion.p
						variants={cardReveal}
						className="text-[14px] text-dotori-500"
					>
						이동 고민은 지금, 빈자리와 조건을 바로 체크하고
						</motion.p>
				</motion.section>

				{/* ── 서비스 통계 카드 ── */}
				<motion.section
					className="mt-6"
					initial="hidden"
					animate="show"
					variants={sectionStagger}
				>
					<motion.div variants={cardReveal}>
						<div className="rounded-3xl bg-white p-4 ring-1 ring-dotori-100">
							<div className="flex items-center justify-between">
								<Heading level={3} className="font-semibold text-dotori-900">
									서비스 통계
								</Heading>
								<Badge color="dotori" className="text-xs">
									실시간 AI 분석 중
								</Badge>
							</div>
							<Text className="mt-2 text-dotori-700">
								시설 수: {SERVICE_FACILITY_COUNT}
							</Text>
						</div>
					</motion.div>
				</motion.section>

				{/* ── 빠른 액션 카드 ── */}
				<section className="mt-6">
					<motion.div
						ref={scrollRef}
						className="hide-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5"
						initial="hidden"
						animate="show"
						variants={sectionStagger}
					>
						{quickActions.map((action, i) => {
							const href = action.prompt
								? `${action.href}?prompt=${encodeURIComponent(
										action.prompt,
								  )}`
								: action.href;
							return (
								<motion.div key={action.label} variants={cardReveal} style={{ animationDelay: `${i * 40}ms` }}>
									<Link
										href={href}
										className={cn(
											"min-h-[124px] w-[180px] shrink-0 rounded-3xl px-4 py-4 shadow-sm",
											"ring-1 ring-dotori-100 transition-all",
											"bg-white/85 backdrop-blur-sm hover:bg-dotori-50",
											"active:scale-[0.98]",
										)}
									>
										<div
											className={cn(
												"grid h-11 w-11 place-items-center rounded-2xl text-[20px]",
												action.bg,
											)}
										>
											{action.icon}
										</div>
										<p className="mt-3 text-[16px] font-bold leading-snug text-dotori-900">
											{action.label}
										</p>
									</Link>
								</motion.div>
							);
						})}
						<div className="w-2 shrink-0" />
					</motion.div>
				</section>

				{isPremiumBannerVisible && (
					<motion.section
						className="mt-5"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						<div className="relative rounded-2xl bg-dotori-100 px-4 py-3 ring-1 ring-dotori-200">
							<button
								type="button"
								onClick={handleDismissPremiumBanner}
								aria-label="배너 닫기"
								className="absolute right-2 top-2 rounded-full p-1.5 text-dotori-600 transition-colors hover:bg-dotori-200/70"
							>
								<XMarkIcon className="h-4 w-4" />
							</button>
							<Link
								href="/my/settings"
								className="block text-[14px] font-semibold text-dotori-900"
							>
								<p>빈자리 즉시 알림 서비스 — 월 1,900원</p>
								<p className="mt-0.5 text-[12px] font-medium text-dotori-700">
									프리미엄으로 바로 업그레이드해 빈자리 알림을 받아보세요
								</p>
							</Link>
						</div>
					</motion.section>
				)}

				{/* ── AI 브리핑 카드 ── */}
				<motion.section
					className="mt-6 space-y-3"
					initial="hidden"
					animate="show"
					variants={sectionStagger}
				>
					<h2 className="text-[17px] font-bold">AI 브리핑</h2>
					<motion.div variants={cardReveal}>
						<AiBriefingCard source="아이사랑" updatedAt={aiUpdatedAt}>
							<p className="mb-2 text-[13px] text-dotori-700">
								{aiBriefingUsageHint}
							</p>
							{hasAiBriefingContent ? (
								<div className="space-y-2 text-dotori-900">
									<p className="text-[18px] font-semibold leading-snug text-dotori-900">
										{interestFacilities.some(
											(f) => f.status === "available",
										)
											? "입소 가능 시설이 있어요"
											: waitingInterests.length > 0
												? "입소 대기 시설을 실시간으로 모니터링 중입니다"
												: "토리에게 지금 바로 물어볼 수 있어요"}
									</p>
									{interestFacilities.some((f) => f.status === "available") ? (
										<ul className="space-y-1.5 text-[15px] leading-relaxed text-dotori-800">
									{interestFacilities
										.filter((f) => f.status === "available")
										.slice(0, 3)
										.map((f) => {
													const toCount =
														f.capacity.total - f.capacity.current;
													return (
														<li
															key={f.id}
															className="flex items-start gap-1.5 rounded-xl bg-dotori-50/70 px-3 py-2"
														>
															<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" />
															<span>
																<strong className="text-forest-700">{f.name}</strong> 현재 TO {toCount}석
															</span>
														</li>
													);
												})}
										</ul>
									) : waitingInterests.length > 0 ? (
										<p className="text-[15px] leading-relaxed text-dotori-700">
											관심 시설 {interestFacilities.length}곳 모두 대기 중이에요.
											{(data?.waitlistCount ?? 0) > 0 &&
												` 나의 대기 ${(data?.waitlistCount ?? 0)}건 진행 중`}
										</p>
									) : (
										<div className="space-y-2">
											<p className="text-[15px] leading-relaxed text-dotori-700">
												토리에게 조건을 말해주면 입소 가능 시설을 바로 추천해드려요.
											</p>
											<Skeleton variant="text" />
										</div>
									)}
								</div>
							) : (
								<div className="space-y-2">
									<p className="text-[17px] font-bold text-dotori-900">
										AI 브리핑을 준비 중이에요
									</p>
									<p className="text-[15px] leading-relaxed text-dotori-700">
										우리 아이에 맞는 브리핑을 실시간으로 만들고 있어요.
									</p>
									<Skeleton variant="text" />
									<Skeleton variant="text" />
								</div>
							)}
							<Link
								href="/chat"
								className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-dotori-600 transition-colors hover:text-dotori-700"
							>
								<SparklesIcon className="h-3.5 w-3.5" />
								토리에게 자세히 물어보기
							</Link>
						</AiBriefingCard>
					</motion.div>
				</motion.section>

				{/* ── 빈자리 알림 섹션 ── */}
				<motion.section
					className="mt-6"
					initial="hidden"
					animate="show"
					variants={sectionStagger}
				>
					<h2 className="mb-2 text-[17px] font-bold">빈자리 알림</h2>
					<motion.div variants={cardReveal}>
						{isPremiumUser ? (
							<div className="rounded-3xl bg-white p-4 ring-1 ring-dotori-100">
								<p className="text-[15px] font-semibold text-dotori-800">
									알림 건수: {data?.alertCount ?? 0}건
								</p>
								<p className="mt-1 text-[13px] text-forest-700">
									실시간 빈자리 상태를 확인할 수 있어요
								</p>
							</div>
						) : (
							<div className="rounded-3xl bg-dotori-50 p-4 ring-1 ring-dotori-100">
								<p className="text-[14px] font-semibold text-dotori-800">
									프리미엄 전용 기능
								</p>
								<p className="mt-1 text-[13px] text-dotori-700">
									빈자리 즉시 알림은 월 1,900원 프리미엄에서 이용할 수 있어요
								</p>
							</div>
						)}
					</motion.div>
				</motion.section>

				{/* ── 실시간 시설 현황 ── */}
				{data && (
					<motion.section
						className="mt-8"
						initial="hidden"
						animate="show"
						variants={sectionStagger}
					>
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-[17px] font-bold">현재 입소 가능한 시설</h2>
							<Link
								href="/explore"
								className="flex items-center gap-0.5 py-1 text-[14px] text-dotori-500 transition-colors hover:text-dotori-600"
							>
								실시간 확인
								<ChevronRightIcon className="h-4 w-4" />
							</Link>
						</div>
						{realtimeAvailableFacilities.length > 0 ? (
							<div className="space-y-3">
								{realtimeAvailableFacilities.slice(0, 3).map((facility) => (
									<motion.div
										key={facility.id}
										variants={cardReveal}
										className="rounded-2xl"
									>
										<Link href={`/facility/${facility.id}`}>
											<FacilityCard facility={facility} compact />
										</Link>
									</motion.div>
								))}
							</div>
						) : (
							<motion.div
								variants={cardReveal}
								className="rounded-3xl bg-white p-5 ring-1 ring-dotori-100"
							>
								<p className="text-[15px] leading-relaxed text-dotori-800">
									현재 입소 가능한 시설이 없어요.
								</p>
								<p className="mt-1 text-[13px] text-dotori-500">
										{interestFacilities.length > 0
										? `관심 ${interestFacilities.length}곳은 지금 대기 중이에요`
										: "주변 시설에서 다시 확인해보세요"}
								</p>
								<Link
									href="/my/waitlist"
									className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-dotori-500 px-4 py-2 text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
								>
									대기 현황 확인
								</Link>
							</motion.div>
						)}
					</motion.section>
				)}

				{/* ── NBA 카드 ── */}
				{orderedNBAs.length > 0 && (
					<motion.section
						className="mt-5 space-y-2"
						initial="hidden"
						animate="show"
						variants={sectionStagger}
					>
						{orderedNBAs.map((nba) => (
							<motion.div key={nba.id} variants={cardReveal}>
								<NBACard nba={nba} onDismiss={handleDismiss} />
							</motion.div>
						))}
					</motion.section>
				)}

				{/* ── 관심 시설 변동 ── */}
				{data && interestFacilities.length > 0 && isInterestStatusReady && (
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
											{urgentFacility.status === "available" ? (
												<Badge
													color="forest"
													className="absolute left-3 top-3 z-10 px-2 py-0.5 text-xs"
												>
													빈자리 있어요!
												</Badge>
											) : null}
											<FacilityCard
												facility={urgentFacility}
												compact
											/>
										</div>
									</Link>
								</div>
							)}
							{interestFacilities.slice(0, 3).map((f, i) => (
								<div
									key={f.id}
									className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300"
									style={{
										animationDelay: `${(i + 1) * 80}ms`,
										animationFillMode: "both",
									}}
								>
									<Link href={`/facility/${f.id}`}>
										<div className="relative">
											{f.status === "available" ? (
												<Badge
													color="forest"
													className="absolute left-3 top-3 z-10 px-2 py-0.5 text-xs"
												>
													빈자리 있어요!
												</Badge>
											) : null}
											<FacilityCard facility={f} compact />
										</div>
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
							{todayTip}
						</p>
						<Link
							href="/explore"
							className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-forest-600 transition-colors hover:text-forest-700"
						>
							빈자리 찾기
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
											이미 다니고 있는데 고민 중이신가요?
										</p>
									</div>
									<Link
										href="/login"
										className="inline-flex shrink-0 rounded-xl bg-dotori-400 px-4 py-2 text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
									>
										무료로 이동 상담하기 →
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
							이동 맞춤 알림 받기
						</h3>
						<p className="mt-1.5 text-[14px] leading-snug text-white/70">
							아이 나이와 지역을 등록하면 이동 최적 시기를 알려드려요
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

	}
const NBACard = memo(function NBACard({
	nba,
	onDismiss,
}: {
	nba: NBAItem;
	onDismiss: (id: string) => void;
}) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-3xl bg-gradient-to-r from-dotori-50 to-white p-5 shadow-sm ring-1 ring-dotori-200/30",
				"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300",
			)}
		>
			<button
				onClick={() => onDismiss(nba.id)}
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
				<div className="relative mt-3">
					<Button href={nba.action.href} color="dotori">
						{nba.action.label}
					</Button>
				</div>
			)}
		</div>
	);
});
