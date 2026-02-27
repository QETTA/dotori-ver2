import { NextResponse } from "next/server";
import { acquireCronLock, releaseCronLock } from "@/lib/cron-lock";
import { verifyCronSecret } from "@/lib/cron-auth";
import dbConnect from "@/lib/db";
import { syncKindergartenToDB, SIDO_CODES } from "@/lib/external/kindergarten-api";
import SystemConfig from "@/models/SystemConfig";
import { log } from "@/lib/logger";
import { createApiErrorResponse } from "@/lib/api-error";

const JOB_NAME = "sync-kindergarten";
const BATCH_SIZE = 3;

/**
 * GET /api/cron/sync-kindergarten
 *
 * 유치원알리미 시설 데이터 동기화 크론
 * - 시도별 유치원 데이터를 배치 동기화
 * - Authorization: Bearer {CRON_SECRET}
 */
export async function GET(req: Request) {
	if (!verifyCronSecret(req)) {
		return createApiErrorResponse({
			status: 401,
			code: "UNAUTHORIZED",
			message: "인증이 필요합니다",
		});
	}

	let ownerToken: string | null = null;

	try {
		await dbConnect();

		ownerToken = await acquireCronLock(JOB_NAME, 300_000);
		if (!ownerToken) {
			return createApiErrorResponse({
				status: 409,
				code: "CONFLICT",
				message: "이미 실행 중입니다",
			});
		}

		try {
			const sidoEntries = Object.entries(SIDO_CODES);
			const totalSidos = sidoEntries.length;

			if (totalSidos === 0) {
				return createApiErrorResponse({
					status: 500,
					code: "INTERNAL_ERROR",
					message: "시도 코드 설정이 없어 동기화를 실행할 수 없습니다",
				});
			}

			// Determine batch
			const lastBatchRaw = await SystemConfig.getValue(
				"kindergarten_sync_last_batch",
			);
			const parsedLastBatch = Number.parseInt(lastBatchRaw || "0", 10);
			const batchCount = Math.ceil(totalSidos / BATCH_SIZE);
			const currentBatch =
				Number.isFinite(parsedLastBatch) && parsedLastBatch >= 0
					? parsedLastBatch % batchCount
					: 0;
			const startIdx = (currentBatch * BATCH_SIZE) % totalSidos;
			const batchSidos = Array.from(
				{ length: Math.min(BATCH_SIZE, totalSidos) },
				(_, offset) => sidoEntries[(startIdx + offset) % totalSidos],
			);

			let totalCreated = 0;
			let totalUpdated = 0;
			let totalFacilities = 0;
			const failures: { sidoName: string; reason: string }[] = [];

			for (const [sidoName, sidoCode] of batchSidos) {
				try {
					const result = await syncKindergartenToDB(sidoCode);
					totalCreated += result.created;
					totalUpdated += result.updated;
					totalFacilities += result.total;
				} catch (error) {
					failures.push({
						sidoName,
						reason:
							error instanceof Error ? error.message : "알 수 없는 오류",
					});
				}
			}

			// Save batch progress
			const nextBatch = (currentBatch + 1) % batchCount;
			await SystemConfig.setValue(
				"kindergarten_sync_last_batch",
				String(nextBatch),
				"유치원 동기화 마지막 배치 번호",
			);

			await SystemConfig.setValue(
				"kindergarten_sync_last_run",
				new Date().toISOString(),
				"유치원 동기화 마지막 실행 시각",
			);

			return NextResponse.json({
				data: {
					batch: nextBatch,
					sidos: batchSidos.map(([name]) => name),
					created: totalCreated,
					updated: totalUpdated,
					totalFacilities,
					failures,
					timestamp: new Date().toISOString(),
				},
			});
		} finally {
			await releaseCronLock(JOB_NAME, ownerToken);
		}
	} catch (err) {
		log.error("유치원 동기화 실패", {
			error: err instanceof Error ? err.message : String(err),
		});
		return createApiErrorResponse({
			status: 500,
			code: "INTERNAL_ERROR",
			message: "처리에 실패했습니다",
		});
	}
}
