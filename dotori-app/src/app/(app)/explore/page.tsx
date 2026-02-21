"use client";

import {
	AdjustmentsHorizontalIcon,
	ClockIcon,
	ListBulletIcon,
	MapIcon,
	MagnifyingGlassIcon,
	SparklesIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
	Suspense,
	useCallback,
	useEffect,
	type FormEvent,
	useMemo,
	useRef,
	useState,
} from "react";
import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { useFacilities } from "@/hooks/use-facilities";
import { useFacilityActions } from "@/hooks/use-facility-actions";
import { useToast } from "@/components/dotori/ToastProvider";
import { HeartIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { cn, facilityTypeBadgeColor } from "@/lib/utils";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Select } from "@/components/catalyst/select";

const MapEmbed = dynamic(
	() => import("@/components/dotori/MapEmbed").then((mod) => mod.MapEmbed),
	{ ssr: false },
);

const typeFilters = ["국공립", "민간", "가정", "직장", "공공형"];
type SortKey = "distance" | "rating" | "capacity";
const sortOptions: { key: SortKey; label: string }[] = [
	{ key: "distance", label: "거리순" },
	{ key: "rating", label: "평점순" },
	{ key: "capacity", label: "정원순" },
];

const RECENT_SEARCHES_KEY = "dotori_recent_searches";
const MAX_RECENT_SEARCHES = 5;
const SEARCH_DEBOUNCE_MS = 300;
const FACILITY_LOAD_TIMEOUT_MS = 8000;
const MIN_BAR_WIDTH = 20;
const MIN_WAITING_WIDTH = 60;
const MAX_WIDTH = 100;
const POPULAR_SEARCHES = [
	"반편성 불만",
	"교사 교체",
	"국공립 당첨",
	"이사 예정",
	"국공립",
	"강남구",
	"연장보육",
	"통학버스",
	"영아전문",
];

interface ReverseGeocodeResponse {
	data: {
		sido: string;
		sigungu: string;
		dong: string;
	};
}

interface GPSState {
	lat: number | null;
	lng: number | null;
	loading: boolean;
	error: string | null;
}

// ── localStorage helpers ──

function getRecentSearches(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT_SEARCHES);
	} catch {
		return [];
	}
}

function saveRecentSearch(term: string) {
	if (typeof window === "undefined") return;
	const trimmed = term.trim();
	if (!trimmed) return;
	try {
		const prev = getRecentSearches();
		const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(
			0,
			MAX_RECENT_SEARCHES,
		);
		localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
	} catch {
		// Storage full or blocked — silently fail
	}
}

function clearRecentSearches() {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(RECENT_SEARCHES_KEY);
	} catch {
		// silently fail
	}
}

function buildResultLabel({
	selectedSido,
	selectedSigungu,
	selectedTypes,
	total,
	isLoading,
}: {
	selectedSido: string;
	selectedSigungu: string;
	selectedTypes: string[];
	total: number;
	isLoading: boolean;
}): string {
	if (isLoading) return "검색 중...";
	const district = selectedSigungu || selectedSido || "전국";
	const typeLabel = selectedTypes.length === 1 ? `${selectedTypes[0]} ` : "";
	return `${district} ${typeLabel}어린이집 ${total.toLocaleString()}개`;
}

function isValidFacilityType(value: string, allowed: string[]): value is string {
	return allowed.includes(value);
}

export default function ExplorePage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[calc(100dvh-8rem)] flex-col">
					<div className="px-5 pt-4">
						<Skeleton variant="facility-card" count={6} />
					</div>
				</div>
			}
		>
			<ExploreContent />
		</Suspense>
	);
}

