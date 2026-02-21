import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const pulse = "animate-pulse rounded-xl bg-dotori-100";
const pulseWithShimmer = `${pulse} animate-[shimmer_1.4s_ease-in-out_infinite]`;
const shimmerKeyframes = `
@keyframes shimmer {
  0%, 100% { opacity: 0.6 }
  50% { opacity: 1 }
}
`;

export function Skeleton({
  variant,
  count = 3,
}: {
	variant: "card" | "list" | "chat" | "text" | "facility-card" | "facility-detail" | "community-post" | "home";
  count?: number;
}) {
  const withShimmer = (content: ReactNode) => (
    <>
      <style>{shimmerKeyframes}</style>
      {content}
    </>
  );

	const loadingProps = {
		"aria-busy": true,
		"aria-label": "로딩 중",
	};

	if (variant === "card") {
		return withShimmer(
			<div className="space-y-3" role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className={cn(pulseWithShimmer, "h-44")} />
				))}
			</div>
		);
	}

	if (variant === "facility-card") {
		return withShimmer(
			<div className="space-y-3" role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={`sk-${i}`}
						className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm"
					>
						<div className="flex-1 space-y-2.5">
							<div className="flex items-center gap-2">
								<div className={cn(pulseWithShimmer, "h-2.5 w-2.5 rounded-full")} />
								<div className={cn(pulseWithShimmer, "h-5 w-2/3")} />
							</div>
							<div className={cn(pulseWithShimmer, "h-4 w-1/2")} />
						</div>
						<div className="space-y-1.5 text-right">
							<div className={cn(pulseWithShimmer, "ml-auto h-5 w-14")} />
							<div className={cn(pulseWithShimmer, "ml-auto h-3 w-10")} />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (variant === "facility-detail") {
		return withShimmer(
			<div className="space-y-4 px-4" role="status" {...loadingProps}>
				{/* Photo placeholder */}
				<div className={cn(pulseWithShimmer, "h-48")} />
				{/* Info card */}
				<div className="rounded-xl bg-white p-5 shadow-sm space-y-3">
					<div className={cn(pulseWithShimmer, "h-6 w-3/4")} />
					<div className="flex gap-2">
						<div className={cn(pulseWithShimmer, "h-6 w-16 rounded-full")} />
						<div className={cn(pulseWithShimmer, "h-6 w-16 rounded-full")} />
					</div>
				</div>
				{/* Capacity cards */}
				<div className="grid grid-cols-3 gap-2.5">
					{[0, 1, 2].map((i) => (
						<div key={`sk-${i}`} className="rounded-xl bg-white p-4 shadow-sm space-y-2">
							<div className={cn(pulseWithShimmer, "mx-auto h-8 w-12")} />
							<div className={cn(pulseWithShimmer, "mx-auto h-3 w-8")} />
						</div>
					))}
				</div>
				{/* CTA button */}
				<div className={cn(pulseWithShimmer, "h-14")} />
			</div>
		);
	}

	if (variant === "community-post") {
		return withShimmer(
			<div className="space-y-3" role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={`sk-${i}`}
						className="rounded-xl bg-white p-5 shadow-sm space-y-3"
					>
						<div className="flex items-center gap-2.5">
							<div className={cn(pulseWithShimmer, "h-10 w-10 rounded-full")} />
							<div className="flex-1 space-y-1.5">
								<div className={cn(pulseWithShimmer, "h-4 w-24")} />
								<div className={cn(pulseWithShimmer, "h-3 w-16")} />
							</div>
						</div>
						<div className="space-y-2">
							<div className={cn(pulseWithShimmer, "h-4 w-full")} />
							<div className={cn(pulseWithShimmer, "h-4 w-4/5")} />
						</div>
						<div className="flex gap-4">
							<div className={cn(pulseWithShimmer, "h-8 w-16 rounded-full")} />
							<div className={cn(pulseWithShimmer, "h-8 w-16 rounded-full")} />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (variant === "home") {
		return withShimmer(
			<div className="space-y-5 px-4 mt-5" role="status" {...loadingProps}>
				{/* AI Briefing */}
				<div className={cn(pulseWithShimmer, "h-32")} />
				{/* Quick actions */}
				<div className="flex gap-2">
					{[0, 1, 2, 3].map((i) => (
						<div key={`sk-${i}`} className={cn(pulseWithShimmer, "h-11 w-24 rounded-full")} />
					))}
				</div>
				{/* Section header */}
				<div className="flex items-center justify-between">
					<div className={cn(pulseWithShimmer, "h-5 w-20")} />
					<div className={cn(pulseWithShimmer, "h-4 w-14")} />
				</div>
				{/* Facility cards */}
				<div className="space-y-3">
					{[0, 1, 2].map((i) => (
						<div key={`sk-${i}`} className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm">
							<div className="flex-1 space-y-2">
								<div className={cn(pulseWithShimmer, "h-5 w-3/4")} />
								<div className={cn(pulseWithShimmer, "h-3 w-1/2")} />
							</div>
							<div className={cn(pulseWithShimmer, "h-5 w-14")} />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (variant === "list") {
		return withShimmer(
			<div role="status" {...loadingProps}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className="flex items-center gap-3 py-3.5">
						<div className={cn(pulseWithShimmer, "h-10 w-10 rounded-full")} />
						<div className="flex-1 space-y-2">
							<div className={cn(pulseWithShimmer, "h-4 w-3/4")} />
							<div className={cn(pulseWithShimmer, "h-3 w-1/2")} />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (variant === "chat") {
		return withShimmer(
			<div className="mb-3 flex gap-2.5" role="status" {...loadingProps}>
				<div className={cn(pulseWithShimmer, "h-9 w-9 shrink-0 rounded-full")} />
				<div className={cn(pulseWithShimmer, "h-24 w-3/4 rounded-xl rounded-bl-sm")} />
			</div>
		);
	}

	// text
	return withShimmer(
		<div role="status" {...loadingProps}>
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={`sk-${i}`}
					className={cn(pulseWithShimmer, "mb-2.5 h-4", i === count - 1 && "w-2/3")}
				/>
			))}
		</div>
	);
}
