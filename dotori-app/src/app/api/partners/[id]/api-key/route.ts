import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Partner from "@/models/Partner";
import { regenerateApiKey } from "@/lib/engines/partner-auth";

/** POST /api/partners/[id]/api-key — Regenerate API key */
export const POST = withApiHandler(async (_req, { params }) => {
	const partner = await Partner.findById(params.id);
	if (!partner) throw new NotFoundError("파트너를 찾을 수 없습니다");

	const { rawApiKey, prefix } = await regenerateApiKey(params.id);

	return NextResponse.json({
		data: {
			apiKey: rawApiKey,
			prefix,
			message: "API 키가 재발급되었습니다. 이 키는 다시 조회할 수 없으므로 안전하게 보관하세요.",
		},
	});
}, { rateLimiter: standardLimiter });

/** GET /api/partners/[id]/api-key — Get key prefix (masked) */
export const GET = withApiHandler(async (_req, { params }) => {
	const partner = await Partner.findById(params.id).select("apiKeyPrefix").lean();
	if (!partner) throw new NotFoundError("파트너를 찾을 수 없습니다");

	return NextResponse.json({
		data: {
			prefix: partner.apiKeyPrefix,
			maskedKey: `${partner.apiKeyPrefix}${"*".repeat(56)}`,
		},
	});
}, { rateLimiter: standardLimiter });
