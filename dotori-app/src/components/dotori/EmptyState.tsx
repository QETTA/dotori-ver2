"use client";

import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
	return (
		<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.emptyState}
				alt=""
				className="w-28 h-28 mb-6 opacity-50"
			/>
			<h3 className="text-base font-semibold text-dotori-900 mb-1">{title}</h3>
			{message && (
				<p className="text-sm text-dotori-900/60 mb-4">{message}</p>
			)}
			{actionLabel && onAction && (
				<button
					type="button"
					onClick={onAction}
					className="px-5 py-2 bg-dotori-400 text-white text-sm font-medium rounded-xl active:scale-[0.97] transition-transform"
				>
					{actionLabel}
				</button>
			)}
		</div>
	);
}

/* ── Full-featured named export (backward-compatible) ── */

export function EmptyState({
	icon,
	title,
	description,
	actionLabel,
	actionHref,
	onAction,
	secondaryLabel,
	secondaryHref,
}: {
	icon?: ReactNode;
	title: string;
	description?: string;
	actionLabel?: string;
	actionHref?: string;
	onAction?: () => void;
	secondaryLabel?: string;
	secondaryHref?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center px-6 py-16 text-center",
				"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-300"
			)}
		>
			{icon ? (
				<div className="mb-5 rounded-full bg-dotori-100 p-6 text-dotori-500">
					{icon}
				</div>
			) : (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={BRAND.emptyState} alt="" className="mb-5 h-36 w-36" />
			)}
			<h3 className="text-lg font-semibold text-dotori-800">{title}</h3>
			{description && (
				<p className="mt-2 max-w-xs text-[15px] leading-relaxed text-dotori-500">
					{description}
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
					className="mt-5 inline-block rounded-3xl bg-dotori-400 px-7 py-4 text-[15px] font-bold text-white transition-all active:scale-[0.98] hover:bg-dotori-600"
				>
					{actionLabel}
				</a>
			)}
			{secondaryLabel && secondaryHref && (
				<Link
					href={secondaryHref}
					className="mt-3 py-2 text-[14px] text-dotori-400 transition-colors hover:text-dotori-600"
				>
					{secondaryLabel}
				</Link>
			)}
		</div>
	);
}
