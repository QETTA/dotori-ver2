"use client";

import type { TextBlock as TextBlockType } from "@/types/dotori";
import { motion } from "motion/react";
import { BRAND } from "@/lib/brand-assets";
import { copy as COPY } from "@/lib/brand-copy";
import { fadeUp, stagger } from "@/lib/motion";
import { DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from "@/lib/utils";

const TEXT_BLOCK_FALLBACK = COPY.chat.panelDescription;
const TEXT_BLOCK_TITLE = COPY.chat.panelTitle;
const TEXT_BLOCK_FRAME = "relative overflow-hidden border-b border-dotori-100/70";
const TEXT_BLOCK_HEADER = "mb-3 flex items-center gap-2 border-b border-dotori-100/70 pb-3";
const TEXT_BLOCK_HEADER_TITLE = "font-semibold text-dotori-700 dark:text-dotori-100";
const TEXT_BLOCK_CONTENT = "relative z-10";

export function TextBlock({ block }: { block: TextBlockType }) {
	const normalizedContent =
		block.content.trim().length > 0 ? block.content : TEXT_BLOCK_FALLBACK;
	const paragraphs = normalizedContent
		.split(/\n+/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
	const content = paragraphs.length > 0 ? paragraphs : [TEXT_BLOCK_FALLBACK];

	return (
		<motion.section
			{...fadeUp}
			className={cn(
				'glass-card',
				'mt-2 rounded-2xl bg-dotori-50/80 p-4 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60',
				TEXT_BLOCK_FRAME,
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className={'pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]'}
			/>
			<div className={TEXT_BLOCK_HEADER}>
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
				<p className={cn(DS_TYPOGRAPHY.bodySm, TEXT_BLOCK_HEADER_TITLE)}>
					{TEXT_BLOCK_TITLE}
				</p>
			</div>
			<motion.div
				{...stagger.fast.container}
				className={cn('space-y-2.5 text-body leading-relaxed text-dotori-800 dark:text-dotori-100', DS_TYPOGRAPHY.body, TEXT_BLOCK_CONTENT)}
			>
				{content.map((paragraph, index) => (
					<motion.p key={`${paragraph}-${index}`} {...stagger.fast.item} className={DS_TYPOGRAPHY.body}>
						{paragraph}
					</motion.p>
				))}
			</motion.div>
		</motion.section>
	);
}
