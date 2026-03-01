"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
	setMapView: (view: "list" | "map") => Promise<boolean>;
	hasMapContent: boolean;
	mapFacilityPoints: ExploreMapPoint[];
	mapCenter: { lat: number; lng: number } | undefined;
	userLocation: { lat: number; lng: number } | undefined;
	isMapAvailable: boolean;
	mapDisabledReason: string | null;
	checkMapAvailability: () => Promise<boolean>;
	toggleMap: () => Promise<boolean>;
}

interface UseExploreMapStateParams {
	initialShowMap: boolean;
	facilities: Facility[];
	gpsState: GPSState;
}

const MAP_DISABLED_FALLBACK_MESSAGE =
	"지도 기능이 비활성화되어 있어요. 운영 설정을 확인해주세요.";

export function useExploreMapState({
	initialShowMap,
	facilities,
	gpsState,
}: UseExploreMapStateParams): UseExploreMapStateReturn {
	const { addToast } = useToast();
	const [showMap, setShowMap] = useState(initialShowMap);
	const targetViewRef = useRef<"list" | "map">(initialShowMap ? "map" : "list");
	const showMapRef = useRef(showMap);
	const requestSeqRef = useRef(0);
	const isMountedRef = useRef(true);

	const {
		isMapAvailable,
		mapDisabledReason,
		checkMapAvailability,
		checkMapAvailabilityDetailed,
	} = useExploreMapAvailability();
	const latestMapDisabledReasonRef = useRef<string | null>(mapDisabledReason);

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

	useEffect(() => {
		latestMapDisabledReasonRef.current = mapDisabledReason;
	}, [mapDisabledReason]);

	useEffect(() => {
		showMapRef.current = showMap;
	}, [showMap]);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			requestSeqRef.current += 1;
		};
	}, []);

	const setMapView = useCallback(async (view: "list" | "map"): Promise<boolean> => {
		targetViewRef.current = view;
		if (view === "list") {
			requestSeqRef.current += 1;
			setShowMap(false);
			return true;
		}

		const requestSeq = requestSeqRef.current + 1;
		requestSeqRef.current = requestSeq;

		const { available, reason } = await checkMapAvailabilityDetailed();
		if (
			!isMountedRef.current ||
			requestSeq !== requestSeqRef.current ||
			targetViewRef.current !== "map"
		) {
			return false;
		}
		if (!available) {
			targetViewRef.current = "list";
			latestMapDisabledReasonRef.current = reason;
			if (!showMapRef.current) {
				addToast({
					type: "error",
					message: reason || MAP_DISABLED_FALLBACK_MESSAGE,
				});
			}
			return false;
		}
		setShowMap(true);
		return true;
	}, [addToast, checkMapAvailabilityDetailed]);

	const toggleMap = useCallback(async () => {
		return setMapView(targetViewRef.current === "map" ? "list" : "map");
	}, [setMapView]);

	useEffect(() => {
		if (!showMap || isMapAvailable) {
			return;
		}

		const resetTimer = window.setTimeout(() => {
			requestSeqRef.current += 1;
			targetViewRef.current = "list";
			setShowMap(false);
		}, 0);

		addToast({
			type: "error",
			message:
				latestMapDisabledReasonRef.current || MAP_DISABLED_FALLBACK_MESSAGE,
		});

		return () => {
			window.clearTimeout(resetTimer);
		};
	}, [addToast, isMapAvailable, showMap]);

	return {
		showMap,
		setShowMap,
		setMapView,
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
