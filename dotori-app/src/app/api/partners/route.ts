import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler, ForbiddenError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Partner from "@/models/Partner";
import User from "@/models/User";
import { createPartner } from "@/lib/engines/partner-auth";

const createPartnerSchema = z.object({
	name: z.string().min(1).max(100),
	contactEmail: z.string().email().max(200),
	contactPhone: z.string().max(20).optional(),
	tier: z.enum(["free", "basic", "pro", "enterprise"]).optional(),
});

/** POST /api/partners — Register a new partner (admin only) */
export const POST = withApiHandler(async (_req, { userId, body }) => {
	const user = await User.findById(userId).select("role").lean<{ role?: string }>();
	if (user?.role !== "admin") {
		throw new ForbiddenError("관리자만 파트너를 등록할 수 있습니다");
	}

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

/** GET /api/partners — List all partners (admin only) */
export const GET = withApiHandler(async (req, { userId }) => {
	const user = await User.findById(userId).select("role").lean<{ role?: string }>();
	if (user?.role !== "admin") {
		throw new ForbiddenError("관리자만 파트너 목록을 조회할 수 있습니다");
	}

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
