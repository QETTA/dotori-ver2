"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DsButton } from "@/components/ds/DsButton";
import { BRAND } from "@/lib/brand-assets";
import { copy as COPY } from "@/lib/brand-copy";
import { NoiseTexture } from "@/components/dotori/NoiseTexture";
import { fadeUp, stagger, tap } from "@/lib/motion";
import { DS_STATUS, DS_TYPOGRAPHY, DS_GLASS, DS_TEXT, DS_SHADOW } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import type { UiBlock as UiBlockType, UiBlockItem, UiBlockTone } from "@/types/dotori";

/* ── Constants ── */
const UI_BLOCK_EMPTY_COPY = {
	eyebrow: COPY.emptyState.default.eyebrow,
	title: "보여드릴 UI 블록이 아직 없어요.",
	description: COPY.emptyState.default.description,
} as const;

const DEFAULT_TITLE = "추천 UI 블록";
const DEFAULT_SUBTITLE = "필요한 화면을 바로 실행해보세요";
const DEFAULT_CTA = "블록 열기";

/* ── V2 Tone Maps ── */
const TONE_ACCENT: Record<UiBlockTone, string> = {
	dotori: "from-dotori-500 via-amber-400 to-dotori-400",
	forest: "from-forest-500 via-forest-400 to-forest-500",
	amber: "from-amber-500 via-amber-400 to-amber-500",
	neutral: "from-zinc-400 via-zinc-300 to-zinc-400",
};

const TONE_RING: Record<UiBlockTone, string> = {
	dotori: "ring-dotori-100/70 dark:ring-dotori-800/60",
	forest: "ring-forest-100/70 dark:ring-forest-800/60",
	amber: "ring-amber-100/70 dark:ring-amber-800/60",
	neutral: "ring-zinc-200/70 dark:ring-zinc-700/60",
};

const TONE_DOT: Record<UiBlockTone, string> = {
	dotori: DS_STATUS.available.dot,
	forest: DS_STATUS.available.dot,
	amber: "bg-amber-500",
	neutral: "bg-zinc-400 dark:bg-zinc-500",
};

const TONE_BADGE: Record<UiBlockTone, string> = {
	dotori: DS_STATUS.available.pill,
	forest: "bg-forest-50 text-forest-700 dark:bg-forest-950/30 dark:text-forest-400",
	amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
	neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400",
};

/* ── V2 Variant → section padding ── */
const VARIANT_SECTION_CLASS = {
	default: "p-4",
	hero: "p-5",
	panel: "p-4",
	strip: "px-4 py-3",
} as const;

/* ── V2 Density → item spacing ── */
const DENSITY_ITEM_GAP = {
	default: "gap-2.5",
	compact: "gap-1.5",
	spacious: "gap-3.5",
} as const;

const DENSITY_ITEM_PADDING = {
	default: "p-3",
	compact: "px-3 py-2",
	spacious: "p-4",
} as const;

/* ── Helpers ── */
function resolveActionLabel(actionLabel?: string) {
	const trimmed = actionLabel?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_CTA;
}

function isExternalHref(href: string) {
	return /^(https?:)?\/\//i.test(href);
}

function isDirectAnchor(href: string) {
	return /^mailto:|^tel:/i.test(href);
}

/* ── Action Link (shared) ── */
function ActionLink({
	href,
	label,
	ariaLabel,
	tone,
}: {
	href: string;
	label: string;
	ariaLabel: string;
	tone: UiBlockTone;
}) {
	const cls = cn(
		"inline-flex min-h-11 items-center justify-center rounded-xl px-3 font-semibold transition-all duration-150",
		DS_TYPOGRAPHY.bodySm,
		DS_TEXT.secondary,
		TONE_RING[tone],
		"ring-1 bg-white hover:bg-dotori-50 dark:bg-dotori-900/60 dark:hover:bg-dotori-900/80",
	);

	if (isExternalHref(href)) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={cls}>
				{label}
			</a>
		);
	}
	if (isDirectAnchor(href)) {
		return (
			<a href={href} aria-label={ariaLabel} className={cls}>
				{label}
			</a>
		);
	}
	return (
		<Link href={href} aria-label={ariaLabel} className={cls}>
			{label}
		</Link>
	);
}

