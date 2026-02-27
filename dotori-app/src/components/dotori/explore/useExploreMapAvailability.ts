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

function isHardBlockedStatus(status: KakaoMapSdkStatus): boolean {
	return status === "missing_key" || status === "unauthorized" || status === "invalid_key";
}

export function useExploreMapAvailability() {
	const [isMapAvailable, setIsMapAvailable] = useState(true);
	const [mapDisabledReason, setMapDisabledReason] = useState<string | null>(null);
	const mapAvailabilityCheckRef = useRef<Promise<boolean> | null>(null);

	const checkMapAvailability = useCallback(async () => {
		if (mapAvailabilityCheckRef.current) {
			return mapAvailabilityCheckRef.current;
		}

		const checkPromise = (async () => {
			try {
				const response = await apiFetch<KakaoMapSdkStatusResponse>("/api/maps/sdk-status");
				const blocked = isHardBlockedStatus(response.data.status);

				setIsMapAvailable(!blocked);
				setMapDisabledReason(blocked ? response.data.message : null);
				return !blocked;
			} catch {
				// 네트워크 일시 오류는 지도 노출을 막지 않는다.
				setIsMapAvailable(true);
				setMapDisabledReason(null);
				return true;
			} finally {
				mapAvailabilityCheckRef.current = null;
			}
		})();

		mapAvailabilityCheckRef.current = checkPromise;
		return checkPromise;
	}, []);

	useEffect(() => {
		void checkMapAvailability();
	}, [checkMapAvailability]);

	return {
		isMapAvailable,
		mapDisabledReason,
		checkMapAvailability,
	};
}
