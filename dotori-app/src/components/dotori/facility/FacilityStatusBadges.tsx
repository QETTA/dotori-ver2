import { Badge } from "@/components/catalyst/badge";
import type { Facility } from "@/types/dotori";
import {
	getFacilityStatusBadge,
	getQualityColor,
	getTypeBadgeColor,
	UNVERIFIED_FACILITY_HINT,
	VERIFIED_FACILITY_LABEL,
} from "./facility-detail-helpers";

interface FacilityStatusBadgesProps {
	facilityType: string;
	status: Facility["status"];
	qualityScore?: number;
	isPremiumFacility: boolean;
}

export function FacilityStatusBadges({
	facilityType,
	status,
	qualityScore,
	isPremiumFacility,
}: FacilityStatusBadgesProps) {
	const facilityStatusBadge = getFacilityStatusBadge(status);

	return (
		<div className="mx-5 mt-3 flex flex-wrap gap-1.5">
			<Badge color={getTypeBadgeColor(facilityType)}>{facilityType}</Badge>
			<Badge color={facilityStatusBadge.color}>{facilityStatusBadge.label}</Badge>
			{isPremiumFacility ? (
				<Badge color="forest">{VERIFIED_FACILITY_LABEL}</Badge>
			) : null}
			<Badge color={getQualityColor(qualityScore)}>
				{qualityScore == null
					? "데이터 품질 미공개"
					: `데이터 품질 점수 ${qualityScore}점`}
			</Badge>
			{!isPremiumFacility ? (
				<span className="text-sm text-dotori-500">{UNVERIFIED_FACILITY_HINT}</span>
			) : null}
		</div>
	);
}
