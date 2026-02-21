import { NextResponse } from "next/server";
import { acquireCronLock, releaseCronLock } from "@/lib/cron-lock";
import dbConnect from "@/lib/db";
import Alert from "@/models/Alert";
import SystemConfig from "@/models/SystemConfig";
import User from "@/models/User";
import { sendAlimtalk } from "@/lib/kakao-alimtalk";
import { SEOUL_REGION_CODES, syncFacilitiesToDB } from "@/lib/external/isalang-api";
import { log } from "@/lib/logger";

const VACANCY_TEMPLATE = process.env.ALIMTALK_TEMPLATE_VACANCY || "";
const JOB_NAME = "sync-isalang";

type SyncFailure = {
	regionName: string;
	regionCode: string;
	stage: "sync" | "alert" | "notification";
	reason: string;
	facilityName?: string;
	address?: string;
};

const BATCH_SIZE = 5;

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "알 수 없는 오류";
}

function addSyncFailures(
	target: SyncFailure[],
	regionName: string,
	regionCode: string,
	stage: SyncFailure["stage"],
	source: { reason: string; facilityName?: string; address?: string },
): void {
	target.push({
		regionName,
		regionCode,
		stage,
		reason: source.reason,
		facilityName: source.facilityName,
		address: source.address,
	});
}

/**
 * GET /api/cron/sync-isalang
 *
 * 아이사랑 포털 시설 데이터 동기화 크론
 * - 서울 25개 구 중 상위 우선순위 5개 구씩 순환 동기화
 * - 상태 변경 감지 → 알림 트리거
 * - Vercel Cron 또는 외부 스케줄러에서 호출 (5분 간격 권장)
 *
 * Authorization: Bearer {CRON_SECRET}
 */
