import {
	EXPLORE_TYPE_FILTERS,
	type ExploreSortKey,
} from "./explore-constants";
import { isValidFacilityType } from "./explore-utils";

interface QueryReader {
	get: (name: string) => string | null;
	toString: () => string;
}

export interface ExploreInitialQueryState {
	initialSearch: string;
	initialSido: string;
	initialSigungu: string;
	initialSelectedTypes: string[];
	initialToOnly: boolean;
	initialSortBy: ExploreSortKey;
	initialShowMap: boolean;
	initialShowFilters: boolean;
	shouldFocusMapRadius: boolean;
	shouldOpenFiltersFromQuery: boolean;
}

export interface ExploreSyncQueryState {
	debouncedSearch: string;
	selectedTypes: string[];
	toOnly: boolean;
	selectedSido: string;
	selectedSigungu: string;
	sortBy: ExploreSortKey;
	showMap: boolean;
}

function parseExploreSort(rawSort: string | null): ExploreSortKey {
	if (rawSort === "distance" || rawSort === "rating" || rawSort === "capacity") {
		return rawSort;
	}
	return "distance";
}

function parseSelectedTypes(rawTypes: string | null): string[] {
	const tokens = rawTypes
		?.split(",")
		.map((value) => value.trim())
		.filter((value) => value.length > 0) ?? [];

	const validTypes = tokens.filter((value): value is string =>
		isValidFacilityType(value, EXPLORE_TYPE_FILTERS),
	);
	return validTypes.length > 0 ? validTypes : [];
}

export function readExploreInitialQueryState(searchParams: QueryReader): ExploreInitialQueryState {
	const rawType = searchParams.get("type");
	const rawTo = searchParams.get("to");
	const rawSido = searchParams.get("sido");
	const rawSigungu = searchParams.get("sigungu");
	const rawOpenFilters = searchParams.get("openFilters");

	const shouldOpenFiltersFromQuery = rawOpenFilters === "1";

	return {
		initialSearch: searchParams.get("q") ?? "",
		initialSido: rawSido ?? "",
		initialSigungu: rawSigungu ?? "",
		initialSelectedTypes: parseSelectedTypes(rawType),
		initialToOnly: rawTo === "1",
		initialSortBy: parseExploreSort(searchParams.get("sort")),
		initialShowMap: searchParams.get("view") === "map",
		initialShowFilters: Boolean(
			shouldOpenFiltersFromQuery || rawType || rawTo || rawSido || rawSigungu,
		),
		shouldFocusMapRadius: searchParams.get("focusRadius") === "1",
		shouldOpenFiltersFromQuery,
	};
}

export function buildExploreSyncQueryString({
	debouncedSearch,
	selectedTypes,
	toOnly,
	selectedSido,
	selectedSigungu,
	sortBy,
	showMap,
}: ExploreSyncQueryState): string {
	const params = new URLSearchParams();
	if (debouncedSearch) params.set("q", debouncedSearch);
	if (selectedTypes.length > 0) params.set("type", selectedTypes.join(","));
	if (toOnly) params.set("to", "1");
	if (selectedSido) params.set("sido", selectedSido);
	if (selectedSigungu) params.set("sigungu", selectedSigungu);
	if (sortBy !== "distance") params.set("sort", sortBy);
	if (showMap) params.set("view", "map");
	return params.toString();
}

export function buildMapViewQueryString(searchParams: QueryReader): string {
	const nextParams = new URLSearchParams(searchParams.toString());
	nextParams.delete("focusRadius");
	nextParams.set("view", "map");
	return nextParams.toString();
}

export function buildMapFocusQueryString(searchParams: QueryReader): string {
	const nextParams = new URLSearchParams(searchParams.toString());
	nextParams.set("view", "map");
	nextParams.set("focusRadius", "1");
	return nextParams.toString();
}
