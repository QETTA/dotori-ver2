import { memo } from "react"
import { motion } from "motion/react"
import { BRAND } from "@/lib/brand-assets"
import { cn, formatRelativeTime, freshnessColor } from "@/lib/utils"
import type { DataFreshness, DataSource } from "@/types/dotori"

export const SourceChip = memo(function SourceChip({
	source,
	updatedAt,
	freshness,
	selected = false,
}: {
	source: DataSource
	updatedAt?: string
	freshness: DataFreshness
	selected?: boolean
}) {
	const isIsalangSource = source === "아이사랑"
	const displayedSource = isIsalangSource ? "아이사랑(공식)" : source
	const displayedTime = updatedAt ? formatRelativeTime(updatedAt) : "방금"

	return (
		<motion.span
			layout
			animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
			transition={{ type: "spring", stiffness: 420, damping: 26 }}
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all",
				freshnessColor(freshness),
				selected ? "bg-dotori-100 text-dotori-700" : null,
			)}
			>
				{isIsalangSource ? (
					// eslint-disable-next-line @next/next/no-img-element
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
			<span suppressHydrationWarning>{displayedSource} · {displayedTime}</span>
		</motion.span>
	)
})
