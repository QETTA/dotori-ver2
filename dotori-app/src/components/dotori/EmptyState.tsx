"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { DsButton } from "@/components/ds/DsButton";
import { BRAND_GUIDE } from "@/lib/brand-assets";
import { DS_GLASS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/dotori/Surface";
import { fadeUp } from "@/lib/motion";

export const DOTORI_STATE_MOTION = fadeUp;
export type DotoriEmptyStateVariant = "search" | "transfer" | "default";
export type DotoriErrorStateVariant = "default" | "network" | "notfound";

export const DOTORI_STATE_TOKENS = {
	container: "px-5 py-6 text-center",
	surface: cn(
		"relative mx-auto flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-3xl p-6",
		DS_GLASS.CARD,
	),
	accentTop:
		"pointer-events-none absolute inset-x-6 -top-10 h-24 rounded-full bg-dotori-200/40 blur-2xl dark:bg-dotori-700/25",
	accentBottom:
		"pointer-events-none absolute -bottom-10 left-1/2 h-20 w-36 -translate-x-1/2 rounded-full bg-amber-100/55 blur-2xl dark:bg-dotori-800/30",
	watermark:
		"pointer-events-none absolute -right-10 -top-10 h-28 w-28 opacity-[0.07] dark:opacity-[0.12]",
	content: "relative z-10 flex w-full flex-col items-center gap-3",
	mediaWrap:
		"flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-dotori-100 via-dotori-50 to-amber-50 ring-1 ring-dotori-200/70 shadow-[0_14px_28px_-18px_rgba(122,78,48,0.7)] dark:from-dotori-800/80 dark:via-dotori-900/70 dark:to-dotori-900/90 dark:ring-dotori-700/70",
	image: "h-14 w-14 object-contain opacity-90",
	copyWrap: "flex max-w-xs flex-col items-center gap-1.5",
	eyebrow: cn(
		DS_TYPOGRAPHY.label,
		"inline-flex rounded-full bg-dotori-100/80 px-2.5 py-1 font-semibold text-dotori-700 dark:bg-dotori-900/70 dark:text-dotori-200",
	),
	title: cn(DS_TYPOGRAPHY.h3, "font-semibold leading-snug text-dotori-900 dark:text-dotori-50"),
	description: cn(DS_TYPOGRAPHY.bodySm, "leading-relaxed text-dotori-700 dark:text-dotori-200"),
	action: "min-h-11 w-full",
	actions: "flex w-full flex-col gap-2",
	secondaryAction: cn(
		"inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-dotori-200/80 bg-white/70 font-medium text-dotori-700 shadow-sm transition-[background-color,color,transform] duration-200",
		"hover:bg-white hover:text-dotori-900 active:scale-[0.98] dark:border-dotori-700/70 dark:bg-dotori-950/45 dark:text-dotori-200 dark:hover:bg-dotori-950/70 dark:hover:text-dotori-50",
		DS_TYPOGRAPHY.bodySm,
	),
} as const;

export const DOTORI_EMPTY_VARIANT_META: Record<
	DotoriEmptyStateVariant,
	{ eyebrow: string; fallbackDescription: string }
> = {
	default: {
		eyebrow: "도토리 안내",
		fallbackDescription: "표시할 정보가 아직 없어요. 잠시 후 다시 확인해 주세요.",
	},
	search: {
		eyebrow: "검색 결과 없음",
		fallbackDescription: "검색어 또는 조건을 조금 바꾸면 원하는 결과를 더 쉽게 찾을 수 있어요.",
	},
	transfer: {
		eyebrow: "이동 조건 안내",
		fallbackDescription:
			"요청하신 이동 조건에 맞는 시설을 찾지 못했어요. 지역·정렬·필터를 조정해 다시 찾아볼까요?",
	},
} as const;

export const DOTORI_ERROR_VARIANT_META: Record<
	DotoriErrorStateVariant,
	{ eyebrow: string; fallbackDetail: string; illustration: string }
> = {
	default: {
		eyebrow: "일시적 오류",
		fallbackDetail: "잠시 후 다시 시도해 주세요.",
		illustration: BRAND_GUIDE.errorState,
	},
	network: {
		eyebrow: "네트워크 확인 필요",
		fallbackDetail: "인터넷 연결 상태를 확인한 뒤 다시 시도해 주세요.",
		illustration: BRAND_GUIDE.errorState,
	},
	notfound: {
		eyebrow: "페이지를 찾을 수 없음",
		fallbackDetail: "요청하신 페이지를 찾지 못했어요. 경로를 다시 확인해 주세요.",
		illustration: BRAND_GUIDE.emptyState,
	},
} as const;

/* ── Simplified default export (ErrorFallback-style) ── */

interface EmptyStateSimpleProps {
	title?: string;
	message?: string;
	actionLabel?: string;
	onAction?: () => void;
}

export default function EmptyStateFallback({
	title = "아직 데이터가 없어요",
	message,
	actionLabel,
	onAction,
}: EmptyStateSimpleProps) {
	const baseMeta = DOTORI_EMPTY_VARIANT_META.default;
	const resolvedMessage = message ?? baseMeta.fallbackDescription;

	return (
		<motion.div className={DOTORI_STATE_TOKENS.container} {...DOTORI_STATE_MOTION}>
			<Surface className={DOTORI_STATE_TOKENS.surface} tone="muted">
				<span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
				<span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND_GUIDE.watermark}
					alt=""
					aria-hidden="true"
					className={DOTORI_STATE_TOKENS.watermark}
				/>
				<div className={DOTORI_STATE_TOKENS.content}>
					<div className={DOTORI_STATE_TOKENS.mediaWrap}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND_GUIDE.emptyState}
							alt=""
							aria-hidden="true"
							className={DOTORI_STATE_TOKENS.image}
						/>
					</div>
					<div className={DOTORI_STATE_TOKENS.copyWrap}>
						<p className={DOTORI_STATE_TOKENS.eyebrow}>{baseMeta.eyebrow}</p>
						<h3 className={DOTORI_STATE_TOKENS.title}>{title}</h3>
						<p className={DOTORI_STATE_TOKENS.description}>{resolvedMessage}</p>
					</div>
					{actionLabel && onAction ? (
						<DsButton onClick={onAction} className={DOTORI_STATE_TOKENS.action}>
							{actionLabel}
						</DsButton>
					) : null}
				</div>
			</Surface>
		</motion.div>
	);
}

