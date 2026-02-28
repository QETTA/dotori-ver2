import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { getCampaignAnalytics } from "@/lib/engines/campaign-engine";

/** GET /api/campaigns/[id]/analytics — Campaign performance */
export const GET = withApiHandler(async (_req, { params }) => {
	const analytics = await getCampaignAnalytics(params.id);
	if (!analytics) throw new NotFoundError("캠페인을 찾을 수 없습니다");
	return NextResponse.json({ data: analytics });
}, { rateLimiter: relaxedLimiter });
