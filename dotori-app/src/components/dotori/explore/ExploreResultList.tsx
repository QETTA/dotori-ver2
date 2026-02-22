"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import Link from "next/link";
import { memo } from "react";
import { Button } from "@/components/catalyst/button";
import { AiBriefingCard } from "@/components/dotori/AiBriefingCard";
import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { Skeleton } from "@/components/dotori/Skeleton";
import { stagger } from "@/lib/motion";
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
		<div className="flex-1 overflow-y-auto bg-dotori-50 px-4 pt-2 dark:bg-dotori-950">
			{isLoading && !isTimeout ? (
				<div className="pb-4">
					<Skeleton variant="facility-card" count={6} />
				</div>
			) : null}

			{(!isLoading && error) || isTimeout ? (
				<div className="duration-300 motion-safe:animate-in motion-safe:fade-in">
					<ErrorState
						variant="network"
						message={isTimeout ? "시설 목록을 불러오지 못했어요" : "시설 목록을 불러올 수 없습니다"}
						action={{ label: "다시 시도", onClick: onRetry }}
					/>
				</div>
			) : null}

			{isLoadingMore ? (
				<div className="pb-4">
					<Skeleton variant="facility-card" count={2} />
				</div>
			) : null}

			{!isLoading && !error && hasResults ? (
				<motion.ul {...stagger.fast.container} className="space-y-4 pb-4">
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

						return (
							<motion.li
								key={facility.id}
								{...stagger.fast.item}
								className="space-y-2"
							>
								<Link href={`/facility/${facility.id}`} className="block min-h-11">
									<FacilityCard facility={facility} compact />
								</Link>

								<div className="flex items-center justify-end gap-2 border-t border-dotori-100/60 pt-2 dark:border-dotori-800/60">
									<Button
										plain={true}
										type="button"
										disabled={isActionLoading}
										onClick={() => onRegisterInterest(facility.id)}
										className="min-h-11 text-sm text-dotori-700 transition-transform duration-150 active:scale-[0.97] dark:text-dotori-100"
									>
										<HeartIcon className="h-3.5 w-3.5" />
										관심
									</Button>
									{isAvailable ? (
										<Button
											plain={true}
											type="button"
											disabled={isActionLoading}
											onClick={() => onApplyWaiting(facility.id)}
											className="min-h-11 bg-forest-100 px-4 text-sm font-semibold text-forest-900 ring-1 ring-forest-300 transition-colors transition-transform duration-150 hover:bg-forest-200 active:scale-[0.97] dark:bg-forest-900/30 dark:text-forest-100 dark:ring-forest-700/60 dark:hover:bg-forest-900/40"
										>
											입소신청
										</Button>
									) : (
										<Button
											color="dotori"
											type="button"
											disabled={isActionLoading}
											onClick={() => onApplyWaiting(facility.id)}
											className="min-h-11 transition-transform duration-150 active:scale-[0.97]"
										>
											대기신청
										</Button>
									)}
								</div>
							</motion.li>
						);
					})}

					{hasMore ? (
						<motion.li {...stagger.fast.item} className="pt-2">
							<Button
								color="dotori"
								onClick={onLoadMore}
								disabled={isLoadingMore}
								className="min-h-11 w-full transition-transform duration-150 active:scale-[0.97]"
							>
								{isLoadingMore ? "불러오는 중..." : "더 보기"}
							</Button>
						</motion.li>
					) : null}
				</motion.ul>
			) : null}

			{!isLoading && !error && !isTimeout && !hasResults ? (
				<div className="space-y-4 pb-4">
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
						<Button
							color="dotori"
							type="button"
							onClick={emptyPrimaryAction.onClick}
							className="min-h-11 w-full transition-transform duration-150 active:scale-[0.97]"
						>
							{emptyPrimaryAction.label}
						</Button>
						<Button
							plain={true}
							href={chatPromptHref}
							className="min-h-11 w-full justify-center rounded-2xl bg-white text-dotori-700 ring-1 ring-dotori-100 transition-colors transition-transform duration-150 hover:bg-dotori-50 active:scale-[0.97] dark:bg-dotori-950 dark:text-dotori-100 dark:ring-dotori-800 dark:hover:bg-dotori-900"
						>
							토리에게 물어보기
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
});
