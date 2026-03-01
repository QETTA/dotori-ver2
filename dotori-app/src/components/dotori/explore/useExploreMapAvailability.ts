"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { KakaoMapSdkStatus } from "@/lib/kakao-map-sdk";

interface KakaoMapSdkStatusResponse {
	data: {
		status: KakaoMapSdkStatus;
		message: string;
	};
}

interface MapAvailabilityResult {
	available: boolean;
	reason: string | null;
}

function isHardBlockedStatus(status: KakaoMapSdkStatus): boolean {
	return status === "missing_key" || status === "unauthorized" || status === "invalid_key";
}

export function useExploreMapAvailability() {
	const [isMapAvailable, setIsMapAvailable] = useState(true);
	const [mapDisabledReason, setMapDisabledReason] = useState<string | null>(null);
	const mapAvailabilityCheckRef = useRef<Promise<MapAvailabilityResult> | null>(null);

	const checkMapAvailabilityDetailed = useCallback(async (): Promise<MapAvailabilityResult> => {
		if (mapAvailabilityCheckRef.current) {
			return mapAvailabilityCheckRef.current;
		}

		const checkPromise = (async () => {
			try {
				const response = await apiFetch<KakaoMapSdkStatusResponse>("/api/maps/sdk-status");
				const blocked = isHardBlockedStatus(response.data.status);

				setIsMapAvailable(!blocked);
				setMapDisabledReason(blocked ? response.data.message : null);
				return {
					available: !blocked,
					reason: blocked ? response.data.message : null,
				};
			} catch {
				// 네트워크 일시 오류는 지도 노출을 막지 않는다.
				setIsMapAvailable(true);
				setMapDisabledReason(null);
				return {
					available: true,
					reason: null,
				};
			} finally {
				mapAvailabilityCheckRef.current = null;
			}
		})();

		mapAvailabilityCheckRef.current = checkPromise;
		return checkPromise;
	}, []);

	const checkMapAvailability = useCallback(async () => {
		const result = await checkMapAvailabilityDetailed();
		return result.available;
	}, [checkMapAvailabilityDetailed]);

	useEffect(() => {
		void checkMapAvailability();
	}, [checkMapAvailability]);

	return {
		isMapAvailable,
		mapDisabledReason,
		checkMapAvailability,
		checkMapAvailabilityDetailed,
	};
}
