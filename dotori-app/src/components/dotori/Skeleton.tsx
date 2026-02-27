'use client'

import { cn } from "@/lib/utils";

const SKELETON_GLASS_CARD = cn(
	'glass-card',
	"rounded-3xl border-b border-dotori-100/70 ring-1 ring-dotori-100/70 shadow-sm",
)
const SKELETON_MEDIA_FRAME = SKELETON_GLASS_CARD
const SKELETON_CARD_PADDING = "p-4";
const SKELETON_SECTION_DIVIDER = "border-b border-dotori-100/70 pb-1";

const ShimmerBlock = ({ className, delay = 0 }: { className: string; delay?: number }) => (
	<div
		className={cn(
			'relative overflow-hidden rounded-xl bg-dotori-100/80 dark:bg-dotori-800/60',
			className,
		)}
		aria-hidden="true"
	>
		{/* Directional shimmer — 2026 premium loading pattern */}
		<div
			className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10"
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
			<div className={cn('space-y-3', SKELETON_SECTION_DIVIDER)} role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className={cn(SKELETON_CARD_PADDING, SKELETON_GLASS_CARD)}>
						<ShimmerBlock className={'h-44'} />
					</div>
				))}
			</div>
		)
	}

	if (variant === "facility-card") {
		return (
			<div className={cn('space-y-3', SKELETON_SECTION_DIVIDER)} role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={`sk-${i}`}
						className={cn('rounded-xl bg-white p-5 shadow-sm dark:bg-dotori-950 dark:shadow-none', SKELETON_GLASS_CARD)}
					>
						<div className={'flex-1 space-y-2.5'}>
							<div className={'flex items-center gap-2'}>
								<ShimmerBlock className={'h-2.5 w-2.5 rounded-full'} />
								<ShimmerBlock className={'h-5 w-2/3'} />
							</div>
							<ShimmerBlock className={'h-4 w-1/2'} />
						</div>
						<div className={'space-y-1.5 text-right'}>
							<ShimmerBlock className={'ml-auto h-5 w-14'} />
							<ShimmerBlock className={'ml-auto h-3 w-10'} />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "facility-detail") {
		return (
			<div
				className={cn('space-y-4 px-4', SKELETON_SECTION_DIVIDER)}
				role="status"
				{...loadingProps}
			>
				{/* Photo placeholder */}
				<ShimmerBlock
					className={cn('h-48 rounded-xl', SKELETON_MEDIA_FRAME)}
				/>
				{/* Info card */}
				<div className={cn('rounded-xl bg-white p-5 shadow-sm space-y-3 dark:bg-dotori-950 dark:shadow-none', SKELETON_GLASS_CARD)}>
					<ShimmerBlock className={'h-6 w-3/4'} />
					<div className={'flex gap-2'}>
						<ShimmerBlock className={'h-6 w-16 rounded-full'} />
						<ShimmerBlock className={'h-6 w-16 rounded-full'} />
					</div>
				</div>
				{/* Capacity cards */}
				<div className={'grid grid-cols-3 gap-2.5'}>
					{[0, 1, 2].map((i) => (
						<div
							key={`sk-${i}`}
							className={cn('rounded-xl bg-white p-4 shadow-sm space-y-2 dark:bg-dotori-950 dark:shadow-none', SKELETON_GLASS_CARD)}
						>
							<ShimmerBlock className={'mx-auto h-8 w-12'} />
							<ShimmerBlock className={'mx-auto h-3 w-8'} />
						</div>
					))}
				</div>
				{/* CTA button */}
				<ShimmerBlock className={'h-14'} />
			</div>
		)
	}

	if (variant === "community-post") {
		return (
			<div className={cn('space-y-3', SKELETON_SECTION_DIVIDER)} role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={`sk-${i}`}
						className={cn('rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(176,122,74,0.06)] space-y-3 dark:bg-dotori-950 dark:shadow-none', SKELETON_GLASS_CARD)}
					>
						<div className={'flex items-center gap-2.5'}>
							<ShimmerBlock className={'h-10 w-10 rounded-full'} delay={i * 80} />
							<div className={'flex-1 space-y-1.5'}>
								<ShimmerBlock className={'h-4 w-24'} delay={i * 80 + 50} />
								<ShimmerBlock className={'h-4 w-1/2'} delay={i * 80 + 100} />
							</div>
						</div>
						<div className={'space-y-2'}>
							<ShimmerBlock className={'h-4 w-full'} delay={i * 80 + 150} />
							<ShimmerBlock className={'w-4/5 h-4'} delay={i * 80 + 200} />
						</div>
						<div className={'flex gap-4'}>
							<ShimmerBlock className={'h-6 w-16 rounded-full'} delay={i * 80 + 250} />
							<ShimmerBlock className={'h-6 w-16 rounded-full'} delay={i * 80 + 300} />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "home") {
		return (
			<div
				className={cn('space-y-5 px-4 mt-5', SKELETON_SECTION_DIVIDER)}
				role="status"
				{...loadingProps}
			>
				{/* AI Briefing */}
				<ShimmerBlock
					className={cn('h-32 rounded-xl', SKELETON_MEDIA_FRAME)}
				/>
				{/* Quick actions */}
				<div className={'flex gap-2'}>
					{[0, 1, 2, 3].map((i) => (
						<ShimmerBlock
							key={`sk-${i}`}
							className={'h-11 w-24 rounded-full'}
						/>
					))}
				</div>
				{/* Section header */}
				<div className={'flex items-center justify-between'}>
					<ShimmerBlock className={'h-5 w-20'} />
					<ShimmerBlock className={'h-5 w-14'} />
				</div>
				{/* Facility cards */}
				<div className={'space-y-3'}>
					{[0, 1, 2].map((i) => (
						<div
							key={`sk-${i}`}
							className={cn('rounded-xl bg-white p-5 shadow-sm dark:bg-dotori-950 dark:shadow-none', SKELETON_GLASS_CARD)}
						>
							<div className={'flex-1 space-y-2'}>
								<ShimmerBlock className={'h-4 w-3/4'} />
								<ShimmerBlock className={'h-3 w-1/2'} />
							</div>
							<ShimmerBlock className={'h-5 w-14'} />
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
					<div key={`sk-${i}`} className={'flex items-center gap-3 py-3.5'}>
						<ShimmerBlock className={'h-10 w-10 rounded-full'} />
						<div className={'flex-1 space-y-2'}>
							<ShimmerBlock className={'h-4 w-3/4'} />
							<ShimmerBlock className={'h-3 w-1/2'} />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (variant === "chat") {
		return (
			<div className={'mb-3 flex gap-2.5'} role="status" {...loadingProps}>
				<ShimmerBlock className={'h-9 w-9 shrink-0 rounded-full'} />
				<ShimmerBlock className={'h-24 w-3/4 rounded-xl rounded-bl-sm'} />
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
				/>
			))}
		</div>
	)
}
