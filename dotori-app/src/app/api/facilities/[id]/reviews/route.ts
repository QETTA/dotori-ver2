import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter, createRateLimiter } from "@/lib/rate-limit";
import { reviewCreateSchema } from "@/lib/validations";
import { reviewService } from "@/lib/services/review.service";
import { toReviewDTO } from "@/lib/dto";

const reviewQuerySchema = z.object({
	sort: z.enum(["recent", "rating", "helpful"]).optional(),
	page: z.string().regex(/^\d+$/).optional(),
	limit: z.string().regex(/^\d+$/).optional(),
});

const reviewWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/** GET /api/facilities/[id]/reviews — 시설 리뷰 목록 (공개) */
export const GET = withApiHandler(async (req, { params }) => {
	const raw = Object.fromEntries(
		Array.from(req.nextUrl.searchParams.entries()).filter(([, v]) => v !== ""),
	);
	const parsed = reviewQuerySchema.safeParse(raw);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "잘못된 검색 파라미터입니다" },
			{ status: 400 },
		);
	}

	const result = await reviewService.listByFacility(params.id, {
		page: parsed.data.page,
		limit: parsed.data.limit,
		sort: parsed.data.sort,
	});

	return NextResponse.json({
		data: result.data.map(toReviewDTO),
		pagination: result.pagination,
	});
}, { auth: false, rateLimiter: standardLimiter });

/** POST /api/facilities/[id]/reviews — 리뷰 작성 (인증 필수) */
export const POST = withApiHandler(async (_req, { userId, body, params }) => {
	const doc = await reviewService.create({
		userId,
		facilityId: params.id,
		rating: body.rating,
		content: body.content,
		images: body.images,
	});

	return NextResponse.json({ data: toReviewDTO(doc) }, { status: 201 });
}, { schema: reviewCreateSchema, rateLimiter: reviewWriteLimiter });
