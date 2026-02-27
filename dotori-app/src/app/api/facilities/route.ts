import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { facilityService } from "@/lib/services/facility.service";

const facilitySearchQuerySchema = z.object({
	ids: z.string().max(2000).optional(),
	page: z.string().regex(/^\d+$/).optional(),
	limit: z.string().regex(/^\d+$/).optional(),
	search: z.string().max(200).optional(),
	q: z.string().max(200).optional(),
	type: z.string().max(100).optional(),
	status: z.enum(["available", "waiting", "full"]).optional(),
	sido: z.string().max(50).optional(),
	sigungu: z.string().max(50).optional(),
	sort: z.enum(["distance", "rating", "capacity", "recent"]).optional(),
	lat: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
	lng: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
});
const READ_ONLY_CACHE_CONTROL = "public, max-age=30, s-maxage=30, stale-while-revalidate=60";

type FacilitySearchResult = Awaited<ReturnType<typeof facilityService.search>>;
type FacilitySearchItem = FacilitySearchResult["data"][number];
type FacilityPremiumSnapshot = {
	isActive: boolean;
	sortBoost: number;
};

function sanitizeFacilityListItem(
	facility: FacilitySearchItem,
): Omit<
	FacilitySearchItem,
	"dataQuality" | "createdAt" | "updatedAt" | "kakaoPlaceUrl" | "kakaoPlaceId" | "dataSource" | "roomCount" | "teacherCount" | "establishmentYear" | "operatingHours" | "evaluationGrade"
> {
	const facilityItem = { ...facility } as Partial<FacilitySearchItem>;
	delete facilityItem.dataQuality;
	delete facilityItem.kakaoPlaceUrl;
	delete facilityItem.kakaoPlaceId;
	delete facilityItem.dataSource;
	delete facilityItem.roomCount;
	delete facilityItem.teacherCount;
	delete facilityItem.establishmentYear;
	delete facilityItem.operatingHours;
	delete facilityItem.evaluationGrade;
	delete facilityItem.createdAt;
	delete facilityItem.updatedAt;
	return facilityItem as Omit<
		FacilitySearchItem,
		"dataQuality" | "createdAt" | "updatedAt" | "kakaoPlaceUrl" | "kakaoPlaceId" | "dataSource" | "roomCount" | "teacherCount" | "establishmentYear" | "operatingHours" | "evaluationGrade"
	>;
}

function getFacilityPremiumSortScore(facility: FacilitySearchItem): FacilityPremiumSnapshot {
	const premium = (facility as { premium?: FacilityPremiumSnapshot }).premium;
	const sortBoost =
		typeof premium?.sortBoost === "number" && Number.isFinite(premium.sortBoost)
			? premium.sortBoost
			: 0;
	return {
		isActive: premium?.isActive === true,
		sortBoost,
	};
}

export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const raw = Object.fromEntries(
		Array.from(searchParams.entries()).filter(([, v]) => v !== ""),
	);
	const parsed = facilitySearchQuerySchema.safeParse(raw);
	if (!parsed.success) {
		throw new ApiError("잘못된 검색 파라미터입니다", 400, {
			details: { fields: parsed.error.flatten().fieldErrors },
		});
	}
	const q = parsed.data;
	const hasCustomSort = !!q.sort;
	const result = await facilityService.search({
		ids: q.ids,
		page: q.page,
		limit: q.limit,
		search: q.search,
		q: q.q,
		type: q.type,
		status: q.status,
		sido: q.sido,
		sigungu: q.sigungu,
		sort: q.sort,
		lat: q.lat,
		lng: q.lng,
	});
	let facilitiesData = q.status === "available"
		? result.data.filter((item) => item.capacity.total > item.capacity.current)
		: result.data;

	if (!hasCustomSort) {
		facilitiesData = [...facilitiesData].sort((left, right) => {
			const leftScore = getFacilityPremiumSortScore(left);
			const rightScore = getFacilityPremiumSortScore(right);
			if (leftScore.isActive !== rightScore.isActive) {
				return rightScore.isActive ? 1 : -1;
			}
			if (rightScore.sortBoost !== leftScore.sortBoost) {
				return rightScore.sortBoost - leftScore.sortBoost;
			}
			return 0;
		});
	}

	const facilities = facilitiesData.map(sanitizeFacilityListItem);

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
