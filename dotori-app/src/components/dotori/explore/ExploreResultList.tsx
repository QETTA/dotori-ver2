"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { memo } from "react";
import { Button } from "@/components/catalyst/button";
import { AiBriefingCard } from "@/components/dotori/AiBriefingCard";
import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { Skeleton } from "@/components/dotori/Skeleton";
import type { ExploreResultActions, ExploreResultState } from "./useExploreSearch";

interface ExploreResultInteraction {
	loadingAction: string | null;
	onRegisterInterest: (facilityId: string) => void;
	onApplyWaiting: (facilityId: string) => void;
}

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
		<div className="flex-1 overflow-y-auto px-5 pt-3">
			{isLoading && !isTimeout ? (
				<div className="pb-4">
					<Skeleton variant="facility-card" count={6} />
				</div>
			) : null}

			{((!isLoading && error) || isTimeout) ? (
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
				<div className="space-y-3 pb-4">
					<AiBriefingCard
						message={
							hasSearchInput
								? `"${debouncedSearch}" 이동 고민 기준으로 이동 가능한 시설부터 정렬했어요.`
								: "지도와 이동 수요 우선순위 기준으로 시설을 정렬했어요."
						}
						source="AI분석"
					/>

						{facilities.map((facility, index) => {
							const isActionLoading =
								loadingAction === `interest-${facility.id}` ||
								loadingAction === `waiting-${facility.id}`;

							return (
								<div
									key={facility.id}
									className="space-y-2"
									style={{ animationDelay: `${index * 50}ms` }}
								>
									<div
										className="duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
										style={{ animationFillMode: "both" }}
									>
										<Link href={`/facility/${facility.id}`}>
											<FacilityCard facility={facility} compact />
										</Link>
									</div>

									<div className="flex items-center justify-end gap-2 border-t border-dotori-100/60 pt-2">
										<Button
											plain={true}
											type="button"
											disabled={isActionLoading}
											onClick={() => onRegisterInterest(facility.id)}
											className="text-sm"
										>
											<HeartIcon className="h-3.5 w-3.5" />
											관심
										</Button>
										<Button
											color="dotori"
											type="button"
											disabled={isActionLoading}
											onClick={() => onApplyWaiting(facility.id)}
										>
											{facility.status === "available" ? "입소신청" : "대기신청"}
										</Button>
									</div>
								</div>
							);
						})}

					{hasMore ? (
						<div className="pt-2">
							<Button color="dotori" onClick={onLoadMore} disabled={isLoadingMore}>
								{isLoadingMore ? "불러오는 중..." : "더 보기"}
							</Button>
						</div>
					) : null}
				</div>
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
					<Button color="dotori" href={chatPromptHref} className="w-full">
						토리에게 물어보기
					</Button>
				</div>
			) : null}
		</div>
	);
});
