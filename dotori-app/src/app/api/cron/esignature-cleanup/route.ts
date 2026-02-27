import { NextRequest, NextResponse } from "next/server";
import { esignatureService } from "@/lib/services/esignature.service";
import { log } from "@/lib/logger";
import dbConnect from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { createApiErrorResponse } from "@/lib/api-error";

/**
 * POST /api/cron/esignature-cleanup
 * 만료된 전자서명 서류 정리 (draft/pending → expired)
 * Bearer CRON_SECRET 인증 필요
 */
export async function POST(req: NextRequest) {
	if (!verifyCronSecret(req)) {
		return createApiErrorResponse({
			status: 401,
			code: "UNAUTHORIZED",
			message: "Unauthorized",
		});
	}

	try {
		await dbConnect();
		const count = await esignatureService.cleanupExpired();
		log.info("전자서명 만료 정리 완료", { expiredCount: count });
		return NextResponse.json({ success: true, expiredCount: count });
	} catch (err) {
		log.error("전자서명 만료 정리 실패", {
			error: err instanceof Error ? err.message : String(err),
		});
		return createApiErrorResponse({
			status: 500,
			code: "INTERNAL_ERROR",
			message: "Internal server error",
		});
	}
}
