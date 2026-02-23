"use client";

import { ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { Button } from "@/components/catalyst/button";
import { Text } from "@/components/catalyst/text";
import { BRAND_GUIDE } from "@/lib/brand-assets";
import { DS_GLASS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { fadeScale, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ExploreSuggestionPanelProps {
	recentSearches: string[];
	popularSearches: readonly string[];
	onClearRecent: () => void;
	onSelectTerm: (term: string) => void;
}

export function ExploreSuggestionPanel({
	recentSearches,
	popularSearches,
	onClearRecent,
	onSelectTerm,
}: ExploreSuggestionPanelProps) {
	return (
		<motion.div
			{...fadeScale}
			className={cn(
				DS_GLASS.CARD,
				"absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-dotori-200/70 bg-gradient-to-br from-white via-dotori-50/90 to-amber-50/70 p-4 shadow-[0_16px_36px_-22px_rgba(122,78,48,0.75)] dark:border-dotori-800/70 dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-950 dark:shadow-none",
			)}
		>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-dotori-200/45 blur-2xl dark:bg-dotori-700/25"
			/>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND_GUIDE.inApp}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-6 -left-6 h-16 w-16 opacity-[0.07] dark:opacity-[0.14]"
			/>

			{recentSearches.length > 0 ? (
				<div className="relative mb-4">
					<div className="mb-2.5 flex items-center justify-between">
						<div className="flex items-center gap-1.5">
							<ClockIcon className="h-4 w-4 text-dotori-500" />
							<Text className={cn(DS_TYPOGRAPHY.bodySm, "font-semibold text-dotori-600 dark:text-dotori-300")}>
								최근 검색
							</Text>
						</div>
						<Button
							type="button"
							plain={true}
							onClick={onClearRecent}
							className={cn(
								DS_TYPOGRAPHY.bodySm,
								"min-h-11 px-2 text-dotori-500 transition-colors transition-transform duration-150 hover:text-dotori-700 active:scale-[0.97] dark:text-dotori-300 dark:hover:text-dotori-100",
							)}
						>
							전체 삭제
						</Button>
					</div>
					<div className="flex flex-wrap gap-2">
						{recentSearches.map((term) => (
							<motion.div key={term} {...tap.chip}>
								<Button
									type="button"
									onClick={() => onSelectTerm(term)}
									plain={true}
									className={cn(
										DS_TYPOGRAPHY.bodySm,
										"inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dotori-200/70 bg-white/85 px-3 py-2 text-dotori-700 transition-colors duration-150 hover:bg-dotori-100 dark:border-dotori-800 dark:bg-dotori-900 dark:text-dotori-100 dark:hover:bg-dotori-800",
									)}
								>
									<ClockIcon className="h-3.5 w-3.5 text-dotori-300 dark:text-dotori-600" />
									{term}
								</Button>
							</motion.div>
						))}
					</div>
				</div>
			) : null}

			<div className="relative">
				<div className="mb-2.5 flex items-center gap-1.5">
					<MagnifyingGlassIcon className="h-4 w-4 text-dotori-500" />
					<Text className={cn(DS_TYPOGRAPHY.bodySm, "font-semibold text-dotori-600 dark:text-dotori-300")}>
						인기 검색어
					</Text>
				</div>
				<div className="flex flex-wrap gap-2">
					{popularSearches.map((term) => (
						<motion.div key={term} {...tap.chip}>
							<Button
								type="button"
								plain={true}
								onClick={() => onSelectTerm(term)}
								className={cn(
									DS_TYPOGRAPHY.bodySm,
									"inline-flex min-h-11 items-center rounded-full bg-white px-3 py-2 font-medium text-dotori-600 shadow-sm ring-1 ring-dotori-100 transition-colors duration-150 hover:bg-dotori-50 hover:text-dotori-800 dark:bg-dotori-950 dark:text-dotori-200 dark:shadow-none dark:ring-dotori-800 dark:hover:bg-dotori-900 dark:hover:text-dotori-50",
								)}
							>
								{term}
							</Button>
						</motion.div>
					))}
				</div>
			</div>
		</motion.div>
	);
}
