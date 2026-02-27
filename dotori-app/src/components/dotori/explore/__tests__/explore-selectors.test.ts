import { describe, expect, it } from "vitest";
import {
	buildChatPromptHref,
	countActiveFilters,
	hasMapContent,
	hasSearchInput,
	sortFacilitiesByPremium,
	toMapCenter,
	toMapFacilityPoints,
	toUserLocation,
} from "@/components/dotori/explore/explore-selectors";
import type { Facility } from "@/types/dotori";

function makeFacility(overrides: Partial<Facility>): Facility {
	return {
		id: "facility-1",
		name: "테스트어린이집",
		type: "민간",
		status: "available",
		address: "서울시 강남구",
		lat: 37.5,
		lng: 127.0,
		distance: "1.2km",
		capacity: {
			total: 50,
			current: 30,
			waiting: 3,
		},
		features: [],
		reviewCount: 0,
		rating: 0,
		images: [],
		isPremium: false,
		lastSyncedAt: "2026-02-24T00:00:00.000Z",
		...overrides,
	};
}

describe("explore-selectors", () => {
	it("counts active filters consistently", () => {
		expect(
			countActiveFilters({
				selectedTypes: ["민간", "국공립"],
				toOnly: true,
				selectedSido: "서울특별시",
				selectedSigungu: "",
			}),
		).toBe(4);
	});

	it("sorts facilities by premium first", () => {
		const facilities = [
			makeFacility({ id: "normal-a", isPremium: false }),
			makeFacility({ id: "premium", isPremium: true }),
			makeFacility({ id: "normal-b", isPremium: false }),
		];
		const sorted = sortFacilitiesByPremium(facilities);
		expect(sorted[0]?.id).toBe("premium");
		expect(facilities[0]?.id).toBe("normal-a");
	});

	it("derives map points and center from facilities and gps", () => {
		const facilities = [
			makeFacility({ id: "a", lat: 37.1, lng: 127.1, status: "waiting" }),
			makeFacility({ id: "b", lat: 37.2, lng: 127.2, status: "full" }),
		];
		const points = toMapFacilityPoints(facilities);
		expect(points).toHaveLength(2);
		expect(points[0]).toMatchObject({ id: "a", lat: 37.1, lng: 127.1, status: "waiting" });

		const gps = toUserLocation({ lat: 36.5, lng: 127.8, loading: false });
		expect(gps).toEqual({ lat: 36.5, lng: 127.8 });

		const centeredByGps = toMapCenter(points, gps);
		expect(centeredByGps).toEqual({ lat: 36.5, lng: 127.8 });

		const centeredByFacility = toMapCenter(points, undefined);
		expect(centeredByFacility).toEqual({ lat: 37.1, lng: 127.1 });
	});

	it("computes search/map derived flags and chat href", () => {
		expect(hasSearchInput("   ")).toBe(false);
		expect(hasSearchInput("강남")).toBe(true);
		expect(hasMapContent([], undefined)).toBe(false);
		expect(hasMapContent([{ id: "a", name: "a", lat: 1, lng: 1, status: "available" }], undefined)).toBe(true);
		expect(buildChatPromptHref("강남 주변")).toBe("/chat?prompt=%EA%B0%95%EB%82%A8%20%EC%A3%BC%EB%B3%80");
	});
});
