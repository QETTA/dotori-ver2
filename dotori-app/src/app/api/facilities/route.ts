import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { facilityService } from "@/lib/services/facility.service";
const READ_ONLY_CACHE_CONTROL = "public, max-age=30, s-maxage=30, stale-while-revalidate=60";

const ALLOWED_FACILITY_STATUS = ["available", "waiting", "full"] as const;
type FacilitySearchResult = Awaited<ReturnType<typeof facilityService.search>>;
type FacilitySearchItem = FacilitySearchResult["data"][number];

function sanitizeStatus(
	rawStatus: string | null,
): (typeof ALLOWED_FACILITY_STATUS)[number] | undefined {
	if (!rawStatus) {
		return undefined;
	}
	return ALLOWED_FACILITY_STATUS.includes(rawStatus as (typeof ALLOWED_FACILITY_STATUS)[number])
		? (rawStatus as (typeof ALLOWED_FACILITY_STATUS)[number])
		: undefined;
}

function sanitizeFacilityListItem(
	facility: FacilitySearchItem,
): Omit<
	FacilitySearchItem,
	"dataQuality" | "createdAt" | "updatedAt" | "kakaoPlaceUrl" | "kakaoPlaceId" | "dataSource" | "roomCount" | "teacherCount" | "establishmentYear" | "operatingHours" | "evaluationGrade"
> {
	const {
		dataQuality,
		kakaoPlaceUrl,
		kakaoPlaceId,
		dataSource,
		roomCount,
		teacherCount,
		establishmentYear,
		operatingHours,
		evaluationGrade,
		createdAt,
		updatedAt,
		...facilityItem
	} = facility;
	return facilityItem;
}

export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const status = sanitizeStatus(searchParams.get("status"));
	const result = await facilityService.search({
		ids: searchParams.get("ids") || undefined,
		page: searchParams.get("page") || undefined,
		limit: searchParams.get("limit") || undefined,
		search: searchParams.get("search") || undefined,
		q: searchParams.get("q") || undefined,
		type: searchParams.get("type") || undefined,
		status: status || undefined,
		sido: searchParams.get("sido") || undefined,
		sigungu: searchParams.get("sigungu") || undefined,
		sort: searchParams.get("sort") || undefined,
		lat: searchParams.get("lat") || undefined,
		lng: searchParams.get("lng") || undefined,
	});
	const facilities = (status === "available"
		? result.data.filter((item) => item.capacity.total > item.capacity.current)
		: result.data).map(sanitizeFacilityListItem);

	const response = {
		...result,
		data: facilities,
	};

	return NextResponse.json(response);
}, {
	auth: false,
	rateLimiter: relaxedLimiter,
	cacheControl: READ_ONLY_CACHE_CONTROL,
});
