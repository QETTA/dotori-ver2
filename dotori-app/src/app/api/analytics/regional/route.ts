import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { getRegionalStats } from "@/lib/engines/regional-analytics-engine";

/** GET /api/analytics/regional — Regional facility statistics */
export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const sido = searchParams.get("sido") ?? undefined;
	const sigungu = searchParams.get("sigungu") ?? undefined;

	const stats = await getRegionalStats({ sido, sigungu });

	return NextResponse.json({ data: stats });
}, { auth: false, rateLimiter: relaxedLimiter, cacheControl: "public, max-age=300, stale-while-revalidate=600" });
