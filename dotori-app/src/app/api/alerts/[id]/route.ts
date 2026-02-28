import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { alertService } from "@/lib/services/alert.service";

/** GET /api/alerts/[id] — Get a single alert */
export const GET = withApiHandler(async (_req, { userId, params }) => {
	const alert = await alertService.findById(params.id);

	if (String(alert.userId) !== userId) {
		throw new NotFoundError("알림을 찾을 수 없습니다");
	}

	return NextResponse.json({ data: alert });
}, { rateLimiter: standardLimiter });

/** DELETE /api/alerts/[id] — Delete own alert */
export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	await alertService.deleteById(userId, params.id);

	return NextResponse.json({ data: { deleted: true } });
}, { rateLimiter: standardLimiter });
