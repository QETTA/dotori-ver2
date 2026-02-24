"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import Link from "next/link";
import { memo } from "react";
import { DsButton } from "@/components/ds/DsButton";
import { AiBriefingCard } from "@/components/dotori/AiBriefingCard";
import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { Skeleton } from "@/components/dotori/Skeleton";
import { BRAND } from "@/lib/brand-assets";
import { DS_GLASS, DS_STATUS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { fadeUp, stagger, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type {
	ExploreResultActions,
	ExploreResultInteraction,
	ExploreResultState,
} from "./useExploreSearch";

interface ExploreResultListProps {
	state: ExploreResultState;
	actions: ExploreResultActions;
	interaction: ExploreResultInteraction;
}

const facilityCardClassName = cn(
	DS_GLASS.CARD,
	"overflow-hidden rounded-2xl border border-dotori-100/70 bg-dotori-50/80 shadow-sm ring-1 ring-dotori-100/70",
);

const actionRowClassName = cn(
	DS_GLASS.CARD,
	"flex flex-wrap items-center justify-end gap-1.5 rounded-b-2xl border-t border-dotori-100/70 bg-dotori-50/85 px-3 py-2.5",
);

const summaryBadgeClassName = cn(
	"inline-flex items-center rounded-full border border-dotori-100/70 bg-white/80 px-2.5 py-1 text-caption font-semibold text-dotori-700 ring-1 ring-dotori-100/50",
	"dark:bg-dotori-950/55 dark:text-dotori-100 dark:ring-dotori-700/40 dark:border-dotori-700/60",
);

const getStatusPillClass = (status: string) => {
	if (status === "available") return DS_STATUS.available.pill;
	if (status === "waiting") return DS_STATUS.waiting.pill;
	return DS_STATUS.full.pill;
};

const getStatusLabel = (status: string) => {
	if (status === "available") return DS_STATUS.available.label;
	if (status === "waiting") return DS_STATUS.waiting.label;
	return DS_STATUS.full.label;
};

const getAvailableSeats = (total: number, current: number) => Math.max(0, total - current);
const getOccupancyRate = (total: number, current: number) =>
	total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

export const ExploreResultList = memo(function ExploreResultList({
	state,
	actions,
	interaction,
}: ExploreResultListProps) {
	const {
		facilities,
		isLoading,
		isLoadingMore,
		error,
		isTimeout,
		hasMore,
		hasSearchInput,
		hasFilterApplied,
		debouncedSearch,
		chatPromptHref,
	} = state;
	const { onRetry, onLoadMore, onResetSearch, onResetFilters } = actions;
	const { loadingAction, onRegisterInterest, onApplyWaiting } = interaction;

	const hasResults = facilities.length > 0;

	const emptyPrimaryAction = hasSearchInput
		? { label: "검색어 지우고 다시 찾기", onClick: onResetSearch }
		: hasFilterApplied
			? { label: "필터 풀고 다시 찾기", onClick: onResetFilters }
			: { label: "조건 다시 설정", onClick: onResetSearch };

	return (
		<div className="relative bg-gradient-to-b from-dotori-50 via-dotori-50 to-dotori-100/45 px-3 pt-2 dark:from-dotori-950 dark:via-dotori-950 dark:to-dotori-900/45">
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-2 mx-auto h-32 w-32 opacity-5"
			/>
			{isLoading && !isTimeout ? (
				<div className="pb-4">
					<Skeleton variant="facility-card" count={6} />
				</div>
			) : null}

			{(!isLoading && error) || isTimeout ? (
				<motion.div {...fadeUp}>
					<ErrorState
						variant="network"
						message={isTimeout ? "시설 목록을 불러오지 못했어요" : "시설 목록을 불러올 수 없습니다"}
						action={{ label: "다시 시도", onClick: onRetry }}
					/>
				</motion.div>
			) : null}

			{isLoadingMore ? (
				<div className="pb-4">
					<Skeleton variant="facility-card" count={2} />
				</div>
			) : null}

			{!isLoading && !error && hasResults ? (
				<motion.ul {...stagger.fast.container} className="relative space-y-3 pb-4">
					<motion.li {...stagger.fast.item}>
						<AiBriefingCard
							message={
								hasSearchInput
									? `"${debouncedSearch}" 이동 고민 기준으로 이동 가능한 시설부터 정렬했어요.`
									: "지도와 이동 수요 우선순위 기준으로 시설을 정렬했어요."
							}
							source="AI분석"
						/>
					</motion.li>

					{facilities.map((facility) => {
						const isActionLoading =
							loadingAction === `interest-${facility.id}` ||
							loadingAction === `waiting-${facility.id}`;
						const isAvailable = facility.status === "available";
						const availableSeats = getAvailableSeats(
							facility.capacity.total,
							facility.capacity.current,
						);
						const occupancyRate = getOccupancyRate(
							facility.capacity.total,
							facility.capacity.current,
						);
						const reviewLabel =
							facility.rating > 0 || facility.reviewCount > 0
								? `리뷰 ${facility.reviewCount}건 · ${facility.rating.toFixed(1)}점`
								: "리뷰 0건";

						return (
							<motion.li
								key={facility.id}
								{...stagger.fast.item}
								className={cn(facilityCardClassName, "space-y-0")}
							>
								<motion.div {...tap.card}>
									<Link href={`/facility/${facility.id}`} className="relative block min-h-11">
										<img
											src={BRAND.watermark}
											alt=""
											aria-hidden="true"
											className="pointer-events-none absolute -right-4 top-4 h-24 w-24 opacity-10"
										/>
										<FacilityCard facility={facility} compact />
									</Link>
								</motion.div>

								<div className="border-t border-dotori-100/70 px-3 py-2.5">
									<div className="flex flex-wrap items-center gap-1.5">
										<span
											className={cn(
												summaryBadgeClassName,
												getStatusPillClass(facility.status),
												"border-white/40",
											)}
											aria-label={`시설 상태 ${getStatusLabel(facility.status)}`}
										>
											{facility.status === "available"
												? `${getStatusLabel(facility.status)} · ${availableSeats}석`
												: facility.status === "waiting"
													? `${getStatusLabel(facility.status)} ${facility.capacity.waiting}명`
													: getStatusLabel(facility.status)}
										</span>
										<span className={cn(summaryBadgeClassName, "text-dotori-800 dark:text-dotori-100")}>
											{facility.type}
										</span>
										{facility.distance ? (
											<span className={cn(summaryBadgeClassName, "text-dotori-700 dark:text-dotori-200")}>
												{facility.distance}
											</span>
										) : null}
									</div>

									<div className="mt-2.5 grid grid-cols-3 gap-1.5">
										<div className="rounded-2xl bg-dotori-100/85 p-2 text-center ring-1 ring-dotori-100/70 dark:bg-dotori-900/45 dark:ring-dotori-700/40">
											<p className="text-caption text-dotori-700 dark:text-dotori-100">입소률</p>
											<p className={cn(DS_TYPOGRAPHY.body, "font-semibold text-dotori-900 dark:text-dotori-50")}>{occupancyRate}%</p>
										</div>
										<div className="rounded-2xl bg-dotori-100/85 p-2 text-center ring-1 ring-dotori-100/70 dark:bg-dotori-900/45 dark:ring-dotori-700/40">
											<p className="text-caption text-dotori-700 dark:text-dotori-100">가용석</p>
											<p
												className={cn(
													DS_TYPOGRAPHY.body,
													"font-semibold",
													facility.status === "available" ? "text-forest-700" : "text-dotori-900 dark:text-dotori-50",
												)}
											>
												{facility.status === "available" ? `${availableSeats}석` : `${facility.capacity.waiting}명`}
											</p>
										</div>
										<div className="rounded-2xl bg-dotori-100/85 p-2 text-center ring-1 ring-dotori-100/70 dark:bg-dotori-900/45 dark:ring-dotori-700/40">
											<p className="text-caption text-dotori-700 dark:text-dotori-100">리뷰</p>
											<p className={cn("line-clamp-1 font-semibold text-dotori-900 dark:text-dotori-50", DS_TYPOGRAPHY.body)}>
												{facility.reviewCount}건
												{facility.rating > 0 ? ` · ${facility.rating.toFixed(1)}점` : ""}
											</p>
										</div>
									</div>
									<p className="mt-2 px-0.5 text-caption text-dotori-600 dark:text-dotori-200">{reviewLabel}</p>
								</div>

								<div className={actionRowClassName}>
									<motion.div {...tap.chip}>
										<DsButton
										 variant="ghost"
											type="button"
											disabled={isActionLoading}
											onClick={() => onRegisterInterest(facility.id)}
											className={cn(
												"inline-flex min-h-10 items-center gap-1 rounded-full bg-dotori-100 px-3 text-caption font-semibold text-dotori-700 transition-colors duration-150 dark:bg-dotori-900/35 dark:text-dotori-100",
											)}
										>
											<HeartIcon className="h-3.5 w-3.5" />
											관심
										</DsButton>
									</motion.div>
									<motion.div {...tap.chip}>
										<DsButton
										
											type="button"
											disabled={isActionLoading}
											onClick={() => onApplyWaiting(facility.id)}
											className={cn(
												"min-h-10 inline-flex items-center gap-1 rounded-full px-4 text-caption font-semibold",
											)}
										>
											{isAvailable ? "입소신청" : "대기신청"}
										</DsButton>
									</motion.div>
								</div>
							</motion.li>
						);
					})}

					{hasMore ? (
						<motion.li {...stagger.fast.item} className="pt-2">
							<motion.div {...tap.chip}>
								<DsButton
								
									onClick={onLoadMore}
									disabled={isLoadingMore}
									className="min-h-11 w-full text-body"
								>
									{isLoadingMore ? "불러오는 중..." : "더 보기"}
								</DsButton>
							</motion.div>
						</motion.li>
					) : null}
				</motion.ul>
			) : null}

			{!isLoading && !error && !isTimeout && !hasResults ? (
				<motion.div {...fadeUp} className="space-y-4 pb-4">
					<EmptyState
						variant="transfer"
						title={hasSearchInput ? `"${debouncedSearch}"로는 결과가 없어요` : "이 조건에 맞는 시설이 없어요"}
						description={
							!hasSearchInput && !hasFilterApplied
								? "현재 지역 기준으로 바로 이동 가능한 시설을 찾지 못했어요. ‘이동 가능 시설만 보기’를 켜거나 지역을 넓혀보세요."
								: "지역·시설 유형·정렬을 조금만 바꾸면 결과가 나올 수 있어요. 필터를 조정해 다시 찾아볼까요?"
						}
					/>
					<div className="space-y-2.5">
						<motion.div {...tap.chip}>
							<DsButton
							
								type="button"
								onClick={emptyPrimaryAction.onClick}
								className="min-h-11 w-full text-body"
							>
								{emptyPrimaryAction.label}
							</DsButton>
						</motion.div>
						<motion.div {...tap.chip}>
							<DsButton
							 variant="ghost"
								href={chatPromptHref}
								className={cn(
									"text-body-sm",
									"min-h-11 w-full justify-center rounded-2xl bg-white text-dotori-700 ring-1 ring-dotori-100 transition-colors duration-150 hover:bg-dotori-50 dark:bg-dotori-950 dark:text-dotori-100 dark:ring-dotori-800 dark:hover:bg-dotori-900",
								)}
							>
								토리에게 물어보기
							</DsButton>
						</motion.div>
					</div>
				</motion.div>
			) : null}
		</div>
	);
});
