"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/catalyst/badge";
import { DsButton } from "@/components/ds/DsButton";
import { DsProgressBar } from "@/components/ds/DsProgressBar";
import { BRAND } from "@/lib/brand-assets";
import { spring, tap } from "@/lib/motion";
import { DS_STATUS, DS_TYPOGRAPHY, DS_TEXT, DS_SHADOW } from "@/lib/design-system/tokens";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ActionType, Facility, SourceInfo } from "@/types/dotori";
import { SourceChip } from "./SourceChip";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const statusMeta = DS_STATUS;

const cardReveal = {
	hidden: { opacity: 0, y: 12 },
	show: {
		opacity: 1,
		y: 0,
		transition: { ...spring.card, delayChildren: 0.02, staggerChildren: 0.06 },
	},
};

const cardRevealItem = {
	hidden: { opacity: 0, y: 8 },
	show: { opacity: 1, y: 0, transition: spring.card },
};

const CLS = {
	article: cn(
		'relative overflow-hidden rounded-2xl',
		DS_SHADOW.lg, DS_SHADOW.dark.lg,
		'ring-1 ring-dotori-300/50',
		'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.20),0_16px_40px_rgba(176,122,74,0.20)]',
		'dark:ring-dotori-700/60',
	),
	inner: cn(
		'relative overflow-hidden rounded-2xl',
		'border border-dotori-200/60 bg-white ring-1 ring-dotori-200/70',
		'shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.08)]',
		'before:pointer-events-none before:absolute before:inset-px before:rounded-[15px] before:ring-1 before:ring-inset before:ring-white/60',
		'dark:bg-dotori-900 dark:border-dotori-700/60 dark:ring-dotori-700/50 dark:shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.3)]',
		'dark:before:ring-white/[0.04]',
	),
	sectionBorder: 'border-b border-dotori-100/70 dark:border-dotori-800/50',
	statsGrid: cn(
		'grid grid-cols-3 gap-2 rounded-xl p-2.5 text-center',
		'bg-gradient-to-br from-dotori-50/80 via-dotori-50/40 to-transparent',
		'ring-1 ring-dotori-100/70',
		'dark:from-dotori-900/60 dark:via-dotori-900/30 dark:to-transparent dark:ring-dotori-800/60',
	),
	statValue: cn(DS_TYPOGRAPHY.h3, 'font-semibold', DS_TEXT.primary),
	statLabel: cn(DS_TYPOGRAPHY.caption, 'font-medium', DS_TEXT.secondary),
	pill: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-label font-semibold',
	progressTrack: 'h-1.5 overflow-hidden rounded-full bg-dotori-100 dark:bg-dotori-900/70',
} as const;

