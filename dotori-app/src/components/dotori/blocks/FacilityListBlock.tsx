"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { ToBadge } from "@/components/dotori/ToBadge";
import { BRAND } from "@/lib/brand-assets";
import { copy as COPY } from "@/lib/brand-copy";
import { fadeUp, stagger, tap } from "@/lib/motion";
import { DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from "@/lib/utils";
import type { FacilityListBlock as FacilityListBlockType } from "@/types/dotori";

const FACILITY_LIST_EMPTY_FRAME = "relative overflow-hidden border-b border-dotori-100/70";
const FACILITY_LIST_EMPTY_HEADER = "mb-2";
const FACILITY_LIST_FILLED_FRAME = "relative overflow-hidden border-b border-dotori-100/70";
const FACILITY_LIST_HEADER = "mb-3 flex items-center justify-between gap-2 border-b border-dotori-100/70 pb-3";
const FACILITY_LIST_COUNT = "text-dotori-500 dark:text-dotori-300";
const FACILITY_LIST_STATUS_ROW = "mb-3 flex flex-wrap gap-1.5";
const FACILITY_LIST_STACK_FRAME = "border-b border-dotori-100/70 pb-1";
const FACILITY_LIST_LINK_TOUCH = "min-h-11";

const FACILITY_LIST_EMPTY_COPY = {
	eyebrow: COPY.emptyState.search.eyebrow,
	title: "조건에 맞는 시설이 아직 없어요.",
	description: COPY.emptyState.search.description,
} as const;

export const FacilityListBlock = memo(function FacilityListBlock({
	block,
}: {
	block: FacilityListBlockType;
}) {
	const statusCounts: Record<keyof typeof DS_STATUS, number> = {
		available: 0,
		waiting: 0,
		full: 0,
	};

	for (const facility of block.facilities) {
		statusCounts[facility.status] += 1;
	}

	const statusOrder: Array<keyof typeof DS_STATUS> = ["available", "waiting", "full"];

	if (block.facilities.length === 0) {
		return (
			<motion.div
				{...fadeUp}
				className={cn(
					'glass-card',
					'mt-2 rounded-2xl bg-dotori-50/80 p-4 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60',
					FACILITY_LIST_EMPTY_FRAME,
				)}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.emptyState}
					alt=""
					aria-hidden="true"
					className={'pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]'}
				/>
				<div className={cn('flex items-center gap-2', FACILITY_LIST_EMPTY_HEADER)}>
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
					<span className={cn('mt-1 text-body-sm text-dotori-500 dark:text-dotori-300', DS_TYPOGRAPHY.bodySm)}>
						{FACILITY_LIST_EMPTY_COPY.eyebrow}
					</span>
				</div>
				<p className={cn('text-body font-medium text-dotori-800 dark:text-dotori-100', DS_TYPOGRAPHY.body)}>
					{FACILITY_LIST_EMPTY_COPY.title}
				</p>
				<p className={cn('mt-1 text-body-sm text-dotori-500 dark:text-dotori-300', DS_TYPOGRAPHY.bodySm)}>
					{FACILITY_LIST_EMPTY_COPY.description}
				</p>
			</motion.div>
		);
	}

	return (
		<motion.section
			{...fadeUp}
			className={cn(
				'glass-card',
				'mt-2 rounded-2xl bg-dotori-50/80 p-4 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60',
				FACILITY_LIST_FILLED_FRAME,
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className={'pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]'}
			/>
			<div className={FACILITY_LIST_HEADER}>
				<div className={'flex items-center gap-2'}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.symbol}
						alt=""
						aria-hidden="true"
						className={'h-3 w-3 rounded-full border border-white/70 bg-white object-contain dark:border-dotori-700/40 dark:bg-dotori-950'}
					/>
					<span
						className={cn('size-1.5 rounded-full', DS_STATUS.available.dot)}
						aria-hidden="true"
					/>
					<h3 className={cn(DS_TYPOGRAPHY.h3, 'font-semibold text-dotori-900 dark:text-dotori-50')}>
						추천 시설 목록
					</h3>
				</div>
				<span className={cn(DS_TYPOGRAPHY.caption, FACILITY_LIST_COUNT)}>
					총 {block.facilities.length}곳
				</span>
			</div>
			<motion.div className={FACILITY_LIST_STATUS_ROW} {...stagger.fast.container}>
				{statusOrder.map((status) =>
					statusCounts[status] > 0 ? (
						<motion.span
							key={status}
							{...stagger.fast.item}
							className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-label font-semibold', DS_STATUS[status].pill)}
						>
							<span
								className={cn('size-2 rounded-full', DS_STATUS[status].dot)}
								aria-hidden="true"
							/>
							{DS_STATUS[status].label} {statusCounts[status]}
						</motion.span>
					) : null,
				)}
			</motion.div>
			<motion.ul
				{...stagger.fast.container}
				className={cn('mt-2 space-y-3', FACILITY_LIST_STACK_FRAME)}
			>
				{block.facilities.map((f) => (
					<motion.li key={f.id} {...stagger.fast.item}>
						<Link
							href={`/facility/${f.id}`}
							className={cn('block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-dotori-500/40 dark:focus-visible:ring-offset-dotori-950', FACILITY_LIST_LINK_TOUCH)}
							aria-label={`${f.name} 상세 보기`}
						>
							<FacilityCard facility={f} compact />
						</Link>
						{/* Inline actions + ToBadge */}
						<div className="mt-1.5 flex items-center justify-between px-1">
							<ToBadge
								status={f.status}
								vacancy={Math.max(0, f.capacity.total - f.capacity.current)}
								compact
							/>
							<div className="flex items-center gap-2">
								<motion.button
									type="button"
									{...tap.chip}
									className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-dotori-500 transition-colors hover:bg-dotori-50 hover:text-dotori-700 dark:hover:bg-dotori-900/40 dark:hover:text-dotori-300"
									aria-label={`${f.name} 관심 등록`}
								>
									<Heart className="h-3.5 w-3.5" />
									관심
								</motion.button>
								<Link
									href={`/facility/${f.id}`}
									className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-dotori-500 transition-colors hover:bg-dotori-50 hover:text-dotori-700 dark:hover:bg-dotori-900/40 dark:hover:text-dotori-300"
								>
									상세보기 →
								</Link>
							</div>
						</div>
					</motion.li>
				))}
			</motion.ul>
		</motion.section>
	);
});
