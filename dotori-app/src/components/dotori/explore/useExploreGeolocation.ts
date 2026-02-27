"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import type { GPSState } from "./useExploreSearch.types";

interface ReverseGeocodeResponse {
	data: {
		sido: string;
		sigungu: string;
		dong: string;
	};
}

export interface UseExploreGeolocationReturn {
	gpsState: GPSState;
	requestCurrentLocation: (callbacks: {
		onSido: (sido: string) => void;
		onSigungu: (sigungu: string) => void;
	}) => Promise<void>;
	handleUseCurrentLocation: (callbacks: {
		onSido: (sido: string) => void;
		onSigungu: (sigungu: string) => void;
	}) => void;
}

export function useExploreGeolocation(): UseExploreGeolocationReturn {
	const { addToast } = useToast();

	const [gpsState, setGpsState] = useState<GPSState>({
		lat: null,
		lng: null,
		loading: false,
	});

	const requestCurrentLocation = useCallback(async (callbacks: {
		onSido: (sido: string) => void;
		onSigungu: (sigungu: string) => void;
	}) => {
		if (gpsState.loading) return;

		if (typeof navigator === "undefined" || !navigator.geolocation) {
			setGpsState((prev) => ({ ...prev, loading: false }));
			addToast({
				type: "error",
				message: "이 기기에서 위치 서비스를 지원하지 않아요",
			});
			return;
		}

		setGpsState((prev) => ({ ...prev, loading: true }));

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 30000,
				});
			});

			const { latitude, longitude } = position.coords;
			const geocodeRes = await apiFetch<ReverseGeocodeResponse>(
				`/api/geocode/reverse?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`,
			);

			setGpsState((prev) => ({
				...prev,
				lat: latitude,
				lng: longitude,
			}));

			if (geocodeRes.data.sido) {
				callbacks.onSido(geocodeRes.data.sido);
			}
			if (geocodeRes.data.sigungu) {
				callbacks.onSigungu(geocodeRes.data.sigungu);
			}

			addToast({
				type: "success",
				message: "현재 위치로 지역이 설정되었어요",
			});
		} catch (error) {
			let message = "현재 위치 정보를 가져오지 못했어요";

			if (error instanceof GeolocationPositionError) {
				switch (error.code) {
					case error.PERMISSION_DENIED:
						message = "위치 권한을 허용해주세요";
						break;
					case error.POSITION_UNAVAILABLE:
						message = "현재 위치를 찾을 수 없어요";
						break;
					case error.TIMEOUT:
						message = "위치 확인 시간이 초과했어요";
						break;
					default:
						message = "현재 위치를 가져오지 못했어요";
				}
			} else if (error instanceof Error && error.message) {
				message = error.message;
			}

			addToast({ type: "error", message });
		} finally {
			setGpsState((prev) => ({ ...prev, loading: false }));
		}
	}, [addToast, gpsState.loading]);

	const handleUseCurrentLocation = useCallback((callbacks: {
		onSido: (sido: string) => void;
		onSigungu: (sigungu: string) => void;
	}) => {
		void requestCurrentLocation(callbacks);
	}, [requestCurrentLocation]);

	return {
		gpsState,
		requestCurrentLocation,
		handleUseCurrentLocation,
	};
}
