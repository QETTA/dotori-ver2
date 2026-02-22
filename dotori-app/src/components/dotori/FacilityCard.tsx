"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { cn, facilityTypeBadgeColor, formatRelativeTime } from "@/lib/utils";
import type { ActionType, Facility, SourceInfo } from "@/types/dotori";
import { SourceChip } from "./SourceChip";
import { Surface } from "./Surface";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const statusMeta = {
	available: {
		label: "TO 있음",
		dot: "bg-forest-500",
		pill: "bg-forest-100 text-forest-900",
		border: "border-l-4 border-l-forest-500/80",
	},
	waiting: {
		label: "대기",
		dot: "bg-warning",
		pill: "bg-dotori-100 text-dotori-900",
		border: "border-l-4 border-l-warning/80",
	},
	full: {
		label: "마감",
		dot: "bg-danger",
		pill: "bg-dotori-100 text-dotori-900",
		border: "border-l-4 border-l-danger/80",
	},
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
	const hasRecentUpdate = useMemo(() => {
		const lastSyncedAtTime = new Date(facility.lastSyncedAt).getTime();
		return (
			Number.isFinite(lastSyncedAtTime) &&
			// eslint-disable-next-line react-hooks/purity -- UI hint depends on current time.
			Date.now() - lastSyncedAtTime <= ONE_WEEK_MS
		);
	}, [facility.lastSyncedAt]);

	const motionCardProps = {
		whileHover: { scale: 1.01 },
		whileTap: { scale: 0.98 },
		transition: { type: "spring" as const, stiffness: 420, damping: 32 },
	};

	if (compact) {
		return (
			<motion.div {...motionCardProps} className={cn("rounded-3xl", status.border)}>
				<Surface className={cn("p-4")} aria-label={facility.name} role="article">
					{facility.isPremium ? (
						<div className="absolute right-3 top-3">
							<Badge color="dotori">파트너</Badge>
						</div>
					) : null}

					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden="true" />
								<p className="truncate text-base font-semibold text-dotori-900">
									{facility.name}
								</p>
							</div>
							<p className="mt-1 truncate text-sm text-dotori-600">
								{facility.distance ? `${facility.distance} · ` : ""}
								{facility.type}
							</p>
						</div>

						<div className="shrink-0 text-right">
							<span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", status.pill)}>
								{facility.status === "available"
									? status.label
									: facility.status === "waiting"
										? `${status.label} ${facility.capacity.waiting}`
										: status.label}
							</span>
							{facility.status === "available" ? (
								<p className="mt-1 text-xs font-medium text-forest-700">
									자리 {availableSeats}석
								</p>
							) : null}
							{hasRecentUpdate ? (
								<p className="mt-1 text-xs text-dotori-600">최근 업데이트</p>
							) : null}
							<p className="mt-1 text-xs text-dotori-500" suppressHydrationWarning>
								{formatRelativeTime(facility.lastSyncedAt)}
							</p>
						</div>
					</div>
				</Surface>
			</motion.div>
		);
	}

	return (
		<motion.div {...motionCardProps} className={cn("rounded-3xl", status.border)}>
			<Surface className="p-5" aria-label={facility.name} role="article">
				{facility.isPremium ? (
					<div className="absolute right-4 top-4">
						<Badge color="dotori">파트너</Badge>
					</div>
				) : null}

				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden="true" />
							<p className="truncate text-lg font-semibold text-dotori-900">{facility.name}</p>
						</div>
						<p className="mt-1 line-clamp-2 text-sm text-dotori-600">
							{facility.address}
						</p>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<Badge color={facilityTypeBadgeColor(facility.type)}>{facility.type}</Badge>
							{facility.distance ? (
								<span className="text-xs font-medium text-dotori-600">
									{facility.distance}
								</span>
							) : null}
							{hasRecentUpdate ? (
								<span className="text-xs font-medium text-forest-700">최근 업데이트</span>
							) : null}
						</div>
					</div>

					<div className="shrink-0 text-right">
						<span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", status.pill)}>
							{facility.status === "available"
								? status.label
								: facility.status === "waiting"
									? `${status.label} ${facility.capacity.waiting}`
									: status.label}
						</span>
						<p className="mt-2 text-xs text-dotori-500" suppressHydrationWarning>
							{formatRelativeTime(facility.lastSyncedAt)}
						</p>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-dotori-50/70 p-4 text-center ring-1 ring-dotori-100/70">
					<div>
						<p className="text-lg font-semibold text-dotori-900">{facility.capacity.total}</p>
						<p className="text-xs font-medium text-dotori-600">정원</p>
					</div>
					<div>
						<p className={cn("text-lg font-semibold", facility.capacity.current >= facility.capacity.total ? "text-danger" : "text-dotori-900")}>
							{facility.capacity.current}
						</p>
						<p className="text-xs font-medium text-dotori-600">현원</p>
					</div>
					<div>
						<p className={cn("text-lg font-semibold", facility.capacity.waiting > 0 ? "text-warning" : "text-dotori-900")}>
							{facility.capacity.waiting}
						</p>
						<p className="text-xs font-medium text-dotori-600">대기</p>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap gap-1">
						{sources ? (
							sources.map((s, i) => <SourceChip key={`${s.source}-${i}`} {...s} />)
						) : (
							<SourceChip source="아이사랑" updatedAt={facility.lastSyncedAt} freshness="realtime" />
						)}
					</div>

					{onAction ? (
						<div className="flex items-center gap-2">
							<Button
								plain={true}
								type="button"
								onClick={() => onAction("register_interest", facility.id)}
								className="min-h-11 text-sm text-dotori-700"
								aria-label="관심 시설 추가/제거"
							>
								관심
							</Button>
							{facility.status !== "full" ? (
								<Button
									color="dotori"
									type="button"
									onClick={() => onAction("apply_waiting", facility.id)}
									className="min-h-11"
									aria-label="대기 신청"
								>
									{facility.status === "available" ? "입소신청" : "대기신청"}
								</Button>
							) : null}
						</div>
					) : null}
				</div>
			</Surface>
		</motion.div>
	);
});
