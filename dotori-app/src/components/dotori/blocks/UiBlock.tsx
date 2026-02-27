"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DsButton } from "@/components/ds/DsButton";
import { BRAND } from "@/lib/brand-assets";
import { copy as COPY } from "@/lib/brand-copy";
import { fadeUp, stagger, tap } from "@/lib/motion";
import { DS_STATUS, DS_TYPOGRAPHY, DS_GLASS, DS_TEXT, DS_SHADOW } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import type { UiBlock as UiBlockType } from "@/types/dotori";

const UI_BLOCK_EMPTY_COPY = {
	eyebrow: COPY.emptyState.default.eyebrow,
	title: "보여드릴 UI 블록이 아직 없어요.",
	description: COPY.emptyState.default.description,
} as const;

const UI_BLOCK_DEFAULT_TITLE = "추천 UI 블록";
const UI_BLOCK_DEFAULT_SUBTITLE = "필요한 화면을 바로 실행해보세요";
const UI_BLOCK_DEFAULT_CTA = "블록 열기";

/** Shared glass-card surface */
const GLASS_SECTION = cn(
	'relative overflow-hidden rounded-2xl border-b border-dotori-100/70 p-4 ring-1 ring-dotori-100/70',
	DS_GLASS.card, DS_GLASS.dark.card,
);

/** Shared action link style */
const ACTION_LINK_CLASS =
	"inline-flex min-h-11 items-center justify-center rounded-xl border border-dotori-200/90 bg-white px-3 text-body-sm font-semibold transition-all duration-150 hover:bg-dotori-50 dark:border-dotori-700/80 dark:bg-dotori-900/60 dark:hover:bg-dotori-900/80";

function resolveActionLabel(actionLabel?: string) {
	const trimmed = actionLabel?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : UI_BLOCK_DEFAULT_CTA;
}

function isHttpExternalHref(href: string) {
	return /^(https?:)?\/\//i.test(href);
}

function isDirectAnchorHref(href: string) {
	return /^mailto:|^tel:/i.test(href);
}

export const UiBlock = memo(function UiBlock({
	block,
	onAction,
}: {
	block: UiBlockType;
	onAction?: (actionId: string) => void;
}) {
	const title = block.title.trim().length > 0 ? block.title : UI_BLOCK_DEFAULT_TITLE;
	const subtitle =
		block.subtitle && block.subtitle.trim().length > 0
			? block.subtitle
			: UI_BLOCK_DEFAULT_SUBTITLE;

	if (block.items.length === 0) {
		return (
			<motion.section
				{...fadeUp}
				className={GLASS_SECTION}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.emptyState}
					alt=""
					aria-hidden="true"
					className={"pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]"}
				/>
				<div className={"mb-2 flex items-center gap-2"}>
					<span
						className={cn("size-1.5 rounded-full", DS_STATUS.waiting.dot)}
						aria-hidden="true"
					/>
					<p className={cn(DS_TYPOGRAPHY.bodySm, DS_TEXT.muted)}>
						{UI_BLOCK_EMPTY_COPY.eyebrow}
					</p>
				</div>
				<p className={cn(DS_TYPOGRAPHY.body, DS_TEXT.primary)}>
					{UI_BLOCK_EMPTY_COPY.title}
				</p>
				<p
					className={cn(
						DS_TYPOGRAPHY.bodySm,
						"mt-1",
						DS_TEXT.muted,
					)}
				>
					{UI_BLOCK_EMPTY_COPY.description}
				</p>
			</motion.section>
		);
	}

	const listClass =
		block.layout === "list"
			? "mt-3 space-y-2.5"
			: "mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2";

	return (
		<motion.section
			{...fadeUp}
			className={GLASS_SECTION}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className={"pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]"}
			/>

			<header className={"border-b border-dotori-100/70 pb-3"}>
				<div className={"flex items-center gap-2"}>
					<span
						className={cn("size-1.5 rounded-full", DS_STATUS.available.dot)}
						aria-hidden="true"
					/>
					<h3 className={cn(DS_TYPOGRAPHY.h3, "font-semibold", DS_TEXT.primary)}>
						{title}
					</h3>
				</div>
				<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-1", DS_TEXT.muted)}>
					{subtitle}
				</p>
			</header>

			<motion.ul {...stagger.fast.container} className={listClass}>
				{block.items.map((item) => {
					const actionLabel = resolveActionLabel(item.actionLabel);
					const actionAriaLabel = `${item.title} ${actionLabel}`;

					return (
						<motion.li key={item.id} {...stagger.fast.item}>
							<article className={cn("rounded-2xl p-3 ring-1 ring-dotori-100/70 dark:ring-dotori-800/60", DS_GLASS.nav, DS_GLASS.dark.nav, DS_SHADOW.sm)}>
								<div className={"space-y-1.5"}>
									{item.badge ? (
										<span
											className={cn(
												DS_TYPOGRAPHY.caption,
												"inline-flex items-center gap-1 rounded-full px-2 py-0.5",
												DS_STATUS.available.pill,
											)}
										>
											<span className={cn("size-1.5 rounded-full", DS_STATUS.available.dot)} />
											{item.badge}
										</span>
									) : null}
									<p className={cn(DS_TYPOGRAPHY.body, "font-semibold", DS_TEXT.primary)}>
										{item.title}
									</p>
									{item.description ? (
										<p className={cn(DS_TYPOGRAPHY.bodySm, DS_TEXT.secondary)}>
											{item.description}
										</p>
									) : null}
								</div>

								<div className={"mt-3"}>
									{item.href ? (
										isHttpExternalHref(item.href) ? (
											<a
												href={item.href}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={actionAriaLabel}
												className={cn(ACTION_LINK_CLASS, DS_TEXT.secondary)}
											>
												{actionLabel}
											</a>
										) : isDirectAnchorHref(item.href) ? (
											<a
												href={item.href}
												aria-label={actionAriaLabel}
												className={cn(ACTION_LINK_CLASS, DS_TEXT.secondary)}
											>
												{actionLabel}
											</a>
										) : (
											<Link
												href={item.href}
												aria-label={actionAriaLabel}
												className={cn(ACTION_LINK_CLASS, DS_TEXT.secondary)}
											>
												{actionLabel}
											</Link>
										)
									) : (
										<motion.div {...tap.button} className={"inline-flex"}>
											<DsButton
												variant="primary"
												tone="dotori"
												disabled={!item.actionId}
												onClick={() => {
													if (item.actionId) onAction?.(item.actionId);
												}}
												aria-label={actionAriaLabel}
												className={"w-auto px-3 text-body-sm font-semibold"}
											>
												{actionLabel}
											</DsButton>
										</motion.div>
									)}
								</div>
							</article>
						</motion.li>
					);
				})}
			</motion.ul>
		</motion.section>
	);
});
