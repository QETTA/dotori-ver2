import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { createRateLimiter } from "@/lib/rate-limit";
import { reviewService } from "@/lib/services/review.service";

const helpfulLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

/** POST /api/facilities/[id]/reviews/[reviewId]/helpful — 도움됨 토글 */
export const POST = withApiHandler(async (_req, { userId, params }) => {
	const result = await reviewService.toggleHelpful(params.reviewId, userId);
	return NextResponse.json({ data: result });
}, { rateLimiter: helpfulLimiter });
