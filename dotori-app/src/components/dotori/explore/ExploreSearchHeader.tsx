"use client";

/**
 * ExploreSearchHeader — search bar + filter controls
 *
 * hasDesignTokens: true  — DS_STATUS (filter pills), DS_GLASS (sticky header)
 */
import {
	memo,
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Fieldset } from "@/components/catalyst/fieldset";
import { DsButton } from "@/components/ds/DsButton";
import { DS_GLASS, DS_STATUS } from "@/lib/design-system/tokens";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ExploreFilterPanel } from "./ExploreFilterPanel";
import { ExploreFilterToolbar } from "./ExploreFilterToolbar";
import { ExploreSearchInput } from "./ExploreSearchInput";
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

function areExploreSearchHeaderPropsEqual(
	prev: Readonly<ExploreSearchHeaderProps>,
	next: Readonly<ExploreSearchHeaderProps>,
) {
	const prevState = prev.state;
	const nextState = next.state;
	const prevActions = prev.actions;
	const nextActions = next.actions;

	return (
		prevState.searchInput === nextState.searchInput &&
		prevState.toOnly === nextState.toOnly &&
		prevState.sortBy === nextState.sortBy &&
		prevState.selectedTypes === nextState.selectedTypes &&
		prevState.selectedSido === nextState.selectedSido &&
		prevState.selectedSigungu === nextState.selectedSigungu &&
		prevState.showFilters === nextState.showFilters &&
		prevState.resultLabel === nextState.resultLabel &&
		prevState.activeFilterCount === nextState.activeFilterCount &&
		prevState.toCount === nextState.toCount &&
		prevState.recentSearches === nextState.recentSearches &&
		prevState.sidoOptions === nextState.sidoOptions &&
		prevState.sigunguOptions === nextState.sigunguOptions &&
		prevState.isLoadingSido === nextState.isLoadingSido &&
		prevState.isLoadingSigungu === nextState.isLoadingSigungu &&
		prevState.isGpsLoading === nextState.isGpsLoading &&
		prevActions.onSearchInputChange === nextActions.onSearchInputChange &&
		prevActions.onSubmitSearch === nextActions.onSubmitSearch &&
		prevActions.onApplySearch === nextActions.onApplySearch &&
		prevActions.onClearSearch === nextActions.onClearSearch &&
		prevActions.onClearRecentSearches === nextActions.onClearRecentSearches &&
		prevActions.onToggleFilters === nextActions.onToggleFilters &&
		prevActions.onToggleType === nextActions.onToggleType &&
		prevActions.onToggleToOnly === nextActions.onToggleToOnly &&
		prevActions.onSortChange === nextActions.onSortChange &&
		prevActions.onSidoChange === nextActions.onSidoChange &&
		prevActions.onSigunguChange === nextActions.onSigunguChange &&
		prevActions.onUseCurrentLocation === nextActions.onUseCurrentLocation &&
		prevActions.onResetFilters === nextActions.onResetFilters
	);
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
		resultLabel,
		activeFilterCount,
		toCount,
		recentSearches,
		sidoOptions,
		sigunguOptions,
		isLoadingSido,
		isLoadingSigungu,
		isGpsLoading,
	} = state;
	const {
		onSearchInputChange,
		onSubmitSearch,
		onApplySearch,
		onClearSearch,
		onClearRecentSearches,
		onToggleFilters,
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
		"text-caption font-semibold",
		DS_STATUS.available.pill,
		"ring-1 ring-gray-300/70",
	);
	const inactiveFilterPillClass = cn(
		"text-caption",
		DS_STATUS.full.pill,
		"ring-1 ring-gray-200/70 dark:ring-gray-700/45",
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
			{/* ── Sticky: ONLY search bar ── */}
			<header
				className={cn(
					'sticky top-0 z-20 px-4 py-2.5 glass-header',
					DS_GLASS.nav, DS_GLASS.dark.nav,
					'hairline-border-b',
					'dark:border-dotori-800/40',
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
						activeFilterCount={activeFilterCount}
						activeFilterPillClass={activeFilterPillClass}
						inactiveFilterPillClass={inactiveFilterPillClass}
						onToggleFilters={onToggleFilters}
					/>

					<motion.div {...tap.chip}>
						<DsButton
							type="button"
							variant="ghost"
							onClick={onToggleToOnly}
							aria-pressed={toOnly}
								className={cn(
									"inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5",
									"text-label font-medium transition-all duration-200",
									toOnly
										? "!bg-dotori-500 font-semibold !text-white shadow-sm ring-1 ring-dotori-400/60 dark:ring-dotori-300/50"
										: "!bg-dotori-50 !text-dotori-700 ring-1 ring-dotori-200 hover:bg-dotori-100/70 dark:!bg-white/[0.03] dark:!text-dotori-100 dark:ring-dotori-700/50 dark:hover:bg-dotori-900/40",
								)}
						>
							<AnimatePresence mode="wait" initial={false}>
								<motion.span
									key={`toOnly-indicator-${toOnly ? "on" : "off"}`}
									className={cn(
										"h-2 w-2 rounded-full",
										toOnly ? "bg-white" : "bg-dotori-500",
									)}
									initial={{ scale: 0.5, opacity: 0.4 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.5, opacity: 0.4 }}
									transition={spring.chip}
								/>
							</AnimatePresence>
							이동 가능 시설만 보기{toCount > 0 ? ` ${toCount}` : ""}
						</DsButton>
					</motion.div>
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
}, areExploreSearchHeaderPropsEqual);
