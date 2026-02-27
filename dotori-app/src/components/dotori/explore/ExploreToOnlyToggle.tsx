"use client";

import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import { DsButton } from "@/components/ds/DsButton";
import { DS_TEXT } from "@/lib/design-system/tokens";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ExploreToOnlyToggleProps {
	toOnly: boolean;
	toCount: number;
	activeFilterPillClass: string;
	inactiveFilterPillClass: string;
	onToggleToOnly: () => void;
}

export const ExploreToOnlyToggle = memo(function ExploreToOnlyToggle({
	toOnly,
	toCount,
	onToggleToOnly,
}: ExploreToOnlyToggleProps) {
	return (
		<motion.div {...tap.chip}>
			<DsButton
				type="button"
				variant="ghost"
				onClick={onToggleToOnly}
				aria-pressed={toOnly}
				className={cn(
					'inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5',
					'text-body-sm font-medium transition-all duration-200',
					toOnly
						? 'bg-dotori-900 text-white shadow-md ring-1 ring-dotori-700/50 dark:bg-dotori-800 dark:ring-dotori-600/60'
						: cn('bg-dotori-950/[0.025] ring-1 ring-dotori-200/50 hover:bg-dotori-50 dark:bg-white/[0.03] dark:ring-dotori-700/40 dark:hover:bg-dotori-800/40', DS_TEXT.secondary),
				)}
			>
				<AnimatePresence mode="wait" initial={false}>
					<motion.span
						key={`toOnly-indicator-${toOnly ? "on" : "off"}`}
						className={cn(
							'h-2 w-2 rounded-full',
							toOnly
								? 'bg-forest-400 shadow-[0_0_6px_rgba(74,122,66,0.5)]'
								: 'bg-dotori-400',
						)}
						initial={{ scale: 0.5, opacity: 0.4 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.5, opacity: 0.4 }}
						transition={spring.chip}
					/>
				</AnimatePresence>
				이동 가능 시설만 보기{toCount > 0 ? ` ${toCount}` : ""}
			</DsButton>
		</motion.div>
	);
});
