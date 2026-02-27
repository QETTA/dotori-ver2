import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler, ApiError } from "@/lib/api-handler";
import { standardLimiter, createRateLimiter } from "@/lib/rate-limit";
import { visitCreateSchema } from "@/lib/validations";
import { visitService } from "@/lib/services/visit.service";
import { toVisitDTO } from "@/lib/dto";
import { API_CONFIG } from "@/lib/config/api";
import Visit from "@/models/Visit";

const visitQuerySchema = z.object({
	status: z.enum(["requested", "confirmed", "completed", "cancelled"]).optional(),
	page: z.string().regex(/^\d+$/).optional(),
	limit: z.string().regex(/^\d+$/).optional(),
});

const visitWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

/** GET /api/visits — 내 견학 목록 */
export const GET = withApiHandler(async (req, { userId }) => {
	const raw = Object.fromEntries(
		Array.from(req.nextUrl.searchParams.entries()).filter(([, v]) => v !== ""),
	);
	const parsed = visitQuerySchema.safeParse(raw);
	if (!parsed.success) {
		throw new ApiError("잘못된 검색 파라미터입니다", 400);
	}

	const result = await visitService.findByUser(userId, {
		page: parsed.data.page,
		limit: parsed.data.limit,
		status: parsed.data.status,
	});

	return NextResponse.json({
		data: result.data.map(toVisitDTO),
		pagination: result.pagination,
	});
}, { rateLimiter: standardLimiter });

/** POST /api/visits — 견학 신청 */
export const POST = withApiHandler(async (_req, { userId, body }) => {
	// maxActive 제한
	const activeCount = await Visit.countDocuments({
		userId,
		status: { $in: ["requested", "confirmed"] },
	});
	if (activeCount >= API_CONFIG.VISIT.maxActivePerUser) {
		throw new ApiError(
			`활성 견학 신청은 최대 ${API_CONFIG.VISIT.maxActivePerUser}개까지 가능합니다`,
			400,
		);
	}

	const doc = await visitService.create({
		userId,
		facilityId: body.facilityId,
		scheduledAt: body.scheduledAt,
		childId: body.childId,
		notes: body.notes,
	});

	return NextResponse.json({ data: toVisitDTO(doc) }, { status: 201 });
}, { schema: visitCreateSchema, rateLimiter: visitWriteLimiter });
