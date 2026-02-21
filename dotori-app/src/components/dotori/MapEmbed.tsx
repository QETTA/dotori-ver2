"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { FacilityStatus } from "@/types/dotori";

type KakaoMarkerHandler = () => void;

interface MapFacility {
	id: string;
	name: string;
	lat: number;
	lng: number;
	status: FacilityStatus;
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

const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
const KAKAO_MAP_SDK_SCRIPT_ID = "kakao-maps-sdk";

// Global flag: SDK script is already appended (prevents duplicate Script tags)
let sdkScriptLoaded = false;
let sdkLoadCallbacks: (() => void)[] = [];
let sdkLoadError = false;

function onSdkReady() {
	sdkScriptLoaded = true;
	for (const cb of sdkLoadCallbacks) cb();
	sdkLoadCallbacks = [];
}

function onSdkError() {
	sdkLoadError = true;
	for (const cb of sdkErrorCallbacks) cb();
	sdkLoadCallbacks = [];
	sdkErrorCallbacks = [];
}

let sdkErrorCallbacks: (() => void)[] = [];

export function MapEmbed({
	facilities,
	center,
	height,
	onMarkerClick,
}: {
	facilities: MapFacility[];
	center?: { lat: number; lng: number };
	height?: string;
	onMarkerClick?: (id: string) => void;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<KakaoMapsMap | null>(null);
	const markersRef = useRef<KakaoMapsMarker[]>([]);
	const handlersRef = useRef<Map<KakaoMapsMarker, KakaoMarkerHandler>>(new Map());
	const mountedRef = useRef(true);
	const [sdkReady, setSdkReady] = useState(sdkScriptLoaded);
	const [mapError, setMapError] = useState(sdkLoadError);

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
		const mapCenter = center ?? (facilities.length > 0
			? { lat: facilities[0].lat, lng: facilities[0].lng }
			: null);

		if (!mapCenter) return;

		const defaultCenter = new maps.LatLng(mapCenter.lat, mapCenter.lng);

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

		if (facilities.length === 0) return;

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

		if (facilities.length > 1) {
			mapRef.current.setBounds(bounds);
		} else {
			mapRef.current.setLevel(5);
		}
	}, [facilities, center, clearMarkers, onMarkerClick]);

	// Register for SDK ready callback or render immediately
	useEffect(() => {
		mountedRef.current = true;

		if (sdkScriptLoaded) {
			try {
				window.kakao.maps.load(() => {
					if (mountedRef.current) renderMap();
				});
			} catch {
				// setMapError in a callback to avoid synchronous setState in effect
				queueMicrotask(() => {
					if (mountedRef.current) setMapError(true);
				});
			}
		} else if (!sdkLoadError) {
			const cb = () => {
				if (!mountedRef.current) return;
				setSdkReady(true);
				try {
					window.kakao.maps.load(() => {
						if (mountedRef.current) renderMap();
					});
				} catch {
					queueMicrotask(() => {
						if (mountedRef.current) setMapError(true);
					});
				}
			};
			sdkLoadCallbacks.push(cb);
			sdkErrorCallbacks.push(() => {
				if (mountedRef.current) setMapError(true);
			});
		}

		return () => {
			mountedRef.current = false;
		};
	}, [renderMap]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			clearMarkers();
			mapRef.current = null;
		};
	}, [clearMarkers]);

		// No API key — show fallback
	if (!KAKAO_MAP_KEY) {
		return (
			<div
				role="region"
				aria-label="지도"
				className={cn(
					"relative flex items-center justify-center overflow-hidden rounded-2xl border border-dotori-100 bg-dotori-100",
					height || "h-48",
				)}
			>
				<span className="text-[14px] text-dotori-500">
					지도를 불러올 수 없어요. 주소로 검색해보세요
				</span>
			</div>
		);
	}

	// Cannot build map center from data (no Seoul fallback)
	if (!center && facilities.length === 0) {
		return (
			<div
				role="region"
				aria-label="지도"
				className={cn(
					"relative flex items-center justify-center overflow-hidden rounded-2xl border border-dotori-100 bg-dotori-100",
					height || "h-48",
				)}
			>
				<span className="text-[14px] text-dotori-500">
					지도를 불러올 수 없어요. 주소로 검색해보세요
				</span>
			</div>
		);
	}

	return (
		<div
			role="region"
			aria-label={`지도 — ${facilities.length}개 시설`}
			className={cn(
				"relative overflow-hidden rounded-2xl border border-dotori-100",
				height || "h-48",
			)}
		>
			{/* Map container */}
			<div ref={containerRef} className="h-full w-full" />

			{/* Loading overlay */}
			{!sdkReady && !mapError && (
				<div className="absolute inset-0 flex items-center justify-center bg-dotori-100 motion-safe:animate-pulse">
					<svg
						className="mr-2 h-5 w-5 text-dotori-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
						/>
					</svg>
					<span className="text-[14px] text-dotori-500">
						지도 로딩 중...
					</span>
				</div>
			)}

			{/* Error overlay */}
			{mapError && (
				<div className="absolute inset-0 flex items-center justify-center bg-dotori-100">
					<span className="text-[14px] text-dotori-500">
						지도를 불러올 수 없어요. 주소로 검색해보세요
					</span>
				</div>
			)}

			{/* Facility count badge */}
			{facilities.length > 0 && (
				<div className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-medium shadow-sm">
					{facilities.length}곳
				</div>
			)}

			{/* Kakao Maps SDK Script — only first instance loads it */}
			{!sdkScriptLoaded && !sdkLoadError && (
				<Script
					id={KAKAO_MAP_SDK_SCRIPT_ID}
					strategy="afterInteractive"
					src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`}
					onReady={onSdkReady}
					onError={onSdkError}
				/>
			)}
		</div>
	);
}
