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
import type {
	UiBlock as UiBlockType,
	UiBlockCtaMode,
	UiBlockDensity,
	UiBlockItem,
	UiBlockTone,
	UiBlockVariant,
} from "@/types/dotori";

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

const TONE_GLOW: Record<UiBlockTone, string> = {
	dotori: "from-dotori-300/70 via-amber-200/45 to-transparent",
	forest: "from-forest-300/70 via-forest-200/35 to-transparent",
	amber: "from-amber-300/70 via-amber-200/35 to-transparent",
	neutral: "from-zinc-300/70 via-zinc-200/35 to-transparent",
};

const TONE_DOT: Record<UiBlockTone, string> = {
	dotori: DS_STATUS.available.dot,
	forest: DS_STATUS.available.dot,
	amber: "bg-amber-500",
	neutral: "bg-zinc-400 dark:bg-zinc-500",
};

const BADGE_PILL_CLASS = DS_STATUS.available.pill;
const BADGE_DOT_CLASS = DS_STATUS.available.dot;

/* ── V2 Variant → section padding ── */
const VARIANT_SECTION_CLASS: Record<UiBlockVariant, string> = {
	default: "p-4",
	hero: "p-6 sm:p-7",
	panel: "p-5 sm:p-6",
	strip: "px-4 py-4",
};

const VARIANT_MIN_HEIGHT_CLASS: Record<UiBlockVariant, string> = {
	default: "min-h-[16rem]",
	hero: "min-h-[24rem]",
	panel: "min-h-[19rem]",
	strip: "min-h-[15rem]",
};

const VARIANT_SHADOW_CLASS: Record<UiBlockVariant, string> = {
	default: DS_SHADOW.md,
	hero: DS_SHADOW.xl,
	panel: DS_SHADOW.lg,
	strip: DS_SHADOW.md,
};

const VARIANT_DARK_SHADOW_CLASS: Record<UiBlockVariant, string> = {
	default: DS_SHADOW.dark.md,
	hero: DS_SHADOW.dark.xl,
	panel: DS_SHADOW.dark.lg,
	strip: DS_SHADOW.dark.md,
};

const VARIANT_MEDIA_HEIGHT_CLASS: Record<UiBlockVariant, string> = {
	default: "h-36 sm:h-40",
	hero: "h-48 sm:h-56",
	panel: "h-40 sm:h-44",
	strip: "h-28 sm:h-32",
};

/* ── V2 Density → item spacing ── */
const DENSITY_ITEM_GAP: Record<UiBlockDensity, string> = {
	default: "gap-2.5",
	compact: "gap-1.5",
	spacious: "gap-3.5",
};

const DENSITY_ITEM_PADDING: Record<UiBlockDensity, string> = {
	default: "p-3",
	compact: "px-3 py-2",
	spacious: "p-4",
};

type UiBlockMediaSlot = {
	src: string;
	alt?: string;
	fit?: "cover" | "contain";
};

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

function asRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function resolveMediaSlot(block: UiBlockType): UiBlockMediaSlot | null {
	const raw = block as UiBlockType & {
		media?: unknown;
		mediaSrc?: unknown;
		mediaAlt?: unknown;
		mediaFit?: unknown;
	};

	const mediaAsString = asNonEmptyString(raw.media);
	if (mediaAsString) {
		return { src: mediaAsString, alt: "", fit: "cover" };
	}

	const mediaRecord = asRecord(raw.media);
	if (mediaRecord) {
		const srcCandidate = asNonEmptyString(mediaRecord.src) ?? asNonEmptyString(mediaRecord.url);
		if (srcCandidate) {
			return {
				src: srcCandidate,
				alt: typeof mediaRecord.alt === "string" ? mediaRecord.alt : "",
				fit: mediaRecord.fit === "contain" ? "contain" : "cover",
			};
		}
	}

	const mediaSrc = asNonEmptyString(raw.mediaSrc);
	if (mediaSrc) {
		return {
			src: mediaSrc,
			alt: typeof raw.mediaAlt === "string" ? raw.mediaAlt : "",
			fit: raw.mediaFit === "contain" ? "contain" : "cover",
		};
	}

	return null;
}

