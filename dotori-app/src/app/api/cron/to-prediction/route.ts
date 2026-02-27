import { verifyCronSecret } from "@/lib/cron-auth";
import { acquireCronLock, releaseCronLock } from "@/lib/cron-lock";
import dbConnect from "@/lib/db";
import { log } from "@/lib/logger";
import { batchCalculate } from "@/lib/services/to-prediction.service";
import { createApiErrorResponse } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(req: Request) {
	if (!verifyCronSecret(req)) {
		return createApiErrorResponse({
			status: 401,
			code: "UNAUTHORIZED",
			message: "인증이 필요합니다",
		});
	}

	await dbConnect();

	const ownerToken = await acquireCronLock("to-prediction", 600_000);
	if (!ownerToken) {
		return createApiErrorResponse({
			status: 409,
			code: "CONFLICT",
			message: "이미 실행 중입니다",
		});
	}

	try {
		log.info("TO prediction batch started");
		const stats = await batchCalculate();
		log.info("TO prediction batch completed", stats);

		return NextResponse.json({ data: stats });
	} catch (err) {
		log.error("TO prediction batch failed", {
			error: err instanceof Error ? err.message : "unknown",
		});
		return createApiErrorResponse({
			status: 500,
			code: "INTERNAL_ERROR",
			message: "처리에 실패했습니다",
		});
	} finally {
		await releaseCronLock("to-prediction", ownerToken);
	}
}
