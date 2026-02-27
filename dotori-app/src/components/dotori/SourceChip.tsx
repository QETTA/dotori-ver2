import { memo } from "react"
import { motion } from "motion/react"
import { BRAND } from "@/lib/brand-assets"
import { spring } from "@/lib/motion"
import { cn, formatRelativeTime, freshnessColor } from "@/lib/utils"
import { DS_FRESHNESS } from '@/lib/design-system/tokens'
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
	const displayedSource = isIsalangSource
		? "아이사랑(공식)"
		: source === "AI분석"
			? "토리톡 인사이트"
			: source
	const displayedTime = updatedAt ? formatRelativeTime(updatedAt) : "방금"

	return (
		<motion.span
			layout
			animate={selected ? { scale: 1 } : { scale: 1 }}
			whileTap={{ scale: 1.06 }}
			transition={spring.chip}
			className={cn(
				'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-body-sm font-medium transition-all',
				freshnessColor(freshness),
				DS_FRESHNESS[freshness].dark,
				selected && 'bg-dotori-100 text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100',
			)}
		>
			{isIsalangSource ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={BRAND.symbol}
					alt="아이사랑 공식"
					className={'h-3 w-3 rounded-full border border-white/70 bg-white object-contain dark:border-dotori-700/40 dark:bg-dotori-950'}
				/>
			) : null}
			<span
				className={cn(
					'h-1.5 w-1.5 rounded-full',
					DS_FRESHNESS[freshness].dot,
				)}
			/>
			<span suppressHydrationWarning>{displayedSource} · {displayedTime}</span>
		</motion.span>
	)
})
