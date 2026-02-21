'use client'

import { cn } from "@/lib/utils"
import { motion } from "motion/react";

const shimmerAnimation = {
	animate: { x: ["-100%", "100%"] },
	transition: { duration: 1.4, repeat: Infinity, ease: "linear" as const },
}

const ShimmerBlock = ({ className }: { className: string }) => (
	<motion.div
		className={cn("relative overflow-hidden rounded-xl bg-dotori-100", className)}
		aria-hidden="true"
	>
		<motion.div
			className="absolute inset-0 w-full bg-gradient-to-r from-dotori-50 via-dotori-100 to-dotori-50"
			initial={{ x: "-100%" }}
			{...shimmerAnimation}
		/>
	</motion.div>
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
					<ShimmerBlock className={cn("rounded-xl", "h-44")} key={`sk-${i}`} />
				))}
			</div>
		)
	}

	if (variant === "facility-card") {
		return (
			<div className="space-y-3" role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={`sk-${i}`}
						className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm"
					>
						<div className="flex-1 space-y-2.5">
							<div className="flex items-center gap-2">
								<ShimmerBlock className={cn("h-2.5 w-2.5 rounded-full")} />
								<ShimmerBlock className={cn("h-5 w-2/3")} />
							</div>
							<ShimmerBlock className={cn("h-4 w-1/2")} />
						</div>
						<div className="space-y-1.5 text-right">
							<ShimmerBlock className={cn("ml-auto h-5 w-14")} />
							<ShimmerBlock className={cn("ml-auto h-3 w-10")} />
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
				<ShimmerBlock className={cn("h-48 rounded-xl")} />
				{/* Info card */}
				<div className="rounded-xl bg-white p-5 shadow-sm space-y-3">
					<ShimmerBlock className={cn("h-6 w-3/4")} />
					<div className="flex gap-2">
						<ShimmerBlock className={cn("h-6 w-16 rounded-full")} />
						<ShimmerBlock className={cn("h-6 w-16 rounded-full")} />
					</div>
				</div>
				{/* Capacity cards */}
				<div className="grid grid-cols-3 gap-2.5">
					{[0, 1, 2].map((i) => (
						<div key={`sk-${i}`} className="rounded-xl bg-white p-4 shadow-sm space-y-2">
							<ShimmerBlock className={cn("mx-auto h-8 w-12")} />
							<ShimmerBlock className={cn("mx-auto h-3 w-8")} />
						</div>
					))}
				</div>
				{/* CTA button */}
				<ShimmerBlock className={cn("h-14")} />
			</div>
		)
	}

	if (variant === "community-post") {
		return (
			<div className="space-y-3" role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={`sk-${i}`}
						className="rounded-xl bg-white p-5 shadow-sm space-y-3"
					>
						<div className="flex items-center gap-2.5">
							<ShimmerBlock className={cn("h-10 w-10 rounded-full")} />
							<div className="flex-1 space-y-1.5">
								<ShimmerBlock className={cn("h-4 w-24")} />
								<ShimmerBlock className={cn("h-3 w-16")} />
							</div>
						</div>
						<div className="space-y-2">
							<ShimmerBlock className={cn("h-4 w-full")} />
							<ShimmerBlock className={cn("h-4 w-4/5")} />
						</div>
						<div className="flex gap-4">
							<ShimmerBlock className={cn("h-8 w-16 rounded-full")} />
							<ShimmerBlock className={cn("h-8 w-16 rounded-full")} />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "home") {
		return (
			<div className="space-y-5 px-4 mt-5" role="status" {...loadingProps}>
				{/* AI Briefing */}
				<ShimmerBlock className={cn("h-32 rounded-xl")} />
				{/* Quick actions */}
				<div className="flex gap-2">
					{[0, 1, 2, 3].map((i) => (
						<ShimmerBlock key={`sk-${i}`} className={cn("h-11 w-24 rounded-full")} />
					))}
				</div>
				{/* Section header */}
				<div className="flex items-center justify-between">
					<ShimmerBlock className={cn("h-5 w-20")} />
					<ShimmerBlock className={cn("h-4 w-14")} />
				</div>
				{/* Facility cards */}
				<div className="space-y-3">
					{[0, 1, 2].map((i) => (
						<div key={`sk-${i}`} className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm">
							<div className="flex-1 space-y-2">
								<ShimmerBlock className={cn("h-5 w-3/4")} />
								<ShimmerBlock className={cn("h-3 w-1/2")} />
							</div>
							<ShimmerBlock className={cn("h-5 w-14")} />
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
						<ShimmerBlock className={cn("h-10 w-10 rounded-full")} />
						<div className="flex-1 space-y-2">
							<ShimmerBlock className={cn("h-4 w-3/4")} />
							<ShimmerBlock className={cn("h-3 w-1/2")} />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "chat") {
		return (
			<div className="mb-3 flex gap-2.5" role="status" {...loadingProps}>
				<ShimmerBlock className={cn("h-9 w-9 shrink-0 rounded-full")} />
				<ShimmerBlock className={cn("h-24 w-3/4 rounded-xl rounded-bl-sm")} />
			</div>
		)
	}

	// text
	return (
		<div role="status" {...loadingProps}>
			{Array.from({ length: count }).map((_, i) => (
				<ShimmerBlock
					key={`sk-${i}`}
					className={cn("mb-2.5 h-4", i === count - 1 && "w-2/3")}
				/>
			))}
		</div>
	)
}
