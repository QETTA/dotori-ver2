"use client";

import dynamic from "next/dynamic";
import { BRAND } from "@/lib/brand-assets";
import { copy as COPY } from "@/lib/brand-copy";
import type { CompareBlock as CompareBlockType } from "@/types/dotori";
import { motion } from "motion/react";
import { fadeUp } from "@/lib/motion";
import { DS_STATUS } from '@/lib/design-system/tokens'
import { cn } from "@/lib/utils";

const CompareTable = dynamic(
	() =>
		import("@/components/dotori/CompareTable").then((m) => m.CompareTable),
	{ loading: () => null },
);

const COMPARE_EMPTY_DEFAULT_COPY = {
	eyebrow: COPY.emptyState.default.eyebrow,
	title: "비교할 시설이 아직 없어요.",
	description: COPY.emptyState.default.description,
} as const;
const COMPARE_EMPTY_CENTER = "justify-center";
const COMPARE_EMPTY_FRAME = "relative overflow-hidden";

export function CompareBlock({ block }: { block: CompareBlockType }) {
	return (
		<motion.div
			{...fadeUp}
			className={cn('glass-card', 'mt-2 overflow-hidden rounded-2xl bg-dotori-50/80 p-4 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60 dark:[&_.text-dotori-500]:text-dotori-300 dark:[&_.text-dotori-600]:text-dotori-300 dark:[&_.text-dotori-700]:text-dotori-200')}
		>
			{block.facilities.length === 0 ? (
				<div className={cn('py-4 text-center', COMPARE_EMPTY_FRAME)}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.watermark}
						alt=""
						aria-hidden="true"
						className={'pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]'}
					/>
					<div
						className={cn(
							'flex items-center gap-2',
							COMPARE_EMPTY_CENTER,
						)}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.symbol}
							alt=""
							aria-hidden="true"
							className={'h-3 w-3 rounded-full border border-white/70 bg-white object-contain dark:border-dotori-700/40 dark:bg-dotori-950'}
						/>
						<span
							className={cn('size-1.5 rounded-full', DS_STATUS.waiting.dot)}
							aria-hidden="true"
						/>
						<span className={'text-body-sm font-medium text-dotori-500 dark:text-dotori-300'}>
							{COMPARE_EMPTY_DEFAULT_COPY.eyebrow}
						</span>
					</div>
					<p className={'text-body font-medium text-dotori-800 dark:text-dotori-100'}>
						{COMPARE_EMPTY_DEFAULT_COPY.title}
					</p>
					<p className={'mt-1 text-body-sm text-dotori-500 dark:text-dotori-300'}>
						{COMPARE_EMPTY_DEFAULT_COPY.description}
					</p>
				</div>
			) : (
				<CompareTable facilities={block.facilities} highlightBest />
			)}
		</motion.div>
	);
}
