"use client";

/**
 * ExploreFilterToolbar — Result count + filter/map toggle bar
 *
 * hasDesignTokens: true  — DS_TYPOGRAPHY, DS_SURFACE
 * hasBrandSignal:  true  — DS_SURFACE.sunken (toolbar bg), color="dotori"/"forest"
 */
import {
	AdjustmentsHorizontalIcon,
	ListBulletIcon,
	MapIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import { Badge } from "@/components/catalyst/badge";
import { DsButton } from "@/components/ds/DsButton";
import { Text } from "@/components/catalyst/text";
import { DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { DS_SURFACE } from "@/lib/design-system/page-tokens";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ExploreFilterToolbarProps {
	resultLabel: string;
	showFilters: boolean;
	showMap: boolean;
	activeFilterCount: number;
	isMapAvailable: boolean;
	mapDisabledReason: string | null;
	activeFilterPillClass: string;
	inactiveFilterPillClass: string;
	onToggleFilters: () => void;
	onToggleMap: () => void;
}

export const ExploreFilterToolbar = memo(function ExploreFilterToolbar({
	resultLabel,
	showFilters,
	showMap,
	activeFilterCount,
	isMapAvailable,
	mapDisabledReason,
	activeFilterPillClass,
	inactiveFilterPillClass,
	onToggleFilters,
	onToggleMap,
}: ExploreFilterToolbarProps) {
	return (
		<>
			<motion.div
				{...tap.chip}
				className={cn(
					'mt-1 flex items-center gap-2 rounded-xl px-3 py-2',
					DS_SURFACE.sunken,
				)}
			>
				<Text
					className={cn(
						DS_TYPOGRAPHY.bodySm,
						'mr-auto shrink-0 whitespace-nowrap text-dotori-600 dark:text-dotori-300',
					)}
				>
					{resultLabel}
				</Text>
				<div className="flex items-center gap-1.5">
					<motion.div {...tap.chip} className="inline-flex">
						<DsButton
							type="button"
							variant="ghost"
							onClick={onToggleFilters}
							className={cn(
								'relative inline-flex min-h-9 items-center gap-1 rounded-full px-3 py-1.5 transition-all duration-150',
								DS_TYPOGRAPHY.bodySm,
								showFilters ? activeFilterPillClass : inactiveFilterPillClass,
							)}
						>
							<AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
							필터
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
										<Badge color="forest" className={cn(DS_TYPOGRAPHY.caption, 'px-1.5 py-0.5')}>
											{activeFilterCount}
										</Badge>
									</motion.span>
								</AnimatePresence>
							) : null}
						</DsButton>
					</motion.div>
					<motion.div {...tap.chip} className="inline-flex">
						<DsButton
							type="button"
							variant="ghost"
							onClick={onToggleMap}
							disabled={!showMap && !isMapAvailable}
							className={cn(
								'inline-flex min-h-9 items-center gap-1 rounded-full px-3 py-1.5',
								DS_TYPOGRAPHY.bodySm,
								'text-dotori-600 transition-all duration-150',
								'ring-1 ring-dotori-200/50',
								'hover:bg-dotori-50 hover:ring-dotori-300/50',
								'disabled:cursor-not-allowed disabled:opacity-50',
								'dark:text-dotori-300 dark:ring-dotori-700/50',
								'dark:hover:bg-dotori-800 dark:disabled:bg-transparent',
							)}
						>
							{showMap ? <ListBulletIcon className="h-3.5 w-3.5" /> : <MapIcon className="h-3.5 w-3.5" />}
							{showMap ? "목록" : "지도"}
						</DsButton>
					</motion.div>
				</div>
			</motion.div>
			{!isMapAvailable && mapDisabledReason ? (
				<Text className={cn(DS_TYPOGRAPHY.caption, 'mt-1 text-dotori-500 dark:text-dotori-400')}>
					{mapDisabledReason}
				</Text>
			) : null}
		</>
	);
});
