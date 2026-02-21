import { NextResponse } from "next/server";
import { acquireCronLock, releaseCronLock } from "@/lib/cron-lock";
import dbConnect from "@/lib/db";
import { log } from "@/lib/logger";
import Alert from "@/models/Alert";
import Facility from "@/models/Facility";
import FacilitySnapshot from "@/models/FacilitySnapshot";
import SystemConfig from "@/models/SystemConfig";
import User from "@/models/User";
import { sendAlimtalk } from "@/lib/kakao-alimtalk";

const VACANCY_TEMPLATE = process.env.ALIMTALK_TEMPLATE_VACANCY || "";
const JOB_NAME = "to-monitor";

export async function GET(req: Request) {
	// Verify cron secret — 미설정 시 접근 차단
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

				if (!statusChanged && !waitingChanged) continue;

				// Lookup pre-loaded subscribers for this facility
				const subscribers = alertsByFacility.get(String(facilityId)) || [];

				for (const subscriber of subscribers) {
					const shouldNotify =
						(subscriber.type === "vacancy" &&
							statusChanged &&
							currentStatus === "available") ||
						(subscriber.type === "waitlist_change" && waitingChanged);

					if (shouldNotify) {
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
							currentStatus === "available" &&
							subscriber.type === "vacancy"
						) {
							const uId = String(subscriber.userId);
							const user = usersById.get(uId);

							if (user?.alimtalkOptIn && user?.phone) {
								alimtalkQueue.push({
									to: user.phone,
									templateId: VACANCY_TEMPLATE,
									variables: {
										facilityName: facility.name,
										toCount: String(Math.max(1, currentCapacity.total - (currentCapacity.current || 0))),
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
				alimtalksSent += results.filter((r) => r.status === "fulfilled").length;
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
		return NextResponse.json({ error: "처리에 실패했습니다" }, { status: 500 });
	}
}
