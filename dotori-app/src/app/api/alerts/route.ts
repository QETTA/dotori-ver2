import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { alertCreateSchema } from "@/lib/validations";
import { alertService } from "@/lib/services/alert.service";

export const GET = withApiHandler(async (_req, { userId }) => {
	const alerts = await alertService.listActive(userId);
	return NextResponse.json(alerts);
}, { rateLimiter: standardLimiter });

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const alert = await alertService.create({
		userId,
		facilityId: body.facilityId,
		type: body.type || "vacancy",
		condition: body.condition,
		channels: body.channels,
	});

	return NextResponse.json({ data: alert }, { status: 201 });
}, { schema: alertCreateSchema, rateLimiter: standardLimiter });
