import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { subscriptionService } from "@/lib/services/subscription.service";

const cancelSchema = z.object({
	action: z.literal("cancel"),
});

/** GET /api/subscriptions/[id] — 구독 상세 */
export const GET = withApiHandler(async (_req, { userId, params }) => {
	const sub = await subscriptionService.findById(params.id, userId);
	return NextResponse.json({ data: sub });
}, { rateLimiter: standardLimiter });

/** PATCH /api/subscriptions/[id] — 해지 */
export const PATCH = withApiHandler(async (_req, { userId, body, params }) => {
	if (body.action === "cancel") {
		const updated = await subscriptionService.cancel(params.id, userId);
		return NextResponse.json({ data: updated });
	}

	throw new ApiError("지원하지 않는 작업입니다", 400);
}, { schema: cancelSchema, rateLimiter: standardLimiter });
