"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/catalyst/badge";
import { DsButton } from "@/components/ds/DsButton";
import { BRAND } from "@/lib/brand-assets";
import { spring, tap } from "@/lib/motion";
import { DS_GLASS, DS_STATUS } from "@/lib/design-system/tokens";
import { cn, facilityTypeBadgeColor, formatRelativeTime } from "@/lib/utils";
import type { ActionType, Facility, SourceInfo } from "@/types/dotori";
import { SourceChip } from "./SourceChip";
import { Surface } from "./Surface";

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

	if (compact) {
		return (
			<motion.div
				{...tap.card}
				variants={cardReveal}
				initial="hidden"
				animate="show"
				className={cn("overflow-hidden rounded-3xl shadow-sm", status.border)}
			>
				<Surface
					className={cn(
						"relative overflow-hidden border border-dotori-100/70 bg-dotori-50/75 p-4 ring-1 ring-dotori-100/70 dark:border-dotori-800/70 dark:bg-dotori-950/70 dark:ring-dotori-800/70",
						DS_GLASS.CARD,
					)}
					aria-label={facility.name}
					role="article"
				>
					<img
						src={BRAND.watermark}
						alt=""
						aria-hidden="true"
						className="pointer-events-none absolute -right-6 -top-4 h-24 w-24 opacity-10 md:h-28 md:w-28"
					/>

					{facility.isPremium ? (
						<div className="absolute right-3 top-3">
							<Badge color="forest">파트너</Badge>
						</div>
					) : null}

					<motion.div variants={cardRevealItem} className="relative space-y-3">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden="true" />
									<p className="truncate text-h3 font-semibold text-dotori-900 dark:text-dotori-50">
										{facility.name}
									</p>
								</div>
								<p className="mt-1 truncate text-body-sm text-dotori-500 dark:text-dotori-300">
									{facility.distance ? `${facility.distance} · ` : ""}
									{facility.address || facility.type}
								</p>
								<div className="mt-2 flex flex-wrap items-center gap-1.5">
									<Badge color={facilityTypeBadgeColor(facility.type)}>{facility.type}</Badge>
									{hasRecentUpdate ? <Badge color="forest">최근 업데이트</Badge> : null}
								</div>
							</div>

							<div className="shrink-0 text-right">
								<span
									className={cn(
										"inline-flex items-center rounded-full px-2.5 py-0.5 text-label font-semibold tracking-[0.02em]",
										status.pill,
									)}
								>
									{facility.status === "available"
										? status.label
										: facility.status === "waiting"
											? `${status.label} ${facility.capacity.waiting}`
											: status.label}
								</span>
								{facility.status === "available" ? (
									<p className="mt-1 text-body-sm font-semibold text-forest-700 dark:text-forest-200">
										TO {availableSeats}석
									</p>
								) : null}
								<p className="mt-1 text-caption text-dotori-500 dark:text-dotori-300" suppressHydrationWarning>
									{formatRelativeTime(facility.lastSyncedAt)}
								</p>
							</div>
						</div>
					</motion.div>
				</Surface>
			</motion.div>
		);
	}

	return (
		<motion.div
			{...tap.card}
			variants={cardReveal}
			initial="hidden"
			animate="show"
			className={cn("overflow-hidden rounded-3xl shadow-sm", status.border)}
		>
			<Surface
				className={cn(
					"relative overflow-hidden border border-dotori-100/70 bg-dotori-50/75 p-0 ring-1 ring-dotori-100/70 dark:border-dotori-800/70 dark:bg-dotori-950/70 dark:ring-dotori-800/70",
					DS_GLASS.CARD,
				)}
				aria-label={facility.name}
				role="article"
			>
				<img
					src={BRAND.watermark}
					alt=""
					aria-hidden="true"
					className="pointer-events-none absolute -right-6 top-2 h-28 w-28 opacity-10 md:h-32 md:w-32"
				/>

				{facility.isPremium ? (
					<div className="absolute right-4 top-4">
						<Badge color="forest">파트너</Badge>
					</div>
				) : null}

				<motion.section variants={cardRevealItem} className="border-b border-dotori-100/70">
					<div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden="true" />
								<p className="truncate text-h2 font-semibold text-dotori-900 dark:text-dotori-50">
									{facility.name}
								</p>
							</div>
							<p className="mt-1 line-clamp-2 text-body-sm text-dotori-600 dark:text-dotori-300">{facility.address}</p>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<Badge color={facilityTypeBadgeColor(facility.type)}>{facility.type}</Badge>
								{facility.distance ? (
									<span className="text-caption font-medium text-dotori-600 dark:text-dotori-300">
										{facility.distance}
									</span>
								) : null}
								{hasRecentUpdate ? <Badge color="forest">최근 업데이트</Badge> : null}
							</div>
						</div>

						<div className="shrink-0 text-right">
							<span
								className={cn(
									"inline-flex items-center rounded-full px-2.5 py-0.5 text-label font-semibold tracking-[0.02em]",
									status.pill,
								)}
							>
								{facility.status === "available"
									? status.label
									: facility.status === "waiting"
										? `${status.label} ${facility.capacity.waiting}`
										: status.label}
							</span>
							{facility.status === "available" ? (
								<p className="mt-1 text-body-sm font-semibold text-forest-700 dark:text-forest-200">
									TO {availableSeats}석
								</p>
							) : null}
							<p className="mt-1 text-caption text-dotori-500 dark:text-dotori-300" suppressHydrationWarning>
								{formatRelativeTime(facility.lastSyncedAt)}
							</p>
						</div>
					</div>
				</motion.section>

				<motion.section variants={cardRevealItem} className="border-b border-dotori-100/70 px-4 py-3">
					<div className="mb-2">
						<div className="mb-1 flex items-center justify-between">
							<p className="text-label font-semibold uppercase tracking-[0.18em] text-dotori-500 dark:text-dotori-300">
								수용률
							</p>
							<p className="text-body-sm font-semibold text-dotori-700 dark:text-dotori-100">{occupancyRate}%</p>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-dotori-100 dark:bg-dotori-900/70">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									occupancyRate >= 100
										? "bg-danger"
										: occupancyRate >= 85
											? "bg-warning"
											: "bg-forest-500",
								)}
								style={{ width: `${occupancyRate}%` }}
							/>
						</div>
					</div>
				</motion.section>

				<motion.section variants={cardRevealItem} className="px-4 pt-3 pb-4">
					<div className="grid grid-cols-3 gap-2 rounded-xl bg-dotori-50/80 p-3 text-center ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60">
						<div>
							<p className="text-h3 font-semibold text-dotori-900 dark:text-dotori-50">{facility.capacity.total}</p>
							<p className="text-caption font-medium text-dotori-600 dark:text-dotori-300">정원</p>
						</div>
						<div>
							<p
								className={cn(
									"text-h3 font-semibold",
									facility.capacity.current >= facility.capacity.total
										? "text-danger"
										: "text-dotori-900 dark:text-dotori-50",
								)}
							>
								{facility.capacity.current}
							</p>
							<p className="text-caption font-medium text-dotori-600 dark:text-dotori-300">현원</p>
						</div>
						<div>
							<p
								className={cn(
									"text-h3 font-semibold",
									facility.capacity.waiting > 0 ? "text-warning" : "text-dotori-900 dark:text-dotori-50",
								)}
							>
								{facility.capacity.waiting}
							</p>
							<p className="text-caption font-medium text-dotori-600 dark:text-dotori-300">대기</p>
						</div>
					</div>

					<div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
						<div className="flex flex-wrap gap-1">
							{sources ? (
								sources.map((s, i) => <SourceChip key={`${s.source}-${i}`} {...s} />)
							) : (
								<SourceChip source="아이사랑" updatedAt={facility.lastSyncedAt} freshness="realtime" />
							)}
						</div>

						{onAction ? (
							<div className="flex items-center gap-2">
								<DsButton
									variant="ghost"
									type="button"
									tone="dotori"
									onClick={() => onAction("register_interest", facility.id)}
									className="min-h-11 text-label text-dotori-700 dark:text-dotori-200"
									aria-label="관심 시설 추가/제거"
								>
									관심
								</DsButton>
								{facility.status !== "full" ? (
									<DsButton
										type="button"
										tone="dotori"
										onClick={() => onAction("apply_waiting", facility.id)}
										className="min-h-11 text-label"
										aria-label="대기 신청"
									>
										{facility.status === "available" ? "입소신청" : "대기신청"}
									</DsButton>
								) : null}
							</div>
						) : null}
					</div>
				</motion.section>
			</Surface>
		</motion.div>
	);
});
