import { NextResponse } from "next/server";
import { acquireCronLock, releaseCronLock } from "@/lib/cron-lock";
import { verifyCronSecret } from "@/lib/cron-auth";
import dbConnect from "@/lib/db";
import { log } from "@/lib/logger";
import Alert from "@/models/Alert";
import Facility from "@/models/Facility";
import FacilitySnapshot from "@/models/FacilitySnapshot";
import TOPrediction from "@/models/TOPrediction";
import SystemConfig from "@/models/SystemConfig";
import User from "@/models/User";
import { sendAlimtalk } from "@/lib/kakao-alimtalk";
import { createApiErrorResponse } from "@/lib/api-error";

const VACANCY_TEMPLATE = process.env.ALIMTALK_TEMPLATE_VACANCY || "";
const JOB_NAME = "to-monitor";
const PREDICTION_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
	// Verify cron secret (timing-safe) — 미설정 시 접근 차단
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

		// Distributed lock — prevent concurrent execution
		ownerToken = await acquireCronLock(JOB_NAME, 300_000);
		if (!ownerToken) {
			return createApiErrorResponse({
				status: 409,
				code: "CONFLICT",
				message: "이미 실행 중입니다",
			});
		}

		try {
			// Record last check timestamp via SystemConfig
			const lastCheckStr = await SystemConfig.getValue("vacancy_alert_last_check");
			const lastCheck = lastCheckStr ? new Date(lastCheckStr) : new Date(0);

			// Only check facilities updated since last run (or all on first run)
			const facilityFilter = lastCheck.getTime() > 0
				? { updatedAt: { $gte: lastCheck } }
				: {};
			const facilities = await Facility.find(facilityFilter)
				.select("_id name status capacity address updatedAt")
				.lean();
			let alertsCreated = 0;
			let alimtalksSent = 0;
			let predictionAlertsTriggered = 0;
			const nowMs = Date.now();

			// Pre-load all facility IDs for batch alert lookup
			const facilityIds = facilities.map((f) => f._id);
			const allAlerts = await Alert.find({
				facilityId: { $in: facilityIds },
				active: true,
			}).lean();
			const alertsByFacility = new Map<string, typeof allAlerts>();
			for (const alert of allAlerts) {
				const key = String(alert.facilityId);
				const existing = alertsByFacility.get(key) || [];
				existing.push(alert);
				alertsByFacility.set(key, existing);
			}

			// Pre-load subscriber user info (batch)
			const subscriberUserIds = [
				...new Set(allAlerts.map((a) => String(a.userId))),
			];
			const subscriberUsers = subscriberUserIds.length > 0
				? await User.find({ _id: { $in: subscriberUserIds } })
					.select("_id phone alimtalkOptIn")
					.lean()
				: [];
			const usersById = new Map(
				subscriberUsers.map((u) => [String(u._id), u]),
			);

			// Batch: fetch latest snapshots for all facilities at once
			const latestSnapshots = await FacilitySnapshot.aggregate([
				{ $match: { facilityId: { $in: facilityIds } } },
				{ $sort: { snapshotAt: -1 } },
				{
					$group: {
						_id: "$facilityId",
						status: { $first: "$status" },
						capacity: { $first: "$capacity" },
						snapshotAt: { $first: "$snapshotAt" },
					},
				},
			]);
			const snapshotByFacility = new Map(
				latestSnapshots.map((s) => [String(s._id), s]),
			);

			// Batch: fetch latest valid TO predictions for all facilities
			const latestPredictions = facilityIds.length > 0
				? await TOPrediction.find({
					facilityId: { $in: facilityIds },
					validUntil: { $gt: new Date() },
				})
					.select("facilityId predictedVacancies")
					.lean()
				: [];
			const predictionByFacility = new Map(
				latestPredictions.map((p) => [String(p.facilityId), p]),
			);

			// Collect new snapshots for batch insert
			const newSnapshots: Array<{
				facilityId: unknown;
				capacity: unknown;
				status: string;
				snapshotAt: Date;
			}> = [];

			// Collect alert updates and alimtalk sends for batch processing
			const alertBulkOps: Array<{
				updateOne: {
					filter: { _id: unknown };
					update: { $set: { lastTriggeredAt: Date } };
				};
			}> = [];
			const alimtalkQueue: Array<{
				to: string;
				templateId: string;
				variables: Record<string, string>;
				userId: string;
			}> = [];

			for (const facility of facilities) {
				const facilityId = facility._id;
				const currentStatus = facility.status;
				const currentCapacity = facility.capacity;
				const actualVacancies = Math.max(
					0,
					Number(currentCapacity?.total ?? 0) - Number(currentCapacity?.current ?? 0),
				);
				const prediction = predictionByFacility.get(String(facilityId));
				const predictedVacancies = Math.max(
					0,
					Number(prediction?.predictedVacancies ?? 0),
				);

				// Queue new snapshot
				newSnapshots.push({
					facilityId,
					capacity: currentCapacity,
					status: currentStatus,
					snapshotAt: new Date(),
				});

				// Get latest snapshot from batch result
				const latestSnapshot = snapshotByFacility.get(String(facilityId));

				// Skip if no previous snapshot (first run)
				if (!latestSnapshot) continue;

				const statusChanged = latestSnapshot.status !== currentStatus;
				const waitingChanged =
					latestSnapshot.capacity?.waiting !== currentCapacity?.waiting;

				if (!statusChanged && !waitingChanged && predictedVacancies <= 0) continue;

				// Lookup pre-loaded subscribers for this facility
				const subscribers = alertsByFacility.get(String(facilityId)) || [];

				for (const subscriber of subscribers) {
					const minVacancy = typeof subscriber.condition?.minVacancy === "number"
						? Math.max(0, subscriber.condition.minVacancy)
						: 1;
					const vacancyStatusTriggered =
						subscriber.type === "vacancy" &&
						statusChanged &&
						currentStatus === "available" &&
						actualVacancies >= minVacancy;
					const lastTriggeredAt = subscriber.lastTriggeredAt
						? new Date(subscriber.lastTriggeredAt)
						: null;
					const predictionCooldownPassed =
						!lastTriggeredAt ||
						Number.isNaN(lastTriggeredAt.getTime()) ||
						nowMs - lastTriggeredAt.getTime() >= PREDICTION_COOLDOWN_MS;
					const vacancyPredictionTriggered =
						subscriber.type === "vacancy" &&
						predictedVacancies >= minVacancy &&
						predictionCooldownPassed;
					const shouldNotify =
						vacancyStatusTriggered ||
						vacancyPredictionTriggered ||
						(subscriber.type === "waitlist_change" && waitingChanged);

					if (shouldNotify) {
						if (vacancyPredictionTriggered && !vacancyStatusTriggered) {
							predictionAlertsTriggered++;
						}

						alertBulkOps.push({
							updateOne: {
								filter: { _id: subscriber._id },
								update: { $set: { lastTriggeredAt: new Date() } },
							},
						});
						alertsCreated++;

						// Queue alimtalk if vacancy and template is configured
						if (
							VACANCY_TEMPLATE &&
							subscriber.type === "vacancy" &&
							subscriber.channels?.includes("kakao")
						) {
							const uId = String(subscriber.userId);
							const user = usersById.get(uId);

							if (user?.alimtalkOptIn && user?.phone) {
								alimtalkQueue.push({
									to: user.phone,
									templateId: VACANCY_TEMPLATE,
									variables: {
										facilityName: facility.name,
										toCount: String(Math.max(actualVacancies, predictedVacancies, 1)),
										address: facility.address || "",
									},
									userId: uId,
								});
							}
						}
					}
				}
			}

			// Execute alert updates as bulk write
			if (alertBulkOps.length > 0) {
				await Alert.bulkWrite(alertBulkOps, { ordered: false });
			}

			// Send alimtalk notifications in parallel (batches of 10)
			for (let i = 0; i < alimtalkQueue.length; i += 10) {
				const batch = alimtalkQueue.slice(i, i + 10);
				const results = await Promise.allSettled(
					batch.map((msg) => sendAlimtalk(msg)),
				);
				alimtalksSent += results.filter((r) =>
					r.status === "fulfilled" && r.value.success,
				).length;
			}

			// Batch insert all new snapshots
			if (newSnapshots.length > 0) {
				await FacilitySnapshot.insertMany(newSnapshots, { ordered: false });
			}

			// Update last check timestamp
			await SystemConfig.setValue(
				"vacancy_alert_last_check",
				new Date().toISOString(),
				"마지막 TO 모니터링 실행 시각",
			);

			return NextResponse.json({
				data: {
					facilitiesChecked: facilities.length,
					alertsTriggered: alertsCreated,
					predictionAlertsTriggered,
					alimtalksSent,
					lastCheck: lastCheck.toISOString(),
					timestamp: new Date().toISOString(),
				},
			});
		} finally {
			await releaseCronLock(JOB_NAME, ownerToken);
		}
	} catch (err) {
		log.error("TO 모니터링 실패", { error: err instanceof Error ? err.message : String(err) });
		return createApiErrorResponse({
			status: 500,
			code: "INTERNAL_ERROR",
			message: "처리에 실패했습니다",
		});
	}
}
