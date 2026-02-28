import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Partner from "@/models/Partner";
import { createPartner } from "@/lib/engines/partner-auth";

const createPartnerSchema = z.object({
	name: z.string().min(1).max(100),
	contactEmail: z.string().email().max(200),
	contactPhone: z.string().max(20).optional(),
	tier: z.enum(["free", "basic", "pro", "enterprise"]).optional(),
});

/** POST /api/partners — Register a new partner */
export const POST = withApiHandler(async (_req, { body }) => {
	const { partner, rawApiKey } = await createPartner(body);
	return NextResponse.json(
		{
			data: {
				...partner.toJSON(),
				apiKey: rawApiKey,
			},
		},
		{ status: 201 },
	);
}, { schema: createPartnerSchema, rateLimiter: standardLimiter });

/** GET /api/partners — List all partners (admin) */
export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		Partner.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
		Partner.countDocuments(),
	]);

	return NextResponse.json({
		data,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	});
}, { rateLimiter: standardLimiter });
