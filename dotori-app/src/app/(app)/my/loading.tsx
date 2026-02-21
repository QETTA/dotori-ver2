import { Skeleton } from "@/components/dotori/Skeleton";

export default function MyLoading() {
	return (
		<div className="space-y-4 px-5 pt-6">
			{/* Profile skeleton */}
			<div className="flex items-center gap-4">
				<div className="h-16 w-16 animate-pulse rounded-full bg-dotori-100" />
				<div className="flex-1 space-y-2">
					<div className="h-5 w-32 animate-pulse rounded bg-dotori-100" />
					<div className="h-4 w-48 animate-pulse rounded bg-dotori-50" />
				</div>
			</div>
			{/* Menu items skeleton */}
			{Array.from({ length: 4 }).map((_, i) => (
				<Skeleton key={i} variant="list" />
			))}
		</div>
	);
}
