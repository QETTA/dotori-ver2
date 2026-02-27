"use client";

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
import { DS_LAYOUT, DS_STATUS } from '@/lib/design-system/tokens'
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
		'text-body-sm',
		DS_STATUS.available.pill,
		'font-semibold',
		'ring-1 ring-dotori-300/70 shadow-sm',
	);
	const inactiveFilterPillClass = cn(
		'text-body-sm',
		DS_STATUS.full.pill,
		'ring-1 ring-dotori-100/70 dark:ring-dotori-700/45',
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
		<header
			className={cn(
				'sticky top-0 z-20 px-4 pb-5',
				DS_LAYOUT.SAFE_AREA_HEADER_TOP,
				/* Glass morphism header — frosted warm tint */
				'bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.8]',
				'shadow-[0_1px_3px_rgba(176,122,74,0.08)]',
				'border-b border-dotori-200/30',
				'dark:bg-dotori-950/70 dark:border-dotori-800/30',
				'dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
			)}
		>
			{/* Warm ambient glow — two-layer for depth */}
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -top-20 -right-10 h-52 w-52 rounded-full bg-dotori-300/25 blur-[80px] dark:bg-dotori-500/10"
			/>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -top-10 left-1/4 h-32 w-32 rounded-full bg-dotori-200/20 blur-[60px] dark:bg-dotori-600/8"
			/>

			<motion.div {...stagger.container} className="relative space-y-4">
				{/* ── Brand bar ── */}
				<motion.div
					{...stagger.item}
					className="flex items-center justify-between gap-3 pt-1"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND_GUIDE.header}
						alt="도토리"
						className="h-5 w-auto opacity-90 md:h-6"
					/>
					<div className="rounded-full border border-dotori-100/80 bg-white/90 px-2.5 py-1 shadow-sm dark:border-dotori-800 dark:bg-dotori-950">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND_GUIDE.inApp}
							alt=""
							aria-hidden="true"
							className="h-4 w-4"
						/>
					</div>
				</motion.div>

				{/* ── Hero copy ── */}
				<motion.div {...stagger.item}>
					<h2
						className={cn("text-h2 font-bold tracking-tight", gradientTextHero)}
					>
						이동 가능 시설을 바로 확인해요
					</h2>
					<Text className="text-body-sm mt-1.5 leading-relaxed text-dotori-500 dark:text-dotori-400">
						지역과 조건만 선택하면 핵심 결과부터 보여드려요
					</Text>
				</motion.div>

				{/* ── Search + Scenario Chips + Filters ── */}
				<Fieldset className="space-y-3">
					<motion.div {...stagger.item}>
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
					</motion.div>

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
			</motion.div>

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
		</header>
	);
});
