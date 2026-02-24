"use client";

import Image from "next/image";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand-assets";
import type { FacilityStatus } from "@/types/dotori";

type KakaoMarkerHandler = () => void;

interface MapFacility {
	id: string;
	name: string;
	lat: number;
	lng: number;
	status: FacilityStatus;
}

interface UserLocation {
	lat: number;
	lng: number;
}

const MARKER_COLORS: Record<FacilityStatus, string> = {
	available: "%234a7a42", // forest-500
	waiting: "%23d4a030", // warning
	full: "%23c44040", // danger
};

function markerSvgUrl(status: FacilityStatus) {
	const color = MARKER_COLORS[status];
	return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='12' fill='${color}'/%3E%3Ccircle cx='14' cy='14' r='5' fill='white'/%3E%3C/svg%3E`;
}

function userLocationMarkerUrl() {
	return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%232E80FF'/%3E%3Ccircle cx='12' cy='12' r='4' fill='white'/%3E%3C/svg%3E";
}

const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
const KAKAO_MAP_SDK_SCRIPT_ID = "kakao-maps-sdk";

// Global flag: SDK script is already appended (prevents duplicate Script tags)
let sdkScriptLoaded = false;
let sdkLoadCallbacks: (() => void)[] = [];
let sdkErrorCallbacks: (() => void)[] = [];
let sdkLoadError = false;

function resetSdkQueues() {
	sdkLoadCallbacks = [];
	sdkErrorCallbacks = [];
}

function removeSdkScriptTag() {
	if (typeof document === "undefined") return;
	document.getElementById(KAKAO_MAP_SDK_SCRIPT_ID)?.remove();
}

function onSdkReady() {
	sdkScriptLoaded = true;
	sdkLoadError = false;
	const callbacks = sdkLoadCallbacks;
	resetSdkQueues();
	for (const cb of callbacks) cb();
}

function onSdkError() {
	sdkLoadError = true;
	sdkScriptLoaded = false;
	const callbacks = sdkErrorCallbacks;
	resetSdkQueues();
	for (const cb of callbacks) cb();
}

export function MapEmbed({
	facilities,
	center,
	height,
	onMarkerClick,
	userLocation,
}: {
	facilities: MapFacility[];
	center?: { lat: number; lng: number };
	height?: string;
	onMarkerClick?: (id: string) => void;
	userLocation?: UserLocation;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<KakaoMapsMap | null>(null);
	const markersRef = useRef<KakaoMapsMarker[]>([]);
	const handlersRef = useRef<Map<KakaoMapsMarker, KakaoMarkerHandler>>(new Map());
	const mountedRef = useRef(true);
	const [mapError, setMapError] = useState(sdkLoadError);
	const [isLoading, setIsLoading] = useState(false);
	const [scriptVersion, setScriptVersion] = useState(0);
	const hasMapCenter = Boolean(center || facilities.length > 0 || userLocation);
	const hasApiKey = Boolean(KAKAO_MAP_KEY);
	const isProd = process.env.NODE_ENV === "production";

	const mapErrorTitle = isProd || hasApiKey
		? "지도를 잠시 사용할 수 없어요. 탐색 목록으로 확인해주세요."
		: "지도를 불러올 수 없어요. 카카오맵 API가 필요합니다.";
	const developerHint = !isProd && !hasApiKey
		? "로컬에서 확인하려면 .env.local의 NEXT_PUBLIC_KAKAO_MAP_KEY를 설정해주세요."
		: null;

	const clearMarkers = useCallback(() => {
		const maps = window.kakao?.maps;
		for (const m of markersRef.current) {
			const handler = handlersRef.current.get(m);
			if (maps?.event && handler) {
				maps.event.removeListener(m, "click", handler);
			}
			m.setMap(null);
		}
		markersRef.current = [];
		handlersRef.current.clear();
	}, []);

	const renderMap = useCallback(() => {
		if (!mountedRef.current) return;
		if (!window.kakao?.maps || !containerRef.current) return;

		const maps = window.kakao.maps;
		const mapCenter = center ??
			userLocation ??
			(facilities.length > 0
				? { lat: facilities[0].lat, lng: facilities[0].lng }
				: null);

		if (!mapCenter) {
			setIsLoading(false);
			setMapError(true);
			return;
		}

		try {
			const defaultCenter = new maps.LatLng(mapCenter.lat, mapCenter.lng);
			const hasMultipleMarkers = facilities.length + (userLocation ? 1 : 0) > 1;

			if (!mapRef.current) {
				mapRef.current = new maps.Map(containerRef.current, {
					center: defaultCenter,
					level: 5,
				});
			} else {
				mapRef.current.setCenter(defaultCenter);
				mapRef.current.relayout();
			}

			clearMarkers();
			const bounds = new maps.LatLngBounds();

			for (const f of facilities) {
				const position = new maps.LatLng(f.lat, f.lng);
				const marker = new maps.Marker({
					map: mapRef.current,
					position,
					title: f.name,
					image: new maps.MarkerImage(
						markerSvgUrl(f.status),
						new maps.Size(28, 28),
						{ offset: new maps.Point(14, 14) },
					),
				});

				if (onMarkerClick) {
					const handler = () => onMarkerClick(f.id);
					maps.event.addListener(marker, "click", handler);
					handlersRef.current.set(marker, handler);
				}

				markersRef.current.push(marker);
				bounds.extend(position);
			}

			if (userLocation) {
				const position = new maps.LatLng(userLocation.lat, userLocation.lng);
				const marker = new maps.Marker({
					map: mapRef.current,
					position,
					title: "내 위치",
					image: new maps.MarkerImage(
						userLocationMarkerUrl(),
						new maps.Size(24, 24),
						{ offset: new maps.Point(12, 12) },
					),
				});

				markersRef.current.push(marker);
				bounds.extend(position);
			}

			if (hasMultipleMarkers) {
				mapRef.current.setBounds(bounds);
			} else {
				mapRef.current.setLevel(5);
			}

			setMapError(false);
			setIsLoading(false);
		} catch {
			setMapError(true);
			setIsLoading(false);
		}
	}, [center, clearMarkers, facilities, onMarkerClick, userLocation]);

	const handleRetry = useCallback(() => {
		setMapError(false);
		setIsLoading(true);
		clearMarkers();

		if (sdkLoadError) {
			sdkLoadError = false;
			sdkScriptLoaded = false;
			resetSdkQueues();
			removeSdkScriptTag();
			setScriptVersion((prev) => prev + 1);
			return;
		}

		if (sdkScriptLoaded && window.kakao?.maps) {
			try {
				window.kakao.maps.load(() => {
					if (!mountedRef.current) return;
					renderMap();
				});
				return;
			} catch {
				setMapError(true);
				setIsLoading(false);
			}
			return;
		}

		setScriptVersion((prev) => prev + 1);
	}, [clearMarkers, renderMap]);

	// Register for SDK ready callback or render immediately
	useEffect(() => {
		mountedRef.current = true;

		if (!hasMapCenter) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setMapError(true);
			setIsLoading(false);
			return;
		}

		if (!hasApiKey) {
			setMapError(true);
			setIsLoading(false);
			return;
		}

		setMapError(false);
		setIsLoading(true);

		const cb = () => {
			if (!mountedRef.current) return;
			try {
				window.kakao.maps.load(() => {
					if (mountedRef.current) renderMap();
				});
			} catch {
				if (mountedRef.current) {
					setMapError(true);
					setIsLoading(false);
				}
			}
		};
		const errorCb = () => {
			if (mountedRef.current) {
				setMapError(true);
				setIsLoading(false);
			}
		};

		if (sdkScriptLoaded) {
			cb();
		} else if (!sdkLoadError) {
			sdkLoadCallbacks.push(cb);
			sdkErrorCallbacks.push(errorCb);
		} else {
			setMapError(true);
			setIsLoading(false);
		}

		return () => {
			mountedRef.current = false;
			sdkLoadCallbacks = sdkLoadCallbacks.filter((queued) => queued !== cb);
			sdkErrorCallbacks = sdkErrorCallbacks.filter((queued) => queued !== errorCb);
		};
	}, [hasApiKey, hasMapCenter, renderMap, scriptVersion]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			clearMarkers();
			mapRef.current = null;
		};
	}, [clearMarkers]);

	if (!hasMapCenter) {
		return (
			<div
				role="region"
				aria-label="지도"
				className={cn(
					"relative flex items-center justify-center overflow-hidden rounded-2xl border border-dotori-100 bg-dotori-100 dark:border-dotori-800 dark:bg-dotori-800",
					height || "h-48",
				)}
			>
					<span className="text-sm text-dotori-500 dark:text-dotori-300">지도를 불러올 수 없어요. 주소로 검색해보세요</span>
			</div>
		);
	}

	return (
		<div
			role="region"
			aria-label={`지도 — ${facilities.length}개 시설`}
			className={cn(
				"relative overflow-hidden rounded-2xl border border-dotori-100 dark:border-dotori-800",
				height || "h-48",
			)}
		>
			{/* Map container */}
			<div ref={containerRef} className="h-full w-full" />

			{/* Loading skeleton */}
			{isLoading && !mapError && (
				<div className="absolute inset-0 flex items-center justify-center bg-dotori-100 dark:bg-dotori-800">
					<Image
						src={BRAND.symbol}
						alt=""
						width={40}
						height={40}
						className="h-auto w-10 animate-bounce"
						sizes="40px"
						aria-hidden="true"
					/>
				</div>
			)}

			{/* Error overlay */}
			{mapError && (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dotori-100 px-5 text-center dark:bg-dotori-800">
						<p className="text-sm text-dotori-500 dark:text-dotori-200">{mapErrorTitle}</p>
						{developerHint && (
							<p className="text-xs text-dotori-500 dark:text-dotori-300">{developerHint}</p>
						)}
						{isProd && (
							<button
								type="button"
								onClick={handleRetry}
								disabled={!hasApiKey}
								className="mt-1 min-h-11 rounded-xl bg-dotori-500 px-4 py-2 text-sm font-semibold text-white disabled:bg-dotori-200 disabled:text-dotori-500 dark:disabled:bg-dotori-800 dark:disabled:text-dotori-300"
							>
								재시도
							</button>
						)}
				</div>
			)}

			{/* Marker cluster hint */}
			{!isLoading && !mapError && facilities.length >= 5 && (
				<div className="absolute inset-x-2 bottom-2 flex justify-center">
						<p className="rounded-lg bg-white/90 px-2.5 py-1 text-xs text-dotori-600 shadow-sm dark:bg-dotori-950/80 dark:text-dotori-200 dark:shadow-none">
							마커 5개 이상입니다. 줌인하면 더 자세히 보여요
						</p>
				</div>
			)}

			{/* Kakao Maps SDK Script — only first instance loads it */}
			{!sdkScriptLoaded && !sdkLoadError && hasApiKey && (
				<Script
					id={KAKAO_MAP_SDK_SCRIPT_ID}
					key={`${KAKAO_MAP_SDK_SCRIPT_ID}-${scriptVersion}`}
					strategy="afterInteractive"
					src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`}
					onReady={onSdkReady}
					onError={onSdkError}
				/>
			)}
		</div>
	);
}
