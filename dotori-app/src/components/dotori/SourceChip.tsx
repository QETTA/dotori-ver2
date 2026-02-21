import { memo } from "react";
import { cn, formatRelativeTime, freshnessColor } from "@/lib/utils";
import type { DataFreshness, DataSource } from "@/types/dotori";

export const SourceChip = memo(function SourceChip({
	source,
	updatedAt,
	freshness,
}: {
	source: DataSource;
	updatedAt: string;
	freshness: DataFreshness;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
				freshnessColor(freshness),
			)}
		>
			<span
				className={cn(
					"h-1.5 w-1.5 rounded-full",
					freshness === "realtime" && "animate-pulse bg-forest-500",
					freshness === "recent" && "bg-amber-500",
					freshness === "cached" && "bg-dotori-300",
				)}
			/>
			<span suppressHydrationWarning>
				{source} · {formatRelativeTime(updatedAt)}
			</span>
		</span>
	);
});
