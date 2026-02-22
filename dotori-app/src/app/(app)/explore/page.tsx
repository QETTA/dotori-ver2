"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback } from "react";
import { ExploreResultList } from "@/components/dotori/explore/ExploreResultList";
import { ExploreSearchHeader } from "@/components/dotori/explore/ExploreSearchHeader";
import { useExploreSearch } from "@/components/dotori/explore/useExploreSearch";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useFacilityActions } from "@/hooks/use-facility-actions";

const MapEmbed = dynamic(
	() => import("@/components/dotori/MapEmbed").then((mod) => mod.MapEmbed),
	{ ssr: false },
);

export default function ExplorePage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[calc(100dvh-8rem)] flex-col">
					<div className="px-5 pt-4">
						<Skeleton variant="facility-card" count={6} />
					</div>
				</div>
			}
		>
			<ExploreContent />
		</Suspense>
	);
}

function ExploreContent() {
	const explore = useExploreSearch();
	const {
		registerInterest,
		applyWaiting,
		isLoading: isActionLoading,
	} = useFacilityActions();

	const handleRegisterInterest = useCallback(
		(facilityId: string) => {
			void registerInterest(facilityId);
		},
		[registerInterest],
	);

	const handleApplyWaiting = useCallback(
		(facilityId: string) => {
			void applyWaiting(facilityId);
		},
		[applyWaiting],
	);

	const handleUseCurrentLocation = useCallback(() => {
		void explore.useCurrentLocation();
	}, [explore.useCurrentLocation]);

	return (
		<div className="flex h-[calc(100dvh-8rem)] flex-col">
			<ExploreSearchHeader
				searchInput={explore.searchInput}
				toOnly={explore.toOnly}
				sortBy={explore.sortBy}
				selectedTypes={explore.selectedTypes}
				selectedSido={explore.selectedSido}
				selectedSigungu={explore.selectedSigungu}
				showFilters={explore.showFilters}
				showMap={explore.showMap}
				resultLabel={explore.resultLabel}
				activeFilterCount={explore.activeFilterCount}
				toCount={explore.toCount}
				recentSearches={explore.recentSearches}
				sidoOptions={explore.sidoOptions}
				sigunguOptions={explore.sigunguOptions}
				isLoadingSido={explore.isLoadingSido}
				isLoadingSigungu={explore.isLoadingSigungu}
				isGpsLoading={explore.gpsState.loading}
				onSearchInputChange={explore.setSearchInput}
				onSubmitSearch={explore.submitSearch}
				onApplySearch={explore.applySearch}
				onClearSearch={explore.clearSearch}
				onClearRecentSearches={explore.clearRecentSearchHistory}
				onToggleFilters={explore.toggleFilters}
				onToggleMap={explore.toggleMap}
				onToggleType={explore.toggleType}
				onToggleToOnly={explore.toggleToOnly}
				onSortChange={explore.changeSortBy}
				onSidoChange={explore.changeSido}
				onSigunguChange={explore.changeSigungu}
				onUseCurrentLocation={handleUseCurrentLocation}
				onResetFilters={explore.resetFilters}
			/>

			{explore.showMap && explore.hasMapContent ? (
				<div className="px-4 pt-2 duration-200 motion-safe:animate-in motion-safe:fade-in">
					<MapEmbed
						facilities={explore.mapFacilityPoints}
						{...(explore.mapCenter ? { center: explore.mapCenter } : {})}
						{...(explore.userLocation
							? { userLocation: explore.userLocation }
							: {})}
						height="h-48 sm:h-64"
					/>
				</div>
			) : null}

			<ExploreResultList
				facilities={explore.facilities}
				isLoading={explore.isLoading}
				isLoadingMore={explore.isLoadingMore}
				error={explore.error}
				isTimeout={explore.isTimeout}
				hasMore={explore.hasMore}
				hasSearchInput={explore.hasSearchInput}
				hasFilterApplied={explore.hasFilterApplied}
				debouncedSearch={explore.debouncedSearch}
				chatPromptHref={explore.chatPromptHref}
				onRetry={explore.retry}
				onLoadMore={explore.loadMore}
				onResetSearch={explore.clearSearch}
				onResetFilters={explore.resetFilters}
				isActionLoading={isActionLoading}
				onRegisterInterest={handleRegisterInterest}
				onApplyWaiting={handleApplyWaiting}
			/>
		</div>
	);
}
