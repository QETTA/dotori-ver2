import { Badge } from "@/components/catalyst/badge";
import { SourceChip } from "@/components/dotori/SourceChip";
import { facilityStatusLabel, facilityTypeBadgeColor } from "@/lib/utils";
import type { Facility } from "@/types/dotori";

interface FacilityInfoCardProps {
	facility: Facility;
}

export function FacilityInfoCard({ facility }: FacilityInfoCardProps) {
	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm">
			<div className="flex items-center gap-2">
				<h2 className="text-xl font-bold">{facility.name}</h2>
				{facility.rating > 0 && (
					<span className="text-[14px] text-dotori-400">
						★ {facility.rating}
					</span>
				)}
			</div>
			<div className="mt-2 flex items-center gap-2">
				<Badge color={facilityTypeBadgeColor(facility.type)}>
					{facility.type}
				</Badge>
				<Badge
					color={
						facility.status === "available"
							? "forest"
							: facility.status === "waiting"
								? "amber"
								: "red"
					}
				>
					{facilityStatusLabel(facility.status)}
				</Badge>
			</div>
			<div className="mt-2">
				<SourceChip
					source="아이사랑"
					updatedAt={facility.lastSyncedAt}
					freshness="realtime"
				/>
			</div>
		</section>
	);
}
