"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/catalyst/badge";
import { DsButton } from "@/components/ds/DsButton";
import { tap } from "@/lib/motion";
import { DS_GLASS, DS_STATUS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { cn, facilityTypeBadgeColor, formatRelativeTime } from "@/lib/utils";
import type { ActionType, Facility, SourceInfo } from "@/types/dotori";
import { SourceChip } from "./SourceChip";
import { Surface } from "./Surface";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const statusMeta = DS_STATUS;

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
			<motion.div {...tap.card} className={cn("rounded-2xl", status.border)}>
				<Surface
					className={cn(
						"overflow-hidden border border-dotori-100/70 bg-gradient-to-b from-white/95 via-dotori-50/65 to-white/90 p-3.5 ring-1 ring-dotori-200/60 dark:border-dotori-800/70 dark:bg-dotori-950/65 dark:ring-dotori-800/70",
						DS_GLASS.CARD,
					)}
					aria-label={facility.name}
					role="article"
				>
					{facility.isPremium ? (
						<div className="absolute right-3 top-3">
							<Badge color="dotori">파트너</Badge>
						</div>
					) : null}

					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden="true" />
								<p className={cn("truncate font-semibold text-dotori-900 dark:text-dotori-50", DS_TYPOGRAPHY.h3)}>
									{facility.name}
								</p>
							</div>
							<p className={cn("mt-1 truncate text-dotori-500 dark:text-dotori-300", DS_TYPOGRAPHY.bodySm)}>
								{facility.distance ? `${facility.distance} · ` : ""}
								{facility.address || facility.type}
							</p>
							<div className="mt-2 flex flex-wrap items-center gap-1.5">
								<Badge color={facilityTypeBadgeColor(facility.type)}>{facility.type}</Badge>
								{hasRecentUpdate ? <Badge color="forest">최근 업데이트</Badge> : null}
							</div>
						</div>

						<div className="shrink-0 text-right">
							<span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", status.pill)}>
								{facility.status === "available"
									? status.label
									: facility.status === "waiting"
										? `${status.label} ${facility.capacity.waiting}`
										: status.label}
							</span>
							{facility.status === "available" ? (
								<p className="mt-1 text-sm font-semibold text-forest-700 dark:text-forest-200">
									TO {availableSeats}석
								</p>
							) : null}
							<p className="mt-1 text-xs text-dotori-500 dark:text-dotori-300" suppressHydrationWarning>
								{formatRelativeTime(facility.lastSyncedAt)}
							</p>
						</div>
					</div>
				</Surface>
			</motion.div>
		);
	}

	return (
		<motion.div {...tap.card} className={cn("rounded-2xl", status.border)}>
			<Surface
				className={cn(
					"overflow-hidden border border-dotori-100/70 bg-gradient-to-b from-white/95 via-dotori-50/60 to-white/90 p-0 ring-1 ring-dotori-200/60 dark:border-dotori-800/70 dark:bg-dotori-950/70 dark:ring-dotori-800/70",
					DS_GLASS.CARD,
				)}
				aria-label={facility.name}
				role="article"
			>
				{facility.isPremium ? (
					<div className="absolute right-4 top-4">
						<Badge color="dotori">파트너</Badge>
					</div>
				) : null}

				<div className="flex items-start justify-between gap-3 bg-gradient-to-br from-dotori-100/80 via-white/60 to-forest-100/40 px-4 pb-3 pt-4 dark:from-dotori-900/70 dark:via-dotori-950/60 dark:to-forest-900/30">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden="true" />
							<p className={cn("truncate font-semibold text-dotori-900 dark:text-dotori-50", DS_TYPOGRAPHY.h2)}>
								{facility.name}
							</p>
						</div>
						<p className={cn("mt-1 line-clamp-2 text-dotori-600 dark:text-dotori-300", DS_TYPOGRAPHY.bodySm)}>
							{facility.address}
						</p>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<Badge color={facilityTypeBadgeColor(facility.type)}>{facility.type}</Badge>
							{facility.distance ? (
								<span className="text-xs font-medium text-dotori-600 dark:text-dotori-300">
									{facility.distance}
								</span>
							) : null}
							{hasRecentUpdate ? (
								<Badge color="forest">최근 업데이트</Badge>
							) : null}
						</div>
					</div>

					<div className="shrink-0 text-right">
						<span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", status.pill)}>
							{facility.status === "available"
								? status.label
								: facility.status === "waiting"
									? `${status.label} ${facility.capacity.waiting}`
									: status.label}
						</span>
						{facility.status === "available" ? (
							<p className="mt-1 text-sm font-semibold text-forest-700 dark:text-forest-200">
								TO {availableSeats}석
							</p>
						) : null}
						<p className="mt-2 text-xs text-dotori-500 dark:text-dotori-300" suppressHydrationWarning>
							{formatRelativeTime(facility.lastSyncedAt)}
						</p>
					</div>
				</div>

				<div className="px-4 pb-4 pt-3">
					<div className="mb-2.5">
						<div className="mb-1 flex items-center justify-between">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-dotori-500 dark:text-dotori-300">
								수용률
							</p>
							<p className="text-sm font-semibold text-dotori-700 dark:text-dotori-100">{occupancyRate}%</p>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-dotori-100 dark:bg-dotori-900/70">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									occupancyRate >= 100 ? "bg-danger" : occupancyRate >= 85 ? "bg-warning" : "bg-forest-500",
								)}
								style={{ width: `${occupancyRate}%` }}
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-2 rounded-xl bg-dotori-50/70 p-3 text-center ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60">
						<div>
							<p className="text-base font-semibold text-dotori-900 dark:text-dotori-50">{facility.capacity.total}</p>
							<p className="text-[11px] font-medium text-dotori-600 dark:text-dotori-300">정원</p>
						</div>
						<div>
							<p
								className={cn(
									"text-base font-semibold",
									facility.capacity.current >= facility.capacity.total
										? "text-danger"
										: "text-dotori-900 dark:text-dotori-50",
								)}
							>
								{facility.capacity.current}
							</p>
							<p className="text-[11px] font-medium text-dotori-600 dark:text-dotori-300">현원</p>
						</div>
						<div>
							<p
								className={cn(
									"text-base font-semibold",
									facility.capacity.waiting > 0 ? "text-warning" : "text-dotori-900 dark:text-dotori-50",
								)}
							>
								{facility.capacity.waiting}
							</p>
							<p className="text-[11px] font-medium text-dotori-600 dark:text-dotori-300">대기</p>
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
									onClick={() => onAction("register_interest", facility.id)}
									className="min-h-10 text-sm text-dotori-700 dark:text-dotori-200"
									aria-label="관심 시설 추가/제거"
								>
									관심
								</DsButton>
								{facility.status !== "full" ? (
									<DsButton
										type="button"
										onClick={() => onAction("apply_waiting", facility.id)}
										className="min-h-10"
										aria-label="대기 신청"
									>
										{facility.status === "available" ? "입소신청" : "대기신청"}
									</DsButton>
								) : null}
							</div>
						) : null}
					</div>
				</div>
			</Surface>
		</motion.div>
	);
});
