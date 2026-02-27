import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { createRateLimiter, standardLimiter } from "@/lib/rate-limit";
import { visitUpdateSchema } from "@/lib/validations";
import { visitService } from "@/lib/services/visit.service";
import { toVisitDTO } from "@/lib/dto";

const visitWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

/** GET /api/visits/[id] — 견학 상세 */
export const GET = withApiHandler(async (_req, { userId, params }) => {
	const doc = await visitService.findById(params.id, userId);
	return NextResponse.json({ data: toVisitDTO(doc) });
}, { rateLimiter: standardLimiter });

/** PATCH /api/visits/[id] — 상태 변경 */
export const PATCH = withApiHandler(async (_req, { userId, body, params }) => {
	let updated;
	if (body.status === "confirmed") {
		updated = await visitService.confirm(params.id, userId);
	} else if (body.status === "completed") {
		updated = await visitService.complete(params.id, userId);
	} else {
		updated = await visitService.cancel(params.id, userId, body.cancelReason);
	}
	return NextResponse.json({ data: toVisitDTO(updated) });
}, { schema: visitUpdateSchema, rateLimiter: visitWriteLimiter });

/** DELETE /api/visits/[id] — 견학 취소 */
export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	await visitService.cancel(params.id, userId);
	return NextResponse.json({ success: true });
}, { rateLimiter: visitWriteLimiter });
