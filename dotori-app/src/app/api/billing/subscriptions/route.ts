import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import BillingSubscription from "@/models/BillingSubscription";
import { createSubscription } from "@/lib/engines/billing-engine";

const createSubscriptionSchema = z.object({
	partnerId: z.string().min(1),
	planId: z.enum(["starter", "growth", "enterprise"]),
	billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
	withTrial: z.boolean().default(true),
});

/** POST /api/billing/subscriptions — Create subscription */
export const POST = withApiHandler(async (_req, { body }) => {
	const result = await createSubscription(body);

	return NextResponse.json(
		{
			data: {
				subscription: result.subscription.toJSON(),
				invoice: result.invoice?.toJSON() ?? null,
			},
		},
		{ status: 201 },
	);
}, { schema: createSubscriptionSchema, rateLimiter: standardLimiter });

/** GET /api/billing/subscriptions — List subscriptions */
export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const partnerId = searchParams.get("partnerId");
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = {};
	if (partnerId) filter.partnerId = partnerId;

	const [data, total] = await Promise.all([
		BillingSubscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
		BillingSubscription.countDocuments(filter),
	]);

	return NextResponse.json({
		data,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	});
}, { rateLimiter: standardLimiter });
