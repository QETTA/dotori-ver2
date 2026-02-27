"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import Link from "next/link";
import { memo } from "react";
import { DsButton } from "@/components/ds/DsButton";

import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { Skeleton } from "@/components/dotori/Skeleton";
import { BRAND } from "@/lib/brand-assets";
import { DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
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

const getStatusColor = (status: string) => {
	if (status === "available") return "bg-forest-500";
	if (status === "waiting") return "bg-amber-500";
	return "bg-dotori-300";
};

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
		<div className={cn(
			'relative min-h-[50vh] px-4 pt-3 pb-28',
			/* Warm organic gradient — layered depth */
			'bg-gradient-to-b from-dotori-50/60 via-white via-60% to-forest-50/30',
			'dark:from-dotori-950 dark:via-dotori-950 dark:to-forest-950/20',
		)}>
			{/* Subtle watermark */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-28 w-28 opacity-[0.02]"
			/>

			{/* ── Loading state ── */}
			{isLoading && !isTimeout ? (
				<div className="pb-4">
					<Skeleton variant="facility-card" count={6} />
				</div>
			) : null}

			{/* ── Error state ── */}
			{(!isLoading && error) || isTimeout ? (
				<motion.div {...fadeUp}>
					<ErrorState
						variant="network"
						message={isTimeout ? "시설 목록을 불러오지 못했어요" : "시설 목록을 불러올 수 없습니다"}
						action={{ label: "다시 시도", onClick: onRetry }}
					/>
				</motion.div>
			) : null}

			{/* ── Loading more indicator ── */}
			{isLoadingMore ? (
				<div className="pb-4">
					<Skeleton variant="facility-card" count={2} />
				</div>
			) : null}

			{/* ── Results ── */}
			{!isLoading && !error && hasResults ? (
				<motion.ul {...stagger.fast.container} className="relative space-y-3 pb-4">
					{/* ── Insight banner ── */}
					<motion.li {...stagger.fast.item}>
						<div className="flex items-start gap-3 rounded-2xl bg-dotori-950/[0.025] px-4 py-3 dark:bg-white/[0.03]">
							<ChatBubbleLeftIcon className="mt-0.5 h-4 w-4 shrink-0 text-dotori-400" />
							<div>
								<p className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-600 dark:text-dotori-300')}>
									{hasSearchInput
										? `"${debouncedSearch}" 기준으로 이동 가능한 시설부터 정렬했어요.`
										: "이동 수요 우선순위 기준으로 시설을 정렬했어요."}
								</p>
								<p className={cn(DS_TYPOGRAPHY.caption, 'mt-0.5 text-dotori-400 dark:text-dotori-500')}>
									토리톡 인사이트
								</p>
							</div>
						</div>
					</motion.li>

					{/* ── Facility cards ── */}
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
								? `${facility.reviewCount}건 · ${facility.rating.toFixed(1)}`
								: "0건";

						return (
							<motion.li
								key={facility.id}
								{...stagger.fast.item}
								className="group/card relative"
							>
								<div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-dotori-100/80 transition-all duration-200 group-hover/card:-translate-y-0.5 group-hover/card:shadow-[0_8px_32px_rgba(176,122,74,0.12)] dark:bg-dotori-900/80 dark:ring-dotori-800/60">
								{/* Status accent bar — strongest visual signal */}
								<div className={cn('h-1', getStatusColor(facility.status))} />
								{/* Gradient top bar — visible on hover (TP5 Pattern 5) */}
								<div className="absolute inset-x-0 top-0 z-10 h-0.5 rounded-t-2xl bg-gradient-to-r from-dotori-400 via-amber-400 to-dotori-500 opacity-0 transition-opacity group-hover/card:opacity-100" />

								<div className="relative z-10">
									<FacilityCard facility={facility} compact />

								{/* ── Status + Stats inline row ── */}
								<div className="border-t border-dotori-100/60 px-4 py-3 dark:border-dotori-800/40">
									<div className="flex flex-wrap items-center gap-1.5">
										<span className={cn(
											'inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold',
											getStatusPillClass(facility.status),
										)}>
											{facility.status === "available"
												? `${getStatusLabel(facility.status)} · ${availableSeats}석`
												: facility.status === "waiting"
													? `${getStatusLabel(facility.status)} ${facility.capacity.waiting}명`
													: getStatusLabel(facility.status)}
										</span>
										<span className="inline-flex items-center rounded-full bg-dotori-950/[0.04] px-2.5 py-1 text-caption font-medium text-dotori-700 dark:bg-white/[0.06] dark:text-dotori-200">
											{facility.type}
										</span>
										{facility.distance ? (
											<span className="inline-flex items-center rounded-full bg-dotori-950/[0.04] px-2.5 py-1 text-caption text-dotori-500 dark:bg-white/[0.06] dark:text-dotori-400">
												{facility.distance}
											</span>
										) : null}
									</div>

									{/* ── Compact stat row ── */}
									<div className="mt-3 flex items-center gap-4 text-caption">
										<div>
											<span className="text-dotori-500 dark:text-dotori-400">입소률 </span>
											<span className="font-semibold text-dotori-900 dark:text-dotori-50">{occupancyRate}%</span>
										</div>
										<span className="text-dotori-200 dark:text-dotori-700">|</span>
										<div>
											<span className="text-dotori-500 dark:text-dotori-400">가용 </span>
											<span className={cn(
												'font-semibold',
												isAvailable ? 'text-forest-600 dark:text-forest-400' : 'text-dotori-900 dark:text-dotori-50',
											)}>
												{isAvailable ? `${availableSeats}석` : `대기 ${facility.capacity.waiting}명`}
											</span>
										</div>
										<span className="text-dotori-200 dark:text-dotori-700">|</span>
										<div>
											<span className="text-dotori-500 dark:text-dotori-400">리뷰 </span>
											<span className="font-semibold text-dotori-900 dark:text-dotori-50">{reviewLabel}</span>
										</div>
									</div>
								</div>

								{/* ── Actions — z-30 above click zone ── */}
								<div className="relative z-30 flex items-center justify-end gap-2 border-t border-dotori-100/40 px-4 py-2.5 dark:border-dotori-800/30">
									<motion.div {...tap.chip}>
										<DsButton
											variant="ghost"
											type="button"
											disabled={isActionLoading}
											onClick={() => onRegisterInterest(facility.id)}
											className="inline-flex min-h-9 items-center gap-1 rounded-full bg-dotori-950/[0.04] px-3 text-caption font-medium text-dotori-600 transition-colors hover:bg-dotori-100 dark:bg-white/[0.05] dark:text-dotori-300 dark:hover:bg-dotori-800"
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
											className="min-h-9 inline-flex items-center gap-1 rounded-full px-4 text-caption font-semibold"
										>
											{isAvailable ? "입소신청" : "대기신청"}
										</DsButton>
									</motion.div>
								</div>
								</div>{/* close z-10 content */}
								</div>{/* close outer wrapper */}
								{/* Layer 2: Click zone — z-20 */}
								<Link href={`/facility/${facility.id}`} className="absolute inset-0 z-20 rounded-2xl" aria-label={facility.name} />
							</motion.li>
						);
					})}

					{/* ── Load more ── */}
					{hasMore ? (
						<motion.li {...stagger.fast.item} className="pt-1">
							<motion.div {...tap.chip}>
								<DsButton
									onClick={onLoadMore}
									disabled={isLoadingMore}
									variant="ghost"
									className={cn(
										'min-h-11 w-full rounded-2xl text-body-sm font-medium',
										'bg-white text-dotori-600 ring-1 ring-dotori-200/50',
										'hover:bg-dotori-50 hover:ring-dotori-300/50',
										'dark:bg-dotori-900/60 dark:text-dotori-300 dark:ring-dotori-700/40',
									)}
								>
									{isLoadingMore ? "불러오는 중..." : "더 보기"}
								</DsButton>
							</motion.div>
						</motion.li>
					) : null}
				</motion.ul>
			) : null}

			{/* ── Empty state ── */}
			{!isLoading && !error && !isTimeout && !hasResults ? (
				<motion.div {...fadeUp} className="space-y-4 pb-4">
					<EmptyState
						variant="transfer"
						title={hasSearchInput ? `"${debouncedSearch}"로는 결과가 없어요` : "이 조건에 맞는 시설이 없어요"}
						description={
							!hasSearchInput && !hasFilterApplied
								? "현재 지역 기준으로 바로 이동 가능한 시설을 찾지 못했어요. '이동 가능 시설만 보기'를 켜거나 지역을 넓혀보세요."
								: "지역·시설 유형·정렬을 조금만 바꾸면 결과가 나올 수 있어요."
						}
					/>
					<div className="space-y-2">
						<motion.div {...tap.chip}>
							<DsButton
								type="button"
								onClick={emptyPrimaryAction.onClick}
								className="min-h-11 w-full text-body-sm"
							>
								{emptyPrimaryAction.label}
							</DsButton>
						</motion.div>
						<motion.div {...tap.chip}>
							<DsButton
								variant="ghost"
								href={chatPromptHref}
								className={cn(
									'min-h-11 w-full justify-center rounded-2xl text-body-sm',
									'bg-dotori-950/[0.025] text-dotori-600 ring-1 ring-dotori-200/40',
									'hover:bg-dotori-50',
									'dark:bg-white/[0.03] dark:text-dotori-300 dark:ring-dotori-700/40',
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
