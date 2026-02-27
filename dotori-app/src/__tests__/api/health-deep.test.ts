import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
	dbConnectMock,
	verifyCronSecretMock,
	getAllCircuitStatusMock,
	logErrorMock,
	pingMock,
	adminMock,
	mongooseMock,
} = vi.hoisted(() => {
	const pingMock = vi.fn();
	const adminMock = vi.fn(() => ({ ping: pingMock }));
	const mongooseMock = {
		connection: {
			db: {
				admin: adminMock,
			},
		},
	};

	return {
		dbConnectMock: vi.fn(),
		verifyCronSecretMock: vi.fn(),
		getAllCircuitStatusMock: vi.fn(),
		logErrorMock: vi.fn(),
		pingMock,
		adminMock,
		mongooseMock,
	};
});

vi.mock("@/lib/db", () => ({
	default: dbConnectMock,
}));

vi.mock("@/lib/cron-auth", () => ({
	verifyCronSecret: verifyCronSecretMock,
}));

vi.mock("@/lib/external/circuit-breakers", () => ({
	getAllCircuitStatus: getAllCircuitStatusMock,
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

vi.mock("mongoose", () => ({
	default: mongooseMock,
}));

const originalNodeEnv = process.env.NODE_ENV;
const env = process.env as Record<string, string | undefined>;

describe("GET /api/health/deep", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		env.NODE_ENV = "test";

		dbConnectMock.mockResolvedValue(undefined);
		verifyCronSecretMock.mockReturnValue(true);
		getAllCircuitStatusMock.mockReturnValue([{ name: "isalang-api", state: "CLOSED" }]);
		pingMock.mockResolvedValue({ ok: 1 });
		mongooseMock.connection.db = { admin: adminMock };
	});

	afterEach(() => {
		env.NODE_ENV = originalNodeEnv;
	});

	it("returns 401 in production when cron secret verification fails", async () => {
		env.NODE_ENV = "production";
		verifyCronSecretMock.mockReturnValue(false);

		const { GET } = await import("@/app/api/health/deep/route");
		const res = await GET(new Request("http://localhost:3000/api/health/deep"));
		const body = await res.json();

		expect(res.status).toBe(401);
		expect(body).toMatchObject({
			code: "UNAUTHORIZED",
			error: { code: "UNAUTHENTICATED" },
		});
		expect(verifyCronSecretMock).toHaveBeenCalledTimes(1);
		expect(dbConnectMock).not.toHaveBeenCalled();
		expect(getAllCircuitStatusMock).not.toHaveBeenCalled();
	});

	it("returns 200 and healthy when DB ping succeeds and no circuit is open", async () => {
		getAllCircuitStatusMock.mockReturnValue([{ name: "isalang-api", state: "CLOSED" }]);

		const { GET } = await import("@/app/api/health/deep/route");
		const res = await GET(new Request("http://localhost:3000/api/health/deep"));
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toMatchObject({
			status: "healthy",
			checks: {
				mongodb: {
					status: "ok",
					latencyMs: expect.any(Number),
				},
			},
		});
		expect(pingMock).toHaveBeenCalledWith({ maxTimeMS: 5000 });
		expect(body.circuits).toEqual([{ name: "isalang-api", state: "CLOSED" }]);
	});

	it("returns 503 and mongodb error status when DB check fails", async () => {
		dbConnectMock.mockRejectedValueOnce(new Error("db unavailable"));

		const { GET } = await import("@/app/api/health/deep/route");
		const res = await GET(new Request("http://localhost:3000/api/health/deep"));
		const body = await res.json();

		expect(res.status).toBe(503);
		expect(body.status).toBe("degraded");
		expect(body.checks.mongodb.status).toBe("error");
		expect(body.checks.mongodb.reason).toContain("db unavailable");
		expect(logErrorMock).toHaveBeenCalledWith("Deep health check MongoDB failed", { error: "db unavailable" });
		expect(pingMock).not.toHaveBeenCalled();
	});

	it("returns 200 and degraded when DB is healthy but an open circuit exists", async () => {
		getAllCircuitStatusMock.mockReturnValue([
			{ name: "isalang-api", state: "OPEN" },
			{ name: "kosis-api", state: "CLOSED" },
		]);

		const { GET } = await import("@/app/api/health/deep/route");
		const res = await GET(new Request("http://localhost:3000/api/health/deep"));
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.status).toBe("degraded");
		expect(body.checks.mongodb.status).toBe("ok");
		expect(body.circuits).toEqual([
			{ name: "isalang-api", state: "OPEN" },
			{ name: "kosis-api", state: "CLOSED" },
		]);
	});
});
