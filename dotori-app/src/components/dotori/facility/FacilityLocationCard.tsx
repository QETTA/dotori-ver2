import { MapEmbed } from "@/components/dotori/MapEmbed";
import type { Facility } from "@/types/dotori";

interface FacilityLocationCardProps {
	facility: Facility;
}

export function FacilityLocationCard({ facility }: FacilityLocationCardProps) {
	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in duration-400">
			<h3 className="mb-3 font-semibold">위치 &amp; 교통</h3>
			<MapEmbed
				facilities={[
					{
						id: facility.id,
						name: facility.name,
						lat: facility.lat,
						lng: facility.lng,
						status: facility.status,
					},
				]}
			/>
			<div className="mt-3 space-y-1 text-sm text-dotori-700">
				<p>{facility.address}</p>
				{facility.phone && (
					<p className="text-dotori-500">
						전화: {facility.phone}
					</p>
				)}
				{facility.distance && (
					<p className="text-dotori-500">
						{facility.distance} (내 위치 기준)
					</p>
				)}
				{facility.kakaoPlaceUrl && (
					<a
						href={facility.kakaoPlaceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-dotori-500 hover:text-dotori-500"
					>
						카카오맵에서 보기 →
					</a>
				)}
			</div>
		</section>
	);
}
