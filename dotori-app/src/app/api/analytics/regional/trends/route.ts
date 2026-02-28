import { NextResponse } from "next/server";
import { withApiHandler, BadRequestError } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { getRegionalTrends } from "@/lib/engines/regional-analytics-engine";

/** GET /api/analytics/regional/trends — Monthly trend data */
export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const sido = searchParams.get("sido");
	if (!sido) throw new BadRequestError("sido parameter is required");

	const sigungu = searchParams.get("sigungu") ?? undefined;
	const months = Math.min(24, Math.max(1, Number(searchParams.get("months")) || 6));

	const trends = await getRegionalTrends({ sido, sigungu, months });

	return NextResponse.json({ data: trends });
}, { auth: false, rateLimiter: relaxedLimiter, cacheControl: "public, max-age=300, stale-while-revalidate=600" });