/* ── Full-featured named export (backward-compatible) ── */

export function EmptyState({
	icon,
	title,
	variant = "default",
	description,
	actionLabel,
	actionHref,
	onAction,
	secondaryLabel,
	secondaryHref,
}: {
	icon?: ReactNode;
	title: string;
	variant?: DotoriEmptyStateVariant;
	description?: string;
	actionLabel?: string;
	actionHref?: string;
	onAction?: () => void;
	secondaryLabel?: string;
	secondaryHref?: string;
}) {
	const variantMeta = DOTORI_EMPTY_VARIANT_META[variant];
	const resolvedDescription = description ?? variantMeta.fallbackDescription;

	const transferIcon = (
		<span className="inline-flex items-center gap-1.5 text-dotori-700 dark:text-dotori-100" aria-hidden="true">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={BRAND_GUIDE.inApp} alt="" aria-hidden="true" className="h-4 w-4 opacity-80" />
			<span className={cn(DS_TYPOGRAPHY.caption, "font-semibold")}>↔</span>
		</span>
	);

	const resolvedIcon = icon ?? (variant === "transfer" ? transferIcon : null);

	return (
		<motion.div className={DOTORI_STATE_TOKENS.container} {...DOTORI_STATE_MOTION}>
			<Surface className={DOTORI_STATE_TOKENS.surface} tone="muted">
				<span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
				<span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND_GUIDE.watermark}
					alt=""
					aria-hidden="true"
					className={DOTORI_STATE_TOKENS.watermark}
				/>
				<div className={DOTORI_STATE_TOKENS.content}>
					<div
						className={cn(
							DOTORI_STATE_TOKENS.mediaWrap,
							resolvedIcon ? "text-2xl text-dotori-700 dark:text-dotori-100" : undefined,
						)}
					>
						{resolvedIcon ? (
							resolvedIcon
						) : (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={BRAND_GUIDE.emptyState}
								alt=""
								aria-hidden="true"
								className={DOTORI_STATE_TOKENS.image}
							/>
						)}
					</div>
					<div className={DOTORI_STATE_TOKENS.copyWrap}>
						<p className={DOTORI_STATE_TOKENS.eyebrow}>{variantMeta.eyebrow}</p>
						<h3 className={DOTORI_STATE_TOKENS.title}>{title}</h3>
						{resolvedDescription ? (
							<p className={DOTORI_STATE_TOKENS.description}>{resolvedDescription}</p>
						) : null}
					</div>
					{actionLabel || (secondaryLabel && secondaryHref) ? (
						<div className={DOTORI_STATE_TOKENS.actions}>
							{actionLabel ? (
								actionHref ? (
									<DsButton
										href={actionHref}
										onClick={onAction}
										className={DOTORI_STATE_TOKENS.action}
									>
										{actionLabel}
									</DsButton>
								) : (
									<DsButton onClick={onAction} className={DOTORI_STATE_TOKENS.action}>
										{actionLabel}
									</DsButton>
								)
							) : null}
							{secondaryLabel && secondaryHref ? (
								<Link href={secondaryHref} className={DOTORI_STATE_TOKENS.secondaryAction}>
									{secondaryLabel}
								</Link>
							) : null}
						</div>
					) : null}
				</div>
			</Surface>
		</motion.div>
	);
}
