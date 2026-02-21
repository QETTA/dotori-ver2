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
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { MapEmbed } from "@/components/dotori/MapEmbed";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useFacilities } from "@/hooks/use-facilities";
import { useFacilityActions } from "@/hooks/use-facility-actions";
import { HeartIcon } from "@heroicons/react/24/solid";
import { cn, facilityTypeBadgeColor } from "@/lib/utils";
import { Badge } from "@/components/catalyst/badge";

const typeFilters = ["국공립", "민간", "가정", "직장"];
type SortKey = "distance" | "rating" | "to";
const sortOptions: { key: SortKey; label: string }[] = [
	{ key: "distance", label: "가까운순" },
	{ key: "rating", label: "평점순" },
	{ key: "to", label: "빈자리순" },
];

const RECENT_SEARCHES_KEY = "dotori_recent_searches";
const MAX_RECENT_SEARCHES = 5;
const POPULAR_SEARCHES = [
	"국공립",
	"강남구",
	"연장보육",
	"통학버스",
	"영아전문",
];

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
		// Remove duplicate, prepend new term, cap at MAX
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
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialize state from URL params
	const [searchInput, setSearchInput] = useState(
		searchParams.get("q") ?? "",
	);
	const [debouncedSearch, setDebouncedSearch] = useState(
		searchParams.get("q") ?? "",
	);
	const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
		const t = searchParams.get("type");
		return t ? t.split(",").filter((v) => typeFilters.includes(v)) : [];
	});
	const [toOnly, setToOnly] = useState(searchParams.get("to") === "1");
	const [sortBy, setSortBy] = useState<SortKey>(() => {
		const s = searchParams.get("sort");
		return s && ["distance", "rating", "to"].includes(s)
			? (s as SortKey)
			: "distance";
	});
	const [showMap, setShowMap] = useState(false);
	const [showFilters, setShowFilters] = useState(() => {
		// Auto-open filter panel if URL has type/to params
		return !!(searchParams.get("type") || searchParams.get("to"));
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
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isSearchFocused]);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isInitialMount = useRef(true);
	const {
		registerInterest,
		applyWaiting,
		isLoading: isActionLoading,
	} = useFacilityActions();

	// Sync state → URL params (skip initial mount)
	const syncURL = useCallback(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}
		const params = new URLSearchParams();
		if (debouncedSearch) params.set("q", debouncedSearch);
		if (selectedTypes.length > 0)
			params.set("type", selectedTypes.join(","));
		if (toOnly) params.set("to", "1");
		if (sortBy !== "distance") params.set("sort", sortBy);
		const qs = params.toString();
		router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
	}, [debouncedSearch, selectedTypes, toOnly, sortBy, router]);

	useEffect(() => {
		syncURL();
	}, [syncURL]);

	// Debounce search input → debouncedSearch (300ms)
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setDebouncedSearch(searchInput);
		}, 300);
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
		type: selectedTypes.length === 1 ? selectedTypes[0] : undefined,
		status: toOnly ? "available" : undefined,
	});

	// Client-side sort + multi-type filter
	const filtered = useMemo(() => {
		let result = facilities;

		// Multi-type filter (API only supports single type)
		if (selectedTypes.length > 1) {
			result = result.filter((f) => selectedTypes.includes(f.type));
		}

		// Sort
		result = [...result].sort((a, b) => {
			if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
			if (sortBy === "to") {
				const aTo =
					a.status === "available"
						? a.capacity.total - a.capacity.current
						: 0;
				const bTo =
					b.status === "available"
						? b.capacity.total - b.capacity.current
						: 0;
				return bTo - aTo;
			}
			return 0;
		});

		return result;
	}, [facilities, selectedTypes, sortBy]);

	const toCount = facilities.filter((f) => f.status === "available").length;

	const toggleType = useCallback((type: string) => {
		setSelectedTypes((prev) =>
			prev.includes(type)
				? prev.filter((t) => t !== type)
				: [...prev, type],
		);
	}, []);

	const activeFilterCount = selectedTypes.length + (toOnly ? 1 : 0);

	// ── Search submit handler (saves to recent) ──
	const handleSearchSubmit = useCallback(
		(term: string) => {
			const trimmed = term.trim();
			if (!trimmed) return;
			setSearchInput(trimmed);
			setDebouncedSearch(trimmed); // immediate for explicit submit
			saveRecentSearch(trimmed);
			setRecentSearches(getRecentSearches());
			setIsSearchFocused(false);
		},
		[],
	);

	const handleFormSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			handleSearchSubmit(searchInput);
		},
		[searchInput, handleSearchSubmit],
	);

	const handleClearRecent = useCallback(() => {
		clearRecentSearches();
		setRecentSearches([]);
	}, []);

	const handleChipClick = useCallback(
		(term: string) => {
			handleSearchSubmit(term);
		},
		[handleSearchSubmit],
	);

	// Show suggestion panel when focused and search is empty
	const showSuggestionPanel = isSearchFocused && !searchInput;

	return (
		<div className="flex h-[calc(100dvh-8rem)] flex-col">
			{/* ── Sticky 헤더: 검색 + 컨트롤 ── */}
			<header className="sticky top-0 z-20 bg-white/80 px-5 pb-2 pt-4 backdrop-blur-xl">
				{/* 검색바 */}
				<div ref={searchContainerRef} className="relative">
					<form onSubmit={handleFormSubmit}>
						<MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dotori-400" />
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onFocus={() => setIsSearchFocused(true)}
							placeholder="시설 이름, 지역 검색"
							className="w-full rounded-3xl bg-white/70 py-3.5 pl-11 pr-10 text-[15px] ring-1 ring-dotori-200/40 outline-none backdrop-blur-sm transition-all focus:ring-2 focus:ring-dotori-300"
						/>
						{searchInput && (
							<button
								type="button"
								onClick={() => {
									setSearchInput("");
									setDebouncedSearch("");
								}}
								aria-label="검색어 지우기"
								className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-dotori-400"
							>
								<XMarkIcon className="h-5 w-5" />
							</button>
						)}
					</form>

					{/* ── 최근 검색 & 인기 검색어 패널 ── */}
					{showSuggestionPanel && (
						<div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-dotori-100 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-150">
							{/* 최근 검색 */}
							{recentSearches.length > 0 && (
								<div className="mb-4">
									<div className="mb-2.5 flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<ClockIcon className="h-4 w-4 text-dotori-400" />
											<span className="text-[13px] font-medium text-dotori-500">
												최근 검색
											</span>
										</div>
										<button
											type="button"
											onClick={handleClearRecent}
											className="text-[12px] text-dotori-400 transition-colors hover:text-dotori-600"
										>
											전체 삭제
										</button>
									</div>
									<div className="flex flex-wrap gap-2">
										{recentSearches.map((term) => (
											<button
												key={term}
												type="button"
												onClick={() =>
													handleChipClick(term)
												}
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
									<MagnifyingGlassIcon className="h-4 w-4 text-dotori-400" />
									<span className="text-[13px] font-medium text-dotori-500">
										인기 검색어
									</span>
								</div>
								<div className="flex flex-wrap gap-2">
									{POPULAR_SEARCHES.map((term) => (
										<button
											key={term}
											type="button"
											onClick={() =>
												handleChipClick(term)
											}
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
					<span className="mr-auto shrink-0 whitespace-nowrap text-[14px] text-dotori-400">
						{isLoading ? "검색 중..." : `${total.toLocaleString()}개 시설`}
					</span>

					{/* TO 토글 */}
					<button
						onClick={() => setToOnly(!toOnly)}
						className={cn(
							"flex items-center gap-1 rounded-full px-4 py-2.5 text-[14px] font-medium transition-all active:scale-[0.97]",
							toOnly
								? "bg-forest-500 text-white"
								: "bg-dotori-50 text-dotori-600",
						)}
					>
						<span
							className={cn(
								"h-1.5 w-1.5 rounded-full",
								toOnly ? "bg-white" : "bg-forest-500",
							)}
						/>
						빈자리{toCount > 0 ? ` ${toCount}` : ""}
					</button>

					{/* 필터 */}
					<button
						onClick={() => setShowFilters(!showFilters)}
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
						onClick={() => setShowMap(!showMap)}
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
								{typeFilters.map((type) => (
									<button
										key={type}
										onClick={() => toggleType(type)}
										className={cn(
											"rounded-full px-4 py-2 text-[14px] font-medium transition-all active:scale-[0.97]",
											selectedTypes.includes(type)
												? "bg-dotori-900 text-white"
												: "bg-white text-dotori-600",
										)}
									>
										{type}
									</button>
								))}
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
							<button
								onClick={() => {
									setSelectedTypes([]);
									setToOnly(false);
									setSortBy("distance");
								}}
								className="mt-3 py-1 text-[13px] text-dotori-400 underline"
							>
								필터 초기화
							</button>
						)}
					</div>
				)}
			</header>

			{/* ── 지도뷰 ── */}
			{showMap && filtered.length > 0 && (
				<div className="px-4 pt-2 motion-safe:animate-in motion-safe:fade-in duration-200">
					<MapEmbed
						facilities={filtered.map((f) => ({
							id: f.id,
							name: f.name,
							lat: f.lat,
							lng: f.lng,
							status: f.status,
						}))}
						height="h-56"
					/>
				</div>
			)}

			{/* ── 시설 리스트 ── */}
			<div className="flex-1 overflow-y-auto px-5 pt-3">
				{/* 로딩 스켈레톤 */}
				{isLoading && (
					<div className="pb-4">
						<Skeleton variant="facility-card" count={6} />
					</div>
				)}

				{/* 에러 상태 */}
				{!isLoading && error && (
					<div className="motion-safe:animate-in motion-safe:fade-in duration-300">
						<ErrorState
							message="시설 목록을 불러올 수 없습니다"
							action={{
								label: "다시 시도",
								onClick: refresh,
							}}
						/>
					</div>
				)}

				{/* 결과 있음 */}
				{!isLoading && !error && filtered.length > 0 && (
					<div className="space-y-3 pb-4">
						{filtered.map((f, index) => (
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
									)}>
									<div className={cn(
										"absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
										f.type === "국공립" ? "bg-blue-400" :
										f.type === "민간" ? "bg-amber-400" :
										f.type === "가정" ? "bg-forest-400" :
										f.type === "직장" ? "bg-purple-400" :
										"bg-dotori-200",
									)} />
									<div className="flex items-center gap-3.5 p-5 pb-3">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												<span
													className={cn(
														"h-2 w-2 shrink-0 rounded-full",
														f.status === "available"
															? "bg-forest-500"
															: f.status ===
																  "waiting"
																? "bg-warning"
																: "bg-dotori-300",
													)}
												/>
												<span className="truncate font-semibold">
													{f.name}
												</span>
												{f.rating > 0 && (
													<span className="ml-1 text-[13px] text-dotori-400">
														★ {f.rating}
													</span>
												)}
											</div>
											<div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-dotori-500">
												{f.distance && (
													<span>{f.distance}</span>
												)}
												{f.distance && (
													<span className="text-dotori-200">
														·
													</span>
												)}
												<Badge color={facilityTypeBadgeColor(f.type)} className="px-1.5 py-0 text-[11px]/[18px]">{f.type}</Badge>
												{f.features
													.slice(0, 2)
													.map((feat) => (
														<span key={feat}>
															<span className="text-dotori-200">
																·
															</span>{" "}
															{feat}
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
														: f.status ===
															  "waiting"
															? "text-dotori-700"
															: "text-dotori-400",
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
											<div className="flex items-center justify-between text-[11px] text-dotori-400">
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
															? Math.max(20, 100 - Math.round(((f.capacity.total - f.capacity.current) / f.capacity.total) * 100))
															: f.status === "waiting"
																? Math.min(100, Math.max(60, 60 + Math.min(40, (f.capacity.waiting / f.capacity.total) * 100)))
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
												isActionLoading(f.id) &&
													"opacity-50",
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
							<button
								onClick={loadMore}
								disabled={isLoadingMore}
								className="w-full rounded-2xl bg-dotori-50 py-3.5 text-[15px] font-medium text-dotori-600 transition-all active:scale-[0.98] hover:bg-dotori-100"
							>
								{isLoadingMore ? "불러오는 중..." : "더 보기"}
							</button>
						)}
					</div>
				)}

				{/* 빈 결과 */}
				{!isLoading && !error && filtered.length === 0 && (
					<div className="motion-safe:animate-in motion-safe:fade-in duration-300">
						<EmptyState
							title="검색 결과가 없어요"
							description="다른 이름이나 지역으로 검색해보세요"
							actionLabel="필터 초기화"
							onAction={() => {
								setSearchInput("");
								setDebouncedSearch("");
								setSelectedTypes([]);
								setToOnly(false);
							}}
							secondaryLabel="AI에게 추천받기"
							secondaryHref="/chat?prompt=추천"
						/>
					</div>
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
