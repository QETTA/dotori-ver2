import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/lib/services/subscription.service";
import { notificationService } from "@/lib/services/notification.service";
import { log } from "@/lib/logger";
import dbConnect from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { createApiErrorResponse } from "@/lib/api-error";

/**
 * POST /api/cron/subscription-check
 * 1) 만료 구독 자동 다운그레이드 (active + expiresAt 지남 → expired)
 * 2) 만료 임박 구독 사전경고 (expiryWarningDays 이내)
 * 3) 만료 임박 전자서명 경고 (3일 이내)
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

		const [expiredCount, subWarnings, docWarnings] = await Promise.all([
			subscriptionService.checkExpired(),
			notificationService.processSubscriptionExpiryWarnings(),
			notificationService.processDocumentExpiryWarnings(),
		]);

		log.info("구독/서류 만료 체크 완료", {
			expiredCount,
			subWarnings,
			docWarnings,
		});

		return NextResponse.json({
			success: true,
			expiredCount,
			subscriptionWarnings: subWarnings,
			documentWarnings: docWarnings,
		});
	} catch (err) {
		log.error("구독 만료 체크 실패", {
			error: err instanceof Error ? err.message : String(err),
		});
		return createApiErrorResponse({
			status: 500,
			code: "INTERNAL_ERROR",
			message: "Internal server error",
		});
	}
}
