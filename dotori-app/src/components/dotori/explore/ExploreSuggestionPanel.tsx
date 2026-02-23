"use client";

import { ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Text } from "@/components/catalyst/text";
import { BRAND } from "@/lib/brand-assets";
import { DS_GLASS, DS_STATUS } from "@/lib/design-system/tokens";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ExploreSuggestionPanelProps {
	recentSearches: string[];
	popularSearches: readonly string[];
	onClearRecent: () => void;
	onSelectTerm: (term: string) => void;
}

const STATUS_SERIES = [DS_STATUS.available, DS_STATUS.waiting, DS_STATUS.full] as const;

const panelVariants = {
	hidden: { opacity: 0, y: 10, scale: 0.985 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { ...spring.card },
	},
};

const sectionVariants = {
	hidden: { opacity: 1 },
	show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const chipVariants = {
	hidden: { opacity: 0, y: 8 },
	show: {
		opacity: 1,
		y: 0,
		transition: { ...spring.chip },
	},
};

const getStatusTone = (index: number) => STATUS_SERIES[index % STATUS_SERIES.length];

const sectionPanelClass =
	"relative rounded-2xl border border-dotori-100/70 bg-dotori-50/40 p-4 shadow-sm ring-1 ring-dotori-100/70 backdrop-blur-md";

export function ExploreSuggestionPanel({
	recentSearches,
	popularSearches,
	onClearRecent,
	onSelectTerm,
}: ExploreSuggestionPanelProps) {
	return (
		<motion.div
			initial="hidden"
			animate="show"
			variants={panelVariants}
			className={cn(
				DS_GLASS.CARD,
				"absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-dotori-100/70 bg-dotori-50/30 p-4 shadow-sm ring-1 ring-dotori-100/70",
			)}
		>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-dotori-200/45 blur-3xl"
			/>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.symbol}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-7 -left-7 h-16 w-16 opacity-[0.08]"
			/>

			{recentSearches.length > 0 ? (
				<motion.section
					initial="hidden"
					animate="show"
					variants={sectionVariants}
					className={cn(sectionPanelClass, "mb-4 border-b border-dotori-100/70 pb-5")}
				>
					<div className="mb-3 flex items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-2">
							<span
								className={cn(
									"inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-white/70",
									DS_STATUS.available.pill,
								)}
							>
								<ClockIcon className="h-4 w-4 text-current" />
							</span>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<Text className="text-label text-dotori-700">최근 검색</Text>
									<Badge color="forest" className="px-1.5 py-0.5 text-caption">
										히스토리
									</Badge>
								</div>
								<Text className="text-caption text-dotori-500">최근 기록으로 빠르게 이동하세요</Text>
							</div>
						</div>
						<motion.div whileTap={{ scale: 0.96 }} transition={spring.chip}>
							<Button
								type="button"
								color="dotori"
								onClick={onClearRecent}
								className="min-h-11 px-3 text-body-sm"
							>
								전체 삭제
							</Button>
						</motion.div>
					</div>
					<motion.div initial="hidden" animate="show" variants={sectionVariants} className="flex flex-wrap gap-2">
						{recentSearches.map((term, index) => {
							const tone = getStatusTone(index);
							return (
								<motion.div key={term} variants={chipVariants} whileTap={{ scale: 0.96 }} transition={spring.chip}>
									<Button
										type="button"
										onClick={() => onSelectTerm(term)}
										plain={true}
										className={cn(
											"inline-flex min-h-11 w-full items-center gap-2 rounded-2xl border bg-white/90 px-3 py-2 text-body-sm shadow-sm ring-1 ring-dotori-100/70 transition-colors duration-150",
											"hover:bg-dotori-50 hover:text-dotori-800 dark:border-dotori-800 dark:bg-dotori-950/80 dark:hover:bg-dotori-900/80 dark:hover:text-dotori-50",
											tone.pill,
											tone.border,
										)}
									>
										<span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
										<ClockIcon className={cn("h-3.5 w-3.5 text-current")} />
										{term}
									</Button>
								</motion.div>
							);
						})}
					</motion.div>
				</motion.section>
			) : null}

			<motion.section initial="hidden" animate="show" variants={sectionVariants} className={sectionPanelClass}>
				<div className="mb-3 flex items-center gap-2">
					<span
						className={cn(
							"inline-flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 ring-white/70",
							DS_STATUS.waiting.pill,
						)}
					>
						<MagnifyingGlassIcon className="h-4 w-4 text-current" />
					</span>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<Text className="text-label text-dotori-700">인기 검색어</Text>
							<Badge color="forest" className="px-1.5 py-0.5 text-caption">
								추천
							</Badge>
						</div>
						<Text className="text-caption text-dotori-500">요즘 많이 찾는 단어</Text>
					</div>
				</div>
				<motion.div initial="hidden" animate="show" variants={sectionVariants} className="flex flex-wrap gap-2">
					{popularSearches.map((term, index) => {
						const tone = getStatusTone(index + recentSearches.length);
						return (
							<motion.div key={term} variants={chipVariants} whileTap={{ scale: 0.96 }} transition={spring.chip}>
								<Button
									type="button"
									plain={true}
									onClick={() => onSelectTerm(term)}
									className={cn(
										"inline-flex min-h-11 w-full items-center gap-2 rounded-2xl border border-dotori-100/70 bg-white/90 px-3 py-2 text-body-sm shadow-sm ring-1 ring-dotori-100/70 transition-colors duration-150",
										"hover:bg-dotori-50 hover:text-dotori-800 dark:border-dotori-800 dark:bg-dotori-950/80 dark:hover:bg-dotori-900 dark:hover:text-dotori-50",
										tone.pill,
										tone.border,
									)}
								>
									<span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
									<MagnifyingGlassIcon className={cn("h-3.5 w-3.5 text-current")} />
									{term}
								</Button>
							</motion.div>
						);
					})}
					</motion.div>
				</motion.section>
			</motion.div>
		);
}
