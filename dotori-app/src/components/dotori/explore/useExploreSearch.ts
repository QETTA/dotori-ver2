"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/dotori/ToastProvider";
import { useFacilityActions } from "@/hooks/use-facility-actions";
import { useFacilities } from "@/hooks/use-facilities";
import { apiFetch } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import type { Facility, FacilityStatus } from "@/types/dotori";
import {
	EXPLORE_TYPE_FILTERS,
	FACILITY_LOAD_TIMEOUT_MS,
	SEARCH_DEBOUNCE_MS,
	type ExploreSortKey,
} from "./explore-constants";
import {
	clearRecentSearches,
	getRecentSearches,
	saveRecentSearch,
} from "./explore-storage";
import { buildResultLabel, isValidFacilityType } from "./explore-utils";

interface ReverseGeocodeResponse {
	data: {
		sido: string;
		sigungu: string;
		dong: string;
	};
}

export interface GPSState {
	lat: number | null;
	lng: number | null;
	loading: boolean;
}

export interface ExploreMapPoint {
	id: string;
	name: string;
	lat: number;
	lng: number;
	status: FacilityStatus;
}

export interface ExploreSearchHeaderState {
	searchInput: string;
	toOnly: boolean;
	sortBy: ExploreSortKey;
	selectedTypes: string[];
	selectedSido: string;
	selectedSigungu: string;
	showFilters: boolean;
	showMap: boolean;
	resultLabel: string;
	activeFilterCount: number;
	toCount: number;
	recentSearches: string[];
	sidoOptions: string[];
	sigunguOptions: string[];
	isLoadingSido: boolean;
	isLoadingSigungu: boolean;
	isGpsLoading: boolean;
}

export interface ExploreSearchHeaderActions {
	onSearchInputChange: (value: string) => void;
	onSubmitSearch: () => void;
	onApplySearch: (term: string) => void;
	onClearSearch: () => void;
	onClearRecentSearches: () => void;
	onToggleFilters: () => void;
	onToggleMap: () => void;
	onToggleType: (type: string) => void;
	onToggleToOnly: () => void;
	onSortChange: (nextSort: ExploreSortKey) => void;
	onSidoChange: (nextSido: string) => void;
	onSigunguChange: (nextSigungu: string) => void;
	onUseCurrentLocation: () => void;
	onResetFilters: () => void;
}

export interface ExploreResultState {
	facilities: Facility[];
	isLoading: boolean;
	isLoadingMore: boolean;
	error: string | null;
	isTimeout: boolean;
	hasMore: boolean;
	hasSearchInput: boolean;
	hasFilterApplied: boolean;
	debouncedSearch: string;
	sortBy: ExploreSortKey;
	vacancyOnly: boolean;
	chatPromptHref: string;
}

export interface ExploreResultActions {
	onRetry: () => void;
	onLoadMore: () => void;
	onResetSearch: () => void;
	onResetFilters: () => void;
	onOpenFilters: () => void;
	onOpenMap: () => void;
}

export interface ExploreResultInteraction {
	loadingAction: string | null;
	onRegisterInterest: (facilityId: string) => void;
	onApplyWaiting: (facilityId: string) => void;
}

export interface ExploreMapState {
	showMap: boolean;
	hasMapContent: boolean;
	facilities: ExploreMapPoint[];
	center: { lat: number; lng: number } | undefined;
	userLocation: { lat: number; lng: number } | undefined;
}

export interface UseExploreSearchReturn {
	headerState: ExploreSearchHeaderState;
	headerActions: ExploreSearchHeaderActions;
	resultState: ExploreResultState;
	resultActions: ExploreResultActions;
	mapState: ExploreMapState;
}

export function useExploreResultInteraction(): ExploreResultInteraction {
	const { registerInterest, applyWaiting, loadingAction } = useFacilityActions();
	const registerInterestRef = useRef(registerInterest);
	const applyWaitingRef = useRef(applyWaiting);

	useEffect(() => {
		registerInterestRef.current = registerInterest;
	}, [registerInterest]);

	useEffect(() => {
		applyWaitingRef.current = applyWaiting;
	}, [applyWaiting]);

	const onRegisterInterest = useCallback((facilityId: string) => {
		void registerInterestRef.current(facilityId);
	}, []);

	const onApplyWaiting = useCallback((facilityId: string) => {
		void applyWaitingRef.current(facilityId);
	}, []);

	return useMemo(
		() => ({
			loadingAction,
			onRegisterInterest,
			onApplyWaiting,
		}),
		[loadingAction, onApplyWaiting, onRegisterInterest],
	);
}

