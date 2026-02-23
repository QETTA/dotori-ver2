"use client";

import {
	AdjustmentsHorizontalIcon,
	ListBulletIcon,
	MagnifyingGlassIcon,
	MapIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "motion/react";
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
import { BRAND_GUIDE } from "@/lib/brand-assets";
import { DS_GLASS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ExploreSuggestionPanel } from "./ExploreSuggestionPanel";
import {
	EXPLORE_SORT_OPTIONS,
	EXPLORE_TYPE_FILTERS,
	MOVE_SCENARIO_CHIPS,
	POPULAR_SEARCHES,
} from "./explore-constants";
import type {
	ExploreSearchHeaderActions,
	ExploreSearchHeaderState,
} from "./useExploreSearch";

interface ExploreSearchHeaderProps {
	state: ExploreSearchHeaderState;
	actions: ExploreSearchHeaderActions;
}

export const ExploreSearchHeader = memo(function ExploreSearchHeader({
	state,
	actions,
}: ExploreSearchHeaderProps) {
	const {
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
	} = state;
	const {
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
	} = actions;

	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);
	const activeFilterPillClass = cn(
		DS_TYPOGRAPHY.bodySm,
		"bg-dotori-400 font-semibold text-white ring-1 ring-dotori-500 shadow-sm",
	);
	const inactiveFilterPillClass = cn(
		DS_TYPOGRAPHY.bodySm,
		"bg-dotori-50 text-dotori-700 ring-1 ring-dotori-200 dark:bg-dotori-900 dark:text-dotori-200 dark:ring-dotori-700/40",
	);

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
		<header className={cn("sticky top-0 z-20 px-4 pb-2 pt-3", DS_GLASS.HEADER)}>
			<div className="mb-2.5 flex items-center justify-between">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={BRAND_GUIDE.header} alt="도토리" className="h-5 opacity-90" />
				<div className="rounded-full border border-dotori-100 bg-white px-2.5 py-1 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND_GUIDE.inApp} alt="" aria-hidden="true" className="h-4 w-4" />
				</div>
			</div>

			<Heading
				level={2}
				className={cn(DS_TYPOGRAPHY.h2, "font-bold tracking-tight text-dotori-900 dark:text-dotori-50")}
			>
				이동 고민이라면, 빈자리 먼저 확인해요
			</Heading>
			<Text className={cn(DS_TYPOGRAPHY.bodySm, "mt-1 text-dotori-500 dark:text-dotori-300")}>
				지역·시나리오·필터를 조합해 지금 이동 가능한 시설을 빠르게 확인하세요
			</Text>

			<Fieldset className="mt-3 space-y-2">
				<div
					ref={searchContainerRef}
					className={cn(
						DS_GLASS.CARD,
						"relative rounded-3xl border border-dotori-200/70 bg-gradient-to-br from-white via-dotori-50/90 to-amber-50/70 p-3 shadow-[0_16px_36px_-26px_rgba(122,78,48,0.8)] dark:border-dotori-800/70 dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-950 dark:shadow-none",
					)}
				>
					<form onSubmit={handleFormSubmit}>
						<MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dotori-500" />
						<Input
							type="search"
							value={searchInput}
							onChange={(event) => onSearchInputChange(event.target.value)}
							onFocus={() => setIsSearchFocused(true)}
							placeholder="이동 고민? 내 주변 빈자리 먼저 확인해요"
							className={cn(
								DS_TYPOGRAPHY.body,
								"min-h-12 w-full rounded-3xl bg-dotori-50 py-3 pl-11 pr-10 text-dotori-900 ring-1 ring-dotori-200/50 outline-none transition-all placeholder:text-dotori-400 focus:bg-white focus:ring-2 focus:ring-dotori-300 dark:bg-dotori-900 dark:text-dotori-50 dark:ring-dotori-700/60 dark:placeholder:text-dotori-500 dark:focus:bg-dotori-950 dark:focus:ring-dotori-600",
							)}
							aria-label="시설 검색"
							name="q"
						/>
						{searchInput ? (
							<Button
								type="button"
								plain={true}
								onClick={onClearSearch}
								aria-label="검색어 지우기"
								className={cn(
									DS_TYPOGRAPHY.bodySm,
									"absolute right-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-dotori-500",
								)}
							>
								<XMarkIcon className="h-5 w-5" />
							</Button>
						) : null}
					</form>

					<div className="mt-2.5 flex flex-wrap gap-2">
						<motion.div {...tap.chip} className="inline-flex">
							<Button
								type="button"
								plain={true}
								onClick={onUseCurrentLocation}
								disabled={isGpsLoading}
								className={cn(
									DS_TYPOGRAPHY.bodySm,
									"inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dotori-200 bg-dotori-50 px-3 py-2 font-semibold text-dotori-700 transition-colors duration-150 hover:bg-dotori-100 dark:border-dotori-700 dark:bg-dotori-900 dark:text-dotori-100 dark:hover:bg-dotori-800",
									isGpsLoading && "opacity-70",
								)}
							>
								{isGpsLoading ? (
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-dotori-300 border-t-dotori-700 dark:border-dotori-700 dark:border-t-dotori-100" />
								) : (
									<MapPinIcon className="h-4 w-4 text-dotori-500" />
								)}
								현재 위치
							</Button>
						</motion.div>
					</div>

					<div className="mt-3.5">
						<Text className={cn(DS_TYPOGRAPHY.label, "text-dotori-500 dark:text-dotori-300")}>
							이동 수요 시나리오
						</Text>
						<div className="mt-2 flex flex-wrap gap-2">
							{MOVE_SCENARIO_CHIPS.map((chip) => (
								<motion.div key={chip} {...tap.chip} className="inline-flex">
									<Button
										type="button"
										plain={true}
										onClick={() => handleSelectTerm(chip)}
										className={cn(
											DS_TYPOGRAPHY.bodySm,
											"min-h-11 rounded-full border border-dotori-100 bg-dotori-50 px-3 py-2 font-semibold text-dotori-700 transition-colors duration-150 hover:bg-dotori-100 dark:border-dotori-800 dark:bg-dotori-900 dark:text-dotori-100 dark:hover:bg-dotori-800",
										)}
									>
										{chip}
									</Button>
								</motion.div>
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

				<div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
					<Text className={cn(DS_TYPOGRAPHY.bodySm, "mr-auto shrink-0 whitespace-nowrap text-dotori-500 dark:text-dotori-300")}>
						{resultLabel}
					</Text>
					<motion.div {...tap.chip} className="inline-flex">
						<Button
							type="button"
							plain={true}
							onClick={onToggleFilters}
							className={cn(
								"relative inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-2 transition-colors duration-150",
								showFilters ? activeFilterPillClass : inactiveFilterPillClass,
							)}
						>
							<AdjustmentsHorizontalIcon className="h-4 w-4" />
							필터 설정
							{activeFilterCount > 0 ? (
								<AnimatePresence initial={false}>
									<motion.span
										key="filter-count-badge"
										className="inline-flex"
										initial={{ scale: 0.7, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										exit={{ scale: 0.7, opacity: 0 }}
										transition={spring.chip}
									>
										<Badge color="forest" className="px-1 py-0 text-xs">
											{activeFilterCount}
										</Badge>
									</motion.span>
								</AnimatePresence>
							) : null}
						</Button>
					</motion.div>
					<motion.div {...tap.chip} className="inline-flex">
						<Button
							type="button"
							plain={true}
							onClick={onToggleMap}
							className={cn(
								DS_TYPOGRAPHY.bodySm,
								"inline-flex min-h-11 items-center gap-1 rounded-full border border-dotori-100 bg-white px-3 py-2 text-dotori-700 shadow-sm transition-colors duration-150 hover:bg-dotori-50 dark:border-dotori-800 dark:bg-dotori-950 dark:text-dotori-100 dark:shadow-none dark:hover:bg-dotori-900",
							)}
						>
							{showMap ? <ListBulletIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
							{showMap ? "리스트 보기" : "지도 보기"}
						</Button>
					</motion.div>
				</div>

				<motion.div {...tap.chip} className="mt-1">
					<Button
						type="button"
						onClick={onToggleToOnly}
						aria-pressed={toOnly}
						className={cn(
							"inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 transition-colors duration-150",
							toOnly ? activeFilterPillClass : inactiveFilterPillClass,
							toOnly
								? "dark:bg-dotori-500 dark:ring-dotori-300"
								: "hover:bg-dotori-100 dark:hover:bg-dotori-800",
						)}
					>
						<AnimatePresence mode="wait" initial={false}>
							<motion.span
								key={`toOnly-dot-${toOnly ? "on" : "off"}`}
								className={cn(
									"h-1.5 w-1.5 rounded-full",
									toOnly ? "bg-white" : "bg-dotori-500",
								)}
								initial={{ scale: 0.6, opacity: 0.5 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.6, opacity: 0.5 }}
								transition={spring.chip}
							/>
						</AnimatePresence>
						이동 가능 시설만 보기{toCount > 0 ? ` ${toCount}` : ""}
					</Button>
				</motion.div>
			</Fieldset>

			<AnimatePresence>
				{showFilters ? (
					<motion.div
						key="explore-filter-panel"
						initial={{ opacity: 0, scale: 0.96, y: -6 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: -6 }}
						transition={spring.card}
						className={cn(
							DS_GLASS.SHEET,
							"mt-3 rounded-3xl border border-dotori-200/70 p-4 shadow-[0_16px_36px_-26px_rgba(122,78,48,0.8)] dark:border-dotori-800/70 dark:shadow-none",
						)}
					>
						<Fieldset className="space-y-3">
							<Field>
								<Text className={cn(DS_TYPOGRAPHY.bodySm, "mb-2 block font-semibold text-dotori-600 dark:text-dotori-300")}>
									시설 유형
								</Text>
								<div className="flex flex-wrap gap-2">
									{EXPLORE_TYPE_FILTERS.map((type) => {
										const isSelectedType = selectedTypes.includes(type);
										return (
											<motion.div key={type} {...tap.chip} className="inline-flex">
												<Button
													type="button"
													plain={true}
													onClick={() => onToggleType(type)}
													aria-pressed={isSelectedType}
													className={cn(
														"min-h-11 rounded-full px-4 py-2 transition-colors duration-150",
														isSelectedType
															? activeFilterPillClass
															: inactiveFilterPillClass,
													)}
												>
													{type}
												</Button>
											</motion.div>
										);
									})}
								</div>
							</Field>

							<Field>
								<Text className={cn(DS_TYPOGRAPHY.bodySm, "mb-2 block font-semibold text-dotori-600 dark:text-dotori-300")}>
									지역 필터
								</Text>
								<div className="grid gap-2 sm:grid-cols-2">
									<div>
										<Select
											value={selectedSido}
											onChange={(event) => onSidoChange(event.target.value)}
											className={cn(DS_TYPOGRAPHY.bodySm, "min-h-11")}
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
											className={cn(DS_TYPOGRAPHY.bodySm, "min-h-11")}
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
								<Text className={cn(DS_TYPOGRAPHY.bodySm, "mb-2 block font-semibold text-dotori-600 dark:text-dotori-300")}>
									정렬
								</Text>
								<div className="flex flex-wrap gap-2">
									{EXPLORE_SORT_OPTIONS.map((option) => (
										<motion.div key={option.key} {...tap.chip} className="inline-flex">
											<Button
												type="button"
												plain={true}
												onClick={() => onSortChange(option.key)}
												className={cn(
													"min-h-11 rounded-full px-4 py-2 transition-colors duration-150",
													sortBy === option.key
														? activeFilterPillClass
														: inactiveFilterPillClass,
												)}
											>
												{option.label}
											</Button>
										</motion.div>
									))}
								</div>
							</Field>

							{activeFilterCount > 0 ? (
								<div className="mt-3 flex items-center justify-between gap-2">
									<Button
										plain={true}
										onClick={onResetFilters}
										className={cn(
											DS_TYPOGRAPHY.bodySm,
											"min-h-11 font-semibold text-dotori-700 transition-colors duration-150 hover:text-dotori-900 dark:text-dotori-100 dark:hover:text-dotori-50",
										)}
									>
										필터 초기화
									</Button>
								</div>
							) : null}
						</Fieldset>
					</motion.div>
				) : null}
			</AnimatePresence>
		</header>
	);
});
