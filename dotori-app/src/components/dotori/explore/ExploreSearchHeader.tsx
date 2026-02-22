"use client";

import {
	AdjustmentsHorizontalIcon,
	ListBulletIcon,
	MapIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/24/solid";
import {
	memo,
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import { ExploreSuggestionPanel } from "./ExploreSuggestionPanel";
import {
	EXPLORE_SORT_OPTIONS,
	EXPLORE_TYPE_FILTERS,
	MOVE_SCENARIO_CHIPS,
	POPULAR_SEARCHES,
	type ExploreSortKey,
} from "./explore-constants";

interface ExploreSearchHeaderProps {
	searchInput: string;
	toOnly: boolean;
	sortBy: ExploreSortKey;
	selectedTypes: string[];
	selectedSido: string;
	selectedSigungu: string;
	showFilters: boolean;
	showMap: boolean;
	resultLabel: string;
	activeFilterCount: number;
	toCount: number;
	recentSearches: string[];
	sidoOptions: string[];
	sigunguOptions: string[];
	isLoadingSido: boolean;
	isLoadingSigungu: boolean;
	isGpsLoading: boolean;
	onSearchInputChange: (value: string) => void;
	onSubmitSearch: () => void;
	onApplySearch: (term: string) => void;
	onClearSearch: () => void;
	onClearRecentSearches: () => void;
	onToggleFilters: () => void;
	onToggleMap: () => void;
	onToggleType: (type: string) => void;
	onToggleToOnly: () => void;
	onSortChange: (nextSort: ExploreSortKey) => void;
	onSidoChange: (nextSido: string) => void;
	onSigunguChange: (nextSigungu: string) => void;
	onUseCurrentLocation: () => void;
	onResetFilters: () => void;
}

export const ExploreSearchHeader = memo(function ExploreSearchHeader({
	searchInput,
	toOnly,
	sortBy,
	selectedTypes,
	selectedSido,
	selectedSigungu,
	showFilters,
	showMap,
	resultLabel,
	activeFilterCount,
	toCount,
	recentSearches,
	sidoOptions,
	sigunguOptions,
	isLoadingSido,
	isLoadingSigungu,
	isGpsLoading,
	onSearchInputChange,
	onSubmitSearch,
	onApplySearch,
	onClearSearch,
	onClearRecentSearches,
	onToggleFilters,
	onToggleMap,
	onToggleType,
	onToggleToOnly,
	onSortChange,
	onSidoChange,
	onSigunguChange,
	onUseCurrentLocation,
	onResetFilters,
}: ExploreSearchHeaderProps) {
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isSearchFocused) return;

		function handleClickOutside(event: MouseEvent) {
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(event.target as Node)
			) {
				setIsSearchFocused(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isSearchFocused]);

	const showSuggestionPanel = isSearchFocused && searchInput.length === 0;

	const handleFormSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			onSubmitSearch();
			setIsSearchFocused(false);
		},
		[onSubmitSearch],
	);

	const handleSelectTerm = useCallback(
		(term: string) => {
			onApplySearch(term);
			setIsSearchFocused(false);
		},
		[onApplySearch],
	);

	return (
		<header className="sticky top-0 z-20 bg-white/80 px-5 pb-2 pt-4 backdrop-blur-xl">
			<div className="mb-2 flex items-center justify-between">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={BRAND.lockupHorizontal} alt="Dotori" className="h-5 opacity-90" />
				<div className="rounded-full bg-dotori-50 px-2 py-1">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.symbol} alt="" aria-hidden="true" className="h-4 w-4" />
				</div>
			</div>

			<Heading level={2} className="text-lg">
				이동 고민이라면, 빈자리 먼저 확인해요
			</Heading>

			<Fieldset className="mt-3 space-y-2">
				<div ref={searchContainerRef} className="relative">
					<form onSubmit={handleFormSubmit}>
						<MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dotori-500" />
						<Input
							type="search"
							value={searchInput}
							onChange={(event) => onSearchInputChange(event.target.value)}
							onFocus={() => setIsSearchFocused(true)}
							placeholder="이동 고민? 내 주변 빈자리 먼저 확인해요"
							className="w-full rounded-3xl bg-white/70 py-3 pl-11 pr-10 text-base ring-1 ring-dotori-200/40 outline-none transition-all focus:ring-2 focus:ring-dotori-300"
							aria-label="시설 검색"
							name="q"
						/>
						{searchInput ? (
							<Button
								type="button"
								plain={true}
								onClick={onClearSearch}
								aria-label="검색어 지우기"
								className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-dotori-500"
							>
								<XMarkIcon className="h-5 w-5" />
							</Button>
						) : null}
					</form>

					<div className="mt-2 flex flex-wrap gap-2">
						<Button
							type="button"
							plain={true}
							onClick={onUseCurrentLocation}
							disabled={isGpsLoading}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full border border-dotori-200 px-3 py-2 text-sm font-medium text-dotori-600",
								isGpsLoading && "opacity-70",
							)}
						>
							{isGpsLoading ? (
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
									plain={true}
									onClick={() => handleSelectTerm(chip)}
									className="rounded-full border border-dotori-100 bg-dotori-50 px-3 py-1.5 text-sm text-dotori-700"
								>
									{chip}
								</Button>
							))}
						</div>
					</div>

					{showSuggestionPanel ? (
						<ExploreSuggestionPanel
							recentSearches={recentSearches}
							popularSearches={POPULAR_SEARCHES}
							onClearRecent={onClearRecentSearches}
							onSelectTerm={handleSelectTerm}
						/>
					) : null}
				</div>

				<div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
					<Text className="mr-auto shrink-0 whitespace-nowrap text-sm text-dotori-500">
						{resultLabel}
					</Text>
					<Button
						type="button"
						plain={true}
						onClick={onToggleFilters}
						className="relative inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm"
					>
						<AdjustmentsHorizontalIcon className="h-4 w-4" />
						필터
						{activeFilterCount > 0 ? (
							<Badge color="dotori" className="px-1 py-0 text-xs">
								{activeFilterCount}
							</Badge>
						) : null}
					</Button>
					<Button
						type="button"
						plain={true}
						onClick={onToggleMap}
						className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm"
					>
						{showMap ? (
							<ListBulletIcon className="h-4 w-4" />
						) : (
							<MapIcon className="h-4 w-4" />
						)}
						{showMap ? "리스트" : "지도"}
					</Button>
				</div>

				<div className="mt-2">
					<Button
						type="button"
						onClick={onToggleToOnly}
						aria-pressed={toOnly}
						className={cn(
							"inline-flex w-full items-center gap-1 rounded-full px-4 py-2.5 text-sm transition-all",
							toOnly
								? "bg-forest-100 font-semibold text-forest-900 ring-2 ring-forest-300/80"
								: "bg-forest-50 text-forest-700",
						)}
					>
						<span
							className={cn(
								"h-1.5 w-1.5 rounded-full",
								toOnly ? "bg-forest-700" : "bg-forest-500",
							)}
						/>
						이동 가능 시설만 보기{toCount > 0 ? ` ${toCount}` : ""}
					</Button>
				</div>
			</Fieldset>

			{showFilters ? (
				<div className="mt-3 rounded-2xl bg-dotori-50 p-4 duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
					<Fieldset className="space-y-3">
						<Field>
							<Text className="mb-2 block text-sm font-medium text-dotori-500">시설 유형</Text>
							<div className="flex flex-wrap gap-2">
								{EXPLORE_TYPE_FILTERS.map((type) => {
									const isSelectedType = selectedTypes.includes(type);
									return (
										<Button
											key={type}
											type="button"
											plain={true}
											onClick={() => onToggleType(type)}
											aria-pressed={isSelectedType}
											className={cn(
												"rounded-full px-4 py-2 text-sm transition-all",
												isSelectedType
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
									<Select
										value={selectedSido}
										onChange={(event) => onSidoChange(event.target.value)}
									>
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
										onChange={(event) => onSigunguChange(event.target.value)}
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
						</Field>

						<Field>
							<Text className="mb-2 block text-sm font-medium text-dotori-500">정렬</Text>
							<div className="flex gap-2">
								{EXPLORE_SORT_OPTIONS.map((option) => (
									<Button
										key={option.key}
										type="button"
										plain={true}
										onClick={() => onSortChange(option.key)}
										className={cn(
											"rounded-full px-4 py-2 text-sm transition-all",
											sortBy === option.key
												? "bg-dotori-900 text-white"
												: "bg-white text-dotori-600",
										)}
									>
										{option.label}
									</Button>
								))}
							</div>
						</Field>

						{activeFilterCount > 0 ? (
							<div className="mt-3 flex items-center justify-between gap-2">
								<Button plain={true} onClick={onResetFilters}>
									필터 초기화
								</Button>
							</div>
						) : null}
					</Fieldset>
				</div>
			) : null}
		</header>
	);
});
