"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import type { ExploreSortKey } from "./explore-constants";
import { SEARCH_DEBOUNCE_MS } from "./explore-constants";
import {
	clearRecentSearches,
	getRecentSearches,
	saveRecentSearch,
} from "./explore-storage";
import { countActiveFilters } from "./explore-selectors";
import type { ExploreInitialQueryState } from "./explore-query";

export interface UseExploreFiltersReturn {
	searchInput: string;
	debouncedSearch: string;
	selectedTypes: string[];
	toOnly: boolean;
	sortBy: ExploreSortKey;
	selectedSido: string;
	selectedSigungu: string;
	showFilters: boolean;
	activeFilterCount: number;
	recentSearches: string[];
	sidoOptions: string[];
	sigunguOptions: string[];
	isLoadingSido: boolean;
	isLoadingSigungu: boolean;

	setSearchInput: (value: string) => void;
	setDebouncedSearch: (value: string) => void;
	applySearch: (term: string) => void;
	submitSearch: () => void;
	clearSearch: () => void;
	clearRecentSearchHistory: () => void;
	toggleType: (type: string) => void;
	toggleToOnly: () => void;
	changeSortBy: (nextSort: ExploreSortKey) => void;
	changeSido: (nextSido: string) => void;
	changeSigungu: (nextSigungu: string) => void;
	setSelectedSido: (value: string) => void;
	setSelectedSigungu: (value: string) => void;
	toggleFilters: () => void;
	openFilters: () => void;
	resetFilters: () => void;
	/** Call this whenever the facility total changes so analytics picks up the latest count. */
	setTotalForTracking: (total: number) => void;
}

