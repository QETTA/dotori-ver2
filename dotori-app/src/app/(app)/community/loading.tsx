import { Skeleton } from "@/components/dotori/Skeleton";

export default function CommunityLoading() {
	return (
		<div className="space-y-3 px-5 pt-16">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} variant="community-post" />
			))}
		</div>
	);
}
