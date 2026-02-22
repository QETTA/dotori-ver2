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

	return (
		<div className="flex-1 overflow-y-auto bg-dotori-50 px-5 pt-3 dark:bg-dotori-950">
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
				<motion.ul {...stagger.fast.container} className="space-y-3 pb-4">
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
								<Link href={`/facility/${facility.id}`} className="block min-h-[44px]">
									<FacilityCard facility={facility} compact />
								</Link>

								<div className="flex items-center justify-end gap-2 border-t border-dotori-100/60 pt-2 dark:border-dotori-800/60">
									<Button
										plain={true}
										type="button"
										disabled={isActionLoading}
										onClick={() => onRegisterInterest(facility.id)}
										className="min-h-[44px] text-sm text-dotori-700 dark:text-dotori-100"
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
											className="min-h-[44px] bg-forest-100 px-4 text-sm font-semibold text-forest-900 ring-1 ring-forest-300 transition-colors hover:bg-forest-200"
										>
											입소신청
										</Button>
									) : (
										<Button
											color="dotori"
											type="button"
											disabled={isActionLoading}
											onClick={() => onApplyWaiting(facility.id)}
											className="min-h-[44px]"
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
								className="min-h-[44px]"
							>
								{isLoadingMore ? "불러오는 중..." : "더 보기"}
							</Button>
						</motion.li>
					) : null}
				</motion.ul>
			) : null}

			{!isLoading && !error && !isTimeout && !hasResults ? (
				<div className="space-y-3">
					<EmptyState
						title={
							hasSearchInput
								? `"${debouncedSearch}"로 이동 가능 시설을 찾지 못했어요. 조건을 바꿔보세요`
								: "이 조건의 이동 가능 시설이 없어요. 조건을 바꿔보세요"
						}
						description={
							!hasSearchInput && !hasFilterApplied
								? "검색어나 필터 없이 결과가 없어요. 이동 가능한 시설만 보려면 '이동 가능 시설' 토글을 켜 보세요."
								: "다른 지역이나 시설 유형으로 검색해보세요. 반경을 넓히거나 필터를 변경해보세요."
						}
						actionLabel={hasSearchInput ? "검색 초기화" : hasFilterApplied ? "필터 초기화" : "검색 초기화"}
						onAction={hasSearchInput ? onResetSearch : hasFilterApplied ? onResetFilters : onResetSearch}
					/>
					<Button color="dotori" href={chatPromptHref} className="min-h-[44px] w-full">
						토리에게 물어보기
					</Button>
				</div>
			) : null}
		</div>
	);
});
