import type { Facility } from "@/types/dotori";
import type { ExploreMapPoint, GPSState } from "./useExploreSearch.types";

interface ActiveFilterCountInput {
	selectedTypes: string[];
	toOnly: boolean;
	selectedSido: string;
	selectedSigungu: string;
}

export function countActiveFilters({
	selectedTypes,
	toOnly,
	selectedSido,
	selectedSigungu,
}: ActiveFilterCountInput): number {
	return (
		selectedTypes.length +
		(toOnly ? 1 : 0) +
		(selectedSido ? 1 : 0) +
		(selectedSigungu ? 1 : 0)
	);
}

export function sortFacilitiesByPremium(facilities: Facility[]): Facility[] {
	if (facilities.length === 0) return facilities;
	return [...facilities].sort((a, b) => {
		const premiumScoreA = a.isPremium ? 1 : 0;
		const premiumScoreB = b.isPremium ? 1 : 0;
		return premiumScoreB - premiumScoreA;
	});
}

export function toMapFacilityPoints(facilities: Facility[]): ExploreMapPoint[] {
	return facilities.map((facility) => ({
		id: facility.id,
		name: facility.name,
		lat: facility.lat,
		lng: facility.lng,
		status: facility.status,
	}));
}

export function toUserLocation(gpsState: GPSState): { lat: number; lng: number } | undefined {
	if (gpsState.lat === null || gpsState.lng === null) return undefined;
	return { lat: gpsState.lat, lng: gpsState.lng };
}

export function toMapCenter(
	mapFacilityPoints: ExploreMapPoint[],
	userLocation: { lat: number; lng: number } | undefined,
): { lat: number; lng: number } | undefined {
	if (userLocation) return userLocation;
	if (mapFacilityPoints.length === 0) return undefined;
	return {
		lat: mapFacilityPoints[0].lat,
		lng: mapFacilityPoints[0].lng,
	};
}

export function hasMapContent(
	mapFacilityPoints: ExploreMapPoint[],
	userLocation: { lat: number; lng: number } | undefined,
): boolean {
	return mapFacilityPoints.length > 0 || Boolean(userLocation);
}

export function hasSearchInput(debouncedSearch: string): boolean {
	return debouncedSearch.trim().length > 0;
}

export function buildChatPromptHref(debouncedSearch: string): string {
	return `/chat?prompt=${encodeURIComponent(debouncedSearch.trim())}`;
}
