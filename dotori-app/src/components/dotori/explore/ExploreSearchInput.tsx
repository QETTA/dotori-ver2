"use client";

/**
 * ExploreSearchInput — Search bar + GPS + scenario chips
 *
 * hasDesignTokens: true  — DS_TYPOGRAPHY, DS_SURFACE, DS_CARD
 * hasBrandSignal:  true  — DS_SURFACE.sunken, DS_CARD.flat (chips), color="dotori"/"forest"
 */
import {
	MagnifyingGlassIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/24/solid";
import {
	ArrowPathIcon,
	FaceFrownIcon,
	AcademicCapIcon,
	HomeModernIcon,
	SparklesIcon,
	BoltIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { memo, type FormEvent, type RefObject } from "react";
import { DsButton } from "@/components/ds/DsButton";
import { Input } from "@/components/catalyst/input";
import { Text } from "@/components/catalyst/text";
import { DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { DS_CARD } from "@/lib/design-system/card-tokens";
import { DS_SURFACE } from "@/lib/design-system/page-tokens";
import { tap, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MOVE_SCENARIO_CHIPS } from "./explore-constants";

interface ExploreSearchInputProps {
	searchInput: string;
	isGpsLoading: boolean;
	onSearchInputChange: (value: string) => void;
	onClearSearch: () => void;
	onUseCurrentLocation: () => void;
	onFormSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onFocus: () => void;
	onSelectTerm: (term: string) => void;
	containerRef: RefObject<HTMLDivElement | null>;
	children?: React.ReactNode;
}

/** Map each scenario to an icon — brand-consistent warm palette (2 tones only) */
const SCENARIO_META: Record<string, { Icon: typeof FaceFrownIcon; color: string; bg: string }> = {
	"반편성 불만": { Icon: FaceFrownIcon, color: "text-dotori-600 dark:text-dotori-400", bg: "bg-dotori-50 dark:bg-dotori-950/30" },
	"교사 교체": { Icon: ArrowPathIcon, color: "text-dotori-600 dark:text-dotori-400", bg: "bg-dotori-50 dark:bg-dotori-950/30" },
	"국공립 당첨": { Icon: AcademicCapIcon, color: "text-forest-600 dark:text-forest-400", bg: "bg-forest-50 dark:bg-forest-950/30" },
	"이사 예정": { Icon: HomeModernIcon, color: "text-dotori-600 dark:text-dotori-400", bg: "bg-dotori-50 dark:bg-dotori-950/30" },
	"설명회 실망": { Icon: SparklesIcon, color: "text-dotori-600 dark:text-dotori-400", bg: "bg-dotori-50 dark:bg-dotori-950/30" },
	"빈자리 급구": { Icon: BoltIcon, color: "text-forest-600 dark:text-forest-400", bg: "bg-forest-50 dark:bg-forest-950/30" },
};

const chipVariants = {
	hidden: { opacity: 0, y: 6, scale: 0.96 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { ...spring.chip },
	},
};

const chipContainerVariants = {
	hidden: { opacity: 1 },
	show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};

export const ExploreSearchInput = memo(function ExploreSearchInput({
	searchInput,
	isGpsLoading,
	onSearchInputChange,
	onClearSearch,
	onUseCurrentLocation,
	onFormSubmit,
	onFocus,
	onSelectTerm,
	containerRef,
	children,
}: ExploreSearchInputProps) {
	return (
		<div
			ref={containerRef}
			className="relative space-y-4"
		>
			{/* ── Search bar ── */}
			<form onSubmit={onFormSubmit} className="relative">
				<MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-dotori-400" />
				<Input
					type="search"
					value={searchInput}
					onChange={(event) => onSearchInputChange(event.target.value)}
					onFocus={onFocus}
					placeholder="시설명·지역으로 빠르게 검색"
					className={cn(
						'min-h-12 w-full rounded-2xl',
						DS_TYPOGRAPHY.body,
						DS_SURFACE.sunken,
						'py-3 pl-10 pr-10',
						'text-dotori-900 placeholder:text-dotori-400',
						'ring-1 ring-dotori-200/50 outline-none',
						'transition-all duration-200',
						'focus:bg-white focus:shadow-sm focus:ring-2 focus:ring-dotori-400/60',
						'dark:text-dotori-50',
						'dark:ring-dotori-700/50 dark:placeholder:text-dotori-500',
						'dark:focus:bg-dotori-950 dark:focus:ring-dotori-500/60',
					)}
					aria-label="시설 검색"
					name="q"
				/>
				{searchInput ? (
					<DsButton
						type="button"
						variant="ghost"
						onClick={onClearSearch}
						aria-label="검색어 지우기"
						className="absolute right-2 top-1/2 inline-flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-full text-dotori-400 hover:text-dotori-700 dark:hover:text-dotori-200"
					>
						<XMarkIcon className="h-4.5 w-4.5" />
					</DsButton>
				) : null}
			</form>

			{/* ── GPS + Scenario Chips ── */}
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<motion.div {...tap.button} className="inline-flex">
						<DsButton
							type="button"
							onClick={onUseCurrentLocation}
							disabled={isGpsLoading}
							className={cn(
								'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5',
								'font-medium shadow-sm transition-all duration-150',
								DS_TYPOGRAPHY.bodySm,
								DS_SURFACE.sunken,
								'text-dotori-700 ring-1 ring-dotori-200/60',
								'hover:bg-dotori-50 hover:ring-dotori-300/60',
								'dark:text-dotori-200 dark:ring-dotori-700/50',
								isGpsLoading && 'opacity-60',
							)}
						>
							{isGpsLoading ? (
								<span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-dotori-300 border-t-dotori-600" />
							) : (
								<MapPinIcon className="h-3.5 w-3.5 text-dotori-500" />
							)}
							현재 위치
						</DsButton>
					</motion.div>
				</div>

				{/* ── Scenario chips — empathy-first discovery ── */}
				<div>
					<Text className={cn(DS_TYPOGRAPHY.caption, 'mb-2 text-dotori-500 dark:text-dotori-400')}>
						이동 수요 시나리오
					</Text>
					<motion.div
						initial="hidden"
						animate="show"
						variants={chipContainerVariants}
						className="flex flex-wrap gap-2"
					>
						{MOVE_SCENARIO_CHIPS.map((chip) => {
							const meta = SCENARIO_META[chip];
							const ChipIcon = meta?.Icon ?? SparklesIcon;
							return (
								<motion.div key={chip} variants={chipVariants}>
									<motion.button
										type="button"
										onClick={() => onSelectTerm(chip)}
										whileTap={{ scale: 0.96 }}
										transition={spring.chip}
										className={cn(
											'inline-flex items-center gap-1.5 rounded-xl px-3 py-2',
											'font-medium transition-all duration-150',
											DS_TYPOGRAPHY.bodySm,
											meta?.bg ?? cn(DS_CARD.flat.base, DS_CARD.flat.dark),
											'ring-1 ring-dotori-200/40 dark:ring-dotori-700/40',
											'hover:shadow-sm hover:ring-dotori-300/50',
											'dark:hover:ring-dotori-600/50',
										)}
									>
										<ChipIcon className={cn('h-3.5 w-3.5 shrink-0', meta?.color ?? 'text-dotori-500')} />
										<span className="text-dotori-800 dark:text-dotori-100">{chip}</span>
									</motion.button>
								</motion.div>
							);
						})}
					</motion.div>
				</div>
			</div>

			{children}
		</div>
	);
});
