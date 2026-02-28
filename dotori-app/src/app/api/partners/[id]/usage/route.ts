import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import Partner from "@/models/Partner";
import { getUsageStats } from "@/lib/engines/partner-auth";

/** GET /api/partners/[id]/usage — Usage statistics */
export const GET = withApiHandler(async (req, { params }) => {
	const partner = await Partner.findById(params.id).lean();
	if (!partner) throw new NotFoundError("파트너를 찾을 수 없습니다");

	const { searchParams } = req.nextUrl;
	const days = Math.min(365, Math.max(1, Number(searchParams.get("days")) || 30));

	const stats = await getUsageStats(params.id, days);

	return NextResponse.json({ data: stats });
}, { rateLimiter: relaxedLimiter });
