import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { facilityService } from "@/lib/services/facility.service";
const READ_ONLY_CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=60";

export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const result = await facilityService.search({
		ids: searchParams.get("ids") || undefined,
		page: searchParams.get("page") || undefined,
		limit: searchParams.get("limit") || undefined,
		search: searchParams.get("search") || undefined,
		q: searchParams.get("q") || undefined,
		type: searchParams.get("type") || undefined,
		status: searchParams.get("status") || undefined,
		sido: searchParams.get("sido") || undefined,
		sigungu: searchParams.get("sigungu") || undefined,
		sort: searchParams.get("sort") || undefined,
		lat: searchParams.get("lat") || undefined,
		lng: searchParams.get("lng") || undefined,
	});

	return NextResponse.json(result);
}, {
	auth: false,
	rateLimiter: relaxedLimiter,
	cacheControl: READ_ONLY_CACHE_CONTROL,
});
