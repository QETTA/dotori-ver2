import { describe, expect, it } from "vitest";
import {
	buildExploreSyncQueryString,
	buildMapFocusQueryString,
	buildMapViewQueryString,
	readExploreInitialQueryState,
} from "@/components/dotori/explore/explore-query";

describe("explore-query", () => {
	it("parses default initial state from empty query", () => {
		const state = readExploreInitialQueryState(new URLSearchParams());

		expect(state).toMatchObject({
			initialSearch: "",
			initialSido: "",
			initialSigungu: "",
			initialSelectedTypes: [],
			initialToOnly: false,
			initialSortBy: "distance",
			initialShowMap: false,
			initialShowFilters: false,
			shouldFocusMapRadius: false,
			shouldOpenFiltersFromQuery: false,
		});
	});

	it("filters invalid query values and derives flags", () => {
		const params = new URLSearchParams(
			"q=test&type=민간,INVALID&to=1&sido=서울특별시&sigungu=강남구&sort=unknown&openFilters=1&view=map&focusRadius=1",
		);
		const state = readExploreInitialQueryState(params);

		expect(state.initialSearch).toBe("test");
		expect(state.initialSelectedTypes).toEqual(["민간"]);
		expect(state.initialToOnly).toBe(true);
		expect(state.initialSortBy).toBe("distance");
		expect(state.initialShowMap).toBe(true);
		expect(state.initialShowFilters).toBe(true);
		expect(state.shouldFocusMapRadius).toBe(true);
		expect(state.shouldOpenFiltersFromQuery).toBe(true);
	});

	it("builds sync query by omitting default values", () => {
		const query = buildExploreSyncQueryString({
			debouncedSearch: "",
			selectedTypes: [],
			toOnly: false,
			selectedSido: "",
			selectedSigungu: "",
			sortBy: "distance",
			showMap: false,
		});
		expect(query).toBe("");

		const nonDefaultQuery = buildExploreSyncQueryString({
			debouncedSearch: "강남",
			selectedTypes: ["국공립", "민간"],
			toOnly: true,
			selectedSido: "서울특별시",
			selectedSigungu: "강남구",
			sortBy: "rating",
			showMap: true,
		});
		expect(nonDefaultQuery).toBe(
			"q=%EA%B0%95%EB%82%A8&type=%EA%B5%AD%EA%B3%B5%EB%A6%BD%2C%EB%AF%BC%EA%B0%84&to=1&sido=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C&sigungu=%EA%B0%95%EB%82%A8%EA%B5%AC&sort=rating&view=map",
		);
	});

	it("builds map query strings for focus and plain map view", () => {
		const baseParams = new URLSearchParams("q=강남&openFilters=1&focusRadius=1");

		expect(buildMapViewQueryString(baseParams)).toBe(
			"q=%EA%B0%95%EB%82%A8&openFilters=1&view=map",
		);
		expect(buildMapFocusQueryString(baseParams)).toBe(
			"q=%EA%B0%95%EB%82%A8&openFilters=1&focusRadius=1&view=map",
		);
	});
});
