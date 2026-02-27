"use client";

import { motion } from "motion/react";
import { MapEmbed } from "@/components/dotori/MapEmbed";
import { BRAND } from "@/lib/brand-assets";
import { fadeUp, stagger } from "@/lib/motion";
import { DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from "@/lib/utils";
import type { MapBlock as MapBlockType } from "@/types/dotori";

const MAP_BLOCK_FRAME = "relative overflow-hidden border-b border-dotori-100/70";
const MAP_BLOCK_HEADER = "mb-3 flex items-center justify-between gap-2 border-b border-dotori-100/70 pb-3";
const MAP_BLOCK_COUNT = "text-dotori-500 dark:text-dotori-300";
const MAP_BLOCK_STATUS_ROW = "mb-3 flex flex-wrap gap-1.5 border-b border-dotori-100/70 pb-3";
const MAP_BLOCK_MAP_FRAME = "ring-1 ring-dotori-100/70 dark:ring-dotori-800/60";

export function MapBlock({ block }: { block: MapBlockType }) {
	const statusCounts: Record<keyof typeof DS_STATUS, number> = {
		available: 0,
		waiting: 0,
		full: 0,
	};

	for (const marker of block.markers) {
		statusCounts[marker.status] += 1;
	}

	const statusOrder: Array<keyof typeof DS_STATUS> = ["available", "waiting", "full"];

	return (
		<motion.section
			{...fadeUp}
			className={cn(
				'glass-card',
				'mt-2 rounded-2xl bg-dotori-50/80 p-4 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60',
				MAP_BLOCK_FRAME,
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className={'pointer-events-none absolute top-2 right-2 h-10 w-10 opacity-[0.16]'}
			/>
			<div className={MAP_BLOCK_HEADER}>
				<div className={'flex items-center gap-2'}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.symbol}
						alt=""
						aria-hidden="true"
						className={'h-3 w-3 rounded-full border border-white/70 bg-white object-contain dark:border-dotori-700/40 dark:bg-dotori-950'}
					/>
					<h3 className={cn(DS_TYPOGRAPHY.h3, 'font-semibold text-dotori-900 dark:text-dotori-50')}>
						주변 시설 지도
					</h3>
				</div>
				<span className={cn(DS_TYPOGRAPHY.caption, MAP_BLOCK_COUNT)}>
					총 {block.markers.length}곳
				</span>
			</div>
			<motion.div className={MAP_BLOCK_STATUS_ROW} {...stagger.fast.container}>
				{statusOrder.map((status) => (
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
				))}
			</motion.div>
			<div className={cn('overflow-hidden rounded-xl', MAP_BLOCK_MAP_FRAME)}>
				<MapEmbed facilities={block.markers} center={block.center} />
			</div>
		</motion.section>
	);
}
