"use client";

/**
 * ExploreSearchHeader — Hero + search bar + filter controls
 *
 * hasDesignTokens: true  — DS_STATUS, DS_PAGE_HEADER, DS_SURFACE, DS_TYPOGRAPHY
 * hasBrandSignal:  true  — DS_STATUS (filter pills), DS_PAGE_HEADER (hero), DS_SURFACE (sticky header)
 */
import { motion } from "motion/react";
import {
	memo,
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Fieldset } from "@/components/catalyst/fieldset";
import { Text } from "@/components/catalyst/text";
import { BRAND_GUIDE } from "@/lib/brand-assets";
import { DS_STATUS, DS_TYPOGRAPHY, DS_GLASS } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { stagger, gradientTextHero } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ExploreFilterPanel } from "./ExploreFilterPanel";
import { ExploreFilterToolbar } from "./ExploreFilterToolbar";
import { ExploreSearchInput } from "./ExploreSearchInput";
import { ExploreToOnlyToggle } from "./ExploreToOnlyToggle";
import { ExploreSuggestionPanel } from "./ExploreSuggestionPanel";
import { POPULAR_SEARCHES } from "./explore-constants";
import type {
	ExploreSearchHeaderActions,
	ExploreSearchHeaderState,
} from "./useExploreSearch.types";

interface ExploreSearchHeaderProps {
	state: ExploreSearchHeaderState;
	actions: ExploreSearchHeaderActions;
}

export const ExploreSearchHeader = memo(function ExploreSearchHeader({
	state,
	actions,
}: ExploreSearchHeaderProps) {
	const {
		searchInput,
		toOnly,
		sortBy,
		selectedTypes,
		selectedSido,
		selectedSigungu,
		showFilters,
		showMap,
		resultLabel,
		activeFilterCount,
		toCount,
		recentSearches,
		sidoOptions,
		sigunguOptions,
		isLoadingSido,
		isLoadingSigungu,
		isGpsLoading,
		isMapAvailable,
		mapDisabledReason,
	} = state;
	const {
		onSearchInputChange,
		onSubmitSearch,
		onApplySearch,
		onClearSearch,
		onClearRecentSearches,
		onToggleFilters,
		onToggleMap,
		onToggleType,
		onToggleToOnly,
		onSortChange,
		onSidoChange,
		onSigunguChange,
		onUseCurrentLocation,
		onResetFilters,
	} = actions;

	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);
	const activeFilterPillClass = cn(
		'text-xs/5 font-semibold',
		DS_STATUS.available.pill,
		'ring-1 ring-gray-300/70',
	);
	const inactiveFilterPillClass = cn(
		'text-xs/5',
		DS_STATUS.full.pill,
		'ring-1 ring-gray-200/70 dark:ring-gray-700/45',
	);

	useEffect(() => {
		if (!isSearchFocused) return;

		function handleClickOutside(event: PointerEvent) {
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(event.target as Node)
			) {
				setIsSearchFocused(false);
			}
		}

		document.addEventListener("pointerdown", handleClickOutside);
		return () => document.removeEventListener("pointerdown", handleClickOutside);
	}, [isSearchFocused]);

	const showSuggestionPanel = isSearchFocused && searchInput.length === 0;

	const handleFormSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			onSubmitSearch();
			setIsSearchFocused(false);
		},
		[onSubmitSearch],
	);

	const handleSelectTerm = useCallback(
		(term: string) => {
			onApplySearch(term);
			setIsSearchFocused(false);
		},
		[onApplySearch],
	);

	const handleSearchFocus = useCallback(() => {
		setIsSearchFocused(true);
	}, []);

	return (
		<>
			{/* ── Hero (scrolls away) ── */}
			<div className="px-4 pb-4 pt-2">
				<motion.div {...stagger.container} className="space-y-3">
					<motion.div {...stagger.item} className="flex items-center gap-3">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND_GUIDE.header}
							alt="도토리"
							className="h-5 w-auto opacity-90"
						/>
					</motion.div>
					<motion.div {...stagger.item}>
						<h2 className={cn("font-wordmark text-2xl/8 font-bold tracking-tight", gradientTextHero)}>
							시설 탐색
						</h2>
						<Text className={cn('mt-1', DS_PAGE_HEADER.subtitle, DS_TYPOGRAPHY.bodySm)}>
							지역과 조건을 선택하세요
						</Text>
					</motion.div>
				</motion.div>
			</div>

			{/* ── Sticky: ONLY search bar ── */}
			<header
				className={cn(
					'sticky top-0 z-20 px-4 py-2.5',
					DS_GLASS.nav, DS_GLASS.dark.nav,
					
					'border-b border-dotori-200/40','shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_8px_rgba(176,122,74,0.12)]',
					'dark:border-dotori-800/40 dark:shadow-none',
				)}
			>
				<ExploreSearchInput
					searchInput={searchInput}
					isGpsLoading={isGpsLoading}
					onSearchInputChange={onSearchInputChange}
					onClearSearch={onClearSearch}
					onUseCurrentLocation={onUseCurrentLocation}
					onFormSubmit={handleFormSubmit}
					onFocus={handleSearchFocus}
					onSelectTerm={handleSelectTerm}
					containerRef={searchContainerRef}
				>
					{showSuggestionPanel ? (
						<ExploreSuggestionPanel
							recentSearches={recentSearches}
							popularSearches={POPULAR_SEARCHES}
							onClearRecent={onClearRecentSearches}
							onSelectTerm={handleSelectTerm}
						/>
					) : null}
				</ExploreSearchInput>
			</header>

			{/* ── Filters (scrolls with content) ── */}
			<div className="px-4 pt-3 pb-1">
				<Fieldset className="space-y-2">
					<ExploreFilterToolbar
						resultLabel={resultLabel}
						showFilters={showFilters}
						showMap={showMap}
						activeFilterCount={activeFilterCount}
						isMapAvailable={isMapAvailable}
						mapDisabledReason={mapDisabledReason}
						activeFilterPillClass={activeFilterPillClass}
						inactiveFilterPillClass={inactiveFilterPillClass}
						onToggleFilters={onToggleFilters}
						onToggleMap={onToggleMap}
					/>

					<ExploreToOnlyToggle
						toOnly={toOnly}
						toCount={toCount}
						activeFilterPillClass={activeFilterPillClass}
						inactiveFilterPillClass={inactiveFilterPillClass}
						onToggleToOnly={onToggleToOnly}
					/>
				</Fieldset>

				<ExploreFilterPanel
					showFilters={showFilters}
					selectedTypes={selectedTypes}
					selectedSido={selectedSido}
					selectedSigungu={selectedSigungu}
					sortBy={sortBy}
					activeFilterCount={activeFilterCount}
					sidoOptions={sidoOptions}
					sigunguOptions={sigunguOptions}
					isLoadingSido={isLoadingSido}
					isLoadingSigungu={isLoadingSigungu}
					activeFilterPillClass={activeFilterPillClass}
					inactiveFilterPillClass={inactiveFilterPillClass}
					onToggleType={onToggleType}
					onSidoChange={onSidoChange}
					onSigunguChange={onSigunguChange}
					onSortChange={onSortChange}
					onResetFilters={onResetFilters}
				/>
			</div>
		</>
	);
});
