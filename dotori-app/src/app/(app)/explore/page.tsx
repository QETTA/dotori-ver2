"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { ExploreResultList } from "@/components/dotori/explore/ExploreResultList";
import { ExploreSearchHeader } from "@/components/dotori/explore/ExploreSearchHeader";
import { useExploreSearch } from "@/components/dotori/explore/useExploreSearch";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useFacilityActions } from "@/hooks/use-facility-actions";

const MapEmbed = dynamic(
	() => import("@/components/dotori/MapEmbed").then((mod) => mod.MapEmbed),
	{ ssr: false },
);

export default function ExplorePage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[calc(100dvh-8rem)] flex-col">
					<div className="px-5 pt-4">
						<Skeleton variant="facility-card" count={6} />
					</div>
				</div>
			}
		>
			<ExploreContent />
		</Suspense>
	);
}

function ExploreContent() {
	const { headerState, headerActions, resultState, resultActions, mapState } =
		useExploreSearch();
	const { registerInterest, applyWaiting, loadingAction } = useFacilityActions();
	const registerInterestRef = useRef(registerInterest);
	const applyWaitingRef = useRef(applyWaiting);

	useEffect(() => {
		registerInterestRef.current = registerInterest;
	}, [registerInterest]);

	useEffect(() => {
		applyWaitingRef.current = applyWaiting;
	}, [applyWaiting]);

	const handleRegisterInterest = useCallback(
		(facilityId: string) => {
			void registerInterestRef.current(facilityId);
		},
		[],
	);

	const handleApplyWaiting = useCallback(
		(facilityId: string) => {
			void applyWaitingRef.current(facilityId);
		},
		[],
	);

	const resultInteraction = useMemo(
		() => ({
			loadingAction,
			onRegisterInterest: handleRegisterInterest,
			onApplyWaiting: handleApplyWaiting,
		}),
		[handleApplyWaiting, handleRegisterInterest, loadingAction],
	);

	return (
		<div className="flex h-[calc(100dvh-8rem)] flex-col">
			<ExploreSearchHeader state={headerState} actions={headerActions} />

			{mapState.showMap && mapState.hasMapContent ? (
				<div className="px-4 pt-2 duration-200 motion-safe:animate-in motion-safe:fade-in">
					<MapEmbed
						facilities={mapState.facilities}
						{...(mapState.center ? { center: mapState.center } : {})}
						{...(mapState.userLocation
							? { userLocation: mapState.userLocation }
							: {})}
						height="h-48 sm:h-64"
					/>
				</div>
			) : null}

			<ExploreResultList
				state={resultState}
				actions={resultActions}
				interaction={resultInteraction}
			/>
		</div>
	);
}
