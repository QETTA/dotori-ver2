"use client";

import { DsButton } from "@/components/ds/DsButton";
import {
	DOTORI_ERROR_VARIANT_META,
	DOTORI_STATE_MOTION,
	DOTORI_STATE_TOKENS,
	type DotoriErrorStateVariant,
} from "@/components/dotori/EmptyState";
import { Surface } from "@/components/dotori/Surface";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function ErrorState({
	message,
	detail,
	action,
	variant = "default",
}: {
	message: string;
	detail?: string;
	action?: { label: string; onClick: () => void };
	variant?: DotoriErrorStateVariant;
}) {
	const meta = DOTORI_ERROR_VARIANT_META[variant];
	const resolvedDetail = detail ?? meta.fallbackDetail;

	return (
		<motion.div className={DOTORI_STATE_TOKENS.container} {...DOTORI_STATE_MOTION}>
			<Surface className={DOTORI_STATE_TOKENS.surface} tone="muted">
				<span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
				<span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={DOTORI_ERROR_VARIANT_META[variant].illustration}
					alt=""
					aria-hidden="true"
					className={DOTORI_STATE_TOKENS.watermark}
				/>
				<div className={DOTORI_STATE_TOKENS.content}>
					<div className={DOTORI_STATE_TOKENS.mediaWrap}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={meta.illustration}
							alt=""
							aria-hidden="true"
							className={cn(DOTORI_STATE_TOKENS.image, "h-16 w-16")}
						/>
					</div>
					<div className={DOTORI_STATE_TOKENS.copyWrap}>
						<p className={DOTORI_STATE_TOKENS.eyebrow}>{meta.eyebrow}</p>
						<h3 className={DOTORI_STATE_TOKENS.title}>{message}</h3>
						<p className={DOTORI_STATE_TOKENS.description}>{resolvedDetail}</p>
					</div>
					{action ? (
						<DsButton onClick={action.onClick} className={DOTORI_STATE_TOKENS.action}>
							{action.label}
						</DsButton>
					) : null}
				</div>
			</Surface>
		</motion.div>
	);
}
