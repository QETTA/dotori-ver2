"use client";

import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/components/dotori/ToastProvider";
import type { Facility } from "@/types/dotori";
import {
	hasMapContent as deriveHasMapContent,
	toMapCenter,
	toMapFacilityPoints,
	toUserLocation,
} from "./explore-selectors";
import { useExploreMapAvailability } from "./useExploreMapAvailability";
import type { ExploreMapPoint, GPSState } from "./useExploreSearch.types";

export interface UseExploreMapStateReturn {
	showMap: boolean;
	setShowMap: (value: boolean) => void;
	hasMapContent: boolean;
	mapFacilityPoints: ExploreMapPoint[];
	mapCenter: { lat: number; lng: number } | undefined;
	userLocation: { lat: number; lng: number } | undefined;
	isMapAvailable: boolean;
	mapDisabledReason: string | null;
	checkMapAvailability: () => Promise<boolean>;
	toggleMap: () => void;
}

interface UseExploreMapStateParams {
	initialShowMap: boolean;
	facilities: Facility[];
	gpsState: GPSState;
}

export function useExploreMapState({
	initialShowMap,
	facilities,
	gpsState,
}: UseExploreMapStateParams): UseExploreMapStateReturn {
	const { addToast } = useToast();
	const [showMap, setShowMap] = useState(initialShowMap);

	const {
		isMapAvailable,
		mapDisabledReason,
		checkMapAvailability,
	} = useExploreMapAvailability();

	const mapFacilityPoints = useMemo<ExploreMapPoint[]>(
		() => toMapFacilityPoints(facilities),
		[facilities],
	);

	const userLocation = useMemo(
		() => toUserLocation(gpsState),
		[gpsState],
	);

	const mapCenter = useMemo(
		() => toMapCenter(mapFacilityPoints, userLocation),
		[mapFacilityPoints, userLocation],
	);

	const hasMapContent = useMemo(
		() => deriveHasMapContent(mapFacilityPoints, userLocation),
		[mapFacilityPoints, userLocation],
	);

	const toggleMap = useCallback(() => {
		if (showMap) {
			setShowMap(false);
			return;
		}

		void checkMapAvailability().then((available) => {
			if (!available) {
				addToast({
					type: "error",
					message: mapDisabledReason || "지도 기능이 비활성화되어 있어요. 운영 설정을 확인해주세요.",
				});
				return;
			}
			setShowMap(true);
		});
	}, [addToast, checkMapAvailability, mapDisabledReason, showMap]);

	// Disable map when availability changes
	if (showMap && !isMapAvailable) {
		setShowMap(false);
		addToast({
			type: "error",
			message: mapDisabledReason || "지도 기능이 비활성화되어 있어요. 운영 설정을 확인해주세요.",
		});
	}

	return {
		showMap,
		setShowMap,
		hasMapContent,
		mapFacilityPoints,
		mapCenter,
		userLocation,
		isMapAvailable,
		mapDisabledReason,
		checkMapAvailability,
		toggleMap,
	};
}
