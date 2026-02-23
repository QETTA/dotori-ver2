"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";
import { AiBriefingCard } from "@/components/dotori/AiBriefingCard";
import { ErrorState } from "@/components/dotori/ErrorState";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { Skeleton } from "@/components/dotori/Skeleton";
import { Surface } from "@/components/dotori/Surface";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { generateNBAs } from "@/lib/engine/nba-engine";
import { fadeUp, spring, stagger, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { CommunityPost, Facility, UserProfile } from "@/types/dotori";

const AI_PLACEHOLDER = "이동 고민이라면 뭐든 물어보세요";
const AI_CHIPS = ["반편성 불만", "교사 교체", "국공립 당첨"] as const;

type VacancyScope = "nearby" | "all";

interface HomeData {
	user: UserProfile | null;
	nearbyFacilities: Facility[];
	interestFacilities: Facility[];
	hotPosts: CommunityPost[];
	alertCount: number;
	waitlistCount: number;
	bestWaitlistPosition?: number;
	waitlistFacilityName?: string;
	sources?: {
		isalang?: {
			updatedAt?: string;
		};
	};
}

export default function HomePage() {
	const router = useRouter();
	const [homeData, setHomeData] = useState<HomeData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [vacancyScope, setVacancyScope] = useState<VacancyScope>("nearby");

	const fetchHome = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await apiFetch<{ data: HomeData }>("/api/home");
			setHomeData(response.data);
		} catch {
			setError("홈 정보를 불러오지 못했어요");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchHome();
	}, [fetchHome]);

	const user = homeData?.user ?? null;
	const greeting =
		user?.nickname
			? `${user.nickname}님, 안녕하세요`
			: "도토리에 오신 것을 환영해요";

	const nbaItems = useMemo(
		() =>
			homeData
				? generateNBAs({
						user,
						interestFacilities: homeData.interestFacilities,
						alertCount: homeData.alertCount,
						waitlistCount: homeData.waitlistCount,
						bestWaitlistPosition: homeData.bestWaitlistPosition,
						waitlistFacilityName: homeData.waitlistFacilityName,
					})
				: [],
		[homeData, user],
	);

	const vacancyGuide = useMemo(() => {
		const vacancyNba = nbaItems.find((item) => item.id.includes("vacancy"));
		if (vacancyNba) {
			return vacancyNba.description;
		}
		const moveConcernNba = nbaItems.find((item) => item.id === "move_concern");
		if (moveConcernNba) {
			return moveConcernNba.description;
		}
		return "조건에 맞는 시설을 먼저 확인하고 이동 결정을 도와드릴게요";
	}, [nbaItems]);

	const nearbyAvailableFacilities = useMemo(
		() => (homeData?.nearbyFacilities ?? []).filter((facility) => facility.status === "available"),
		[homeData?.nearbyFacilities],
	);

	const allAvailableFacilities = useMemo(() => {
		const sourceFacilities = [
			...(homeData?.nearbyFacilities ?? []),
			...(homeData?.interestFacilities ?? []),
		].filter((facility) => facility.status === "available");
		const seenIds = new Set<string>();
		return sourceFacilities.filter((facility) => {
			if (seenIds.has(facility.id)) {
				return false;
			}
			seenIds.add(facility.id);
			return true;
		});
	}, [homeData?.interestFacilities, homeData?.nearbyFacilities]);

	const visibleFacilities = vacancyScope === "nearby" ? nearbyAvailableFacilities : allAvailableFacilities;
	const hotPost = homeData?.hotPosts[0] ?? null;
	const communityLine = hotPost
		? `${hotPost.author.nickname}: ${hotPost.content}`
		: "이동 고민 글을 커뮤니티에서 확인해보세요";
	const statusCards = [
		{
			label: "주변 빈자리",
			count: nearbyAvailableFacilities.length,
			unit: "곳",
			tone: "forest",
			emptyCta: { label: "탐색 시작", href: "/explore" },
		},
		{
			label: "관심 시설",
			count: homeData?.interestFacilities.length ?? 0,
			unit: "곳",
			tone: "dotori",
			emptyCta: { label: "시설 찾기", href: "/explore" },
		},
		{
			label: "알림",
			count: homeData?.alertCount ?? 0,
			unit: "건",
			tone: "dotori",
			emptyCta: { label: "알림 설정", href: "/my/notifications" },
		},
	] as const;

	const handleOpenChat = useCallback(() => {
		router.push("/chat");
	}, [router]);

	const handleChipClick = useCallback(
		(chip: (typeof AI_CHIPS)[number]) => {
			router.push(`/chat?prompt=${encodeURIComponent(chip)}`);
		},
		[router],
	);

	if (isLoading) {
		return (
			<div className="px-4 py-5">
				<Skeleton variant="home" />
			</div>
		);
	}

	if (error && !homeData) {
		return (
			<div className="px-4 py-8">
				<ErrorState
					message={error}
					action={{ label: "다시 시도", onClick: () => void fetchHome() }}
				/>
			</div>
		);
	}

	return (
		<div className="px-4 pb-12 pt-4">
			<header className="glass-header sticky top-0 z-10 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
				<div className="mb-3 flex items-center justify-between gap-3">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.lockupHorizontalKr} alt="도토리" className="h-6" />
					<div className="rounded-full border border-dotori-100 bg-white/90 px-2.5 py-1 shadow-sm dark:border-dotori-800 dark:bg-dotori-950/80 dark:shadow-none">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.symbolCorporate} alt="" aria-hidden="true" className="h-4 w-4" />
					</div>
				</div>
				<Heading level={1} className="text-lg font-bold text-dotori-900 dark:text-dotori-50">
					{greeting}
				</Heading>
				<Text className="mt-1 text-sm text-dotori-600 dark:text-dotori-300">
					어린이집 이동, 도토리가 함께해요
				</Text>
				<div className="mt-3 grid grid-cols-3 gap-2">
					{statusCards.map((card) => (
						<Surface
							key={card.label}
							className="px-3 py-2"
							aria-label={card.label}
						>
							<Text className="text-caption font-medium text-dotori-600 dark:text-dotori-300">
								{card.label}
							</Text>
							{card.count > 0 ? (
								<Text
									className={cn(
										"mt-0.5 text-sm font-semibold",
										card.tone === "forest"
											? "text-forest-700 dark:text-forest-400"
											: "text-dotori-800 dark:text-dotori-100",
									)}
								>
									{`${card.count}${card.unit}`}
								</Text>
							) : (
								<Link
									href={card.emptyCta.href}
									className="mt-0.5 inline-flex min-h-8 items-center text-caption font-medium text-dotori-500 transition-colors hover:text-dotori-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dotori-400"
								>
									{card.emptyCta.label}
								</Link>
							)}
						</Surface>
					))}
				</div>
			</header>

			<motion.section {...fadeUp} className="mt-3">
				<div
					role="button"
					tabIndex={0}
					onClick={handleOpenChat}
					onKeyDown={(event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							handleOpenChat();
						}
					}}
					className="group"
				>
					<Surface
						tone="brand"
						className="p-4 transition-transform duration-200 group-active:scale-[0.99]"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.watermark}
							alt=""
							aria-hidden="true"
							className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 opacity-10"
						/>
						<Text className="text-sm font-semibold text-white">AI 토리</Text>
						<div className="mt-1 flex items-center gap-2">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={BRAND.symbolMonoWhite}
								alt=""
								aria-hidden="true"
								className="h-4 w-4 opacity-90"
							/>
							<Text className="text-caption text-dotori-100">
								이동 고민 상담 · 빈자리 우선 탐색
							</Text>
						</div>
						<Fieldset className="mt-3">
							<Field>
								<Input
									readOnly
									value=""
									placeholder={AI_PLACEHOLDER}
									aria-label="토리에게 고민 입력"
									className="min-h-12 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-dotori-100/80 focus:bg-white/15"
								/>
							</Field>
						</Fieldset>
						<div className="mt-3 grid grid-cols-3 gap-2">
							{AI_CHIPS.map((chip) => (
								<motion.button
									key={chip}
									type="button"
									onClick={(event) => {
										event.stopPropagation();
										handleChipClick(chip);
									}}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.97 }}
									transition={spring.chip}
									className="min-h-11 rounded-xl bg-white/10 px-2 py-2 text-caption font-semibold text-white/95 ring-1 ring-inset ring-white/15 transition-colors transition-transform duration-150 hover:bg-white/15 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
									aria-label={`${chip} 고민으로 토리에게 질문하기`}
								>
									{chip}
								</motion.button>
							))}
						</div>
					</Surface>
				</div>
			</motion.section>

			<motion.section {...fadeUp} className="mt-6 space-y-4">
				<div className="flex items-center justify-between gap-2">
					<Heading level={2} className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
						내 주변 빈자리
					</Heading>
					<Button href="/explore" color="dotori" className="min-h-11">
						전체 보기
					</Button>
				</div>

				<AiBriefingCard
					source="AI분석"
					updatedAt={homeData?.sources?.isalang?.updatedAt}
				>
					<div className="space-y-3 rounded-2xl bg-gradient-to-br from-dotori-50/80 to-transparent p-3 dark:from-dotori-900/40">
						<div className="flex items-center gap-2">
							<Badge color="forest">NBA 기반</Badge>
							<Text className="text-sm text-dotori-700 dark:text-dotori-200">
								{vacancyGuide}
							</Text>
						</div>
						<Fieldset>
							<Field>
								<Select
									value={vacancyScope}
									onChange={(event) => {
										setVacancyScope(event.target.value === "all" ? "all" : "nearby");
									}}
									aria-label="빈자리 보기 범위"
									className="[&>select]:min-h-11"
								>
									<option value="nearby">내 주변만 보기</option>
									<option value="all">관심 시설 포함</option>
								</Select>
							</Field>
						</Fieldset>
					</div>
				</AiBriefingCard>

				{visibleFacilities.length > 0 ? (
					<div className="space-y-3">
						{visibleFacilities.slice(0, 3).map((facility) => (
							<Link key={facility.id} href={`/facility/${facility.id}`}>
								<FacilityCard facility={facility} compact />
							</Link>
						))}
					</div>
				) : (
					<Surface className="px-4 py-4 text-center">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.emptyState}
							alt=""
							aria-hidden="true"
							className="mx-auto h-14 w-14"
						/>
						<Heading
							level={3}
							className="mt-2 text-base font-semibold text-dotori-900 dark:text-dotori-50"
						>
							현재 보이는 빈자리가 없어요
						</Heading>
						<Text className="mt-1 text-sm text-dotori-600 dark:text-dotori-300">
							조건을 넓히거나 알림을 켜두면 새 빈자리를 빠르게 확인할 수 있어요.
						</Text>
						<div className="mt-4 space-y-2">
							<Button
								color="dotori"
								href="/my/notifications"
								className="min-h-11 w-full justify-center"
							>
								빈자리 알림 설정
							</Button>
							<Button
								plain={true}
								href="/explore"
								className="min-h-11 w-full justify-center"
							>
								탐색 조건 조정하기
							</Button>
						</div>
					</Surface>
				)}
			</motion.section>

			{nbaItems.length > 0 ? (
				<motion.section {...fadeUp} className="mt-6 space-y-4">
					<div className="flex items-center justify-between gap-2">
						<Heading level={2} className="text-lg font-semibold text-dotori-900 dark:text-dotori-50">
							지금 추천
						</Heading>
						<Button href="/chat" plain={true} className="min-h-11">
							토리에게 물어보기
						</Button>
					</div>

					<motion.ul {...stagger.container} className="space-y-2">
						{nbaItems.slice(0, 4).map((item) => (
							<motion.li key={item.id} {...stagger.item}>
								<motion.div {...tap.card}>
									<Surface className="px-4 py-3">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0 flex-1">
												<Text className="text-sm font-semibold text-dotori-900 dark:text-dotori-50">
													{item.title}
												</Text>
												<Text className="mt-1 text-sm text-dotori-700 dark:text-dotori-200">
													{item.description}
												</Text>
											</div>
											{item.priority >= 80 ? (
												<Badge color="forest">추천</Badge>
											) : (
												<Badge color="dotori">안내</Badge>
											)}
										</div>
										{item.action ? (
											<div className="mt-3">
												<Button
													href={item.action.href}
													color="dotori"
													className="min-h-11 w-full justify-center"
												>
													{item.action.label}
												</Button>
											</div>
										) : null}
									</Surface>
								</motion.div>
							</motion.li>
						))}
					</motion.ul>
				</motion.section>
			) : null}

			<motion.div {...tap.card} className="mt-6">
				<Link
					href="/community"
					className="group flex min-h-11 items-center gap-2 rounded-2xl border border-dotori-100 bg-dotori-50/70 px-4 py-3 shadow-sm transition-colors hover:bg-dotori-100/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dotori-400 dark:border-dotori-800 dark:bg-dotori-950/40 dark:hover:bg-dotori-900/50"
					aria-label="커뮤니티로 이동"
				>
					<Text className="min-w-0 flex-1 truncate text-sm font-medium text-dotori-700 dark:text-dotori-100">
						커뮤니티: {communityLine}
					</Text>
					<ChevronRightIcon className="h-4 w-4 text-dotori-400 transition-transform duration-150 group-hover:translate-x-0.5" />
				</Link>
			</motion.div>
		</div>
	);
}