/* ── Item Renderer ── */
function UiBlockItemCard({
	item,
	tone,
	density,
	ctaMode,
	onAction,
}: {
	item: UiBlockItem;
	tone: UiBlockTone;
	density: "default" | "compact" | "spacious";
	ctaMode: "inline" | "footer" | "hidden";
	onAction?: (actionId: string) => void;
}) {
	const actionLabel = resolveActionLabel(item.actionLabel);
	const ariaLabel = `${item.title} ${actionLabel}`;
	const itemTone = item.tone ?? tone;

	return (
		<article className={cn(
			"rounded-2xl ring-1",
			DENSITY_ITEM_PADDING[density],
			TONE_RING[itemTone],
			DS_GLASS.nav, DS_GLASS.dark.nav,
			DS_SHADOW.sm,
		)}>
			<div className={density === "compact" ? "space-y-1" : "space-y-1.5"}>
				{item.badge ? (
					<span className={cn(
						DS_TYPOGRAPHY.caption,
						"inline-flex items-center gap-1 rounded-full px-2 py-0.5",
						TONE_BADGE[itemTone],
					)}>
						<span className={cn("size-1.5 rounded-full", TONE_DOT[itemTone])} />
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
				{item.meta ? (
					<p className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>
						{item.meta}
					</p>
				) : null}
			</div>

			{ctaMode === "inline" && (item.href || item.actionId) ? (
				<div className="mt-3">
					{item.href ? (
						<ActionLink href={item.href} label={actionLabel} ariaLabel={ariaLabel} tone={itemTone} />
					) : (
						<motion.div {...tap.button} className="inline-flex">
							<DsButton
								variant="primary"
								tone="dotori"
								disabled={!item.actionId}
								onClick={() => { if (item.actionId) onAction?.(item.actionId); }}
								aria-label={ariaLabel}
								className="w-auto px-3 font-semibold"
							>
								{actionLabel}
							</DsButton>
						</motion.div>
					)}
				</div>
			) : null}
		</article>
	);
}

/* ── Main Component ── */
export const UiBlock = memo(function UiBlock({
	block,
	onAction,
}: {
	block: UiBlockType;
	onAction?: (actionId: string) => void;
}) {
	const title = block.title.trim().length > 0 ? block.title : DEFAULT_TITLE;
	const subtitle = block.subtitle && block.subtitle.trim().length > 0 ? block.subtitle : DEFAULT_SUBTITLE;

	// V2 defaults (backward-compatible)
	const variant = block.variant ?? "default";
	const tone: UiBlockTone = block.tone ?? "dotori";
	const density = block.density ?? "default";
	const ctaMode = block.ctaMode ?? "inline";
	const accentStyle = block.accentStyle ?? "bar";

	const sectionClass = cn(
		"relative overflow-hidden rounded-2xl ring-1",
		VARIANT_SECTION_CLASS[variant],
		TONE_RING[tone],
		DS_GLASS.card, DS_GLASS.dark.card,
	);

	/* ── Empty state ── */
	if (block.items.length === 0) {
		return (
			<motion.section {...fadeUp} className={sectionClass}>
				<NoiseTexture />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.emptyState}
					alt=""
					aria-hidden="true"
					className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]"
				/>
				<div className="mb-2 flex items-center gap-2">
					<span className={cn("size-1.5 rounded-full", DS_STATUS.waiting.dot)} aria-hidden="true" />
					<p className={cn(DS_TYPOGRAPHY.bodySm, DS_TEXT.muted)}>{UI_BLOCK_EMPTY_COPY.eyebrow}</p>
				</div>
				<p className={cn(DS_TYPOGRAPHY.body, DS_TEXT.primary)}>{UI_BLOCK_EMPTY_COPY.title}</p>
				<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-1", DS_TEXT.muted)}>{UI_BLOCK_EMPTY_COPY.description}</p>
			</motion.section>
		);
	}

	/* ── Items layout ── */
	const gap = DENSITY_ITEM_GAP[density];
	const listClass = block.layout === "list"
		? cn("mt-3 space-y-2.5", density === "compact" && "space-y-1.5", density === "spacious" && "space-y-3.5")
		: cn("mt-3 grid grid-cols-1 sm:grid-cols-2", gap);

	return (
		<motion.section {...fadeUp} className={sectionClass}>
			<NoiseTexture />
			{/* Accent bar */}
			{accentStyle === "bar" ? (
				<div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", TONE_ACCENT[tone])} />
			) : null}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.07]"
			/>

			<header className={cn("pb-3", accentStyle === "bar" && "pt-1", TONE_RING[tone].split(" ")[0] && "border-b border-dotori-100/70")}>
				<div className="flex items-center gap-2">
					<span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} aria-hidden="true" />
					<h3 className={cn(
						variant === "hero" ? DS_TYPOGRAPHY.h2 : DS_TYPOGRAPHY.h3,
						"font-semibold",
						DS_TEXT.primary,
					)}>
						{title}
					</h3>
				</div>
				<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-1", DS_TEXT.muted)}>{subtitle}</p>
			</header>

			<motion.ul {...stagger.fast.container} className={listClass}>
				{block.items.map((item) => (
					<motion.li key={item.id} {...stagger.fast.item}>
						<UiBlockItemCard
							item={item}
							tone={tone}
							density={density}
							ctaMode={ctaMode}
							onAction={onAction}
						/>
					</motion.li>
				))}
			</motion.ul>

			{/* Footer CTA mode — grouped CTAs at bottom */}
			{ctaMode === "footer" && block.items.some((i) => i.href || i.actionId) ? (
				<div className="mt-4 flex flex-wrap gap-2 border-t border-dotori-100/70 pt-3 dark:border-dotori-800/60">
					{block.items.filter((i) => i.href || i.actionId).map((item) => {
						const label = resolveActionLabel(item.actionLabel);
						if (item.href) {
							return <ActionLink key={item.id} href={item.href} label={label} ariaLabel={`${item.title} ${label}`} tone={tone} />;
						}
						return (
							<motion.div key={item.id} {...tap.button} className="inline-flex">
								<DsButton
									variant="primary"
									tone="dotori"
									disabled={!item.actionId}
									onClick={() => { if (item.actionId) onAction?.(item.actionId); }}
									aria-label={`${item.title} ${label}`}
									className="w-auto px-3 font-semibold"
								>
									{label}
								</DsButton>
							</motion.div>
						);
					})}
				</div>
			) : null}
		</motion.section>
	);
});
