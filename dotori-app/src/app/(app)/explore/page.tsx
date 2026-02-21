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
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { AiBriefingCard } from "@/components/dotori/AiBriefingCard";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { useFacilities } from "@/hooks/use-facilities";
import { useFacilityActions } from "@/hooks/use-facility-actions";
import { useToast } from "@/components/dotori/ToastProvider";
import { HeartIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";

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
const MOVE_SCENARIO_CHIPS = ["반편성 불만", "교사 교체", "국공립 당첨", "이사 예정"];
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

function toChatPrompt(search: string) {
	const trimmed = search.trim();
	return encodeURIComponent(trimmed ? `${trimmed} 이동 가능 시설` : "이동 고민");
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
		const typesFromQuery = searchParams
			.get("type")
			?.split(",")
			.map((value) => value.trim()) ?? [];
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
	const chatPromptHref = useMemo(() => `/chat?prompt=${toChatPrompt(debouncedSearch)}`, [debouncedSearch]);

	const toggleType = useCallback((type: string) => {
		setSelectedTypes((prev) =>
			prev.includes(type)
				? prev.filter((t) => t !== type)
				: [...prev, type],
		);
	}, []);

	const setSearch = useCallback((term: string) => {
		const trimmed = term.trim();
		if (!trimmed) return;
		setSearchInput(trimmed);
		setDebouncedSearch(trimmed);
		saveRecentSearch(trimmed);
		setRecentSearches(getRecentSearches());
		setIsSearchFocused(false);
	}, []);

	const handleFormSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			setSearch(searchInput);
		},
		[searchInput, setSearch],
	);

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
				`/api/regions/sigungu?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`,
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

	const handleChipClick = useCallback((term: string) => {
		setSearch(term);
	}, [setSearch]);

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
			<header className="sticky top-0 z-20 bg-white/80 px-5 pb-2 pt-4 backdrop-blur-xl">
				<Heading level={2} className="text-lg">
					이동 고민이라면, 빈자리 먼저 확인해요
				</Heading>

				<Fieldset className="mt-3 space-y-2">
					{/* 검색바 */}
					<div ref={searchContainerRef} className="relative">
						<form onSubmit={handleFormSubmit}>
							<MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dotori-500" />
							<Input
								type="search"
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onFocus={() => setIsSearchFocused(true)}
								placeholder="이동 고민? 내 주변 빈자리 먼저 확인해요"
								className="w-full rounded-3xl bg-white/70 py-3 pl-11 pr-10 text-base ring-1 ring-dotori-200/40 outline-none transition-all focus:ring-2 focus:ring-dotori-300"
								aria-label="시설 검색"
								name="q"
							/>
							{searchInput && (
								<Button
									type="button"
									plain
									onClick={() => {
										setSearchInput("");
										setDebouncedSearch("");
									}}
									aria-label="검색어 지우기"
									className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-dotori-500"
								>
									<XMarkIcon className="h-5 w-5" />
								</Button>
							)}
						</form>

						<div className="mt-2 flex flex-wrap gap-2">
							<Button
								type="button"
								plain
								onClick={handleUseCurrentLocation}
								disabled={useGPS.loading}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full border border-dotori-200 px-3 py-2 text-sm font-medium text-dotori-600",
									useGPS.loading && "opacity-70",
								)}
							>
								{useGPS.loading ? (
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-dotori-300 border-t-dotori-700" />
								) : (
									<MapPinIcon className="h-4 w-4 text-dotori-500" />
								)}
								⚡ 현재 위치
							</Button>
						</div>

						<div className="mt-3">
							<Text className="text-sm font-medium text-dotori-500">이동 수요 시나리오</Text>
							<div className="mt-2 flex flex-wrap gap-2">
								{MOVE_SCENARIO_CHIPS.map((chip) => (
									<Button
										key={chip}
										type="button"
										plain
										onClick={() => setSearch(chip)}
										className="text-sm"
									>
										{chip}
									</Button>
								))}
							</div>
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
												<Text className="text-sm font-medium text-dotori-500">최근 검색</Text>
											</div>
											<Button
												type="button"
												plain
												onClick={handleClearRecent}
												className="text-sm text-dotori-500 transition-colors hover:text-dotori-600"
											>
												전체 삭제
											</Button>
										</div>
										<div className="flex flex-wrap gap-2">
											{recentSearches.map((term) => (
												<Button
													key={term}
													type="button"
													onClick={() => handleChipClick(term)}
													plain
													className="inline-flex items-center gap-1.5 rounded-full bg-dotori-50 px-3 py-2 text-sm text-dotori-700 transition-all hover:bg-dotori-100"
												>
													<ClockIcon className="h-3.5 w-3.5 text-dotori-300" />
													{term}
												</Button>
											))}
										</div>
									</div>
								)
								}

								<div>
									<div className="mb-2.5 flex items-center gap-1.5">
										<MagnifyingGlassIcon className="h-4 w-4 text-dotori-500" />
										<Text className="text-sm font-medium text-dotori-500">인기 검색어</Text>
									</div>
									<div className="flex flex-wrap gap-2">
										{POPULAR_SEARCHES.map((term) => (
											<Button
												key={term}
													type="button"
													plain
													onClick={() => handleChipClick(term)}
													className="rounded-full bg-white px-3 py-2 text-sm font-medium text-dotori-500 shadow-sm ring-1 ring-dotori-100 transition-all hover:bg-dotori-50 hover:text-dotori-700"
											>
												{term}
											</Button>
										))}
									</div>
								</div>
							</div>
						)}
					</div>

					<div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
						<Text className="mr-auto shrink-0 whitespace-nowrap text-sm text-dotori-500">
							{resultLabel}
						</Text>
						<Button
							type="button"
							plain
							onClick={() => setShowFilters((p) => !p)}
							className="relative inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm"
						>
							<AdjustmentsHorizontalIcon className="h-4 w-4" />
							필터
							{activeFilterCount > 0 && (
								<Badge color="dotori" className="px-1 py-0 text-xs">
									{activeFilterCount}
								</Badge>
							)}
						</Button>
						<Button
							type="button"
							plain
							onClick={() => setShowMap((p) => !p)}
							className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm"
						>
							{showMap ? <ListBulletIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
							{showMap ? "리스트" : "지도"}
						</Button>
					</div>

					<div className="mt-2">
						<Button
							type="button"
							className={cn(
								"inline-flex w-full items-center gap-1 rounded-full px-4 py-2.5 text-sm transition-all",
								toOnly
									? "bg-forest-100 text-forest-900 ring-2 ring-forest-300/80 font-semibold"
									: "bg-forest-50 text-forest-700",
							)}
							onClick={() => setToOnly(!toOnly)}
							aria-pressed={toOnly}
						>
							<span
								className={cn("h-1.5 w-1.5 rounded-full", toOnly ? "bg-forest-700" : "bg-forest-500")}
							/>
							이동 가능 시설만 보기{toCount > 0 ? ` ${toCount}` : ""}
						</Button>
					</div>
				</Fieldset>

				{/* 확장 필터 패널 */}
				{showFilters && (
					<div className="mt-3 rounded-2xl bg-dotori-50 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 duration-200">
						<Fieldset className="space-y-3">
							<Field>
								<Text className="mb-2 block text-sm font-medium text-dotori-500">시설 유형</Text>
								<div className="flex flex-wrap gap-2">
									{typeFilters.map((type) => {
										const isTypeSelected = selectedTypes.includes(type);

										return (
											<Button
												key={type}
												type="button"
												plain
												onClick={() => toggleType(type)}
												aria-pressed={isTypeSelected}
												className={cn(
													"rounded-full px-4 py-2 text-sm transition-all",
													isTypeSelected
														? "bg-dotori-900 text-white"
														: "bg-white text-dotori-600",
												)}
										>
											{type}
										</Button>
									);
								})}
								</div>
							</Field>
							<Field>
								<Text className="mb-2 block text-sm font-medium text-dotori-500">지역 필터</Text>
								<div className="grid gap-2 sm:grid-cols-2">
									<div>
										<Select value={selectedSido} onChange={(e) => handleSidoChange(e.target.value)}>
											<option value="">{isLoadingSido ? "시도 불러오는 중" : "시도 선택"}</option>
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
											<option value="">{isLoadingSigungu ? "구군 불러오는 중" : "구/군 선택"}</option>
											{sigunguOptions.map((sigungu) => (
												<option key={sigungu} value={sigungu}>
													{sigungu}
												</option>
											))}
										</Select>
									</div>
								</div>
							</Field>
							<Field>
								<Text className="mb-2 block text-sm font-medium text-dotori-500">정렬</Text>
								<div className="flex gap-2">
									{sortOptions.map((opt) => (
										<Button
											key={opt.key}
											type="button"
											plain
											onClick={() => setSortBy(opt.key)}
											className={cn(
												"rounded-full px-4 py-2 text-sm transition-all",
												sortBy === opt.key ? "bg-dotori-900 text-white" : "bg-white text-dotori-600",
											)}
									>
											{opt.label}
									</Button>
								))}
								</div>
							</Field>
							{activeFilterCount > 0 && (
								<div className="mt-3 flex items-center justify-between gap-2">
									<Button plain onClick={handleResetFilters}>
										필터 초기화
									</Button>
								</div>
							)}
						</Fieldset>
					</div>
				)
			}
			</header>

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

			<div className="flex-1 overflow-y-auto px-5 pt-3">
				{isLoading && !isTimeout && (
					<div className="pb-4">
						<Skeleton variant="facility-card" count={6} />
					</div>
				)}

				{((!isLoading && error) || isTimeout) && (
					<div className="motion-safe:animate-in motion-safe:fade-in duration-300">
						<ErrorState
							variant="network"
							message={
								isTimeout ? "시설 목록을 불러오지 못했어요" : "시설 목록을 불러올 수 없습니다"
							}
							action={{ label: "다시 시도", onClick: retry }}
						/>
					</div>
				)}

				{isLoadingMore && (
					<div className="pb-4">
						<Skeleton variant="facility-card" count={2} />
					</div>
				)}

				{!isLoading && !error && sortedFacilities.length > 0 && (
					<div className="space-y-3 pb-4">
						<AiBriefingCard
							message={`${
								hasSearchInput
									? `\"${debouncedSearch}\" 이동 고민 기준으로 이동 가능한 시설부터 정렬했어요.`
									: "지도와 이동 수요 우선순위 기준으로 시설을 정렬했어요."
								}`}
							source="AI분석"
						/>
						{sortedFacilities.map((f, index) => (
							<div
								key={f.id}
								className="space-y-2"
								style={{
									animationDelay: `${index * 50}ms`,
								}}
							>
								<div
									className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300"
									style={{ animationFillMode: "both" }}
								>
									<Link href={`/facility/${f.id}`}>
										<FacilityCard facility={f} compact />
									</Link>
								</div>
								<div className="flex items-center justify-end gap-2 border-t border-dotori-100/60 pt-2">
									<Button
										plain
										type="button"
										disabled={isActionLoading(f.id)}
										onClick={() => registerInterest(f.id)}
										className="text-sm"
									>
										<HeartIcon className="h-3.5 w-3.5" />
										관심
									</Button>
									<Button
										color="dotori"
										type="button"
										disabled={isActionLoading(f.id)}
										onClick={() => applyWaiting(f.id)}
									>
										{f.status === "available" ? "입소신청" : "대기신청"}
									</Button>
								</div>
							</div>
						))}

						{hasMore && (
							<div className="pt-2">
								<Button color="dotori" onClick={loadMore} disabled={isLoadingMore}>
									{isLoadingMore ? "불러오는 중..." : "더 보기"}
								</Button>
							</div>
						)}
					</div>
				)}

				{!isLoading && !error && !isTimeout && sortedFacilities.length === 0 && (
					<div className="space-y-3">
						<EmptyState
							title={
								hasSearchInput
									? `\"${debouncedSearch}\"로 이동 가능 시설을 찾지 못했어요. 조건을 바꿔보세요`
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
								hasSearchInput
									? handleResetSearch
									: hasFilterApplied
										? handleResetFilters
										: handleResetSearch
								}
						/>
						<Button color="dotori" href={chatPromptHref} className="w-full">
							토리에게 물어보기
						</Button>
					</div>
				)}
			</div>

			{!isLoading && !error && !isTimeout && sortedFacilities.length === 0 && (
				<div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 pb-[env(safe-area-inset-bottom)]">
					<Button
						color="dotori"
						href={chatPromptHref}
						aria-label="AI 추천 받기"
						className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white"
					>
						<SparklesIcon className="h-4 w-4" />
						AI 추천 받기
					</Button>
				</div>
			)}
		</div>
	);
}
