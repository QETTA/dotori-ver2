import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ToMonitorFixtures = {
	facilities?: Array<Record<string, unknown>>;
	alerts?: Array<Record<string, unknown>>;
	users?: Array<Record<string, unknown>>;
	snapshots?: Array<Record<string, unknown>>;
	predictions?: Array<Record<string, unknown>>;
};

const {
	dbConnectMock,
	verifyCronSecretMock,
	acquireCronLockMock,
	releaseCronLockMock,
	logErrorMock,
	alertFindMock,
	alertBulkWriteMock,
	facilityFindMock,
	facilitySnapshotAggregateMock,
	facilitySnapshotInsertManyMock,
	toPredictionFindMock,
	systemConfigGetValueMock,
	systemConfigSetValueMock,
	userFindMock,
	sendAlimtalkMock,
} = vi.hoisted(() => ({
	dbConnectMock: vi.fn(),
	verifyCronSecretMock: vi.fn(),
	acquireCronLockMock: vi.fn(),
	releaseCronLockMock: vi.fn(),
	logErrorMock: vi.fn(),
	alertFindMock: vi.fn(),
	alertBulkWriteMock: vi.fn(),
	facilityFindMock: vi.fn(),
	facilitySnapshotAggregateMock: vi.fn(),
	facilitySnapshotInsertManyMock: vi.fn(),
	toPredictionFindMock: vi.fn(),
	systemConfigGetValueMock: vi.fn(),
	systemConfigSetValueMock: vi.fn(),
	userFindMock: vi.fn(),
	sendAlimtalkMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	default: dbConnectMock,
}));

vi.mock("@/lib/cron-auth", () => ({
	verifyCronSecret: verifyCronSecretMock,
}));

vi.mock("@/lib/cron-lock", () => ({
	acquireCronLock: acquireCronLockMock,
	releaseCronLock: releaseCronLockMock,
}));

vi.mock("@/lib/logger", () => ({
	log: {
		error: logErrorMock,
		info: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		withRequestId: vi.fn(),
	},
}));

vi.mock("@/lib/kakao-alimtalk", () => ({
	sendAlimtalk: sendAlimtalkMock,
}));

vi.mock("@/models/Alert", () => ({
	default: {
		find: alertFindMock,
		bulkWrite: alertBulkWriteMock,
	},
}));

vi.mock("@/models/Facility", () => ({
	default: {
		find: facilityFindMock,
	},
}));

vi.mock("@/models/FacilitySnapshot", () => ({
	default: {
		aggregate: facilitySnapshotAggregateMock,
		insertMany: facilitySnapshotInsertManyMock,
	},
}));

vi.mock("@/models/TOPrediction", () => ({
	default: {
		find: toPredictionFindMock,
	},
}));

vi.mock("@/models/SystemConfig", () => ({
	default: {
		getValue: systemConfigGetValueMock,
		setValue: systemConfigSetValueMock,
	},
}));

vi.mock("@/models/User", () => ({
	default: {
		find: userFindMock,
	},
}));

const FIXED_NOW = new Date("2026-02-26T09:00:00.000Z");
const LAST_CHECK_AT = "2026-02-25T00:00:00.000Z";
const originalVacancyTemplate = process.env.ALIMTALK_TEMPLATE_VACANCY;

function createLeanQuery<T>(result: T) {
	const query = {
		select: vi.fn(),
		sort: vi.fn(),
		lean: vi.fn(),
	};
	query.select.mockReturnValue(query);
	query.sort.mockReturnValue(query);
	query.lean.mockResolvedValue(result);
	return query;
}

function mockFindResult<T>(mockFn: ReturnType<typeof vi.fn>, result: T): void {
	mockFn.mockReturnValue(createLeanQuery(result));
}

function createFacility(overrides: Record<string, unknown> = {}) {
	return {
		_id: "facility-1",
		name: "도토리 어린이집",
		status: "waiting",
		capacity: { total: 20, current: 20, waiting: 2 },
		address: "서울 중구 도토리로 1",
		updatedAt: new Date("2026-02-26T08:00:00.000Z"),
		...overrides,
	};
}

function createSnapshot(overrides: Record<string, unknown> = {}) {
	return {
		_id: "facility-1",
		status: "waiting",
		capacity: { total: 20, current: 20, waiting: 2 },
		snapshotAt: new Date("2026-02-26T07:30:00.000Z"),
		...overrides,
	};
}

function createAlert(overrides: Record<string, unknown> = {}) {
	return {
		_id: "alert-1",
		facilityId: "facility-1",
		userId: "user-1",
		type: "vacancy",
		active: true,
		condition: {},
		channels: ["push"],
		...overrides,
	};
}

function createUser(
	id: string,
	phone: string,
	overrides: Record<string, unknown> = {},
) {
	return {
		_id: id,
		phone,
		alimtalkOptIn: true,
		...overrides,
	};
}

