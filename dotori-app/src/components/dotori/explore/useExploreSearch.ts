"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/components/dotori/ToastProvider";
import { useFacilityActions } from "@/hooks/use-facility-actions";
import { trackEvent } from "@/lib/analytics";
import {
	buildExploreSyncQueryString,
	buildMapFocusQueryString,
	buildMapViewQueryString,
	readExploreInitialQueryState,
} from "./explore-query";
import { useExploreFilters } from "./useExploreFilters";
import { useExploreGeolocation } from "./useExploreGeolocation";
import { useExploreFacilities } from "./useExploreFacilities";
import { useExploreMapState } from "./useExploreMapState";
import type {
	ExploreMapState,
	ExploreResultInteraction,
	ExploreResultActions,
	ExploreResultState,
	ExploreSearchHeaderActions,
	ExploreSearchHeaderState,
	UseExploreSearchReturn,
} from "./useExploreSearch.types";

export type {
	ExploreMapPoint,
	ExploreMapState,
	ExploreResultActions,
	ExploreResultInteraction,
	ExploreResultState,
	ExploreSearchHeaderActions,
	ExploreSearchHeaderState,
	GPSState,
	UseExploreSearchReturn,
} from "./useExploreSearch.types";

export function useExploreResultInteraction(): ExploreResultInteraction {
	const { registerInterest, applyWaiting, loadingAction } = useFacilityActions();
	const registerInterestRef = useRef(registerInterest);
	const applyWaitingRef = useRef(applyWaiting);

	useEffect(() => { registerInterestRef.current = registerInterest; }, [registerInterest]);
	useEffect(() => { applyWaitingRef.current = applyWaiting; }, [applyWaiting]);

	const onRegisterInterest = useCallback((id: string) => { void registerInterestRef.current(id); }, []);
	const onApplyWaiting = useCallback((id: string) => { void applyWaitingRef.current(id); }, []);

	return useMemo(
		() => ({ loadingAction, onRegisterInterest, onApplyWaiting }),
		[loadingAction, onApplyWaiting, onRegisterInterest],
	);
}