export function useExploreFilters(
	initialQueryState: ExploreInitialQueryState,
): UseExploreFiltersReturn {
	const {
		initialSearch,
		initialSido,
		initialSigungu,
		initialSelectedTypes,
		initialToOnly,
		initialSortBy,
		initialShowFilters,
		shouldOpenFiltersFromQuery,
	} = initialQueryState;

	const [searchInput, setSearchInputState] = useState(initialSearch);
	const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
	const [selectedTypes, setSelectedTypes] = useState<string[]>(initialSelectedTypes);
	const [toOnly, setToOnly] = useState(initialToOnly);
	const [sortBy, setSortBy] = useState<ExploreSortKey>(initialSortBy);
	const [selectedSido, setSelectedSido] = useState(initialSido);
	const [selectedSigungu, setSelectedSigungu] = useState(initialSigungu);
	const [showFilters, setShowFilters] = useState(initialShowFilters);

	const [sidoOptions, setSidoOptions] = useState<string[]>([]);
	const [sigunguOptions, setSigunguOptions] = useState<string[]>([]);
	const [isLoadingSido, setIsLoadingSido] = useState(false);
	const [isLoadingSigungu, setIsLoadingSigungu] = useState(false);

	const [recentSearches, setRecentSearches] = useState<string[]>(() =>
		getRecentSearches(),
	);
	const hasAutoFilterOpenTrackedRef = useRef(false);

	// Use a ref for total so callbacks always read the latest value
	// without needing total in their dependency arrays.
	const totalRef = useRef(0);

	const setTotalForTracking = useCallback((total: number) => {
		totalRef.current = total;
	}, []);

	const activeFilterCount = useMemo(
		() =>
			countActiveFilters({
				selectedTypes,
				toOnly,
				selectedSido,
				selectedSigungu,
			}),
		[selectedSido, selectedSigungu, selectedTypes, toOnly],
	);

	// Auto-open filters from query param
	useEffect(() => {
		if (!shouldOpenFiltersFromQuery || hasAutoFilterOpenTrackedRef.current) {
			return;
		}

		hasAutoFilterOpenTrackedRef.current = true;
		// eslint-disable-next-line react-hooks/set-state-in-effect -- one-time query param sync
		setShowFilters(true);
		trackEvent("filter_open", "explore", {
			entry_point: "explore_filter",
			funnel_step: "open_sheet",
			active_filter_count: activeFilterCount,
			result_count: totalRef.current,
			filters: {
				types: selectedTypes,
				sido: selectedSido || undefined,
				sigungu: selectedSigungu || undefined,
				vacancyOnly: toOnly,
				sortBy,
			},
		});
	}, [
		activeFilterCount,
		selectedSigungu,
		selectedSido,
		selectedTypes,
		shouldOpenFiltersFromQuery,
		sortBy,
		toOnly,
	]);

	// Fetch sido options
	useEffect(() => {
		let active = true;

		apiFetch<{ data: string[] }>("/api/regions/sido")
			.then((res) => {
				if (!active) return;
				setSidoOptions(res.data);
			})
			.catch(() => {
				if (!active) return;
				setSidoOptions(["서울특별시", "경기도", "부산광역시"]);
			})
			.finally(() => {
				if (active) setIsLoadingSido(false);
			});

		return () => {
			active = false;
		};
	}, []);

	// Fetch sigungu options when sido changes
	useEffect(() => {
		let active = true;

		if (!selectedSido) {
			return () => {
				active = false;
			};
		}

		apiFetch<{ data: string[] }>(
			`/api/regions/sigungu?sido=${encodeURIComponent(selectedSido)}`,
		)
			.then((res) => {
				if (!active) return;
				setSigunguOptions(res.data);
				setSelectedSigungu((current) =>
					current && !res.data.includes(current) ? "" : current,
				);
			})
			.catch(() => {
				if (!active) return;
				setSigunguOptions([]);
			})
			.finally(() => {
				if (active) setIsLoadingSigungu(false);
			});

		return () => {
			active = false;
		};
	}, [selectedSido]);

	// Debounce search input
	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedSearch(searchInput);
		}, SEARCH_DEBOUNCE_MS);

		return () => window.clearTimeout(timeoutId);
	}, [searchInput]);

	const setSearchInput = useCallback((value: string) => {
		setSearchInputState(value);
	}, []);

	const applySearch = useCallback((term: string) => {
		const trimmed = term.trim();
		if (!trimmed) return;

		setSearchInputState(trimmed);
		setDebouncedSearch(trimmed);
		saveRecentSearch(trimmed);
		setRecentSearches(getRecentSearches());
	}, []);

	const submitSearch = useCallback(() => {
		applySearch(searchInput);
	}, [applySearch, searchInput]);

	const clearRecentSearchHistory = useCallback(() => {
		clearRecentSearches();
		setRecentSearches([]);
	}, []);

	const clearSearch = useCallback(() => {
		setSearchInputState("");
		setDebouncedSearch("");
	}, []);

	const toggleType = useCallback((type: string) => {
		setSelectedTypes((prev) => {
			const nextTypes = prev.includes(type)
				? prev.filter((currentType) => currentType !== type)
				: [...prev, type];
			const nextActiveFilterCount = countActiveFilters({
				selectedTypes: nextTypes,
				toOnly,
				selectedSido,
				selectedSigungu,
			});
			trackEvent("filter_apply", "explore", {
				entry_point: "explore_filter",
				funnel_step: "apply_type",
				active_filter_count: nextActiveFilterCount,
				result_count: totalRef.current,
				filters: {
					types: nextTypes,
					sido: selectedSido || undefined,
					sigungu: selectedSigungu || undefined,
					vacancyOnly: toOnly,
					sortBy,
				},
			});
			return nextTypes;
		});
	}, [selectedSido, selectedSigungu, sortBy, toOnly]);

	const toggleToOnly = useCallback(() => {
		setToOnly((prev) => {
			const next = !prev;
			const nextActiveFilterCount = countActiveFilters({
				selectedTypes,
				toOnly: next,
				selectedSido,
				selectedSigungu,
			});
			trackEvent(next ? "vacancy_only_toggle_on" : "vacancy_only_toggle_off", "explore", {
				entry_point: "explore_filter",
				funnel_step: next ? "toggle_vacancy_on" : "toggle_vacancy_off",
				active_filter_count: nextActiveFilterCount,
				result_count: totalRef.current,
				filters: {
					types: selectedTypes,
					sido: selectedSido || undefined,
					sigungu: selectedSigungu || undefined,
					vacancyOnly: next,
					sortBy,
				},
			});
			trackEvent("filter_apply", "explore", {
				entry_point: "explore_filter",
				funnel_step: "apply_vacancy_toggle",
				active_filter_count: nextActiveFilterCount,
				result_count: totalRef.current,
				filters: {
					types: selectedTypes,
					sido: selectedSido || undefined,
					sigungu: selectedSigungu || undefined,
					vacancyOnly: next,
					sortBy,
				},
			});
			return next;
		});
	}, [selectedSido, selectedSigungu, selectedTypes, sortBy]);

	const changeSortBy = useCallback((nextSort: ExploreSortKey) => {
		setSortBy(nextSort);
		trackEvent("filter_apply", "explore", {
			entry_point: "explore_filter",
			funnel_step: "apply_sort",
			active_filter_count: activeFilterCount,
			result_count: totalRef.current,
			filters: {
				types: selectedTypes,
				sido: selectedSido || undefined,
				sigungu: selectedSigungu || undefined,
				vacancyOnly: toOnly,
				sortBy: nextSort,
			},
		});
	}, [activeFilterCount, selectedSido, selectedSigungu, selectedTypes, toOnly]);

	const changeSido = useCallback((nextSido: string) => {
		setSelectedSido(nextSido);
		setSelectedSigungu("");
		const nextActiveFilterCount = countActiveFilters({
			selectedTypes,
			toOnly,
			selectedSido: nextSido,
			selectedSigungu: "",
		});
		trackEvent("filter_apply", "explore", {
			entry_point: "explore_filter",
			funnel_step: "apply_sido",
			active_filter_count: nextActiveFilterCount,
			result_count: totalRef.current,
			filters: {
				types: selectedTypes,
				sido: nextSido || undefined,
				sigungu: undefined,
				vacancyOnly: toOnly,
				sortBy,
			},
		});
	}, [selectedTypes, sortBy, toOnly]);

	const changeSigungu = useCallback((nextSigungu: string) => {
		setSelectedSigungu(nextSigungu);
		const nextActiveFilterCount = countActiveFilters({
			selectedTypes,
			toOnly,
			selectedSido,
			selectedSigungu: nextSigungu,
		});
		trackEvent("filter_apply", "explore", {
			entry_point: "explore_filter",
			funnel_step: "apply_sigungu",
			active_filter_count: nextActiveFilterCount,
			result_count: totalRef.current,
			filters: {
				types: selectedTypes,
				sido: selectedSido || undefined,
				sigungu: nextSigungu || undefined,
				vacancyOnly: toOnly,
				sortBy,
			},
		});
	}, [selectedSido, selectedTypes, sortBy, toOnly]);

	const toggleFilters = useCallback(() => {
		setShowFilters((prev) => {
			const next = !prev;
			if (next) {
				trackEvent("filter_open", "explore", {
					entry_point: "explore_filter",
					funnel_step: "open_sheet",
					active_filter_count: activeFilterCount,
					result_count: totalRef.current,
					filters: {
						types: selectedTypes,
						sido: selectedSido || undefined,
						sigungu: selectedSigungu || undefined,
						vacancyOnly: toOnly,
						sortBy,
					},
				});
			}
			return next;
		});
	}, [activeFilterCount, selectedSido, selectedSigungu, selectedTypes, sortBy, toOnly]);

	const openFilters = useCallback(() => {
		setShowFilters((prev) => {
			if (prev) {
				return true;
			}

			trackEvent("filter_open", "explore", {
				entry_point: "explore_filter",
				funnel_step: "open_sheet",
				active_filter_count: activeFilterCount,
				result_count: totalRef.current,
				filters: {
					types: selectedTypes,
					sido: selectedSido || undefined,
					sigungu: selectedSigungu || undefined,
					vacancyOnly: toOnly,
					sortBy,
				},
			});

			return true;
		});
	}, [activeFilterCount, selectedSido, selectedSigungu, selectedTypes, sortBy, toOnly]);

	const resetFilters = useCallback(() => {
		trackEvent("filter_reset", "explore", {
			entry_point: "explore_filter",
			funnel_step: "reset",
			active_filter_count: activeFilterCount,
			result_count: totalRef.current,
			filters: {
				types: selectedTypes,
				sido: selectedSido || undefined,
				sigungu: selectedSigungu || undefined,
				vacancyOnly: toOnly,
				sortBy,
			},
		});
		setSearchInputState("");
		setDebouncedSearch("");
		setSelectedTypes([]);
		setToOnly(false);
		setSortBy("distance");
		setSelectedSido("");
		setSelectedSigungu("");
	}, [activeFilterCount, selectedSido, selectedSigungu, selectedTypes, sortBy, toOnly]);

	return {
		searchInput,
		debouncedSearch,
		selectedTypes,
		toOnly,
		sortBy,
		selectedSido,
		selectedSigungu,
		showFilters,
		activeFilterCount,
		recentSearches,
		sidoOptions,
		sigunguOptions,
		isLoadingSido,
		isLoadingSigungu,

		setSearchInput,
		setDebouncedSearch,
		applySearch,
		submitSearch,
		clearSearch,
		clearRecentSearchHistory,
		toggleType,
		toggleToOnly,
		changeSortBy,
		changeSido,
		changeSigungu,
		setSelectedSido,
		setSelectedSigungu,
		toggleFilters,
		openFilters,
		resetFilters,
		setTotalForTracking,
	};
}
