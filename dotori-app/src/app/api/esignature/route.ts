import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { createRateLimiter, standardLimiter } from "@/lib/rate-limit";
import { eSignatureCreateSchema } from "@/lib/validations";
import { esignatureService } from "@/lib/services/esignature.service";
import { toESignatureDTO } from "@/lib/dto";
import { API_CONFIG } from "@/lib/config/api";
import ESignatureDocument from "@/models/ESignatureDocument";
import { ApiError } from "@/lib/api-handler";

const ESIG_STATUSES = ["draft", "pending", "signed", "submitted", "expired"] as const;
const esigQuerySchema = z.object({
	status: z.enum(ESIG_STATUSES).optional(),
	facilityId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
	page: z.string().regex(/^\d+$/).optional(),
	limit: z.string().regex(/^\d+$/).optional(),
});

const esigWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

/** GET /api/esignature — 사용자 서류 목록 */
export const GET = withApiHandler(async (req, { userId }) => {
	const raw = Object.fromEntries(
		Array.from(req.nextUrl.searchParams.entries()).filter(([, v]) => v !== ""),
	);
	const parsed = esigQuerySchema.safeParse(raw);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "잘못된 검색 파라미터입니다" },
			{ status: 400 },
		);
	}
	const q = parsed.data;

	if (q.facilityId) {
		const result = await esignatureService.listByFacility(q.facilityId, userId, {
			page: q.page,
			limit: q.limit,
			status: q.status,
		});
		return NextResponse.json({
			data: result.data.map(toESignatureDTO),
			pagination: result.pagination,
		});
	}

	const result = await esignatureService.findByUser(userId, {
		page: q.page,
		limit: q.limit,
		status: q.status,
	});
	return NextResponse.json({
		data: result.data.map(toESignatureDTO),
		pagination: result.pagination,
	});
}, { rateLimiter: standardLimiter });

/** POST /api/esignature — 서류 생성 (초안) */
export const POST = withApiHandler(async (_req, { userId, body }) => {
	const docCount = await ESignatureDocument.countDocuments({ userId });
	if (docCount >= API_CONFIG.ESIGNATURE.maxDocs) {
		throw new ApiError(
			`서류는 최대 ${API_CONFIG.ESIGNATURE.maxDocs}개까지 생성할 수 있습니다`,
			400,
		);
	}

	const doc = await esignatureService.create({
		userId,
		facilityId: body.facilityId,
		documentType: body.documentType,
		title: body.title,
	});

	return NextResponse.json({ data: toESignatureDTO(doc) }, { status: 201 });
}, { schema: eSignatureCreateSchema, rateLimiter: esigWriteLimiter });
