import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { addInterest, removeInterest } from "@/lib/services/interest-service";
import { interestSchema } from "@/lib/validations";

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const result = await addInterest(userId, body.facilityId);
	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 404 });
	}

	return NextResponse.json({
		data: { interestsCount: result.interestsCount },
	});
}, { schema: interestSchema, rateLimiter: standardLimiter });

export const DELETE = withApiHandler(async (_req, { userId, body }) => {
	const result = await removeInterest(userId, body.facilityId);
	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 404 });
	}

	return NextResponse.json({ data: { success: true } });
}, { schema: interestSchema, rateLimiter: standardLimiter });