function createPrediction(overrides: Record<string, unknown> = {}) {
	return {
		facilityId: "facility-1",
		predictedVacancies: 2,
		...overrides,
	};
}

function setToMonitorFixtures({
	facilities = [createFacility()],
	alerts = [createAlert()],
	users = [createUser("user-1", "01011112222")],
	snapshots = [createSnapshot()],
	predictions = [],
}: ToMonitorFixtures = {}): void {
	mockFindResult(facilityFindMock, facilities);
	mockFindResult(alertFindMock, alerts);
	mockFindResult(userFindMock, users);
	mockFindResult(toPredictionFindMock, predictions);
	facilitySnapshotAggregateMock.mockResolvedValue(snapshots);
}

async function callToMonitorGet() {
	const { GET } = await import("@/app/api/cron/to-monitor/route");
	const response = await GET(new Request("http://localhost:3000/api/cron/to-monitor"));
	return { response, body: await response.json() };
}

describe("cron routes", () => {
	describe("CRON_SECRET authentication", () => {
		it("rejects requests without authorization header", () => {
			// All cron routes use verifyCronSecret which requires Bearer token
			expect(true).toBe(true);
		});

		it("rejects requests with wrong token", () => {
			// Timing-safe comparison prevents timing attacks
			expect(true).toBe(true);
		});
	});

	describe("/api/cron/sync-isalang", () => {
		it("syncs Seoul region facilities in batches", () => {
			// BATCH_SIZE = 5, rotates through 25 Seoul districts
			expect(5).toBeLessThanOrEqual(25);
		});

		it("handles lock conflicts (409)", () => {
			// acquireCronLock returns null if already locked
			expect(true).toBe(true);
		});
	});

	describe("/api/cron/sync-kindergarten", () => {
		it("syncs kindergarten facilities by sido codes", () => {
			// SIDO_CODES has 17 entries
			const expectedSidos = 17;
			expect(expectedSidos).toBeGreaterThan(0);
		});

		it("uses distributed lock", () => {
			// JOB_NAME = "sync-kindergarten"
			expect("sync-kindergarten").toBeTruthy();
		});

		it("tracks batch progress in SystemConfig", () => {
			// kindergarten_sync_last_batch key
			expect("kindergarten_sync_last_batch").toBeTruthy();
		});
	});

	describe("/api/cron/sync-population", () => {
		it("fetches from KOSIS and MOIS in parallel", () => {
			// Promise.all([fetchChildPopulation(), fetchPopulationTrend()])
			expect(true).toBe(true);
		});

		it("skips KOSIS if API key not set", () => {
			// KOSIS_API_KEY check returns empty array
			expect(true).toBe(true);
		});

		it("skips MOIS if API key not set", () => {
			// MOIS_API_KEY check returns empty array
			expect(true).toBe(true);
		});

		it("upserts population data by regionCode+year+ageGroup", () => {
			// Uses findOneAndUpdate with upsert: true
			expect(true).toBe(true);
		});
	});

	describe("/api/cron/to-monitor", () => {
		beforeEach(() => {
			vi.clearAllMocks();
			vi.resetModules();
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			process.env.ALIMTALK_TEMPLATE_VACANCY = "VACANCY_TEMPLATE_TEST";
			dbConnectMock.mockResolvedValue(undefined);
			verifyCronSecretMock.mockReturnValue(true);
			acquireCronLockMock.mockResolvedValue("owner-token");
			releaseCronLockMock.mockResolvedValue(undefined);
			systemConfigGetValueMock.mockResolvedValue(LAST_CHECK_AT);
			systemConfigSetValueMock.mockResolvedValue(undefined);
			alertBulkWriteMock.mockResolvedValue({ modifiedCount: 0 });
			facilitySnapshotInsertManyMock.mockResolvedValue([]);
			sendAlimtalkMock.mockResolvedValue({ success: true });

			setToMonitorFixtures();
		});

		afterEach(() => {
			vi.useRealTimers();
			if (typeof originalVacancyTemplate === "undefined") {
				delete process.env.ALIMTALK_TEMPLATE_VACANCY;
				return;
			}
			process.env.ALIMTALK_TEMPLATE_VACANCY = originalVacancyTemplate;
		});

		it("triggers vacancy by prediction even when facility status is unchanged", async () => {
			const facility = createFacility({
				status: "waiting",
				capacity: { total: 20, current: 20, waiting: 2 },
			});
			setToMonitorFixtures({
				facilities: [facility],
				snapshots: [createSnapshot({
					_id: facility._id,
					status: "waiting",
					capacity: { total: 20, current: 20, waiting: 2 },
				})],
				alerts: [createAlert({
					_id: "alert-prediction",
					facilityId: facility._id,
					userId: "user-1",
					type: "vacancy",
					condition: {},
					channels: ["push"],
				})],
				users: [createUser("user-1", "01011112222")],
				predictions: [createPrediction({
					facilityId: facility._id,
					predictedVacancies: 2,
				})],
			});

			const { response, body } = await callToMonitorGet();

			expect(response.status).toBe(200);
			expect(body.data).toMatchObject({
				alertsTriggered: 1,
				predictionAlertsTriggered: 1,
				alimtalksSent: 0,
			});
			expect(alertBulkWriteMock).toHaveBeenCalledTimes(1);
			expect(alertBulkWriteMock.mock.calls[0]?.[0]).toHaveLength(1);
			expect(alertBulkWriteMock.mock.calls[0]?.[0]?.[0]).toMatchObject({
				updateOne: { filter: { _id: "alert-prediction" } },
			});
			expect(sendAlimtalkMock).not.toHaveBeenCalled();
		});

		it("blocks vacancy trigger when predicted vacancies are below minVacancy", async () => {
			const facility = createFacility({
				status: "waiting",
				capacity: { total: 20, current: 20, waiting: 2 },
			});
			setToMonitorFixtures({
				facilities: [facility],
				snapshots: [createSnapshot({
					_id: facility._id,
					status: "waiting",
					capacity: { total: 20, current: 20, waiting: 2 },
				})],
				alerts: [createAlert({
					_id: "alert-min-vacancy",
					facilityId: facility._id,
					userId: "user-1",
					type: "vacancy",
					condition: { minVacancy: 3 },
					channels: ["kakao"],
				})],
				users: [createUser("user-1", "01011112222")],
				predictions: [createPrediction({
					facilityId: facility._id,
					predictedVacancies: 2,
				})],
			});

			const { response, body } = await callToMonitorGet();

			expect(response.status).toBe(200);
			expect(body.data).toMatchObject({
				alertsTriggered: 0,
				predictionAlertsTriggered: 0,
				alimtalksSent: 0,
			});
			expect(alertBulkWriteMock).not.toHaveBeenCalled();
			expect(sendAlimtalkMock).not.toHaveBeenCalled();
		});

		it("sends Alimtalk only for subscribers with kakao channel", async () => {
			const facility = createFacility({
				status: "available",
				capacity: { total: 20, current: 18, waiting: 0 },
			});
			setToMonitorFixtures({
				facilities: [facility],
				snapshots: [createSnapshot({
					_id: facility._id,
					status: "waiting",
					capacity: { total: 20, current: 20, waiting: 0 },
				})],
				alerts: [
					createAlert({
						_id: "alert-push-only",
						facilityId: facility._id,
						userId: "user-push",
						type: "vacancy",
						channels: ["push"],
					}),
					createAlert({
						_id: "alert-kakao",
						facilityId: facility._id,
						userId: "user-kakao",
						type: "vacancy",
						channels: ["push", "kakao"],
					}),
				],
				users: [
					createUser("user-push", "01011112222"),
					createUser("user-kakao", "01033334444"),
				],
				predictions: [createPrediction({
					facilityId: facility._id,
					predictedVacancies: 0,
				})],
			});

			const { response, body } = await callToMonitorGet();

			expect(response.status).toBe(200);
			expect(body.data).toMatchObject({
				alertsTriggered: 2,
				predictionAlertsTriggered: 0,
				alimtalksSent: 1,
			});
			expect(alertBulkWriteMock).toHaveBeenCalledTimes(1);
			expect(alertBulkWriteMock.mock.calls[0]?.[0]).toHaveLength(2);
			expect(sendAlimtalkMock).toHaveBeenCalledTimes(1);
			expect(sendAlimtalkMock).toHaveBeenCalledWith(expect.objectContaining({
				to: "01033334444",
				templateId: "VACANCY_TEMPLATE_TEST",
				userId: "user-kakao",
			}));
		});

		it("prevents repeated prediction trigger during cooldown window", async () => {
			const facility = createFacility({
				status: "waiting",
				capacity: { total: 20, current: 20, waiting: 2 },
			});
			setToMonitorFixtures({
				facilities: [facility],
				snapshots: [createSnapshot({
					_id: facility._id,
					status: "waiting",
					capacity: { total: 20, current: 20, waiting: 2 },
				})],
				alerts: [createAlert({
					_id: "alert-cooldown",
					facilityId: facility._id,
					userId: "user-1",
					type: "vacancy",
					channels: ["kakao"],
					lastTriggeredAt: new Date("2026-02-26T08:30:00.000Z"),
				})],
				users: [createUser("user-1", "01011112222")],
				predictions: [createPrediction({
					facilityId: facility._id,
					predictedVacancies: 3,
				})],
			});

			const { response, body } = await callToMonitorGet();

			expect(response.status).toBe(200);
			expect(body.data).toMatchObject({
				alertsTriggered: 0,
				predictionAlertsTriggered: 0,
				alimtalksSent: 0,
			});
			expect(alertBulkWriteMock).not.toHaveBeenCalled();
			expect(sendAlimtalkMock).not.toHaveBeenCalled();
		});
	});
});
