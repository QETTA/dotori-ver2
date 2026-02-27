import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { createRateLimiter } from "@/lib/rate-limit";
import { reviewUpdateSchema } from "@/lib/validations";
import { reviewService } from "@/lib/services/review.service";
import { toReviewDTO } from "@/lib/dto";

const reviewWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/** PATCH /api/facilities/[id]/reviews/[reviewId] — 리뷰 수정 (본인만) */
export const PATCH = withApiHandler(async (_req, { userId, body, params }) => {
	const updated = await reviewService.update({
		id: params.reviewId,
		userId,
		rating: body.rating,
		content: body.content,
		images: body.images,
	});
	return NextResponse.json({ data: toReviewDTO(updated) });
}, { schema: reviewUpdateSchema, rateLimiter: reviewWriteLimiter });

/** DELETE /api/facilities/[id]/reviews/[reviewId] — 리뷰 삭제 (본인만) */
export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	await reviewService.deleteById(params.reviewId, userId);
	return NextResponse.json({ success: true });
}, { rateLimiter: reviewWriteLimiter });
