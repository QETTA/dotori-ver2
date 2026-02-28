import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Partner from "@/models/Partner";
import { TIER_RATE_LIMITS } from "@/models/Partner";

const updatePartnerSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	contactEmail: z.string().email().max(200).optional(),
	contactPhone: z.string().max(20).optional(),
	tier: z.enum(["free", "basic", "pro", "enterprise"]).optional(),
	isActive: z.boolean().optional(),
	cpaConfig: z
		.object({
			enabled: z.boolean().optional(),
			rate: z.number().min(0).optional(),
			events: z.array(z.string()).optional(),
		})
		.optional(),
});

/** GET /api/partners/[id] — Partner detail */
export const GET = withApiHandler(async (_req, { params }) => {
	const partner = await Partner.findById(params.id).lean();
	if (!partner) throw new NotFoundError("파트너를 찾을 수 없습니다");
	return NextResponse.json({ data: partner });
}, { rateLimiter: standardLimiter });

/** PATCH /api/partners/[id] — Update partner */
export const PATCH = withApiHandler(async (_req, { body, params }) => {
	const update: Record<string, unknown> = { ...body };

	// Auto-update rate limit when tier changes
	if (body.tier) {
		update.rateLimit = TIER_RATE_LIMITS[body.tier];
	}

	const partner = await Partner.findByIdAndUpdate(
		params.id,
		{ $set: update },
		{ new: true, runValidators: true },
	).lean();

	if (!partner) throw new NotFoundError("파트너를 찾을 수 없습니다");
	return NextResponse.json({ data: partner });
}, { schema: updatePartnerSchema, rateLimiter: standardLimiter });

/** DELETE /api/partners/[id] — Deactivate partner */
export const DELETE = withApiHandler(async (_req, { params }) => {
	const partner = await Partner.findByIdAndUpdate(
		params.id,
		{ $set: { isActive: false } },
		{ new: true },
	).lean();

	if (!partner) throw new NotFoundError("파트너를 찾을 수 없습니다");
	return NextResponse.json({ data: { success: true } });
}, { rateLimiter: standardLimiter });