export function useExploreSearch(): UseExploreSearchReturn {
	const { addToast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();

	const initialSearch = searchParams.get("q") ?? "";
	const initialSido = searchParams.get("sido") ?? "";
	const initialSigungu = searchParams.get("sigungu") ?? "";
	const shouldFocusMapRadius = searchParams.get("focusRadius") === "1";
	const shouldOpenFiltersFromQuery = searchParams.get("openFilters") === "1";

	const [searchInput, setSearchInputState] = useState(initialSearch);
	const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
	const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
		const typesFromQuery =
			searchParams
				.get("type")
				?.split(",")
				.map((value) => value.trim()) ?? [];
		const validTypes = typesFromQuery.filter((value): value is string =>
			isValidFacilityType(value, EXPLORE_TYPE_FILTERS),
		);
		return validTypes.length > 0 ? validTypes : [];
	});
	const [toOnly, setToOnly] = useState(searchParams.get("to") === "1");
	const [sortBy, setSortBy] = useState<ExploreSortKey>(() => {
		const rawSort = searchParams.get("sort") ?? "";
		return rawSort === "distance" || rawSort === "rating" || rawSort === "capacity"
			? rawSort
			: "distance";
	});
	const [selectedSido, setSelectedSido] = useState(initialSido);
	const [selectedSigungu, setSelectedSigungu] = useState(initialSigungu);
	const [showMap, setShowMap] = useState(searchParams.get("view") === "map");
	const [showFilters, setShowFilters] = useState(() => {
		return Boolean(
			shouldOpenFiltersFromQuery ||
				searchParams.get("type") ||
				searchParams.get("to") ||
				searchParams.get("sido") ||
				searchParams.get("sigungu"),
		);
	});

	const [sidoOptions, setSidoOptions] = useState<string[]>([]);
	const [sigunguOptions, setSigunguOptions] = useState<string[]>([]);
	const [isLoadingSido, setIsLoadingSido] = useState(false);
	const [isLoadingSigungu, setIsLoadingSigungu] = useState(false);
	const [gpsState, setGpsState] = useState<GPSState>({
		lat: null,
		lng: null,
		loading: false,
	});

	const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
	const [isTimeout, setIsTimeout] = useState(false);
	const isInitialMount = useRef(true);
	const hasHandledFocusRadiusRef = useRef(false);
	const hasAutoFilterOpenTrackedRef = useRef(false);

	const activeFilterCount = useMemo(
		() =>
			selectedTypes.length +
			(toOnly ? 1 : 0) +
			(selectedSigungu ? 1 : 0) +
			(selectedSido ? 1 : 0),
		[selectedSido, selectedSigungu, selectedTypes.length, toOnly],
	);

	const facilityQuery = useMemo(
		() => ({
			search: debouncedSearch || undefined,
			type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
			status: toOnly ? "available" : undefined,
			sido: selectedSido || undefined,
			sigungu: selectedSigungu || undefined,
			sort: sortBy,
		}),
		[debouncedSearch, selectedSido, selectedSigungu, selectedTypes, sortBy, toOnly],
	);

	const {
		facilities,
		total,
		isLoading,
		isLoadingMore,
		error,
		loadMore,
		refresh,
		hasMore,
	} = useFacilities(facilityQuery);

	useEffect(() => {
		const shouldOpenFilters = searchParams.get("openFilters") === "1";
		if (!shouldOpenFilters || hasAutoFilterOpenTrackedRef.current) {
			return;
		}

		hasAutoFilterOpenTrackedRef.current = true;
		setShowFilters(true);
		trackEvent("filter_open", "explore", {
			entry_point: "explore_filter",
			funnel_step: "open_sheet",
			active_filter_count: activeFilterCount,
			result_count: total,
			filters: {
				types: selectedTypes,
				sido: selectedSido || undefined,
				sigungu: selectedSigungu || undefined,
				vacancyOnly: toOnly,
				sortBy,
			},
		});
	}, [activeFilterCount, selectedSigungu, selectedSido, selectedTypes, sortBy, searchParams, toOnly, total]);

	useEffect(() => {
		let active = true;
		setIsLoadingSido(true);

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

	useEffect(() => {
		let active = true;
		setIsLoadingSigungu(true);
		setSigunguOptions([]);

		if (!selectedSido) {
			setIsLoadingSigungu(false);
			setSelectedSigungu((current) => (current ? "" : current));
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

	const syncUrl = useCallback(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}

		const params = new URLSearchParams();
		if (debouncedSearch) params.set("q", debouncedSearch);
		if (selectedTypes.length > 0) params.set("type", selectedTypes.join(","));
		if (toOnly) params.set("to", "1");
		if (selectedSido) params.set("sido", selectedSido);
		if (selectedSigungu) params.set("sigungu", selectedSigungu);
		if (sortBy !== "distance") params.set("sort", sortBy);
		if (showMap) params.set("view", "map");

		const queryString = params.toString();
		router.replace(`/explore${queryString ? `?${queryString}` : ""}`, {
			scroll: false,
		});
	}, [
		debouncedSearch,
		router,
		selectedSido,
		selectedSigungu,
		selectedTypes,
		sortBy,
		showMap,
		toOnly,
	]);

	useEffect(() => {
		syncUrl();
	}, [syncUrl]);

	useEffect(() => {
		if (!shouldFocusMapRadius || hasHandledFocusRadiusRef.current) {
			return;
		}

		hasHandledFocusRadiusRef.current = true;
		setShowMap(true);
		addToast({
			type: "info",
			message: "반경을 넓히면 후보가 더 많이 보여요",
		});
		trackEvent("filter_open", "explore", {
			entry_point: "explore_empty_map",
			funnel_step: "map_radius_focus",
			map_view: true,
		});

		const nextParams = new URLSearchParams(searchParams.toString());
		nextParams.delete("focusRadius");
		nextParams.set("view", "map");
		const query = nextParams.toString();
		router.replace(`/explore${query ? `?${query}` : ""}`, {
			scroll: false,
		});
	}, [addToast, router, searchParams, shouldFocusMapRadius]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedSearch(searchInput);
		}, SEARCH_DEBOUNCE_MS);

		return () => window.clearTimeout(timeoutId);
	}, [searchInput]);

	const toCount = total;

	const sortedFacilities = useMemo(() => {
		if (facilities.length === 0) return facilities;

		return [...facilities].sort((a, b) => {
			const premiumScoreA = a.isPremium ? 1 : 0;
			const premiumScoreB = b.isPremium ? 1 : 0;
			return premiumScoreB - premiumScoreA;
		});
	}, [facilities]);

	const resultLabel = useMemo(
		() =>
			buildResultLabel({
				selectedSido,
				selectedSigungu,
				selectedTypes,
				total,
				isLoading,
			}),
		[isLoading, selectedSido, selectedSigungu, selectedTypes, total],
	);

	const mapFacilityPoints = useMemo<ExploreMapPoint[]>(
		() =>
			facilities.map((facility) => ({
				id: facility.id,
				name: facility.name,
				lat: facility.lat,
				lng: facility.lng,
				status: facility.status,
			})),
		[facilities],
	);

	const userLocation = useMemo(() => {
		if (gpsState.lat === null || gpsState.lng === null) return undefined;
		return { lat: gpsState.lat, lng: gpsState.lng };
	}, [gpsState.lat, gpsState.lng]);

	const mapCenter = useMemo(() => {
		if (userLocation) return userLocation;
		if (mapFacilityPoints.length === 0) return undefined;
		return {
			lat: mapFacilityPoints[0].lat,
			lng: mapFacilityPoints[0].lng,
		};
	}, [mapFacilityPoints, userLocation]);

	const hasSearchInput = useMemo(
		() => debouncedSearch.trim().length > 0,
		[debouncedSearch],
	);
	const hasFilterApplied = activeFilterCount > 0;
	const hasMapContent = useMemo(
		() => mapFacilityPoints.length > 0 || Boolean(userLocation),
		[mapFacilityPoints.length, userLocation],
	);

	const chatPromptHref = useMemo(
		() => `/chat?prompt=${encodeURIComponent(debouncedSearch.trim())}`,
		[debouncedSearch],
	);

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
			const nextActiveFilterCount =
				nextTypes.length +
				(toOnly ? 1 : 0) +
				(selectedSigungu ? 1 : 0) +
				(selectedSido ? 1 : 0);
			trackEvent("filter_apply", "explore", {
				entry_point: "explore_filter",
				funnel_step: "apply_type",
				active_filter_count: nextActiveFilterCount,
				result_count: total,
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
	}, [selectedSido, selectedSigungu, sortBy, toOnly, total]);

	const toggleToOnly = useCallback(() => {
		setToOnly((prev) => {
			const next = !prev;
			const nextActiveFilterCount =
				selectedTypes.length +
				(next ? 1 : 0) +
				(selectedSigungu ? 1 : 0) +
				(selectedSido ? 1 : 0);
			trackEvent(next ? "vacancy_only_toggle_on" : "vacancy_only_toggle_off", "explore", {
				entry_point: "explore_filter",
				funnel_step: next ? "toggle_vacancy_on" : "toggle_vacancy_off",
				active_filter_count: nextActiveFilterCount,
				result_count: total,
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
				result_count: total,
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
	}, [selectedSido, selectedSigungu, selectedTypes, sortBy, total]);

	const changeSortBy = useCallback((nextSort: ExploreSortKey) => {
		setSortBy(nextSort);
		trackEvent("filter_apply", "explore", {
			entry_point: "explore_filter",
			funnel_step: "apply_sort",
			active_filter_count: activeFilterCount,
			result_count: total,
			filters: {
				types: selectedTypes,
				sido: selectedSido || undefined,
				sigungu: selectedSigungu || undefined,
				vacancyOnly: toOnly,
				sortBy: nextSort,
			},
		});
	}, [activeFilterCount, selectedSido, selectedSigungu, selectedTypes, toOnly, total]);

	const changeSido = useCallback((nextSido: string) => {
		setSelectedSido(nextSido);
		setSelectedSigungu("");
		const nextActiveFilterCount =
			selectedTypes.length +
			(toOnly ? 1 : 0) +
			(nextSido ? 1 : 0);
		trackEvent("filter_apply", "explore", {
			entry_point: "explore_filter",
			funnel_step: "apply_sido",
			active_filter_count: nextActiveFilterCount,
			result_count: total,
			filters: {
				types: selectedTypes,
				sido: nextSido || undefined,
				sigungu: undefined,
				vacancyOnly: toOnly,
				sortBy,
			},
		});
	}, [selectedTypes, sortBy, toOnly, total]);

	const changeSigungu = useCallback((nextSigungu: string) => {
		setSelectedSigungu(nextSigungu);
		const nextActiveFilterCount =
			selectedTypes.length +
			(toOnly ? 1 : 0) +
			(selectedSido ? 1 : 0) +
			(nextSigungu ? 1 : 0);
		trackEvent("filter_apply", "explore", {
			entry_point: "explore_filter",
			funnel_step: "apply_sigungu",
			active_filter_count: nextActiveFilterCount,
			result_count: total,
			filters: {
				types: selectedTypes,
				sido: selectedSido || undefined,
				sigungu: nextSigungu || undefined,
				vacancyOnly: toOnly,
				sortBy,
			},
		});
	}, [selectedSido, selectedTypes, sortBy, toOnly, total]);

	const toggleFilters = useCallback(() => {
		setShowFilters((prev) => {
			const next = !prev;
			if (next) {
				trackEvent("filter_open", "explore", {
					entry_point: "explore_filter",
					funnel_step: "open_sheet",
					active_filter_count: activeFilterCount,
					result_count: total,
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
	}, [activeFilterCount, selectedSido, selectedSigungu, selectedTypes, sortBy, toOnly, total]);

	const openFilters = useCallback(() => {
		setShowFilters((prev) => {
			if (prev) {
				return true;
			}

			trackEvent("filter_open", "explore", {
				entry_point: "explore_filter",
				funnel_step: "open_sheet",
				active_filter_count: activeFilterCount,
				result_count: total,
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
	}, [activeFilterCount, selectedSido, selectedSigungu, selectedTypes, sortBy, toOnly, total]);

	const toggleMap = useCallback(() => {
		setShowMap((prev) => !prev);
	}, []);

	const requestCurrentLocation = useCallback(async () => {
		if (gpsState.loading) return;

		if (typeof navigator === "undefined" || !navigator.geolocation) {
			setGpsState((prev) => ({ ...prev, loading: false }));
			addToast({
				type: "error",
				message: "이 기기에서 위치 서비스를 지원하지 않아요",
			});
			return;
		}

		setGpsState((prev) => ({ ...prev, loading: true }));

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 30000,
				});
			});

			const { latitude, longitude } = position.coords;
			const geocodeRes = await apiFetch<ReverseGeocodeResponse>(
				`/api/regions/sigungu?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`,
			);

			setGpsState((prev) => ({
				...prev,
				lat: latitude,
				lng: longitude,
			}));

			if (geocodeRes.data.sido) {
				setSelectedSido(geocodeRes.data.sido);
			}
			if (geocodeRes.data.sigungu) {
				setSelectedSigungu(geocodeRes.data.sigungu);
			}

			addToast({
				type: "success",
				message: "현재 위치로 지역이 설정되었어요",
			});
		} catch (error) {
			let message = "현재 위치 정보를 가져오지 못했어요";

			if (error instanceof GeolocationPositionError) {
				switch (error.code) {
					case error.PERMISSION_DENIED:
						message = "위치 권한을 허용해주세요";
						break;
					case error.POSITION_UNAVAILABLE:
						message = "현재 위치를 찾을 수 없어요";
						break;
					case error.TIMEOUT:
						message = "위치 확인 시간이 초과했어요";
						break;
					default:
						message = "현재 위치를 가져오지 못했어요";
				}
			}

			addToast({ type: "error", message });
		} finally {
			setGpsState((prev) => ({ ...prev, loading: false }));
		}
	}, [addToast, gpsState.loading]);

	const resetFilters = useCallback(() => {
		trackEvent("filter_reset", "explore", {
			entry_point: "explore_filter",
			funnel_step: "reset",
			active_filter_count: activeFilterCount,
			result_count: total,
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
	}, [activeFilterCount, selectedSido, selectedSigungu, selectedTypes, sortBy, toOnly, total]);

	const retry = useCallback(() => {
		setIsTimeout(false);
		refresh();
	}, [refresh]);

	const handleUseCurrentLocation = useCallback(() => {
		void requestCurrentLocation();
	}, [requestCurrentLocation]);

	useEffect(() => {
		if (!isLoading || facilities.length > 0 || error) {
			setIsTimeout(false);
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setIsTimeout(true);
		}, FACILITY_LOAD_TIMEOUT_MS);

		return () => window.clearTimeout(timeoutId);
	}, [error, facilities.length, isLoading]);

	const headerState = useMemo<ExploreSearchHeaderState>(
		() => ({
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
			isGpsLoading: gpsState.loading,
		}),
		[
			activeFilterCount,
			gpsState.loading,
			isLoadingSido,
			isLoadingSigungu,
			recentSearches,
			resultLabel,
			searchInput,
			selectedSido,
			selectedSigungu,
			selectedTypes,
			showFilters,
			showMap,
			sidoOptions,
			sigunguOptions,
			sortBy,
			toCount,
			toOnly,
		],
	);

	const headerActions = useMemo<ExploreSearchHeaderActions>(
		() => ({
			onSearchInputChange: setSearchInput,
			onSubmitSearch: submitSearch,
			onApplySearch: applySearch,
			onClearSearch: clearSearch,
			onClearRecentSearches: clearRecentSearchHistory,
			onToggleFilters: toggleFilters,
			onToggleMap: toggleMap,
			onToggleType: toggleType,
			onToggleToOnly: toggleToOnly,
			onSortChange: changeSortBy,
			onSidoChange: changeSido,
			onSigunguChange: changeSigungu,
			onUseCurrentLocation: handleUseCurrentLocation,
			onResetFilters: resetFilters,
		}),
		[
			applySearch,
			changeSido,
			changeSigungu,
			changeSortBy,
			clearRecentSearchHistory,
			clearSearch,
			handleUseCurrentLocation,
			resetFilters,
			setSearchInput,
			submitSearch,
			toggleFilters,
			toggleMap,
			toggleToOnly,
			toggleType,
		],
	);

	const resultState = useMemo<ExploreResultState>(
		() => ({
			facilities: sortedFacilities,
			isLoading,
			isLoadingMore,
			error,
			isTimeout,
			hasMore,
			hasSearchInput,
			hasFilterApplied,
			debouncedSearch,
			sortBy,
			vacancyOnly: toOnly,
			chatPromptHref,
		}),
		[
			chatPromptHref,
			debouncedSearch,
			error,
			hasFilterApplied,
			hasMore,
			hasSearchInput,
			isLoading,
			isLoadingMore,
			isTimeout,
			sortBy,
			sortedFacilities,
			toOnly,
		],
	);

	const resultActions = useMemo<ExploreResultActions>(
		() => ({
			onRetry: retry,
			onLoadMore: loadMore,
			onResetSearch: clearSearch,
			onResetFilters: resetFilters,
			onOpenFilters: openFilters,
			onOpenMap: () => {
				const nextParams = new URLSearchParams(searchParams.toString());
				nextParams.set("view", "map");
				nextParams.set("focusRadius", "1");
				const query = nextParams.toString();
				router.replace(`/explore${query ? `?${query}` : ""}`, {
					scroll: false,
				});
				setShowMap(true);
			},
		}),
		[clearSearch, loadMore, openFilters, resetFilters, retry, router, searchParams],
	);

	const mapState = useMemo<ExploreMapState>(
		() => ({
			showMap,
			hasMapContent,
			facilities: mapFacilityPoints,
			center: mapCenter,
			userLocation,
		}),
		[hasMapContent, mapCenter, mapFacilityPoints, showMap, userLocation],
	);

	return {
		headerState,
		headerActions,
		resultState,
		resultActions,
		mapState,
	};
}