/* ── Action Link (shared) ── */
function ActionLink({
	href,
	label,
	ariaLabel,
}: {
	href: string;
	label: string;
	ariaLabel: string;
}) {
	const cls = cn(
		"inline-flex min-h-11 items-center justify-center rounded-xl px-3.5 font-semibold transition-all duration-150",
		DS_TYPOGRAPHY.bodySm,
		"ring-1 ring-dotori-200/80 bg-dotori-50/75 text-dotori-800 hover:bg-dotori-100 dark:ring-dotori-700/70 dark:bg-dotori-900/65 dark:text-dotori-100 dark:hover:bg-dotori-900",
		DS_SHADOW.sm,
		DS_SHADOW.dark.sm,
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
	variant,
	formLike,
	isFeatured,
	ctaMode,
	onAction,
}: {
	item: UiBlockItem;
	tone: UiBlockTone;
	density: UiBlockDensity;
	variant: UiBlockVariant;
	formLike: boolean;
	isFeatured: boolean;
	ctaMode: UiBlockCtaMode;
	onAction?: (actionId: string) => void;
}) {
	const actionLabel = resolveActionLabel(item.actionLabel);
	const ariaLabel = `${item.title} ${actionLabel}`;
	const itemTone = item.tone ?? tone;

	return (
		<article className={cn(
			"group/card relative overflow-hidden rounded-2xl ring-1 transition-transform duration-200",
			DENSITY_ITEM_PADDING[density],
			TONE_RING[itemTone],
			variant === "hero" && "rounded-3xl",
			variant === "panel" && "rounded-3xl",
			formLike && "bg-dotori-50/70 dark:bg-dotori-900/45",
			DS_GLASS.nav,
			DS_GLASS.dark.nav,
			DS_SHADOW.sm,
			DS_SHADOW.dark.sm,
		)}>
			<div className={cn("pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-r opacity-65", TONE_ACCENT[itemTone])} />
			<div className={cn("relative", density === "compact" ? "space-y-1.5" : "space-y-2")}>
				{item.badge ? (
					<span className={cn(
						DS_TYPOGRAPHY.caption,
						"inline-flex items-center gap-1 rounded-full px-2 py-0.5",
						BADGE_PILL_CLASS,
					)}>
						<span className={cn("size-1.5 rounded-full", BADGE_DOT_CLASS)} />
						{item.badge}
					</span>
				) : null}
				<p className={cn(
					density === "compact" ? DS_TYPOGRAPHY.bodySm : DS_TYPOGRAPHY.body,
					"font-semibold tracking-tight",
					variant === "hero" && isFeatured ? DS_TEXT.gradientHero : DS_TEXT.primary,
				)}>
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
				<div className={cn(
					"mt-3 flex flex-wrap gap-2",
					formLike && "border-t border-dotori-100/70 pt-3 dark:border-dotori-800/60",
				)}>
					{item.href ? (
						<ActionLink href={item.href} label={actionLabel} ariaLabel={ariaLabel} />
					) : (
						<motion.div {...tap.button} className="inline-flex">
							<DsButton
								variant="primary"
								tone="dotori"
								disabled={!item.actionId}
								onClick={() => { if (item.actionId) onAction?.(item.actionId); }}
								aria-label={ariaLabel}
								className="w-auto px-3.5 font-semibold"
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
	const variant: UiBlockVariant = block.variant ?? "default";
	const tone: UiBlockTone = block.tone ?? "dotori";
	const density: UiBlockDensity = block.density ?? "default";
	const ctaMode: UiBlockCtaMode = block.ctaMode ?? "inline";
	const accentStyle = block.accentStyle ?? "bar";
	const hasActionableItems = block.items.some((item) => item.href || item.actionId);
	const formLike = block.layout === "list" && ctaMode !== "hidden" && hasActionableItems;
	const mediaSlot = resolveMediaSlot(block);

	const sectionClass = cn(
		"relative isolate overflow-hidden rounded-3xl ring-1",
		VARIANT_SECTION_CLASS[variant],
		VARIANT_MIN_HEIGHT_CLASS[variant],
		TONE_RING[tone],
		DS_GLASS.card,
		DS_GLASS.dark.card,
		VARIANT_SHADOW_CLASS[variant],
		VARIANT_DARK_SHADOW_CLASS[variant],
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
					className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 opacity-[0.1]"
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
		? cn(
			"relative z-10 mt-4 space-y-2.5",
			density === "compact" && "space-y-1.5",
			density === "spacious" && "space-y-3.5",
			variant === "strip" && "space-y-2",
		)
		: cn(
			"relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-2",
			gap,
			variant === "hero" && "gap-3.5",
			variant === "strip" && "lg:grid-cols-3",
		);

	return (
		<motion.section {...fadeUp} className={sectionClass}>
			<NoiseTexture />
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/65 via-transparent to-transparent dark:from-dotori-900/45" />
			<motion.div
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute -top-20 -right-12 h-52 w-52 rounded-full bg-gradient-to-br blur-3xl",
					TONE_GLOW[tone],
					variant === "hero" ? "opacity-85" : "opacity-65",
				)}
				animate={{ scale: [1, 1.05, 1], x: [0, 6, 0], y: [0, -4, 0] }}
				transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
			/>
			{/* Accent bar */}
			{accentStyle === "bar" ? (
				<div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", TONE_ACCENT[tone])} />
			) : null}
			{accentStyle === "glow" ? (
				<motion.div
					aria-hidden="true"
					className={cn(
						"pointer-events-none absolute inset-x-12 top-0 h-2 rounded-b-full bg-gradient-to-r opacity-85 blur-sm",
						TONE_ACCENT[tone],
					)}
					animate={{ opacity: [0.45, 0.95, 0.45] }}
					transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
				/>
			) : null}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute -top-8 -right-8 opacity-[0.1]",
					variant === "hero" ? "h-28 w-28" : "h-24 w-24",
				)}
			/>

			<header className={cn(
				"relative z-10 border-b border-dotori-100/70 pb-4 dark:border-dotori-800/60",
				accentStyle === "bar" && "pt-1",
				variant === "hero" && "pb-5",
				variant === "strip" && "pb-3",
			)}>
				<div className="flex items-center gap-2.5">
					<span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} aria-hidden="true" />
					<p className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>빠른 실행 블록</p>
				</div>
				<h3 className={cn(
					variant === "hero" ? DS_TYPOGRAPHY.h2 : DS_TYPOGRAPHY.h3,
					"mt-1 font-semibold tracking-tight",
					variant === "hero" ? DS_TEXT.gradientHero : DS_TEXT.primary,
				)}>
					{title}
				</h3>
				<p className={cn(
					variant === "hero" ? DS_TYPOGRAPHY.body : DS_TYPOGRAPHY.bodySm,
					"mt-1",
					DS_TEXT.secondary,
				)}>
					{subtitle}
				</p>
				<div className="mt-2 flex flex-wrap gap-2">
					<span className={cn(
						DS_TYPOGRAPHY.caption,
						"inline-flex items-center gap-1 rounded-full px-2 py-0.5",
						BADGE_PILL_CLASS,
					)}>
						<span className={cn("size-1.5 rounded-full", BADGE_DOT_CLASS)} />
						{block.items.length}개 추천
					</span>
					{formLike ? (
						<span className={cn(
							DS_TYPOGRAPHY.caption,
							"inline-flex items-center rounded-full bg-dotori-100 px-2 py-0.5 text-dotori-800 dark:bg-dotori-800 dark:text-dotori-100",
						)}>
							입력형 빠른 실행
						</span>
					) : null}
				</div>
			</header>

			{mediaSlot ? (
				<motion.figure {...fadeUp} className={cn(
					"relative z-10 mt-4 overflow-hidden rounded-2xl ring-1 ring-dotori-200/70 dark:ring-dotori-700/60",
					VARIANT_MEDIA_HEIGHT_CLASS[variant],
					DS_GLASS.nav,
					DS_GLASS.dark.nav,
					DS_SHADOW.sm,
					DS_SHADOW.dark.sm,
				)}>
					<div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-tr opacity-25", TONE_ACCENT[tone])} />
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={mediaSlot.src}
						alt={mediaSlot.alt ?? ""}
						aria-hidden={mediaSlot.alt ? undefined : true}
						className={cn(
							"relative h-full w-full",
							mediaSlot.fit === "contain" ? "object-contain p-3" : "object-cover",
						)}
					/>
				</motion.figure>
			) : null}

			<motion.ul {...stagger.fast.container} className={listClass}>
				{block.items.map((item, index) => (
					<motion.li
						key={item.id}
						{...stagger.fast.item}
						className={cn(
							variant === "hero" && block.layout !== "list" && index === 0 && "sm:col-span-2",
						)}
					>
						<UiBlockItemCard
							item={item}
							tone={tone}
							density={density}
							variant={variant}
							formLike={formLike}
							isFeatured={variant === "hero" && index === 0}
							ctaMode={ctaMode}
							onAction={onAction}
						/>
					</motion.li>
				))}
			</motion.ul>

			{/* Footer CTA mode — grouped CTAs at bottom */}
			{ctaMode === "footer" && hasActionableItems ? (
				<div className={cn(
					"relative z-10 mt-5 flex flex-wrap gap-2 border-t border-dotori-100/70 pt-4 dark:border-dotori-800/60",
					formLike && "rounded-2xl bg-dotori-50/50 px-3 pb-3 dark:bg-dotori-900/45",
				)}>
					{block.items.filter((i) => i.href || i.actionId).map((item) => {
						const label = resolveActionLabel(item.actionLabel);
						if (item.href) {
							return <ActionLink key={item.id} href={item.href} label={label} ariaLabel={`${item.title} ${label}`} />;
						}
						return (
							<motion.div key={item.id} {...tap.button} className="inline-flex">
								<DsButton
									variant="primary"
									tone="dotori"
									disabled={!item.actionId}
									onClick={() => { if (item.actionId) onAction?.(item.actionId); }}
									aria-label={`${item.title} ${label}`}
									className="w-auto px-3.5 font-semibold"
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
