"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import {
	DOTORI_STATE_TOKENS,
	DOTORI_STATE_ITEM_MOTION,
	DOTORI_STATE_MOTION,
	DOTORI_STATE_META,
	type DotoriErrorStateVariant,
} from "@/components/dotori/EmptyState";
import { Surface } from "@/components/dotori/Surface";
import { DS_STATUS } from "@/lib/design-system/tokens";
import { tap } from "@/lib/motion";
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
	const meta = DOTORI_STATE_META.error[variant];
	const resolvedDetail = detail ?? meta.detail;
	const statusTone = meta.tone;

	return (
		<motion.section className={DOTORI_STATE_TOKENS.container} {...DOTORI_STATE_MOTION}>
			<Surface className={DOTORI_STATE_TOKENS.surface} tone="muted">
				<span className={DOTORI_STATE_TOKENS.accentTop} aria-hidden="true" />
				<span className={DOTORI_STATE_TOKENS.accentBottom} aria-hidden="true" />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={meta.media}
					alt=""
					aria-hidden="true"
					className={DOTORI_STATE_TOKENS.watermark}
				/>
				<div className={DOTORI_STATE_TOKENS.content}>
					<motion.div className={DOTORI_STATE_TOKENS.mediaWrap} variants={DOTORI_STATE_ITEM_MOTION.variants}>
						<div className={DOTORI_STATE_TOKENS.mediaFrame}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={meta.media}
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
								{meta.eyebrow}
							</Badge>
						</motion.div>
						<motion.h3 variants={DOTORI_STATE_ITEM_MOTION.variants} className={DOTORI_STATE_TOKENS.title}>
							{message}
						</motion.h3>
						<motion.p variants={DOTORI_STATE_ITEM_MOTION.variants} className={DOTORI_STATE_TOKENS.description}>
							{resolvedDetail}
						</motion.p>
					</motion.div>
					{action ? (
						<motion.div className={DOTORI_STATE_TOKENS.actions} variants={DOTORI_STATE_ITEM_MOTION.variants}>
							<motion.div whileTap={tap.button.whileTap} transition={tap.button.transition}>
								<Button color="dotori" onClick={action.onClick} className={DOTORI_STATE_TOKENS.action}>
									{action.label}
								</Button>
							</motion.div>
						</motion.div>
					) : null}
				</div>
			</Surface>
		</motion.section>
	);
}