function ExploreContent() {
	const { addToast } = useToast();
	const router = useRouter();
	const searchParams = useSearchParams();

	const sidoFromQuery = searchParams.get("sido") || "";
	const sigunguFromQuery = searchParams.get("sigungu") || "";

	// Initialize state from URL params
	const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
	const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") ?? "");
	const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
		const typesFromQuery = searchParams.get("type")?.split(",").map((value) => value.trim()) ?? [];
		const validTypes = typesFromQuery.filter((value): value is string =>
			isValidFacilityType(value, typeFilters),
		);
		return validTypes.length > 0 ? validTypes : [];
	});
	const [toOnly, setToOnly] = useState(searchParams.get("to") === "1");
	const [sortBy, setSortBy] = useState<SortKey>(() => {
		const s = searchParams.get("sort") || "";
		return s === "distance" || s === "rating" || s === "capacity"
			? s
			: "distance";
	});
	const [selectedSido, setSelectedSido] = useState(sidoFromQuery);
	const [selectedSigungu, setSelectedSigungu] = useState(sigunguFromQuery);
	const [showMap, setShowMap] = useState(false);
	const [showFilters, setShowFilters] = useState(() => {
		return !!(
			searchParams.get("type") ||
			searchParams.get("to") ||
			searchParams.get("sido") ||
			searchParams.get("sigungu")
		);
	});

	// District lists
	const [sidoOptions, setSidoOptions] = useState<string[]>([]);
	const [sigunguOptions, setSigunguOptions] = useState<string[]>([]);
	const [isLoadingSido, setIsLoadingSido] = useState(false);
	const [isLoadingSigungu, setIsLoadingSigungu] = useState(false);
	const [useGPS, setUseGPS] = useState<GPSState>({
		lat: null,
		lng: null,
		loading: false,
		error: null,
	});

	// ── Recent searches & suggestion panel ──
	const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	// Close panel on outside click
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(e.target as Node)
			) {
				setIsSearchFocused(false);
			}
		}
		if (isSearchFocused) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isSearchFocused]);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isInitialMount = useRef(true);
	const {
		registerInterest,
		applyWaiting,
		isLoading: isActionLoading,
	} = useFacilityActions();

	// ── Region options ──
	useEffect(() => {
		let active = true;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoadingSido(true);
		apiFetch<{ data: string[] }>("/api/regions/sido")
			.then((res) => {
				if (!active) return;
				setSidoOptions(res.data);
			})
			.catch(() => {
				if (!active) return;
				setSidoOptions(["서울특별시", "경기도", "부산광역시"]);
			})
			.finally(() => {
				if (active) setIsLoadingSido(false);
			});
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		let active = true;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoadingSigungu(true);
		setSigunguOptions([]);

		if (!selectedSido) {
			setIsLoadingSigungu(false);
			if (selectedSigungu) setSelectedSigungu("");
			return () => {
				active = false;
			};
		}

		apiFetch<{ data: string[] }>(
			`/api/regions/sigungu?sido=${encodeURIComponent(selectedSido)}`,
		)
			.then((res) => {
				if (!active) return;
				setSigunguOptions(res.data);
				if (selectedSigungu && !res.data.includes(selectedSigungu)) {
					setSelectedSigungu("");
				}
			})
			.catch(() => {
				if (!active) return;
				setSigunguOptions([]);
			})
			.finally(() => {
				if (active) setIsLoadingSigungu(false);
			});

		return () => {
			active = false;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedSido]);

	// Sync state → URL params (skip initial mount)
	const syncURL = useCallback(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}
		const params = new URLSearchParams();
		if (debouncedSearch) params.set("q", debouncedSearch);
		if (selectedTypes.length > 0) params.set("type", selectedTypes.join(","));
		if (toOnly) params.set("to", "1");
		if (selectedSido) params.set("sido", selectedSido);
		if (selectedSigungu) params.set("sigungu", selectedSigungu);
		if (sortBy !== "distance") params.set("sort", sortBy);
		const qs = params.toString();
		router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
	}, [debouncedSearch, selectedTypes, toOnly, selectedSido, selectedSigungu, sortBy, router]);

	useEffect(() => {
		syncURL();
	}, [syncURL]);

	// Debounce search input → debouncedSearch (300ms)
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setDebouncedSearch(searchInput);
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [searchInput]);

	const {
		facilities,
		total,
		isLoading,
		isLoadingMore,
		error,
		loadMore,
		refresh,
		hasMore,
	} = useFacilities({
		search: debouncedSearch || undefined,
		type: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
		status: toOnly ? "available" : undefined,
		sido: selectedSido || undefined,
		sigungu: selectedSigungu || undefined,
		sort: sortBy,
	});

	const toCount = useMemo(
		() => facilities.filter((f) => f.status === "available").length,
		[facilities],
	);
	const sortedFacilities = useMemo(() => {
		if (facilities.length === 0) return facilities;
		return [...facilities].sort((a, b) => {
			const aPremium = a.isPremium ? 1 : 0;
			const bPremium = b.isPremium ? 1 : 0;
			return bPremium - aPremium;
		});
	}, [facilities]);
	const [isTimeout, setIsTimeout] = useState(false);
	const resultLabel = useMemo(
		() =>
			buildResultLabel({
				selectedSido,
				selectedSigungu,
				selectedTypes,
				total,
				isLoading,
			}),
		[selectedSido, selectedSigungu, selectedTypes, total, isLoading],
	);
	const mapFacilityPoints = useMemo(
		() =>
			facilities.map((f) => ({
				id: f.id,
				name: f.name,
				lat: f.lat,
				lng: f.lng,
				status: f.status,
			})),
		[facilities],
	);
	const mapCenter = useMemo(() => {
		if (useGPS.lat !== null && useGPS.lng !== null) {
			return { lat: useGPS.lat, lng: useGPS.lng };
		}
		if (mapFacilityPoints.length > 0) {
			return {
				lat: mapFacilityPoints[0].lat,
				lng: mapFacilityPoints[0].lng,
			};
		}
		return undefined;
	}, [mapFacilityPoints, useGPS.lat, useGPS.lng]);
	const activeFilterCount =
		selectedTypes.length + (toOnly ? 1 : 0) + (selectedSigungu ? 1 : 0) + (selectedSido ? 1 : 0);
	const hasSearchInput = debouncedSearch.trim().length > 0;
	const hasFilterApplied = activeFilterCount > 0;

	const toggleType = useCallback((type: string) => {
		setSelectedTypes((prev) =>
			prev.includes(type)
				? prev.filter((t) => t !== type)
				: [...prev, type],
		);
	}, []);

	const handleSearchSubmit = useCallback((term: string) => {
		const trimmed = term.trim();
		if (!trimmed) return;
		setSearchInput(trimmed);
		setDebouncedSearch(trimmed);
		saveRecentSearch(trimmed);
		setRecentSearches(getRecentSearches());
		setIsSearchFocused(false);
	}, []);

	const handleFormSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			handleSearchSubmit(searchInput);
	}, [searchInput, handleSearchSubmit]);

	const handleClearRecent = useCallback(() => {
		clearRecentSearches();
		setRecentSearches([]);
	}, []);

	const handleResetSearch = useCallback(() => {
		setSearchInput("");
		setDebouncedSearch("");
	}, []);

	const handleUseCurrentLocation = useCallback(async () => {
		if (useGPS.loading) return;

		if (typeof navigator === "undefined" || !navigator.geolocation) {
			const message = "이 기기에서 위치 서비스를 지원하지 않아요";
			setUseGPS((prev) => ({ ...prev, loading: false, error: message }));
			addToast({ type: "error", message });
			return;
		}

		setUseGPS((prev) => ({ ...prev, loading: true, error: null }));

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

			setUseGPS((prev) => ({
				...prev,
				lat: latitude,
				lng: longitude,
		}));

			if (geocodeRes.data.sido) {
				setSelectedSido(geocodeRes.data.sido);
			}
			if (geocodeRes.data.sigungu) {
				setSelectedSigungu(geocodeRes.data.sigungu);
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
			}

			setUseGPS((prev) => ({ ...prev, error: message }));
			addToast({ type: "error", message });
		} finally {
			setUseGPS((prev) => ({ ...prev, loading: false }));
		}
	}, [addToast, setSelectedSido, setSelectedSigungu, useGPS.loading]);

	const handleChipClick = useCallback(
		(term: string) => {
			handleSearchSubmit(term);
		},
		[handleSearchSubmit],
	);

	const retry = useCallback(() => {
		setIsTimeout(false);
		refresh();
	}, [refresh]);

	const handleResetFilters = useCallback(() => {
		setSearchInput("");
		setDebouncedSearch("");
		setSelectedTypes([]);
		setToOnly(false);
		setSortBy("distance");
		setSelectedSido("");
		setSelectedSigungu("");
	}, []);

	const handleSidoChange = useCallback((nextSido: string) => {
		setSelectedSido(nextSido);
		setSelectedSigungu("");
	}, []);

	// Show suggestion panel when focused and search is empty
	const showSuggestionPanel = isSearchFocused && !searchInput;

	useEffect(() => {
		if (!isLoading || facilities.length > 0 || error) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setIsTimeout(false);
			return;
		}

		const timeoutId = setTimeout(() => {
			setIsTimeout(true);
		}, FACILITY_LOAD_TIMEOUT_MS);

		return () => clearTimeout(timeoutId);
	}, [isLoading, facilities.length, error]);

	return (
		<div className="flex h-[calc(100dvh-8rem)] flex-col">
			{/* ── Sticky 헤더: 검색 + 컨트롤 ── */}
			<header className="sticky top-0 z-20 bg-white/80 px-5 pb-2 pt-4 backdrop-blur-xl">
				{/* 검색바 */}
				<div ref={searchContainerRef} className="relative">
					<form onSubmit={handleFormSubmit}>
						<MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dotori-500" />
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onFocus={() => setIsSearchFocused(true)}
							placeholder="이동 고민? 내 주변 빈자리 먼저 확인해요"
							className="w-full rounded-3xl bg-white/70 py-3.5 pl-11 pr-10 text-base ring-1 ring-dotori-200/40 outline-none backdrop-blur-sm transition-all focus:ring-2 focus:ring-dotori-300"
						/>
						{searchInput && (
							<button
								type="button"
								onClick={() => {
									setSearchInput("");
									setDebouncedSearch("");
								}}
								aria-label="검색어 지우기"
								className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-dotori-500"
							>
								<XMarkIcon className="h-5 w-5" />
							</button>
						)}
					</form>
					<div className="mt-2 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={handleUseCurrentLocation}
							disabled={useGPS.loading}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full border border-dotori-200 px-3 py-2 text-[13px] font-medium text-dotori-600 transition-all active:scale-[0.97]",
								useGPS.loading && "opacity-70",
							)}
						>
								{useGPS.loading ? (
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-dotori-300 border-t-dotori-700" />
								) : (
									<MapPinIcon className="h-4 w-4 text-dotori-500" />
								)}
								⚡ 현재 위치
							</button>
						</div>

					{/* ── 최근 검색 & 인기 검색어 패널 ── */}
					{showSuggestionPanel && (
						<div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-dotori-100 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-150">
							{/* 최근 검색 */}
							{recentSearches.length > 0 && (
								<div className="mb-4">
									<div className="mb-2.5 flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<ClockIcon className="h-4 w-4 text-dotori-500" />
											<span className="text-[13px] font-medium text-dotori-500">
												최근 검색
											</span>
										</div>
										<button
											type="button"
											onClick={handleClearRecent}
											className="text-[12px] text-dotori-500 transition-colors hover:text-dotori-600"
										>
											전체 삭제
										</button>
									</div>
									<div className="flex flex-wrap gap-2">
										{recentSearches.map((term) => (
											<button
												key={term}
												type="button"
												onClick={() => handleChipClick(term)}
												className="flex items-center gap-1.5 rounded-full bg-dotori-50 px-3.5 py-2 text-[13px] text-dotori-700 transition-all active:scale-[0.97] hover:bg-dotori-100"
											>
												<ClockIcon className="h-3.5 w-3.5 text-dotori-300" />
												{term}
											</button>
										))}
									</div>
								</div>
							)}

							{/* 인기 검색어 */}
							<div>
								<div className="mb-2.5 flex items-center gap-1.5">
									<MagnifyingGlassIcon className="h-4 w-4 text-dotori-500" />
									<span className="text-[13px] font-medium text-dotori-500">
										인기 검색어
									</span>
								</div>
								<div className="flex flex-wrap gap-2">
									{POPULAR_SEARCHES.map((term) => (
										<button
											key={term}
											type="button"
											onClick={() => handleChipClick(term)}
											className="rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-dotori-500 shadow-sm ring-1 ring-dotori-100 transition-all active:scale-[0.97] hover:bg-dotori-50 hover:text-dotori-700"
										>
											{term}
										</button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* 컨트롤 바: 결과 수 + TO 토글 + 필터 + 지도 */}
				<div className="mt-3 flex items-center gap-2">
					{/* 결과 수 */}
					<span className="mr-auto shrink-0 whitespace-nowrap text-[14px] text-dotori-500">
						{resultLabel}
					</span>

					{/* 현재 위치 */}
					<button
						onClick={handleUseCurrentLocation}
						disabled={useGPS.loading}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-medium transition-all active:scale-[0.97]",
							useGPS.loading
								? "bg-dotori-100 text-dotori-500 opacity-70"
								: "bg-dotori-50 text-dotori-600 hover:bg-dotori-100",
						)}
					>
						{useGPS.loading ? (
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-dotori-300 border-t-dotori-700" />
						) : (
							<MapPinIcon className="h-4 w-4 text-dotori-500" />
						)}
						내 위치
					</button>

						{/* TO 토글 */}
					<button
						onClick={() => setToOnly(!toOnly)}
						aria-pressed={toOnly}
						className={cn(
							"flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.97]",
							toOnly
								? "bg-forest-600 ring-2 ring-forest-500/70 text-white shadow-sm"
								: "bg-forest-50 text-forest-700",
						)}
					>
						<span
							className={cn(
								"h-1.5 w-1.5 rounded-full",
								toOnly ? "bg-white" : "bg-forest-500",
							)}
						/>
						이동 가능 시설만 보기{toCount > 0 ? ` ${toCount}` : ""}
					</button>

					{/* 필터 */}
					<button
						onClick={() => setShowFilters((p) => !p)}
						className={cn(
							"relative flex items-center gap-1 rounded-full px-4 py-2.5 text-[14px] font-medium transition-all active:scale-[0.97]",
							activeFilterCount > 0
								? "bg-dotori-900 text-white"
								: "bg-dotori-50 text-dotori-600",
						)}
					>
						<AdjustmentsHorizontalIcon className="h-4 w-4" />
						필터
						{activeFilterCount > 0 && (
							<span className="ml-0.5 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-dotori-900">
								{activeFilterCount}
							</span>
						)}
					</button>

					{/* 지도/리스트 토글 */}
					<button
						onClick={() => setShowMap((p) => !p)}
						className={cn(
							"flex items-center gap-1 rounded-full px-4 py-2.5 text-[14px] font-medium transition-all active:scale-[0.97]",
							showMap
								? "bg-dotori-900 text-white"
								: "bg-dotori-50 text-dotori-600",
						)}
					>
						{showMap ? (
							<>
								<ListBulletIcon className="h-4 w-4" /> 리스트
							</>
						) : (
							<>
								<MapIcon className="h-4 w-4" /> 지도
							</>
						)}
					</button>
				</div>

				{/* 확장 필터 패널 */}
				{showFilters && (
					<div className="mt-3 rounded-2xl bg-dotori-50 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 duration-200">
						{/* 시설 유형 */}
						<div>
							<span className="mb-2 block text-[13px] font-medium text-dotori-500">
								시설 유형
							</span>
							<div className="flex flex-wrap gap-2">
								{typeFilters.map((type) => {
									const isTypeSelected = selectedTypes.includes(type);

									return (
										<button
											key={type}
											onClick={() => toggleType(type)}
											aria-pressed={isTypeSelected}
											className={cn(
												"rounded-full px-4 py-2 text-[14px] font-medium transition-all active:scale-[0.97]",
												isTypeSelected
													? "bg-dotori-900 text-white"
													: "bg-white text-dotori-600",
											)}
										>
											{type}
										</button>
									);
								})}
							</div>
						</div>

						{/* 지역 필터 */}
						<div className="mt-3">
							<span className="mb-2 block text-[13px] font-medium text-dotori-500">
								지역 필터
							</span>
							<div className="grid gap-2 sm:grid-cols-2">
								<div>
									<Select
										value={selectedSido}
										onChange={(e) => handleSidoChange(e.target.value)}
									>
										<option value="">
											{isLoadingSido ? "시도 불러오는 중" : "시도 선택"}
										</option>
										{sidoOptions.map((sido) => (
											<option key={sido} value={sido}>
												{sido}
											</option>
										))}
									</Select>
								</div>
								<div>
									<Select
										value={selectedSigungu}
										disabled={!selectedSido || isLoadingSigungu}
										onChange={(e) => setSelectedSigungu(e.target.value)}
									>
										<option value="">
											{isLoadingSigungu ? "구군 불러오는 중" : "구/군 선택"}
										</option>
										{sigunguOptions.map((sigungu) => (
											<option key={sigungu} value={sigungu}>
												{sigungu}
											</option>
										))}
									</Select>
								</div>
							</div>
						</div>

						{/* 정렬 */}
						<div className="mt-3">
							<span className="mb-2 block text-[13px] font-medium text-dotori-500">
								정렬
							</span>
							<div className="flex gap-2">
								{sortOptions.map((opt) => (
									<button
										key={opt.key}
										onClick={() => setSortBy(opt.key)}
										className={cn(
											"rounded-full px-4 py-2 text-[14px] font-medium transition-all active:scale-[0.97]",
											sortBy === opt.key
												? "bg-dotori-900 text-white"
												: "bg-white text-dotori-600",
										)}
									>
										{opt.label}
									</button>
									))}
							</div>
						</div>

						{/* 필터 초기화 */}
						{activeFilterCount > 0 && (
							<div className="mt-3 flex items-center justify-between gap-2">
								<Button plain onClick={handleResetFilters}>
									필터 초기화
								</Button>
							</div>
						)}
					</div>
				)}
			</header>

			{/* ── 지도뷰 ── */}
			{showMap &&
			(mapFacilityPoints.length > 0 || (useGPS.lat !== null && useGPS.lng !== null)) && (
				<div className="px-4 pt-2 motion-safe:animate-in motion-safe:fade-in duration-200">
					<MapEmbed
						facilities={mapFacilityPoints}
						{...(mapCenter ? { center: mapCenter } : {})}
						{...(useGPS.lat !== null && useGPS.lng !== null
							? { userLocation: { lat: useGPS.lat, lng: useGPS.lng } }
							: {})}
						height="h-48 sm:h-64"
					/>
				</div>
			)}

				{/* ── 시설 리스트 ── */}
				<div className="flex-1 overflow-y-auto px-5 pt-3">
					{/* 로딩 스켈레톤 */}
					{isLoading && !isTimeout && (
						<div className="pb-4">
							<Skeleton variant="facility-card" count={6} />
						</div>
					)}

					{/* 에러 상태 */}
					{((!isLoading && error) || isTimeout) && (
						<div className="motion-safe:animate-in motion-safe:fade-in duration-300">
							<ErrorState
								variant="network"
								message={
									isTimeout
										? "시설 목록을 불러오지 못했어요"
										: "시설 목록을 불러올 수 없습니다"
								}
								action={{
									label: "다시 시도",
									onClick: retry,
								}}
							/>
						</div>
					)}

				{/* 추가 로딩 스켈레톤 */}
				{isLoadingMore && (
					<div className="pb-4">
						<Skeleton variant="facility-card" count={2} />
					</div>
				)}

				{/* 결과 있음 */}
				{!isLoading && !error && sortedFacilities.length > 0 && (
					<div className="space-y-3 pb-4">
						{sortedFacilities.map((f, index) => (
							<Link key={f.id} href={`/facility/${f.id}`}>
								<div
									className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300"
									style={{
										animationDelay: `${index * 50}ms`,
										animationFillMode: "both",
									}}
								>
									<div className={cn(
										"relative overflow-hidden rounded-3xl bg-white shadow-sm transition-all duration-200 hover:shadow-md",
										f.isPremium ? "ring-1 ring-dotori-300" : "",
									)}>
											<div className={cn(
												"absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
												f.type === "국공립" ? "bg-forest-500 text-white" :
												f.type === "민간" ? "bg-dotori-400 text-white" :
												f.type === "가정" ? "bg-dotori-200 text-dotori-800" :
												f.type === "직장" ? "bg-dotori-600 text-white" :
												"bg-dotori-100 text-dotori-700",
										)} />
										<div className="flex items-center gap-3.5 p-5 pb-3">
											{f.images?.[0] ? (
												<div className="shrink-0">
													<img
														src={f.images[0]}
														alt={`${f.name} 시설 이미지`}
														loading="lazy"
														className="h-16 w-16 rounded-xl object-cover"
													/>
												</div>
											) : null}
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-1.5">
													<span
														className={cn(
															"h-2 w-2 shrink-0 rounded-full",
															f.status === "available"
																? "bg-forest-500"
																: f.status === "waiting"
																	? "bg-warning"
																	: "bg-dotori-300",
														)}
													/>
													<span className="truncate font-semibold">
														{f.name}
													</span>
													{f.rating > 0 && (
														<span className="ml-1 text-[13px] text-dotori-500">
															★ {f.rating}
														</span>
													)}
												</div>
												<div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-dotori-500">
													{f.distance && (
														<span>{f.distance}</span>
													)}
													{f.distance && (
														<span className="text-dotori-200">·</span>
													)}
													<Badge
														color={facilityTypeBadgeColor(f.type)}
														className="px-1.5 py-0 text-[11px]/[18px]"
													>
														{f.type}
													</Badge>
													{f.features.slice(0, 2).map((feat) => (
														<span key={feat}>
															<span className="text-dotori-200">·</span> {feat}
														</span>
													))}
												</div>
											</div>
											<div className="shrink-0 text-right">
												<span
													className={cn(
														"block text-[15px] font-bold",
														f.status === "available"
															? "text-forest-700"
															: f.status === "waiting"
																? "text-dotori-700"
																: "text-dotori-500",
													)}
												>
													{f.status === "available"
														? `TO ${f.capacity.total - f.capacity.current}`
														: f.status === "waiting"
															? `대기 ${f.capacity.waiting ?? 0}`
															: "마감"}
												</span>
											</div>
										</div>
										{/* 정원·대기 미니바 */}
										{f.capacity.total > 0 && (
											<div className="mx-5 mb-3">
												<div className="flex items-center justify-between text-[11px] text-dotori-500">
													<span>정원 {f.capacity.total}명</span>
													<span>
														{f.status === "available"
															? `여석 ${f.capacity.total - f.capacity.current}석`
															: f.capacity.waiting > 0
																? `대기 ${f.capacity.waiting}명`
																: "마감"}
													</span>
												</div>
												<div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-dotori-100">
													<div
														className={cn(
															"h-full rounded-full transition-all duration-500",
															f.status === "available"
																? "bg-forest-500"
																: f.status === "waiting"
																	? "bg-warning"
																	: "bg-dotori-300",
														)}
														style={{
															width: `${f.status === "available"
																? Math.max(
																	MIN_BAR_WIDTH,
																	MAX_WIDTH -
																		Math.round(
																			((f.capacity.total - f.capacity.current) / f.capacity.total) * MAX_WIDTH,
																		),
																)
																: f.status === "waiting"
																	? Math.min(
																		MAX_WIDTH,
																		Math.max(
																			MIN_WAITING_WIDTH,
																			MIN_WAITING_WIDTH +
																				Math.min(
																					MAX_WIDTH - MIN_WAITING_WIDTH,
																					(f.capacity.waiting / f.capacity.total) * MAX_WIDTH,
																				),
																		),
																	)
																	: 100}%`,
														}}
													/>
												</div>
											</div>
										)}
										{/* 퀵 액션 — 카드 내부 */}
										<div className="mx-4 flex items-center justify-end gap-2 border-t border-dotori-100/60 py-2">
											<button
												type="button"
												disabled={isActionLoading(f.id)}
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													registerInterest(f.id);
												}}
												className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] text-dotori-500 transition-all active:scale-[0.97] hover:bg-dotori-50"
											>
												<HeartIcon className="h-3.5 w-3.5" />
												관심
											</button>
											<button
												type="button"
												disabled={isActionLoading(f.id)}
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													applyWaiting(f.id);
												}}
												className={cn(
													"rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all active:scale-[0.97]",
													f.status === "available"
														? "bg-gradient-to-r from-forest-600 to-forest-500 text-white hover:from-forest-700 hover:to-forest-600"
														: f.status === "full"
															? "bg-dotori-100 text-dotori-600 hover:bg-dotori-200"
															: "bg-gradient-to-r from-dotori-800 to-dotori-600 text-white hover:from-dotori-900 hover:to-dotori-700",
													isActionLoading(f.id) && "opacity-50",
												)}
											>
												{f.status === "available"
													? "입소신청"
													: "대기신청"}
											</button>
										</div>
									</div>
								</div>
							</Link>
						))}

						{/* 더 보기 버튼 */}
						{hasMore && (
							<div className="pt-2">
								<Button
									color="dotori"
									onClick={loadMore}
									disabled={isLoadingMore}
									className={cn(
										"w-full rounded-2xl py-3.5 text-[15px] font-medium transition-all active:scale-[0.98]",
									)}
								>
									{isLoadingMore ? "불러오는 중..." : "더 보기"}
								</Button>
							</div>
						)}
					</div>
				)}

				{/* 빈 결과 */}
				{!isLoading && !error && !isTimeout && sortedFacilities.length === 0 && (
					<EmptyState
						title={
							hasSearchInput
								? `"${debouncedSearch}"로 이동 가능 시설을 찾지 못했어요. 조건을 바꿔보세요`
								: hasFilterApplied
									? "이 조건의 이동 가능 시설이 없어요. 조건을 바꿔보세요"
									: "이 조건의 이동 가능 시설이 없어요. 조건을 바꿔보세요"
						}
						description={
							!hasSearchInput && !hasFilterApplied
								? "검색어나 필터 없이 결과가 없어요. 이동 가능한 시설만 보려면 '이동 가능 시설' 토글을 켜 보세요."
								: "다른 지역이나 시설 유형으로 검색해보세요. 반경을 넓히거나 필터를 변경해보세요."
						}
						actionLabel={
							hasSearchInput
								? "검색 초기화"
								: hasFilterApplied
									? "필터 초기화"
									: "검색 초기화"
						}
						onAction={
							hasSearchInput ? handleResetSearch : hasFilterApplied ? handleResetFilters : handleResetSearch
						}
						secondaryLabel="AI 토리에게 추천받기"
						secondaryHref="/chat?prompt=추천"
					/>
				)}
			</div>

			{/* ── AI 추천 플로팅 칩 ── */}
			<div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 pb-[env(safe-area-inset-bottom)]">
				<Link
					href="/chat?prompt=추천"
					aria-label="AI 추천받기"
					className={cn(
						"flex items-center gap-2 rounded-full bg-dotori-900 px-6 py-3 shadow-lg",
						"text-[14px] font-medium text-white transition-all",
						"active:scale-[0.97] hover:bg-dotori-900/90",
					)}
				>
					<SparklesIcon className="h-4 w-4" />
					AI 추천받기
				</Link>
			</div>
		</div>
	);
}