export function useExploreSearch(): UseExploreSearchReturn {
	const { addToast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialQueryState = readExploreInitialQueryState(searchParams);

	// --- Sub-hooks ---
	const f = useExploreFilters(initialQueryState);
	const resultInteraction = useExploreResultInteraction();

	const fac = useExploreFacilities({
		debouncedSearch: f.debouncedSearch,
		selectedTypes: f.selectedTypes,
		toOnly: f.toOnly,
		selectedSido: f.selectedSido,
		selectedSigungu: f.selectedSigungu,
		sortBy: f.sortBy,
		activeFilterCount: f.activeFilterCount,
	});

	useEffect(() => { f.setTotalForTracking(fac.total); }, [f, fac.total]);

	const geo = useExploreGeolocation();

	const m = useExploreMapState({
		initialShowMap: initialQueryState.initialShowMap,
		facilities: fac.facilities,
		gpsState: geo.gpsState,
	});

	// --- URL sync ---
	const isInitialMount = useRef(true);
	const hasHandledFocusRadiusRef = useRef(false);

	const syncUrl = useCallback(() => {
		if (isInitialMount.current) { isInitialMount.current = false; return; }
		const qs = buildExploreSyncQueryString({
			debouncedSearch: f.debouncedSearch, selectedTypes: f.selectedTypes,
			toOnly: f.toOnly, selectedSido: f.selectedSido,
			selectedSigungu: f.selectedSigungu, sortBy: f.sortBy, showMap: m.showMap,
		});
		router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
	}, [f.debouncedSearch, router, f.selectedSido, f.selectedSigungu, f.selectedTypes, m.showMap, f.sortBy, f.toOnly]);

	useEffect(() => { syncUrl(); }, [syncUrl]);

	// --- Focus radius ---
	useEffect(() => {
		if (!initialQueryState.shouldFocusMapRadius || hasHandledFocusRadiusRef.current) return;
		hasHandledFocusRadiusRef.current = true;
		m.setShowMap(true);
		addToast({ type: "info", message: "반경을 넓히면 후보가 더 많이 보여요" });
		trackEvent("filter_open", "explore", { entry_point: "explore_empty_map", funnel_step: "map_radius_focus", map_view: true });
		const query = buildMapViewQueryString(searchParams);
		router.replace(`/explore${query ? `?${query}` : ""}`, { scroll: false });
	}, [addToast, m, router, searchParams, initialQueryState.shouldFocusMapRadius]);

	// --- Geolocation wiring ---
	const handleUseCurrentLocation = useCallback(() => {
		geo.handleUseCurrentLocation({ onSido: f.setSelectedSido, onSigungu: f.setSelectedSigungu });
	}, [geo, f.setSelectedSido, f.setSelectedSigungu]);

	// --- Assemble header ---
	const headerState = useMemo<ExploreSearchHeaderState>(() => ({
		searchInput: f.searchInput, toOnly: f.toOnly, sortBy: f.sortBy,
		selectedTypes: f.selectedTypes, selectedSido: f.selectedSido,
		selectedSigungu: f.selectedSigungu, showFilters: f.showFilters,
		showMap: m.showMap, resultLabel: fac.resultLabel,
		activeFilterCount: f.activeFilterCount, toCount: fac.total,
		recentSearches: f.recentSearches, sidoOptions: f.sidoOptions,
		sigunguOptions: f.sigunguOptions, isLoadingSido: f.isLoadingSido,
		isLoadingSigungu: f.isLoadingSigungu, isGpsLoading: geo.gpsState.loading,
		isMapAvailable: m.isMapAvailable, mapDisabledReason: m.mapDisabledReason,
	}), [
		f.activeFilterCount, geo.gpsState.loading, f.isLoadingSido, f.isLoadingSigungu,
		m.isMapAvailable, m.mapDisabledReason, f.recentSearches, fac.resultLabel,
		f.searchInput, f.selectedSido, f.selectedSigungu, f.selectedTypes,
		f.showFilters, m.showMap, f.sidoOptions, f.sigunguOptions,
		f.sortBy, fac.total, f.toOnly,
	]);

	const headerActions = useMemo<ExploreSearchHeaderActions>(() => ({
		onSearchInputChange: f.setSearchInput, onSubmitSearch: f.submitSearch,
		onApplySearch: f.applySearch, onClearSearch: f.clearSearch,
		onClearRecentSearches: f.clearRecentSearchHistory, onToggleFilters: f.toggleFilters,
		onToggleMap: m.toggleMap, onToggleType: f.toggleType,
		onToggleToOnly: f.toggleToOnly, onSortChange: f.changeSortBy,
		onSidoChange: f.changeSido, onSigunguChange: f.changeSigungu,
		onUseCurrentLocation: handleUseCurrentLocation, onResetFilters: f.resetFilters,
	}), [
		f.applySearch, f.changeSido, f.changeSigungu, f.changeSortBy,
		f.clearRecentSearchHistory, f.clearSearch, handleUseCurrentLocation,
		f.resetFilters, f.setSearchInput, f.submitSearch, f.toggleFilters,
		m.toggleMap, f.toggleToOnly, f.toggleType,
	]);

	// --- Assemble results ---
	const resultState = useMemo<ExploreResultState>(() => ({
		facilities: fac.sortedFacilities, isLoading: fac.isLoading,
		isLoadingMore: fac.isLoadingMore, error: fac.error,
		isTimeout: fac.isTimeout, hasMore: fac.hasMore,
		hasSearchInput: fac.hasSearchInput, hasFilterApplied: fac.hasFilterApplied,
		debouncedSearch: f.debouncedSearch, sortBy: f.sortBy,
		vacancyOnly: f.toOnly, chatPromptHref: fac.chatPromptHref,
	}), [
		fac.chatPromptHref, f.debouncedSearch, fac.error, fac.hasFilterApplied,
		fac.hasMore, fac.hasSearchInput, fac.isLoading, fac.isLoadingMore,
		fac.isTimeout, f.sortBy, fac.sortedFacilities, f.toOnly,
	]);

	const resultActions = useMemo<ExploreResultActions>(() => ({
		onRetry: fac.retry, onLoadMore: fac.loadMore,
		onResetSearch: f.clearSearch, onResetFilters: f.resetFilters,
		onOpenFilters: f.openFilters,
		onOpenMap: () => {
			void m.checkMapAvailability().then((available) => {
				if (!available) {
					addToast({ type: "error", message: m.mapDisabledReason || "지도 기능이 비활성화되어 있어요. 운영 설정을 확인해주세요." });
					return;
				}
				const query = buildMapFocusQueryString(searchParams);
				router.replace(`/explore${query ? `?${query}` : ""}`, { scroll: false });
				m.setShowMap(true);
			});
		},
	}), [addToast, m, f.clearSearch, fac.loadMore, f.openFilters, f.resetFilters, fac.retry, router, searchParams]);

	// --- Assemble map ---
	const mapState = useMemo<ExploreMapState>(() => ({
		showMap: m.showMap, hasMapContent: m.hasMapContent,
		facilities: m.mapFacilityPoints, center: m.mapCenter, userLocation: m.userLocation,
	}), [m.hasMapContent, m.mapCenter, m.mapFacilityPoints, m.showMap, m.userLocation]);

	return {
		headerState,
		headerActions,
		resultState,
		resultActions,
		resultInteraction,
		mapState,
	};
}
