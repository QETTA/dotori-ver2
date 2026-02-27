"use client";

import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import { DsButton } from "@/components/ds/DsButton";
import { Field, Fieldset } from "@/components/catalyst/fieldset";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
	EXPLORE_SORT_OPTIONS,
	EXPLORE_TYPE_FILTERS,
	type ExploreSortKey,
} from "./explore-constants";

interface ExploreFilterPanelProps {
	showFilters: boolean;
	selectedTypes: string[];
	selectedSido: string;
	selectedSigungu: string;
	sortBy: ExploreSortKey;
	activeFilterCount: number;
	sidoOptions: string[];
	sigunguOptions: string[];
	isLoadingSido: boolean;
	isLoadingSigungu: boolean;
	activeFilterPillClass: string;
	inactiveFilterPillClass: string;
	onToggleType: (type: string) => void;
	onSidoChange: (nextSido: string) => void;
	onSigunguChange: (nextSigungu: string) => void;
	onSortChange: (nextSort: ExploreSortKey) => void;
	onResetFilters: () => void;
}

export const ExploreFilterPanel = memo(function ExploreFilterPanel({
	showFilters,
	selectedTypes,
	selectedSido,
	selectedSigungu,
	sortBy,
	activeFilterCount,
	sidoOptions,
	sigunguOptions,
	isLoadingSido,
	isLoadingSigungu,
	activeFilterPillClass,
	inactiveFilterPillClass,
	onToggleType,
	onSidoChange,
	onSigunguChange,
	onSortChange,
	onResetFilters,
}: ExploreFilterPanelProps) {
	return (
		<AnimatePresence>
			{showFilters ? (
				<motion.div
					key="explore-filter-panel"
					initial={{ opacity: 0, height: 0, y: -4 }}
					animate={{ opacity: 1, height: "auto", y: 0 }}
					exit={{ opacity: 0, height: 0, y: -4 }}
					transition={spring.card}
					className="overflow-hidden"
				>
					<div className={cn(
						'mt-3 rounded-2xl p-4 space-y-4',
						'bg-dotori-950/[0.025] ring-1 ring-dotori-200/40',
						'dark:bg-white/[0.03] dark:ring-dotori-700/40',
					)}>
						<Fieldset className="space-y-4">
							{/* ── Facility type chips ── */}
							<Field>
								<Text className="text-caption mb-2.5 block font-medium text-dotori-500 dark:text-dotori-400">
									시설 유형
								</Text>
								<div className="flex flex-wrap gap-1.5">
									{EXPLORE_TYPE_FILTERS.map((type) => {
										const isSelectedType = selectedTypes.includes(type);
										return (
											<motion.div key={type} {...tap.chip} className="inline-flex">
												<DsButton
													type="button"
													variant="ghost"
													onClick={() => onToggleType(type)}
													aria-pressed={isSelectedType}
													className={cn(
														'min-h-9 rounded-full px-3 py-1.5 text-body-sm transition-all duration-150',
														isSelectedType
															? activeFilterPillClass
															: inactiveFilterPillClass,
													)}
												>
													{type}
												</DsButton>
											</motion.div>
										);
									})}
								</div>
							</Field>

							{/* ── Region selects ── */}
							<Field>
								<Text className="text-caption mb-2.5 block font-medium text-dotori-500 dark:text-dotori-400">
									지역 필터
								</Text>
								<div className="grid gap-2 sm:grid-cols-2">
									<Select
										value={selectedSido}
										onChange={(event) => onSidoChange(event.target.value)}
										className="text-body-sm min-h-10 rounded-xl"
									>
										<option value="">{isLoadingSido ? "시도 불러오는 중" : "시도 선택"}</option>
										{sidoOptions.map((sido) => (
											<option key={sido} value={sido}>{sido}</option>
										))}
									</Select>
									<Select
										value={selectedSigungu}
										disabled={!selectedSido || isLoadingSigungu}
										onChange={(event) => onSigunguChange(event.target.value)}
										className="text-body-sm min-h-10 rounded-xl"
									>
										<option value="">
											{isLoadingSigungu ? "구군 불러오는 중" : "구/군 선택"}
										</option>
										{sigunguOptions.map((sigungu) => (
											<option key={sigungu} value={sigungu}>{sigungu}</option>
										))}
									</Select>
								</div>
							</Field>

							{/* ── Sort options ── */}
							<Field>
								<Text className="text-caption mb-2.5 block font-medium text-dotori-500 dark:text-dotori-400">
									정렬
								</Text>
								<div className="flex flex-wrap gap-1.5">
									{EXPLORE_SORT_OPTIONS.map((option) => (
										<motion.div key={option.key} {...tap.chip} className="inline-flex">
											<DsButton
												type="button"
												variant="ghost"
												onClick={() => onSortChange(option.key)}
												className={cn(
													'min-h-9 rounded-full px-3 py-1.5 text-body-sm transition-all duration-150',
													sortBy === option.key
														? activeFilterPillClass
														: inactiveFilterPillClass,
												)}
											>
												{option.label}
											</DsButton>
										</motion.div>
									))}
								</div>
							</Field>

							{/* ── Reset button ── */}
							{activeFilterCount > 0 ? (
								<div className="flex items-center justify-end pt-1">
									<DsButton
										variant="ghost"
										onClick={onResetFilters}
										className="min-h-9 text-body-sm font-medium text-dotori-500 transition-colors hover:text-dotori-800 dark:text-dotori-400 dark:hover:text-dotori-100"
									>
										필터 초기화
									</DsButton>
								</div>
							) : null}
						</Fieldset>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
});
