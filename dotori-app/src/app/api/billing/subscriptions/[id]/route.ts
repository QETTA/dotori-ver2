import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import BillingSubscription from "@/models/BillingSubscription";
import {
	activateSubscription,
	cancelSubscription,
	changePlan,
} from "@/lib/engines/billing-engine";

const updateSubscriptionSchema = z.object({
	action: z.enum(["activate", "cancel", "change_plan"]),
	planId: z.enum(["starter", "growth", "enterprise"]).optional(),
	billingCycle: z.enum(["monthly", "yearly"]).optional(),
});

/** GET /api/billing/subscriptions/[id] — Subscription detail */
export const GET = withApiHandler(async (_req, { params }) => {
	const sub = await BillingSubscription.findById(params.id).lean();
	if (!sub) throw new NotFoundError("구독을 찾을 수 없습니다");
	return NextResponse.json({ data: sub });
}, { rateLimiter: standardLimiter });

/** PATCH /api/billing/subscriptions/[id] — Update subscription */
export const PATCH = withApiHandler(async (_req, { body, params }) => {
	let result;

	switch (body.action) {
		case "activate":
			result = await activateSubscription(params.id);
			break;
		case "cancel":
			result = await cancelSubscription(params.id);
			break;
		case "change_plan":
			if (!body.planId) {
				return NextResponse.json(
					{ error: "planId is required for change_plan action" },
					{ status: 400 },
				);
			}
			result = await changePlan(params.id, body.planId, body.billingCycle);
			break;
	}

	if (!result) throw new NotFoundError("구독을 찾을 수 없거나 상태 변경이 불가합니다");
	return NextResponse.json({ data: result });
}, { schema: updateSubscriptionSchema, rateLimiter: standardLimiter });
