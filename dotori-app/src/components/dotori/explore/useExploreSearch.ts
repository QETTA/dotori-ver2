"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/dotori/ToastProvider";
import { useFacilities } from "@/hooks/use-facilities";
import { apiFetch } from "@/lib/api";
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

export interface UseExploreSearchReturn {
	searchInput: string;
	debouncedSearch: string;
	selectedTypes: string[];
	toOnly: boolean;
	sortBy: ExploreSortKey;
	selectedSido: string;
	selectedSigungu: string;
	showMap: boolean;
	showFilters: boolean;
	sidoOptions: string[];
	sigunguOptions: string[];
	isLoadingSido: boolean;
	isLoadingSigungu: boolean;
	gpsState: GPSState;
	recentSearches: string[];
	resultLabel: string;
	activeFilterCount: number;
	toCount: number;
	hasSearchInput: boolean;
	hasFilterApplied: boolean;
	chatPromptHref: string;
	facilities: Facility[];
	isLoading: boolean;
	isLoadingMore: boolean;
	error: string | null;
	hasMore: boolean;
	mapFacilityPoints: ExploreMapPoint[];
	mapCenter: { lat: number; lng: number } | undefined;
	userLocation: { lat: number; lng: number } | undefined;
	hasMapContent: boolean;
	isTimeout: boolean;
	setSearchInput: (value: string) => void;
	submitSearch: () => void;
	applySearch: (term: string) => void;
	clearSearch: () => void;
	clearRecentSearchHistory: () => void;
	toggleType: (type: string) => void;
	toggleToOnly: () => void;
	changeSortBy: (nextSort: ExploreSortKey) => void;
	changeSido: (nextSido: string) => void;
	changeSigungu: (nextSigungu: string) => void;
	toggleFilters: () => void;
	toggleMap: () => void;
	useCurrentLocation: () => Promise<void>;
	resetFilters: () => void;
	retry: () => void;
	loadMore: () => void;
}

export function useExploreSearch(): UseExploreSearchReturn {
	const { addToast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();

	const initialSearch = searchParams.get("q") ?? "";
	const initialSido = searchParams.get("sido") ?? "";
	const initialSigungu = searchParams.get("sigungu") ?? "";

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
	const [showMap, setShowMap] = useState(false);
	const [showFilters, setShowFilters] = useState(() => {
		return Boolean(
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
		toOnly,
	]);

	useEffect(() => {
		syncUrl();
	}, [syncUrl]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedSearch(searchInput);
		}, SEARCH_DEBOUNCE_MS);

		return () => window.clearTimeout(timeoutId);
	}, [searchInput]);

	const {
		facilities,
		total,
		isLoading,
		isLoadingMore,
		error,
		loadMore,
		refresh,
		hasMore,
	} = useFacilities({
		search: debouncedSearch || undefined,
		type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
		status: toOnly ? "available" : undefined,
		sido: selectedSido || undefined,
		sigungu: selectedSigungu || undefined,
		sort: sortBy,
	});

	const toCount = useMemo(
		() => facilities.filter((facility) => facility.status === "available").length,
		[facilities],
	);

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

	const activeFilterCount =
		selectedTypes.length +
		(toOnly ? 1 : 0) +
		(selectedSigungu ? 1 : 0) +
		(selectedSido ? 1 : 0);

	const hasSearchInput = debouncedSearch.trim().length > 0;
	const hasFilterApplied = activeFilterCount > 0;
	const hasMapContent = mapFacilityPoints.length > 0 || Boolean(userLocation);

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
		setSelectedTypes((prev) =>
			prev.includes(type)
				? prev.filter((currentType) => currentType !== type)
				: [...prev, type],
		);
	}, []);

	const toggleToOnly = useCallback(() => {
		setToOnly((prev) => !prev);
	}, []);

	const changeSortBy = useCallback((nextSort: ExploreSortKey) => {
		setSortBy(nextSort);
	}, []);

	const changeSido = useCallback((nextSido: string) => {
		setSelectedSido(nextSido);
		setSelectedSigungu("");
	}, []);

	const changeSigungu = useCallback((nextSigungu: string) => {
		setSelectedSigungu(nextSigungu);
	}, []);

	const toggleFilters = useCallback(() => {
		setShowFilters((prev) => !prev);
	}, []);

	const toggleMap = useCallback(() => {
		setShowMap((prev) => !prev);
	}, []);

	const useCurrentLocation = useCallback(async () => {
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
		setSearchInputState("");
		setDebouncedSearch("");
		setSelectedTypes([]);
		setToOnly(false);
		setSortBy("distance");
		setSelectedSido("");
		setSelectedSigungu("");
	}, []);

	const retry = useCallback(() => {
		setIsTimeout(false);
		refresh();
	}, [refresh]);

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

	return {
		searchInput,
		debouncedSearch,
		selectedTypes,
		toOnly,
		sortBy,
		selectedSido,
		selectedSigungu,
		showMap,
		showFilters,
		sidoOptions,
		sigunguOptions,
		isLoadingSido,
		isLoadingSigungu,
		gpsState,
		recentSearches,
		resultLabel,
		activeFilterCount,
		toCount,
		hasSearchInput,
		hasFilterApplied,
		chatPromptHref,
		facilities: sortedFacilities,
		isLoading,
		isLoadingMore,
		error,
		hasMore,
		mapFacilityPoints,
		mapCenter,
		userLocation,
		hasMapContent,
		isTimeout,
		setSearchInput,
		submitSearch,
		applySearch,
		clearSearch,
		clearRecentSearchHistory,
		toggleType,
		toggleToOnly,
		changeSortBy,
		changeSido,
		changeSigungu,
		toggleFilters,
		toggleMap,
		useCurrentLocation,
		resetFilters,
		retry,
		loadMore,
	};
}
