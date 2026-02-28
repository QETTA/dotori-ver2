import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { generateMarketReport } from "@/lib/engines/regional-analytics-engine";

/** GET /api/analytics/regional/report — Comprehensive market report */
export const GET = withApiHandler(async () => {
	const report = await generateMarketReport();
	return NextResponse.json({ data: report });
}, { auth: false, rateLimiter: standardLimiter, cacheControl: "public, max-age=600, stale-while-revalidate=1200" });
