import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withApiHandler, BadRequestError, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Waitlist from "@/models/Waitlist";

const waitlistDocUpdateSchema = z.object({
	docId: z.string(),
	submitted: z.boolean(),
});

const waitlistCancelSchema = z.object({
	status: z.literal("cancelled"),
});

const waitlistUpdateSchema = z.union([
	waitlistDocUpdateSchema,
	waitlistCancelSchema,
]);

/**
 * GET /api/waitlist/[id]
 * 대기 신청 상세 조회 (시설 정보 포함)
 */
export const GET = withApiHandler(async (_req, { userId, params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 대기 신청 ID입니다");
	}

	const waitlist = await Waitlist.findOne({
		_id: id,
		userId,
	})
		.populate("facilityId")
		.lean();

	if (!waitlist) {
		throw new NotFoundError("대기 신청을 찾을 수 없습니다");
	}

	return NextResponse.json({ data: waitlist });
}, { auth: true, rateLimiter: standardLimiter });

/**
 * PATCH /api/waitlist/[id]
 * 대기 신청 수정 — 서류 제출 상태 업데이트, 상태 변경
 *
 * Body options:
 *   { docId: string, submitted: boolean }   — 개별 서류 제출 토글
 *   { status: "cancelled" }                 — 대기 취소
 */
export const PATCH = withApiHandler(async (_req, { userId, body, params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 대기 신청 ID입니다");
	}

	// 1. Document submission toggle
	if ("docId" in body) {
		const submitted = body.submitted === true;
		const update = submitted
			? {
					$set: {
						"requiredDocs.$[elem].submitted": true,
						"requiredDocs.$[elem].submittedAt": new Date(),
					},
				}
			: {
					$set: { "requiredDocs.$[elem].submitted": false },
					$unset: { "requiredDocs.$[elem].submittedAt": "" },
				};

		const waitlist = await Waitlist.findOneAndUpdate(
			{ _id: id, userId },
			update,
			{
				arrayFilters: [{ "elem.docId": body.docId }],
				new: true,
			},
		).populate("facilityId");

		if (!waitlist) {
			throw new NotFoundError("대기 신청을 찾을 수 없습니다");
		}

		return NextResponse.json({ data: waitlist });
	}

	// 2. Status change (cancel)
	if (body.status === "cancelled") {
		const waitlist = await Waitlist.findOneAndUpdate(
			{ _id: id, userId },
			{ $set: { status: "cancelled" } },
			{ new: true },
		);

		if (!waitlist) {
			throw new NotFoundError("대기 신청을 찾을 수 없습니다");
		}

		return NextResponse.json({ data: waitlist });
	}

	throw new BadRequestError("유효하지 않은 요청입니다");
}, { auth: true, schema: waitlistUpdateSchema, rateLimiter: standardLimiter });

/**
 * DELETE /api/waitlist/[id]
 * 대기 취소 (soft delete — status: cancelled)
 */
export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 대기 신청 ID입니다");
	}

	const waitlist = await Waitlist.findOneAndUpdate(
		{ _id: id, userId },
		{ $set: { status: "cancelled" } },
		{ new: true },
	);

	if (!waitlist) {
		throw new NotFoundError("대기 신청을 찾을 수 없습니다");
	}

	return NextResponse.json({ data: waitlist });
}, { auth: true, rateLimiter: standardLimiter });
