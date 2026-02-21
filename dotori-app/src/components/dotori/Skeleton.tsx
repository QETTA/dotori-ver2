import { cn } from "@/lib/utils";

const pulse = "animate-pulse rounded-lg bg-dotori-100";

export function Skeleton({
	variant,
	count = 3,
}: {
	variant: "card" | "list" | "chat" | "text" | "facility-card" | "facility-detail" | "community-post" | "home";
	count?: number;
}) {
	if (variant === "card") {
		return (
			<div className="space-y-3">
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className={cn(pulse, "h-44 rounded-2xl")} />
				))}
			</div>
		);
	}

	if (variant === "facility-card") {
		return (
			<div className="space-y-3">
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={`sk-${i}`}
						className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm"
					>
						<div className="flex-1 space-y-2.5">
							<div className="flex items-center gap-2">
								<div className={cn(pulse, "h-2.5 w-2.5 rounded-full")} />
								<div className={cn(pulse, "h-5 w-2/3")} />
							</div>
							<div className={cn(pulse, "h-4 w-1/2")} />
						</div>
						<div className="space-y-1.5 text-right">
							<div className={cn(pulse, "ml-auto h-5 w-14")} />
							<div className={cn(pulse, "ml-auto h-3 w-10")} />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (variant === "facility-detail") {
		return (
			<div className="space-y-4 px-4">
				{/* Photo placeholder */}
				<div className={cn(pulse, "h-48 rounded-2xl")} />
				{/* Info card */}
				<div className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
					<div className={cn(pulse, "h-6 w-3/4")} />
					<div className="flex gap-2">
						<div className={cn(pulse, "h-6 w-16 rounded-full")} />
						<div className={cn(pulse, "h-6 w-16 rounded-full")} />
					</div>
				</div>
				{/* Capacity cards */}
				<div className="grid grid-cols-3 gap-2.5">
					{[0, 1, 2].map((i) => (
						<div key={`sk-${i}`} className="rounded-2xl bg-white p-4 shadow-sm space-y-2">
							<div className={cn(pulse, "mx-auto h-8 w-12")} />
							<div className={cn(pulse, "mx-auto h-3 w-8")} />
						</div>
					))}
				</div>
				{/* CTA button */}
				<div className={cn(pulse, "h-14 rounded-2xl")} />
			</div>
		);
	}

	if (variant === "community-post") {
		return (
			<div className="space-y-3">
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={`sk-${i}`}
						className="rounded-2xl bg-white p-5 shadow-sm space-y-3"
					>
						<div className="flex items-center gap-2.5">
							<div className={cn(pulse, "h-10 w-10 rounded-full")} />
							<div className="flex-1 space-y-1.5">
								<div className={cn(pulse, "h-4 w-24")} />
								<div className={cn(pulse, "h-3 w-16")} />
							</div>
						</div>
						<div className="space-y-2">
							<div className={cn(pulse, "h-4 w-full")} />
							<div className={cn(pulse, "h-4 w-4/5")} />
						</div>
						<div className="flex gap-4">
							<div className={cn(pulse, "h-8 w-16 rounded-full")} />
							<div className={cn(pulse, "h-8 w-16 rounded-full")} />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (variant === "home") {
		return (
			<div className="space-y-5 px-4 mt-5">
				{/* AI Briefing */}
				<div className={cn(pulse, "h-32 rounded-2xl")} />
				{/* Quick actions */}
				<div className="flex gap-2">
					{[0, 1, 2, 3].map((i) => (
						<div key={`sk-${i}`} className={cn(pulse, "h-11 w-24 rounded-full")} />
					))}
				</div>
				{/* Section header */}
				<div className="flex items-center justify-between">
					<div className={cn(pulse, "h-5 w-20")} />
					<div className={cn(pulse, "h-4 w-14")} />
				</div>
				{/* Facility cards */}
				<div className="space-y-3">
					{[0, 1, 2].map((i) => (
						<div key={`sk-${i}`} className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
							<div className="flex-1 space-y-2">
								<div className={cn(pulse, "h-5 w-3/4")} />
								<div className={cn(pulse, "h-3 w-1/2")} />
							</div>
							<div className={cn(pulse, "h-5 w-14")} />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (variant === "list") {
		return (
			<div>
				{Array.from({ length: count }).map((_, i) => (
					<div key={`sk-${i}`} className="flex items-center gap-3 py-3.5">
						<div className={cn(pulse, "h-10 w-10 rounded-full")} />
						<div className="flex-1 space-y-2">
							<div className={cn(pulse, "h-4 w-3/4")} />
							<div className={cn(pulse, "h-3 w-1/2")} />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (variant === "chat") {
		return (
			<div className="mb-3 flex gap-2.5">
				<div className={cn(pulse, "h-9 w-9 shrink-0 rounded-full")} />
				<div className={cn(pulse, "h-24 w-3/4 rounded-2xl rounded-bl-sm")} />
			</div>
		);
	}

	// text
	return (
		<div>
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={`sk-${i}`}
					className={cn(pulse, "mb-2.5 h-4", i === count - 1 && "w-2/3")}
				/>
			))}
		</div>
	);
}
