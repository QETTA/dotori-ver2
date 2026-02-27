'use client'

/**
 * Skeleton — Loading placeholders for all page variants
 *
 * hasDesignTokens: true  — DS_STATUS, DS_CARD
 * hasBrandSignal:  true  — DS_STATUS.waiting (shimmer tint), DS_CARD.raised (card skeletons)
 */
import { DS_STATUS } from '@/lib/design-system/tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { cn } from "@/lib/utils";

/* ── Brand-tinted skeleton card tokens (extends DS_CARD.raised) ── */
const SK_CARD = cn('overflow-hidden', DS_CARD.raised.base, DS_CARD.raised.dark)
const SK_ACCENT = 'h-1 bg-gradient-to-r from-dotori-200/60 via-dotori-300/40 to-amber-200/60 dark:from-dotori-800/40 dark:via-dotori-700/30 dark:to-amber-800/40'

const ShimmerBlock = ({ className, delay = 0 }: { className: string; delay?: number }) => (
	<div
		className={cn(
			'relative overflow-hidden rounded-lg !bg-dotori-100/60 dark:!bg-dotori-800/40',
			DS_STATUS.waiting.pill,
			className,
		)}
		aria-hidden="true"
	>
		{/* Directional shimmer */}
		<div
			className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10"
			style={{ animation: `shimmer 1.5s ease-in-out ${delay}ms infinite` }}
		/>
	</div>
)

export function Skeleton({
  variant,
  count = 3,
}: {
	variant: "card" | "list" | "chat" | "text" | "facility-card" | "facility-detail" | "community-post" | "home";
  count?: number;
}) {
	const loadingProps = {
		"aria-busy": true,
		"aria-label": "로딩 중",
  };

	if (variant === "card") {
		return (
			<div className="space-y-3" role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className={SK_CARD}>
						<div className={SK_ACCENT} />
						<div className="p-4">
							<ShimmerBlock className="h-44" delay={i * 100} />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "facility-card") {
		return (
			<div className="space-y-3" role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className={SK_CARD}>
						<div className={SK_ACCENT} />
						<div className="p-5">
							<div className="flex-1 space-y-2.5">
								<div className="flex items-center gap-2">
									<ShimmerBlock className="h-2.5 w-2.5 rounded-full" delay={i * 80} />
									<ShimmerBlock className="h-5 w-2/3" delay={i * 80 + 50} />
								</div>
								<ShimmerBlock className="h-4 w-1/2" delay={i * 80 + 100} />
							</div>
							<div className="mt-3 space-y-1.5 text-right">
								<ShimmerBlock className="ml-auto h-5 w-14" delay={i * 80 + 150} />
								<ShimmerBlock className="ml-auto h-3 w-10" delay={i * 80 + 200} />
							</div>
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "facility-detail") {
		return (
			<div className="space-y-4 px-4" role="status" {...loadingProps}>
				{/* Photo placeholder */}
				<div className={SK_CARD}>
					<ShimmerBlock className="h-48" />
				</div>
				{/* Info card */}
				<div className={SK_CARD}>
					<div className={SK_ACCENT} />
					<div className="space-y-3 p-5">
						<ShimmerBlock className="h-6 w-3/4" />
						<div className="flex gap-2">
							<ShimmerBlock className="h-6 w-16 rounded-full" />
							<ShimmerBlock className="h-6 w-16 rounded-full" />
						</div>
					</div>
				</div>
				{/* Capacity cards */}
				<div className="grid grid-cols-3 gap-2.5">
					{[0, 1, 2].map((i) => (
						<div key={`sk-${i}`} className={SK_CARD}>
							<div className="space-y-2 p-4">
								<ShimmerBlock className="mx-auto h-8 w-12" delay={i * 80} />
								<ShimmerBlock className="mx-auto h-3 w-8" delay={i * 80 + 50} />
							</div>
						</div>
					))}
				</div>
				{/* CTA button */}
				<ShimmerBlock className="h-14 rounded-2xl" />
			</div>
		)
	}

	if (variant === "community-post") {
		return (
			<div className="space-y-3" role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className={SK_CARD}>
						<div className={SK_ACCENT} />
						<div className="space-y-3 p-5">
							<div className="flex items-center gap-2.5">
								<ShimmerBlock className="h-10 w-10 rounded-full" delay={i * 80} />
								<div className="flex-1 space-y-1.5">
									<ShimmerBlock className="h-4 w-24" delay={i * 80 + 50} />
									<ShimmerBlock className="h-4 w-1/2" delay={i * 80 + 100} />
								</div>
							</div>
							<div className="space-y-2">
								<ShimmerBlock className="h-4 w-full" delay={i * 80 + 150} />
								<ShimmerBlock className="h-4 w-4/5" delay={i * 80 + 200} />
							</div>
							<div className="flex gap-4">
								<ShimmerBlock className="h-6 w-16 rounded-full" delay={i * 80 + 250} />
								<ShimmerBlock className="h-6 w-16 rounded-full" delay={i * 80 + 300} />
							</div>
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "home") {
		return (
			<div className="mt-5 space-y-5 px-4" role="status" {...loadingProps}>
				{/* AI Briefing */}
				<div className={SK_CARD}>
					<div className={SK_ACCENT} />
					<div className="p-5">
						<ShimmerBlock className="h-24" />
					</div>
				</div>
				{/* Quick actions */}
				<div className="flex gap-2">
					{[0, 1, 2, 3].map((i) => (
						<ShimmerBlock key={`sk-${i}`} className="h-11 w-24 rounded-full" delay={i * 60} />
					))}
				</div>
				{/* Section header */}
				<div className="flex items-center justify-between">
					<ShimmerBlock className="h-5 w-20" />
					<ShimmerBlock className="h-5 w-14" />
				</div>
				{/* Facility cards */}
				<div className="space-y-3">
					{[0, 1, 2].map((i) => (
						<div key={`sk-${i}`} className={SK_CARD}>
							<div className={SK_ACCENT} />
							<div className="p-5">
								<div className="flex-1 space-y-2">
									<ShimmerBlock className="h-4 w-3/4" delay={i * 80} />
									<ShimmerBlock className="h-3 w-1/2" delay={i * 80 + 50} />
								</div>
								<ShimmerBlock className="mt-2 h-5 w-14" delay={i * 80 + 100} />
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}

	if (variant === "list") {
		return (
			<div role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className="flex items-center gap-3 py-3.5">
						<ShimmerBlock className="h-10 w-10 rounded-full" delay={i * 60} />
						<div className="flex-1 space-y-2">
							<ShimmerBlock className="h-4 w-3/4" delay={i * 60 + 40} />
							<ShimmerBlock className="h-3 w-1/2" delay={i * 60 + 80} />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "chat") {
		return (
			<div className="mb-3 flex gap-2.5" role="status" {...loadingProps}>
				<ShimmerBlock className="h-9 w-9 shrink-0 rounded-full" />
				<div className={cn(SK_CARD, 'w-3/4')}>
					<div className={SK_ACCENT} />
					<div className="p-4">
						<ShimmerBlock className="h-16" />
					</div>
				</div>
			</div>
		)
	}

	// text
	return (
		<div role="status" {...loadingProps}>
			{Array.from({ length: count }).map((_, i) => (
				<ShimmerBlock
					key={`sk-${i}`}
					className={cn('mb-2.5 h-4', i === count - 1 && 'w-2/3')}
					delay={i * 60}
				/>
			))}
		</div>
	)
}
