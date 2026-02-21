import { Skeleton } from "@/components/dotori/Skeleton";

export default function ExploreLoading() {
	return (
		<div className="space-y-3 px-5 pt-16">
			{Array.from({ length: 4 }).map((_, i) => (
				<Skeleton key={i} variant="facility-card" />
			))}
		</div>
	);
}
