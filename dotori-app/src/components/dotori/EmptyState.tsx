"use client";

import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "motion/react";

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
		<motion.div className="flex flex-col items-center justify-center px-6 py-10 text-center" {...motionProps}>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.emptyState}
				alt=""
				aria-hidden="true"
				className="mb-4 h-20 w-20 opacity-50"
			/>
			<h3 className="mb-1 text-base font-semibold text-dotori-900">{title}</h3>
			{message && (
				<p className="text-sm text-dotori-900/60 mb-4">{message}</p>
			)}
			{actionLabel && onAction && (
				<button
					type="button"
					onClick={onAction}
					className="rounded-xl bg-dotori-400 px-5 py-2 text-sm font-medium text-white transition-transform active:scale-[0.97]"
				>
					{actionLabel}
				</button>
			)}
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
			className={cn("flex flex-col items-center justify-center px-6 py-10 text-center")}
			{...motionProps}
		>
			{resolvedIcon ? (
				<div className="mb-5 rounded-full bg-dotori-100 p-6 text-dotori-500">
					{resolvedIcon}
				</div>
			) : (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={BRAND.emptyState}
					alt=""
					aria-hidden="true"
					className="mb-4 h-24 w-24"
				/>
			)}
			<h3 className="text-base font-semibold text-dotori-800">{title}</h3>
			{resolvedDescription && (
				<p className="mt-2 max-w-xs text-sm leading-relaxed text-dotori-500">
					{resolvedDescription}
				</p>
			)}
			{actionLabel && (
				<a
					href={actionHref}
					onClick={
						onAction
							? (e) => {
									e.preventDefault();
									onAction();
								}
							: undefined
					}
					className="mt-4 inline-block rounded-3xl bg-dotori-400 px-6 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] hover:bg-dotori-600"
				>
					{actionLabel}
				</a>
			)}
			{secondaryLabel && secondaryHref && (
				<Link
					href={secondaryHref}
					className="mt-3 py-2 text-[14px] text-dotori-500 transition-colors hover:text-dotori-600"
				>
					{secondaryLabel}
				</Link>
			)}
		</motion.div>
	);
}
