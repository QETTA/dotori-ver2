"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { BRAND } from "@/lib/brand-assets";
import { DS_GLASS, DS_STATUS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/dotori/Surface";

export type DotoriEmptyStateVariant = "search" | "transfer" | "default";
export type DotoriErrorStateVariant = "default" | "network" | "notfound";

export const DOTORI_STATE_MOTION = {
	initial: "hidden" as const,
	animate: "show" as const,
	variants: {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: { staggerChildren: 0.06 },
		},
	},
} as const;

export const DOTORI_STATE_ITEM_MOTION = {
	variants: {
		hidden: { opacity: 0, y: 12 },
		show: {
			opacity: 1,
			y: 0,
			transition: spring.card,
		},
	},
} as const;

export const DOTORI_EMPTY_VARIANT_STATUS = {
	default: "available",
	search: "waiting",
	transfer: "full",
} as const satisfies Record<DotoriEmptyStateVariant, keyof typeof DS_STATUS>;

export const DOTORI_ERROR_VARIANT_STATUS = {
	default: "available",
	network: "waiting",
	notfound: "full",
} as const satisfies Record<DotoriErrorStateVariant, keyof typeof DS_STATUS>;

export const DOTORI_STATE_TOKENS = {
	container: "px-4 py-7 text-center sm:px-5",
	surface: cn(
		"relative isolate mx-auto flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-3xl border-b border-dotori-100/70 bg-dotori-50/90 p-6 shadow-sm ring-1 ring-dotori-100/70",
		DS_GLASS.CARD,
	),
	accentTop: cn(
		"pointer-events-none absolute inset-x-6 -top-10 h-24 rounded-full blur-2xl",
		"bg-dotori-200/45 dark:bg-dotori-700/25",
	),
	accentBottom: cn(
		"pointer-events-none absolute -bottom-10 left-1/2 h-20 w-36 -translate-x-1/2 rounded-full blur-2xl",
		"bg-dotori-100/55 dark:bg-dotori-800/30",
	),
	watermark:
		"pointer-events-none absolute -right-10 -top-10 h-28 w-28 opacity-[0.08] dark:opacity-[0.12]",
	content: "relative z-10 flex w-full flex-col gap-4",
	mediaWrap: "w-full border-b border-dotori-100/70 pb-4",
	mediaFrame: cn(
		"mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.4rem]",
		"bg-gradient-to-br from-dotori-100 via-dotori-50 to-dotori-50",
		"ring-1 ring-dotori-200/70 shadow-[0_14px_28px_-18px_rgba(122,78,48,0.7)] dark:from-dotori-800/80 dark:via-dotori-900/70 dark:to-dotori-900/90 dark:ring-dotori-700/70",
	),
	image: "h-14 w-14 object-contain opacity-90",
	copyWrap: "w-full border-b border-dotori-100/70 pb-4",
	badge: cn(
		DS_TYPOGRAPHY.bodySm,
		"inline-flex items-center gap-2 rounded-full border border-dotori-100/70 bg-dotori-100/75 px-2.5 py-1 font-semibold text-dotori-700 dark:border-dotori-800/70 dark:bg-dotori-900/70 dark:text-dotori-200",
	),
	title: cn(DS_TYPOGRAPHY.h3, "font-semibold leading-snug text-dotori-900 dark:text-dotori-50"),
	description: cn(DS_TYPOGRAPHY.bodySm, "leading-relaxed text-dotori-700 dark:text-dotori-200"),
	actions: "mt-2 flex w-full flex-col gap-2.5",
	action: cn("min-h-11 w-full", DS_TYPOGRAPHY.bodySm),
	secondaryAction: cn("min-h-11 w-full rounded-xl", DS_TYPOGRAPHY.bodySm),
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
		illustration: BRAND.errorState,
	},
	network: {
		eyebrow: "네트워크 확인 필요",
		fallbackDetail: "인터넷 연결 상태를 확인한 뒤 다시 시도해 주세요.",
		illustration: BRAND.errorState,
	},
	notfound: {
		eyebrow: "페이지를 찾을 수 없음",
		fallbackDetail: "요청하신 페이지를 찾지 못했어요. 경로를 다시 확인해 주세요.",
		illustration: BRAND.emptyState,
	},
} as const;

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
	const statusTone = DOTORI_EMPTY_VARIANT_STATUS.default;

	return (
		<motion.section className={DOTORI_STATE_TOKENS.container} {...DOTORI_STATE_MOTION}>
			<Surface className={DOTORI_STATE_TOKENS.surface} tone="muted">
				<span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
				<span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.watermark}
					alt=""
					aria-hidden="true"
					className={DOTORI_STATE_TOKENS.watermark}
				/>
				<div className={DOTORI_STATE_TOKENS.content}>
					<motion.div className={DOTORI_STATE_TOKENS.mediaWrap} variants={DOTORI_STATE_ITEM_MOTION.variants}>
						<div className={DOTORI_STATE_TOKENS.mediaFrame}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={BRAND.emptyState}
								alt=""
								aria-hidden="true"
								className={DOTORI_STATE_TOKENS.image}
							/>
						</div>
					</motion.div>
					<motion.div className={DOTORI_STATE_TOKENS.copyWrap} variants={DOTORI_STATE_ITEM_MOTION.variants}>
						<motion.div variants={DOTORI_STATE_ITEM_MOTION.variants}>
							<Badge color="forest" className={DOTORI_STATE_TOKENS.badge}>
								<span
									className={cn("inline-block h-2 w-2 rounded-full", DS_STATUS[statusTone].dot)}
									aria-hidden="true"
								/>
								{baseMeta.eyebrow}
							</Badge>
						</motion.div>
						<motion.h3 variants={DOTORI_STATE_ITEM_MOTION.variants} className={DOTORI_STATE_TOKENS.title}>
							{title}
						</motion.h3>
						<motion.p variants={DOTORI_STATE_ITEM_MOTION.variants} className={DOTORI_STATE_TOKENS.description}>
							{resolvedMessage}
						</motion.p>
					</motion.div>
					{actionLabel && onAction ? (
						<motion.div className={DOTORI_STATE_TOKENS.actions} variants={DOTORI_STATE_ITEM_MOTION.variants}>
							<motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
								<Button color="dotori" onClick={onAction} className={DOTORI_STATE_TOKENS.action}>
									{actionLabel}
								</Button>
							</motion.div>
						</motion.div>
					) : null}
				</div>
			</Surface>
		</motion.section>
	);
}

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
	const statusTone = DOTORI_EMPTY_VARIANT_STATUS[variant];

	const transferIcon = (
		<span className="inline-flex items-center gap-1.5 text-dotori-700 dark:text-dotori-100" aria-hidden="true">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={BRAND.symbol} alt="" aria-hidden="true" className="h-4 w-4 opacity-80" />
			<span className={cn(DS_TYPOGRAPHY.caption, "font-semibold")}>↔</span>
		</span>
	);

	const resolvedIcon = icon ?? (variant === "transfer" ? transferIcon : null);

	return (
		<motion.section className={DOTORI_STATE_TOKENS.container} {...DOTORI_STATE_MOTION}>
			<Surface className={DOTORI_STATE_TOKENS.surface} tone="muted">
				<span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
				<span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.watermark}
					alt=""
					aria-hidden="true"
					className={DOTORI_STATE_TOKENS.watermark}
				/>
				<div className={DOTORI_STATE_TOKENS.content}>
					<motion.div className={DOTORI_STATE_TOKENS.mediaWrap} variants={DOTORI_STATE_ITEM_MOTION.variants}>
						<div
							className={cn(
								DOTORI_STATE_TOKENS.mediaFrame,
								resolvedIcon ? "text-2xl text-dotori-700 dark:text-dotori-100" : undefined,
							)}
						>
							{resolvedIcon ? (
								resolvedIcon
							) : (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img
									src={BRAND.emptyState}
									alt=""
									aria-hidden="true"
									className={DOTORI_STATE_TOKENS.image}
								/>
							)}
						</div>
					</motion.div>
					<motion.div className={DOTORI_STATE_TOKENS.copyWrap} variants={DOTORI_STATE_ITEM_MOTION.variants}>
						<motion.div variants={DOTORI_STATE_ITEM_MOTION.variants}>
							<Badge color="forest" className={DOTORI_STATE_TOKENS.badge}>
								<span
									className={cn("inline-block h-2 w-2 rounded-full", DS_STATUS[statusTone].dot)}
									aria-hidden="true"
								/>
								{variantMeta.eyebrow}
							</Badge>
						</motion.div>
						<motion.h3 variants={DOTORI_STATE_ITEM_MOTION.variants} className={DOTORI_STATE_TOKENS.title}>
							{title}
						</motion.h3>
						{resolvedDescription ? (
							<motion.p variants={DOTORI_STATE_ITEM_MOTION.variants} className={DOTORI_STATE_TOKENS.description}>
								{resolvedDescription}
							</motion.p>
						) : null}
					</motion.div>
					{actionLabel || (secondaryLabel && secondaryHref) ? (
						<motion.div className={DOTORI_STATE_TOKENS.actions} variants={DOTORI_STATE_ITEM_MOTION.variants}>
							{actionLabel ? (
								<motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
									{actionHref ? (
										<Button
											color="dotori"
											href={actionHref}
											onClick={onAction}
											className={DOTORI_STATE_TOKENS.action}
										>
											{actionLabel}
										</Button>
									) : (
										<Button
											color="dotori"
											onClick={onAction}
											className={DOTORI_STATE_TOKENS.action}
										>
											{actionLabel}
										</Button>
									)}
								</motion.div>
							) : null}
							{secondaryLabel && secondaryHref ? (
								<motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
									<Button
										outline
										href={secondaryHref}
										className={DOTORI_STATE_TOKENS.secondaryAction}
									>
										{secondaryLabel}
									</Button>
								</motion.div>
							) : null}
						</motion.div>
					) : null}
				</div>
			</Surface>
		</motion.section>
	);
}