export const FacilityCard = memo(function FacilityCard({
	facility,
	sources,
	onAction,
	compact = false,
}: {
	facility: Facility;
	sources?: SourceInfo[];
	onAction?: (action: ActionType, facilityId: string) => void;
	compact?: boolean;
}) {
	const availableSeats = Math.max(0, facility.capacity.total - facility.capacity.current);
	const status = statusMeta[facility.status] ?? statusMeta.waiting;
	const occupancyRate = facility.capacity.total > 0
		? Math.min(100, Math.round((facility.capacity.current / facility.capacity.total) * 100))
		: 0;
	const hasRecentUpdate = useMemo(() => {
		const lastSyncedAtTime = new Date(facility.lastSyncedAt).getTime();
		return (
			Number.isFinite(lastSyncedAtTime) &&
			// eslint-disable-next-line react-hooks/purity -- UI hint depends on current time.
			Date.now() - lastSyncedAtTime <= ONE_WEEK_MS
		);
	}, [facility.lastSyncedAt]);
	const availabilityText =
		facility.status === "waiting" ? `${status.label} ${facility.capacity.waiting}` : status.label;
	const isActionAvailable = facility.status !== "full";
	const currentOccupancyTone =
		occupancyRate >= 100 ? "danger" : occupancyRate >= 85 ? "warning" : "forest";

	if (compact) {
		return (
			<motion.article
				{...tap.card}
				variants={cardReveal}
				initial="hidden"
				animate="show"
				className={cn(
					'relative overflow-hidden rounded-2xl',
					'shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.18),0_6px_20px_rgba(176,122,74,0.14)] ring-1 ring-dotori-300/50',
					'transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.20),0_16px_36px_rgba(176,122,74,0.20)]',
					'dark:shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.4),0_6px_20px_rgba(0,0,0,0.4)] dark:ring-dotori-700/60',
					status.border,
				)}
			>
				<div
					className={cn(CLS.inner, 'p-3')}
					aria-label={facility.name}
					role="article"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.watermark}
						alt=""
						aria-hidden="true"
						width={128}
						height={128}
						className="pointer-events-none absolute -right-4 -top-3 h-20 w-20 opacity-10 md:right-1 md:top-1 md:h-24 md:w-24"
					/>

					<motion.div variants={cardRevealItem} className="relative space-y-3">
						{facility.isPremium ? (
							<div className="absolute right-1.5 top-1.5 z-10">
								<Badge color="forest">파트너</Badge>
							</div>
						) : null}

					<section className={cn(CLS.sectionBorder, 'pb-3')}>
						<div className="flex items-start justify-between gap-2.5">
							<div className="min-w-0">
								<div className="flex items-start gap-2">
									<span
										className={cn(
											'mt-1.5 h-2 w-2 shrink-0 rounded-full',
											status.dot,
										)}
										aria-hidden="true"
									/>
									<div className="min-w-0">
										<p className={cn(DS_TYPOGRAPHY.h3, 'truncate font-semibold text-dotori-900 dark:text-dotori-50')}>
											{facility.name}
										</p>
										<p className={cn(DS_TYPOGRAPHY.bodySm, 'mt-1 line-clamp-2 text-dotori-500 dark:text-dotori-300')}>
											{facility.address || facility.type}
										</p>
									</div>
								</div>
								<div className="mt-2 flex flex-wrap items-center gap-1.5">
									<Badge color="forest">{facility.type}</Badge>
									{facility.distance ? (
										<span className={cn(DS_TYPOGRAPHY.caption, 'font-medium text-dotori-700 dark:text-dotori-200')}>
											{facility.distance}
										</span>
									) : null}
									{hasRecentUpdate ? <Badge color="forest">최근 업데이트</Badge> : null}
								</div>
							</div>

							<div className="font-medium text-dotori-700 dark:text-dotori-200">
								<span className={cn(CLS.pill, status.pill)}>
									{availabilityText}
								</span>
								{facility.status === "available" ? (
									<p className="mt-1 text-body-sm font-semibold text-forest-700 dark:text-forest-200">
										빈자리 {availableSeats}석
									</p>
								) : null}
							</div>
						</div>
						<p className={cn(DS_TYPOGRAPHY.caption, 'mt-2 text-dotori-500 dark:text-dotori-300')} suppressHydrationWarning>
							{formatRelativeTime(facility.lastSyncedAt)}
						</p>
					</section>

					<section className={cn(CLS.sectionBorder, 'py-3')}>
						<div className="mb-1 flex items-center justify-between">
							<p className={cn(DS_TYPOGRAPHY.label, 'font-semibold uppercase tracking-wide text-dotori-500 dark:text-dotori-300')}>
								정원 현황
							</p>
							<p className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-700 dark:text-dotori-100')}>
								{occupancyRate}%
							</p>
						</div>
						<DsProgressBar
							trackClassName={CLS.progressTrack}
							tone={currentOccupancyTone}
							value={occupancyRate}
							animated
						/>
					</section>

					<section>
						<div className={cn(
							'grid grid-cols-3 gap-2 rounded-xl p-2.5 text-center',
							'bg-gradient-to-br from-dotori-50/80 via-dotori-50/40 to-transparent',
							'ring-1 ring-dotori-100/70',
							'dark:from-dotori-900/60 dark:via-dotori-900/30 dark:to-transparent dark:ring-dotori-800/60',
						)}>
							<div>
								<p className={CLS.statValue}>{facility.capacity.total}</p>
								<p className={CLS.statLabel}>정원</p>
							</div>
							<div>
								<p
									className={cn(
										'font-semibold text-dotori-900 dark:text-dotori-50',
										facility.capacity.current >= facility.capacity.total
											? 'text-danger'
											: 'font-medium text-dotori-600 dark:text-dotori-300',
									)}
								>
									{facility.capacity.current}
								</p>
								<p className={CLS.statLabel}>현원</p>
							</div>
							<div>
								<p
									className={cn(
										'font-semibold text-dotori-900 dark:text-dotori-50',
										facility.capacity.waiting > 0
											? 'text-warning'
											: 'font-medium text-dotori-600 dark:text-dotori-300',
									)}
								>
									{facility.capacity.waiting}
								</p>
								<p className={CLS.statLabel}>대기</p>
							</div>
						</div>

						{facility.status === "available" ? (
							<div className={cn(DS_TYPOGRAPHY.caption, 'mt-2 text-dotori-700 dark:text-dotori-100')}>
								빈자리 있음
							</div>
						) : null}

						<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
							<div className="flex flex-wrap gap-1">
								{sources ? sources.map((s, i) => <SourceChip key={`${s.source}-${i}`} {...s} />) : null}
							</div>

							{onAction ? (
								<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
									<motion.div {...tap.button}>
										<DsButton
											variant="ghost"
											type="button"
											tone="dotori"
											onClick={() => onAction("register_interest", facility.id)}
											className="min-h-10 w-full text-label font-medium text-dotori-700 dark:text-dotori-200"
											aria-label="관심 시설 추가/제거"
										>
											관심
										</DsButton>
									</motion.div>
									{isActionAvailable ? (
										<motion.div {...tap.button}>
											<DsButton
												type="button"
												tone="dotori"
												onClick={() => onAction("apply_waiting", facility.id)}
												className="min-h-10 w-full text-label"
												aria-label="대기 신청"
											>
												{facility.status === "available" ? "입소신청" : "대기신청"}
											</DsButton>
										</motion.div>
									) : null}
								</div>
							) : null}
						</div>
					</section>
				</motion.div>
			</div>
		</motion.article>
		);
	}

	return (
		<motion.article
			{...tap.card}
			variants={cardReveal}
			initial="hidden"
			animate="show"
			className={cn(CLS.article, status.border)}
		>
			<div
				className={CLS.inner}
				aria-label={facility.name}
				role="article"
			>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.watermark}
						alt=""
						aria-hidden="true"
						width={160}
						height={160}
						className="pointer-events-none absolute -right-6 top-2 h-28 w-28 opacity-10 md:h-32 md:w-32"
					/>

				{facility.isPremium ? (
					<div className="absolute right-4 top-4 z-10">
						<Badge color="forest">파트너</Badge>
					</div>
				) : null}

	<motion.section variants={cardRevealItem} className={cn(CLS.sectionBorder, 'px-4 pb-3 pt-4')}>
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<div className="flex items-start gap-2">
								<span
									className={cn(
										'h-2 w-2 rounded-full',
										status.dot,
									)}
									aria-hidden="true"
								/>
								<p className="truncate font-semibold text-dotori-900 dark:text-dotori-50">
									{facility.name}
								</p>
							</div>
							<p className={cn(DS_TYPOGRAPHY.bodySm, 'mt-1 line-clamp-2 text-dotori-500 dark:text-dotori-300')}>
								{facility.address}
							</p>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<Badge color="forest">{facility.type}</Badge>
								{facility.distance ? (
									<span className={cn(DS_TYPOGRAPHY.caption, 'font-medium text-dotori-700 dark:text-dotori-200')}>
										{facility.distance}
									</span>
								) : null}
								{hasRecentUpdate ? <Badge color="forest">최근 업데이트</Badge> : null}
							</div>
						</div>

						<div className="font-medium text-dotori-700 dark:text-dotori-200">
							<span className={cn(CLS.pill, status.pill)}>
								{availabilityText}
							</span>
							{facility.status === "available" ? (
								<p className="mt-1 text-body-sm font-semibold text-forest-700 dark:text-forest-200">
									빈자리 {availableSeats}석
								</p>
							) : null}
							<p className={cn(DS_TYPOGRAPHY.caption, 'mt-2 text-dotori-500 dark:text-dotori-300')} suppressHydrationWarning>
								{formatRelativeTime(facility.lastSyncedAt)}
							</p>
						</div>
					</div>
				</motion.section>

				<motion.section variants={cardRevealItem} className={cn(CLS.sectionBorder, 'px-4 py-3')}>
					<div className="mb-1 flex items-center justify-between">
						<p className={cn(DS_TYPOGRAPHY.label, 'font-semibold uppercase tracking-wide text-dotori-500 dark:text-dotori-300')}>
							정원 현황
						</p>
						<p className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-700 dark:text-dotori-100')}>{occupancyRate}%</p>
					</div>
					<DsProgressBar
						trackClassName={CLS.progressTrack}
						tone={currentOccupancyTone}
						value={occupancyRate}
						animated
					/>
				</motion.section>

				<motion.section variants={cardRevealItem} className={cn(CLS.sectionBorder, 'px-4 pt-3 pb-4')}>
					<div className={CLS.statsGrid}>
						<div>
							<p className={CLS.statValue}>{facility.capacity.total}</p>
							<p className={CLS.statLabel}>정원</p>
						</div>
						<div>
								<p
									className={cn(
										'font-semibold text-dotori-900 dark:text-dotori-50',
										facility.capacity.current >= facility.capacity.total
											? 'text-danger'
											: 'font-medium text-dotori-600 dark:text-dotori-300',
									)}
								>
								{facility.capacity.current}
							</p>
							<p className={CLS.statLabel}>현원</p>
						</div>
						<div>
								<p
									className={cn(
										'font-semibold text-dotori-900 dark:text-dotori-50',
										facility.capacity.waiting > 0
											? 'text-warning'
											: 'font-medium text-dotori-600 dark:text-dotori-300',
									)}
								>
								{facility.capacity.waiting}
							</p>
							<p className={CLS.statLabel}>대기</p>
						</div>
					</div>

					<div className="mt-3 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<div className="flex flex-wrap gap-1">
							{sources ? (
								sources.map((s, i) => <SourceChip key={`${s.source}-${i}`} {...s} />)
							) : (
								<SourceChip source="아이사랑" updatedAt={facility.lastSyncedAt} freshness="realtime" />
							)}
						</div>

						{onAction ? (
							<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
								<motion.div {...tap.button}>
									<DsButton
										variant="ghost"
										type="button"
										tone="dotori"
										onClick={() => onAction("register_interest", facility.id)}
										className="min-h-11 w-full text-label font-medium text-dotori-700 dark:text-dotori-200"
										aria-label="관심 시설 추가/제거"
									>
										관심
									</DsButton>
								</motion.div>
								{isActionAvailable ? (
									<motion.div {...tap.button}>
										<DsButton
											type="button"
											tone="dotori"
											onClick={() => onAction("apply_waiting", facility.id)}
											className="min-h-11 w-full text-label"
											aria-label="대기 신청"
										>
											{facility.status === "available" ? "입소신청" : "대기신청"}
										</DsButton>
									</motion.div>
								) : null}
							</div>
						) : null}
					</div>
				</motion.section>
			</div>
		</motion.article>
	);
});
