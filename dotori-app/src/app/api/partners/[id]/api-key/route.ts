import { NextResponse } from "next/server";
import { withApiHandler, ForbiddenError, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Partner from "@/models/Partner";
import User from "@/models/User";
import { regenerateApiKey } from "@/lib/engines/partner-auth";

/** Verify the authenticated user is admin or owns the partner record */
async function verifyPartnerOwnership(userId: string, partnerId: string) {
	const user = await User.findById(userId).select("email role").lean<{ email?: string; role?: string }>();
	if (user?.role === "admin") return;

	const partner = await Partner.findById(partnerId).select("contactEmail").lean<{ contactEmail?: string }>();
	if (!partner) throw new NotFoundError("파트너를 찾을 수 없습니다");
	if (!user?.email || user.email !== partner.contactEmail) {
		throw new ForbiddenError("해당 파트너의 API 키를 관리할 권한이 없습니다");
	}
}

/** POST /api/partners/[id]/api-key — Regenerate API key */
export const POST = withApiHandler(async (_req, { userId, params }) => {
	await verifyPartnerOwnership(userId, params.id);

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
export const GET = withApiHandler(async (_req, { userId, params }) => {
	await verifyPartnerOwnership(userId, params.id);

	const partner = await Partner.findById(params.id).select("apiKeyPrefix").lean();
	if (!partner) throw new NotFoundError("파트너를 찾을 수 없습니다");

	return NextResponse.json({
		data: {
			prefix: partner.apiKeyPrefix,
			maskedKey: `${partner.apiKeyPrefix}${"*".repeat(56)}`,
		},
	});
}, { rateLimiter: standardLimiter });
