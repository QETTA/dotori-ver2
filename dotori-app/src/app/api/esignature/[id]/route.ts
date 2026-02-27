import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { createRateLimiter, standardLimiter } from "@/lib/rate-limit";
import { eSignatureStatusUpdateSchema } from "@/lib/validations";
import { esignatureService } from "@/lib/services/esignature.service";
import { toESignatureDTO } from "@/lib/dto";

const esigWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

/** GET /api/esignature/[id] — 서류 상세 */
export const GET = withApiHandler(async (_req, { userId, params }) => {
	const doc = await esignatureService.findById(params.id, userId);
	return NextResponse.json({ data: toESignatureDTO(doc) });
}, { rateLimiter: standardLimiter });

/** PATCH /api/esignature/[id] — 상태 변경 */
export const PATCH = withApiHandler(async (_req, { userId, body, params }) => {
	const updated = await esignatureService.updateStatus(params.id, userId, body.status);
	return NextResponse.json({ data: toESignatureDTO(updated) });
}, { schema: eSignatureStatusUpdateSchema, rateLimiter: esigWriteLimiter });

/** DELETE /api/esignature/[id] — 초안 삭제 */
export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	await esignatureService.deleteById(params.id, userId);
	return NextResponse.json({ success: true });
}, { rateLimiter: esigWriteLimiter });