export async function GET(req: Request) {
	// Verify cron secret
	const authHeader = req.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let ownerToken: string | null = null;

	try {
		await dbConnect();

		// Distributed lock — prevent concurrent execution
		ownerToken = await acquireCronLock(JOB_NAME, 300_000);
		if (!ownerToken) {
			return NextResponse.json(
				{ error: "이미 실행 중입니다" },
				{ status: 409 },
			);
		}

		try {
			// Determine which regions to sync this round
			const lastBatchRaw = await SystemConfig.getValue(
				"isalang_sync_last_batch",
			);
			const parsedLastBatch = Number.parseInt(lastBatchRaw || "0", 10);
			const totalRegions = Object.keys(SEOUL_REGION_CODES).length;
			const regionEntries = Object.entries(SEOUL_REGION_CODES);

			if (totalRegions === 0) {
				return NextResponse.json(
					{ error: "서울 구 설정이 없어 동기화를 실행할 수 없습니다" },
					{ status: 500 },
				);
			}

			const batchCount = Math.ceil(totalRegions / BATCH_SIZE);
			const currentBatch =
				Number.isFinite(parsedLastBatch) && parsedLastBatch >= 0
					? parsedLastBatch % batchCount
					: 0;
			const startIdx = (currentBatch * BATCH_SIZE) % totalRegions;
			const batchRegions = Array.from(
				{ length: Math.min(BATCH_SIZE, totalRegions) },
				(_, offset) => regionEntries[(startIdx + offset) % totalRegions],
			);

			let totalCreated = 0;
			let totalUpdated = 0;
			let totalFacilities = 0;
			let skippedFacilities = 0;
			let facilityFailures = 0;
			let alertsTriggered = 0;
			let alimtalksSent = 0;
			const failures: SyncFailure[] = [];

			for (const [regionName, regionCode] of batchRegions) {
				try {
					const result = await syncFacilitiesToDB(regionCode);
					totalCreated += result.created;
					totalUpdated += result.updated;
					totalFacilities += result.total;
					skippedFacilities += result.skipped;
					facilityFailures += result.failures.length;

					for (const syncError of result.failures) {
						addSyncFailures(failures, regionName, regionCode, "sync", syncError);
					}

					// Collect all changed facility IDs for batch alert lookup
					const vacancyChanges = result.statusChanges.filter(
						(c) => c.newStatus === "available",
					);
					const waitlistChanges = result.statusChanges.filter(
						(c) => c.oldStatus !== c.newStatus && c.newStatus === "waiting",
					);

					// Batch: fetch all vacancy alert subscribers at once
					const vacancyFacilityIds = vacancyChanges.map((c) => c.facilityId);
					const waitlistFacilityIds = waitlistChanges.map((c) => c.facilityId);
					const allChangedFacilityIds = [
						...new Set([...vacancyFacilityIds, ...waitlistFacilityIds]),
					];

					if (allChangedFacilityIds.length === 0) continue;

					const allAlerts = await Alert.find({
						facilityId: { $in: allChangedFacilityIds },
						active: true,
					}).select("_id userId facilityId type").lean();

					// Batch: pre-load all subscriber users
					const userIds = [...new Set(allAlerts.map((a) => String(a.userId)))];
					const users = userIds.length > 0
						? await User.find({ _id: { $in: userIds } })
							.select("_id phone alimtalkOptIn")
							.lean()
						: [];
					const usersById = new Map(users.map((u) => [String(u._id), u]));

					// Group alerts by facilityId and type
					const alertsByFacilityAndType = new Map<string, typeof allAlerts>();
					for (const alert of allAlerts) {
						const key = `${String(alert.facilityId)}:${alert.type}`;
						const existing = alertsByFacilityAndType.get(key) || [];
						existing.push(alert);
						alertsByFacilityAndType.set(key, existing);
					}

					// Collect bulk write ops for lastTriggeredAt
					const alertBulkOps: Array<{
						updateOne: {
							filter: { _id: unknown };
							update: { $set: { lastTriggeredAt: Date } };
						};
					}> = [];

					// Process vacancy changes
					for (const change of vacancyChanges) {
						const subscribers =
							alertsByFacilityAndType.get(`${change.facilityId}:vacancy`) || [];

						for (const subscriber of subscribers) {
							alertBulkOps.push({
								updateOne: {
									filter: { _id: subscriber._id },
									update: { $set: { lastTriggeredAt: new Date() } },
								},
							});
							alertsTriggered++;

							// Send alimtalk notification
							if (VACANCY_TEMPLATE) {
								const user = usersById.get(String(subscriber.userId));
								if (user?.alimtalkOptIn && user?.phone) {
									try {
										await sendAlimtalk({
											to: user.phone,
											templateId: VACANCY_TEMPLATE,
											variables: {
												facilityName: change.name,
												toCount: "1",
												address: regionName,
											},
											userId: String(subscriber.userId),
										});
										alimtalksSent++;
									} catch (error) {
										addSyncFailures(
											failures,
											regionName,
											regionCode,
											"notification",
											{
												reason: getErrorMessage(error),
												facilityName: change.name,
											},
										);
									}
								}
							}
						}
					}

					// Process waitlist changes
					for (const change of waitlistChanges) {
						const subscribers =
							alertsByFacilityAndType.get(
								`${change.facilityId}:waitlist_change`,
							) || [];

						for (const subscriber of subscribers) {
							alertBulkOps.push({
								updateOne: {
									filter: { _id: subscriber._id },
									update: { $set: { lastTriggeredAt: new Date() } },
								},
							});
							alertsTriggered++;
						}
					}

					// Batch update all alert lastTriggeredAt
					if (alertBulkOps.length > 0) {
						try {
							await Alert.bulkWrite(alertBulkOps, { ordered: false });
						} catch (error) {
							addSyncFailures(failures, regionName, regionCode, "alert", {
								reason: getErrorMessage(error),
							});
						}
					}
				} catch (error) {
					addSyncFailures(failures, regionName, regionCode, "sync", {
						reason: getErrorMessage(error),
					});
				}
			}

			// Save batch progress
			const nextBatch = (currentBatch + 1) % batchCount;
			await SystemConfig.setValue(
				"isalang_sync_last_batch",
				String(nextBatch),
				"아이사랑 동기화 마지막 배치 번호",
			);

			await SystemConfig.setValue(
				"isalang_sync_last_run",
				new Date().toISOString(),
				"아이사랑 동기화 마지막 실행 시각",
			);

			return NextResponse.json({
				data: {
					batch: nextBatch,
					regions: batchRegions.map(([name]) => name),
					created: totalCreated,
					updated: totalUpdated,
					totalFacilities,
					skippedFacilities,
					facilityFailures,
					alertsTriggered,
					alimtalksSent,
					failures,
					timestamp: new Date().toISOString(),
				},
			});
		} finally {
			await releaseCronLock(JOB_NAME, ownerToken);
		}
	} catch (err) {
		log.error("아이사랑 동기화 실패", { error: err instanceof Error ? err.message : String(err) });
		return NextResponse.json({ error: "처리에 실패했습니다" }, { status: 500 });
	}
}
