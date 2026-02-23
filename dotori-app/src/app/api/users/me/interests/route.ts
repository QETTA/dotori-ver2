import { NextResponse } from "next/server";
import { createApiErrorResponse } from "@/lib/api-error";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { addInterest, removeInterest } from "@/lib/services/interest-service";
import { interestSchema } from "@/lib/validations";

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const result = await addInterest(userId, body.facilityId);
	if (!result.success) {
		return createApiErrorResponse({
			status: 404,
			message: result.error || "시설을 찾을 수 없습니다",
		});
	}

	return NextResponse.json({
		data: { interestsCount: result.interestsCount },
	});
}, { schema: interestSchema, rateLimiter: standardLimiter });

export const DELETE = withApiHandler(async (_req, { userId, body }) => {
	const result = await removeInterest(userId, body.facilityId);
	if (!result.success) {
		return createApiErrorResponse({
			status: 404,
			message: result.error || "시설을 찾을 수 없습니다",
		});
	}

	return NextResponse.json({ data: { success: true } });
}, { schema: interestSchema, rateLimiter: standardLimiter });
