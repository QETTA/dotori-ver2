"use client";

import dynamic from "next/dynamic";
import { memo, Suspense } from "react";
import { ExploreResultList } from "@/components/dotori/explore/ExploreResultList";
import { ExploreSearchHeader } from "@/components/dotori/explore/ExploreSearchHeader";
import {
	type ExploreMapState,
	useExploreResultInteraction,
	useExploreSearch,
} from "@/components/dotori/explore/useExploreSearch";
import { Skeleton } from "@/components/dotori/Skeleton";
import { DS_GLASS } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";

const MapEmbed = dynamic(
	() => import("@/components/dotori/MapEmbed").then((mod) => mod.MapEmbed),
	{ ssr: false },
);

export default function ExplorePage() {
	return (
		<Suspense
			fallback={
				<div
					className={cn(
						"flex h-[calc(100dvh-8rem)] flex-col bg-dotori-50 text-dotori-900 dark:bg-dotori-950 dark:text-dotori-50",
						DS_GLASS.CARD,
					)}
				>
					<div className="px-4 pt-3">
						<Skeleton variant="facility-card" count={6} />
					</div>
				</div>
			}
		>
			<ExploreContent />
		</Suspense>
	);
}

interface ExploreMapSectionProps {
	mapState: ExploreMapState;
}

const ExploreMapSection = memo(function ExploreMapSection({
	mapState,
}: ExploreMapSectionProps) {
	if (!mapState.showMap || !mapState.hasMapContent) return null;

	return (
		<div
			className={cn(
				"px-4 pt-2 duration-200 motion-safe:animate-in motion-safe:fade-in",
				DS_GLASS.CARD,
			)}
		>
			<MapEmbed
				facilities={mapState.facilities}
				{...(mapState.center ? { center: mapState.center } : {})}
				{...(mapState.userLocation ? { userLocation: mapState.userLocation } : {})}
				height="h-48 sm:h-64"
			/>
		</div>
	);
});

function ExploreContent() {
	const { headerState, headerActions, resultState, resultActions, mapState } =
		useExploreSearch();
	const resultInteraction = useExploreResultInteraction();

	return (
		<div className="flex h-[calc(100dvh-8rem)] flex-col bg-gradient-to-b from-dotori-50 via-dotori-50 to-dotori-100/60 text-dotori-900 dark:bg-dotori-950 dark:text-dotori-50">
			<ExploreSearchHeader state={headerState} actions={headerActions} />

			<ExploreMapSection mapState={mapState} />

			<ExploreResultList
				state={resultState}
				actions={resultActions}
				interaction={resultInteraction}
			/>
		</div>
	);
}
