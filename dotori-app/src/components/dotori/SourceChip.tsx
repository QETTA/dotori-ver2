import { memo } from "react";
import { BRAND } from "@/lib/brand-assets";
import { cn, formatRelativeTime, freshnessColor } from "@/lib/utils";
import type { DataFreshness, DataSource } from "@/types/dotori";

export const SourceChip = memo(function SourceChip({
	source,
	updatedAt,
	freshness,
}: {
	source: DataSource;
	updatedAt?: string;
	freshness: DataFreshness;
}) {
	const isIsalangSource = source === "아이사랑";
	const displayedSource = isIsalangSource ? "아이사랑(공식)" : source;
	const displayedTime = updatedAt ? formatRelativeTime(updatedAt) : "방금";

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
				freshnessColor(freshness),
			)}
		>
			{isIsalangSource ? (
				<img
					src={BRAND.symbol}
					alt="아이사랑 공식"
					className="h-3 w-3 rounded-full border border-white/70 bg-white object-contain"
				/>
			) : null}
			<span
				className={cn(
					"h-1.5 w-1.5 rounded-full",
					freshness === "realtime" && "animate-pulse bg-forest-500",
					freshness === "recent" && "bg-amber-500",
					freshness === "cached" && "bg-dotori-300",
				)}
			/>
			<span suppressHydrationWarning>
				{displayedSource} · {displayedTime}
			</span>
		</span>
	);
});
