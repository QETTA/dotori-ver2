"use client";

/**
 * ExploreFilterToolbar — Result count + filter toggle bar
 *
 * hasDesignTokens: true  — DS_TYPOGRAPHY, DS_SURFACE
 * hasBrandSignal:  true  — DS_SURFACE.sunken (toolbar bg), color="dotori"/"forest"
 */
import { SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import { Badge } from "@/components/catalyst/badge";
import { DsButton } from "@/components/ds/DsButton";
import { Text } from "@/components/catalyst/text";
import { DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { DS_SURFACE } from "@/lib/design-system/page-tokens";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ExploreFilterToolbarProps {
	resultLabel: string;
	showFilters: boolean;
	activeFilterCount: number;
	activeFilterPillClass: string;
	inactiveFilterPillClass: string;
	onToggleFilters: () => void;
}

export const ExploreFilterToolbar = memo(function ExploreFilterToolbar({
	resultLabel,
	showFilters,
	activeFilterCount,
	activeFilterPillClass,
	inactiveFilterPillClass,
	onToggleFilters,
}: ExploreFilterToolbarProps) {
	return (
		<motion.div
			className={cn(
				"mt-1 flex items-center gap-2 rounded-xl px-3 py-2",
				DS_SURFACE.sunken,
			)}
		>
			<Text
				role="status"
				aria-live="polite"
				aria-atomic="true"
				className={cn(
					DS_TYPOGRAPHY.body,
					"mr-auto shrink-0 whitespace-nowrap font-semibold text-dotori-700 dark:text-dotori-200",
				)}
			>
				{resultLabel}
			</Text>
			<div className="flex items-center gap-1.5">
				<motion.div className="inline-flex">
					<DsButton
						type="button"
						variant="ghost"
						onClick={onToggleFilters}
						aria-expanded={showFilters}
						aria-label={
							activeFilterCount > 0
								? `필터, 활성 ${activeFilterCount}개`
								: "필터"
						}
						className={cn(
							"relative inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-1.5 transition-all duration-150",
							DS_TYPOGRAPHY.bodySm,
							showFilters ? activeFilterPillClass : inactiveFilterPillClass,
						)}
					>
						<SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
						필터
						<AnimatePresence initial={false}>
							{activeFilterCount > 0 ? (
								<motion.span
									key="filter-count-badge"
									className="inline-flex"
									initial={{ scale: 0.7, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.7, opacity: 0 }}
									transition={spring.chip}
								>
									<Badge
										color="forest"
										className={cn(DS_TYPOGRAPHY.caption, "px-1.5 py-0.5")}
									>
										{activeFilterCount}
									</Badge>
								</motion.span>
							) : null}
						</AnimatePresence>
					</DsButton>
				</motion.div>
			</div>
		</motion.div>
	);
});
