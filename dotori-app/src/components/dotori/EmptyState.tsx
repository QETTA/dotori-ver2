"use client";

import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/catalyst/button";
import { Surface } from "@/components/dotori/Surface";

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
	const motionProps = {
		initial: { opacity: 0, y: 16 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.4, ease: "easeOut" as const },
	}

	return (
		<motion.div className="px-5 py-8 text-center" {...motionProps}>
			<Surface className="mx-auto flex max-w-sm flex-col items-center gap-3 p-6">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.emptyState}
					alt=""
					aria-hidden="true"
					className="h-20 w-20 opacity-70"
				/>
				<h3 className="text-base font-semibold text-dotori-900 dark:text-dotori-50">{title}</h3>
				{message ? <p className="text-sm text-dotori-600 dark:text-dotori-300">{message}</p> : null}
				{actionLabel && onAction ? (
					<Button color="dotori" onClick={onAction} className="min-h-11">
						{actionLabel}
					</Button>
				) : null}
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
	variant?: "search" | "transfer" | "default";
	description?: string;
	actionLabel?: string;
	actionHref?: string;
	onAction?: () => void;
	secondaryLabel?: string;
	secondaryHref?: string;
}) {
	const resolvedDescription =
		description ??
		(variant === "transfer"
			? "요청하신 이동 조건에 맞는 시설을 찾지 못했습니다. 조건을 조정해 다시 검색해 보세요."
			: undefined)

	const transferIcon = (
		<div className="mb-5 rounded-full bg-forest-100 px-5 py-3 text-2xl text-forest-500">
			↔️
		</div>
	)

	const motionProps = {
		initial: { opacity: 0, y: 16 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.4, ease: "easeOut" as const },
	}

	const resolvedIcon =
		icon ??
		(variant === "transfer"
			? transferIcon
			: null)

	return (
		<motion.div
			className={cn("px-5 py-8 text-center")}
			{...motionProps}
		>
			<Surface className="mx-auto flex max-w-sm flex-col items-center gap-3 p-6">
				{resolvedIcon ? (
					<div className="rounded-full bg-dotori-100 p-5 text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100">
						{resolvedIcon}
					</div>
				) : (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={BRAND.emptyState}
						alt=""
						aria-hidden="true"
						className="h-24 w-24 opacity-80"
					/>
				)}
				<h3 className="text-base font-semibold text-dotori-900 dark:text-dotori-50">{title}</h3>
				{resolvedDescription ? (
					<p className="max-w-xs text-sm leading-relaxed text-dotori-600 dark:text-dotori-300">
						{resolvedDescription}
					</p>
				) : null}
				{actionLabel ? (
					<Button
						color="dotori"
						href={actionHref}
						onClick={onAction}
						className="min-h-11"
					>
						{actionLabel}
					</Button>
				) : null}
				{secondaryLabel && secondaryHref ? (
					<Link
						href={secondaryHref}
						className="text-sm font-medium text-dotori-600 underline decoration-dotori-200 underline-offset-4 transition-colors hover:text-dotori-800 dark:text-dotori-300 dark:decoration-dotori-700 dark:hover:text-dotori-100"
					>
						{secondaryLabel}
					</Link>
				) : null}
			</Surface>
		</motion.div>
	);
}
