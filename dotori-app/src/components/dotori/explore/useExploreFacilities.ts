"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFacilities } from "@/hooks/use-facilities";
import type { ExploreSortKey } from "./explore-constants";
import { FACILITY_LOAD_TIMEOUT_MS } from "./explore-constants";
import {
	buildChatPromptHref,
	hasSearchInput as deriveHasSearchInput,
	sortFacilitiesByPremium,
} from "./explore-selectors";
import { buildResultLabel } from "./explore-utils";
import type { Facility } from "@/types/dotori";

export interface UseExploreFacilitiesReturn {
	facilities: Facility[];
	sortedFacilities: Facility[];
	total: number;
	isLoading: boolean;
	isLoadingMore: boolean;
	error: string | null;
	hasMore: boolean;
	isTimeout: boolean;
	resultLabel: string;
	hasSearchInput: boolean;
	hasFilterApplied: boolean;
	chatPromptHref: string;
	loadMore: () => void;
	refresh: () => void;
	retry: () => void;
}

interface UseExploreFacilitiesParams {
	debouncedSearch: string;
	selectedTypes: string[];
	toOnly: boolean;
	selectedSido: string;
	selectedSigungu: string;
	sortBy: ExploreSortKey;
	activeFilterCount: number;
}

export function useExploreFacilities({
	debouncedSearch,
	selectedTypes,
	toOnly,
	selectedSido,
	selectedSigungu,
	sortBy,
	activeFilterCount,
}: UseExploreFacilitiesParams): UseExploreFacilitiesReturn {
	const [isTimeout, setIsTimeout] = useState(false);

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

	const sortedFacilities = useMemo(
		() => sortFacilitiesByPremium(facilities),
		[facilities],
	);

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

	const hasSearchInput = useMemo(() => deriveHasSearchInput(debouncedSearch), [debouncedSearch]);
	const hasFilterApplied = activeFilterCount > 0;

	const chatPromptHref = useMemo(
		() => buildChatPromptHref(debouncedSearch),
		[debouncedSearch],
	);

	useEffect(() => {
		if (!isLoading || facilities.length > 0 || error) {
			if (!isTimeout) {
				return;
			}

			const resetId = window.setTimeout(() => {
				setIsTimeout(false);
			}, 0);

			return () => window.clearTimeout(resetId);
		}

		if (isTimeout) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setIsTimeout(true);
		}, FACILITY_LOAD_TIMEOUT_MS);

		return () => window.clearTimeout(timeoutId);
	}, [error, facilities.length, isLoading, isTimeout]);

	const retry = useCallback(() => {
		setIsTimeout(false);
		refresh();
	}, [refresh]);

	return {
		facilities,
		sortedFacilities,
		total,
		isLoading,
		isLoadingMore,
		error,
		hasMore,
		isTimeout,
		resultLabel,
		hasSearchInput,
		hasFilterApplied,
		chatPromptHref,
		loadMore,
		refresh,
		retry,
	};
}
