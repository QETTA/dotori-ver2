"use client";

/**
 * ExploreResultList — Facility search result list
 *
 * hasDesignTokens: true  — DS_STATUS, DS_CARD, DS_TYPOGRAPHY
 * hasBrandSignal:  true  — DS_STATUS (status pills), DS_CARD.raised (facility cards)
 */
import { HeartIcon } from "@heroicons/react/24/solid";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import Link from "next/link";
import { memo } from "react";
import { DsButton } from "@/components/ds/DsButton";
import { UiBlock } from "@/components/dotori/blocks/UiBlock";

import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { Skeleton } from "@/components/dotori/Skeleton";
import { NoiseTexture } from "@/components/dotori/NoiseTexture";
import { DS_STATUS, DS_TYPOGRAPHY, DS_TEXT } from '@/lib/design-system/tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { fadeUp, stagger, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { UiBlock as UiBlockType } from "@/types/dotori";
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

const getStatusBarGradient = (status: string) => {
	if (status === "available") return "from-forest-500/20 via-forest-500 to-forest-500/20";
	if (status === "waiting") return "from-amber-500/20 via-amber-500 to-amber-500/20";
	return "from-red-500/20 via-red-500 to-red-500/20";
};

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
	const emptyCtaBlock: UiBlockType = {
		type: "ui_block",
		title: "다음으로 해볼 수 있어요",
		subtitle: "조건을 조정하거나 토리에게 바로 물어보세요",
		layout: "list",
		items: [
			{
				id: "explore-empty-primary",
				title: emptyPrimaryAction.label,
				description: hasSearchInput
					? "검색어를 지우고 다시 탐색합니다."
					: hasFilterApplied
						? "적용한 필터를 해제하고 다시 탐색합니다."
						: "조건을 초기화하고 다시 탐색합니다.",
				actionId: "explore_empty_primary",
				actionLabel: "다시 찾기",
			},
			{
				id: "explore-empty-chat",
				title: "토리에게 물어보기",
				description: "이동 조건을 입력하면 후보를 정리해드려요.",
				href: chatPromptHref,
				actionLabel: "토리에게 물어보기",
			},
		],
	};

	return (
		<div className="relative min-h-[50vh] px-4 pt-3 pb-28">

			{/* ── Loading state ── */}
			{isLoading && !isTimeout ? (
				<div className="pb-4">
					<Skeleton variant="facility-card" count={6} />
				</div>
			) : null}

			{/* ── Error state ── */}
			{(!isLoading && error) || isTimeout ? (
				<motion.div {...fadeUp} className="flex min-h-[40vh] flex-col items-center justify-center">
					<ErrorState
						variant="network"
						message={isTimeout ? "시설 목록을 불러오지 못했어요" : "시설 목록을 불러올 수 없습니다"}
						action={{ label: "다시 시도", onClick: onRetry }}
						secondaryAction={{ label: '홈으로 이동', href: '/' }}
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
				<motion.ul {...stagger.fast.container} className="relative space-y-4 pb-4">
					{/* ── Insight banner ── */}
					<motion.li {...stagger.fast.item}>
						<div className={cn('relative overflow-hidden', DS_CARD.raised.base, DS_CARD.raised.dark)}>
						<div className="h-1.5 bg-gradient-to-r from-violet-400 via-dotori-400 to-amber-400" />
						<NoiseTexture opacity={0.02} />
						<div className="flex items-start gap-3 px-4 py-3">
							<ChatBubbleLeftIcon className="mt-0.5 h-4 w-4 shrink-0 text-dotori-400" />
							<div>
								<p className={cn(DS_TYPOGRAPHY.bodySm, DS_TEXT.secondary)}>
									{hasSearchInput
										? `"${debouncedSearch}" 기준으로 이동 가능한 시설부터 정렬했어요.`
										: "이동 수요 우선순위 기준으로 시설을 정렬했어요."}
								</p>
								<p className={cn(DS_TYPOGRAPHY.caption, 'mt-0.5', DS_TEXT.muted)}>
									토리톡 인사이트
								</p>
							</div>
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
								<div className={cn(
								'overflow-hidden',
								DS_CARD.raised.base, DS_CARD.raised.dark, DS_CARD.raised.hover,
							)}>
								{/* Status accent bar */}
								<div className={cn('h-1.5 bg-gradient-to-r', getStatusBarGradient(facility.status))} />

								<div className="relative z-10">
									<FacilityCard facility={facility} compact />

								{/* ── Status + Stats inline row ── */}
								<div className="border-t border-dotori-200/40 px-4 py-3 dark:border-dotori-800/40">
									<div className="flex flex-wrap items-center gap-1.5">
										<span className={cn(
											'inline-flex items-center rounded-full px-2.5 py-1 font-semibold',
											DS_TYPOGRAPHY.caption,
											getStatusPillClass(facility.status),
										)}>
											{facility.status === "available"
												? `${getStatusLabel(facility.status)} · ${availableSeats}석`
												: facility.status === "waiting"
													? `${getStatusLabel(facility.status)} ${facility.capacity.waiting}명`
													: getStatusLabel(facility.status)}
										</span>
										<span className={cn(
											'inline-flex items-center rounded-full px-2.5 py-1 font-medium',
											DS_TYPOGRAPHY.caption,
											DS_STATUS.full.pill,
										)}>
											{facility.type}
										</span>
										{facility.distance ? (
											<span className={cn(
												'inline-flex items-center rounded-full px-2.5 py-1',
												DS_TYPOGRAPHY.caption,
												DS_STATUS.full.pill,
											)}>
												{facility.distance}
											</span>
										) : null}
									</div>

									{/* ── Compact stat row ── */}
									<div className={cn('mt-3 flex items-center gap-4', DS_TYPOGRAPHY.caption)}>
										<div>
											<span className={DS_TEXT.muted}>입소률 </span>
											<span className={cn('font-semibold', DS_TEXT.primary)}>{occupancyRate}%</span>
										</div>
										<span className={DS_TEXT.disabled}>|</span>
										<div>
											<span className={DS_TEXT.muted}>가용 </span>
											<span className={cn(
												'font-semibold',
												isAvailable ? 'text-forest-600 dark:text-forest-400' : DS_TEXT.primary,
											)}>
												{isAvailable ? `${availableSeats}석` : `대기 ${facility.capacity.waiting}명`}
											</span>
										</div>
										<span className={DS_TEXT.disabled}>|</span>
										<div>
											<span className={DS_TEXT.muted}>리뷰 </span>
											<span className={cn('font-semibold', DS_TEXT.primary)}>{reviewLabel}</span>
										</div>
									</div>
								</div>

								{/* ── Actions — z-30 above click zone ── */}
								<div className="relative z-30 flex items-center justify-end gap-2 border-t border-dotori-200/40 px-4 py-2.5 dark:border-dotori-800/40">
									<motion.div {...tap.chip}>
										<DsButton
											variant="ghost"
											type="button"
											disabled={isActionLoading}
											onClick={() => onRegisterInterest(facility.id)}
											className={cn(
												'inline-flex min-h-9 items-center gap-1 rounded-full px-3 font-medium transition-colors',
												DS_TYPOGRAPHY.caption,
												DS_STATUS.full.pill,
												'hover:bg-dotori-200 dark:hover:bg-dotori-700',
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
										'min-h-11 w-full font-medium',
										DS_TYPOGRAPHY.bodySm,
										DS_CARD.raised.base, DS_CARD.raised.dark,
										DS_TEXT.secondary,
										'hover:bg-dotori-50 dark:hover:bg-dotori-800',
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
						<UiBlock
							block={emptyCtaBlock}
							onAction={(actionId) => {
								if (actionId === "explore_empty_primary") {
									emptyPrimaryAction.onClick();
								}
							}}
						/>
					</motion.div>
				) : null}
		</div>
	);
});
