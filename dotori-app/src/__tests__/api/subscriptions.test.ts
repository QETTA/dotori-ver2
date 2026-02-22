import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
const dbConnectMock = vi.fn();

const userFindByIdMock = vi.fn();
const userFindByIdAndUpdateMock = vi.fn();

const subscriptionFindOneMock = vi.fn();
const subscriptionUpdateManyMock = vi.fn();
const subscriptionCreateMock = vi.fn();

vi.mock("@/auth", () => ({
	auth: authMock,
}));

vi.mock("@/lib/db", () => ({
	default: dbConnectMock,
}));

vi.mock("@/lib/logger", () => {
	const log = {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		withRequestId: () => log,
	};
	return { log };
});

vi.mock("@/models/User", () => ({
	default: {
		findById: userFindByIdMock,
		findByIdAndUpdate: userFindByIdAndUpdateMock,
	},
}));

vi.mock("@/models/Subscription", () => ({
	default: {
		findOne: subscriptionFindOneMock,
		updateMany: subscriptionUpdateManyMock,
		create: subscriptionCreateMock,
	},
}));

beforeEach(() => {
	authMock.mockReset();
	dbConnectMock.mockReset();
	userFindByIdMock.mockReset();
	userFindByIdAndUpdateMock.mockReset();
	subscriptionFindOneMock.mockReset();
	subscriptionUpdateManyMock.mockReset();
	subscriptionCreateMock.mockReset();

	dbConnectMock.mockResolvedValue(undefined);
});

describe("POST /api/subscriptions", () => {
	it("returns 403 when user is not admin", async () => {
		authMock.mockResolvedValue({ user: { id: "user-1" } });
		userFindByIdMock.mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue({ role: "user" }),
			}),
		});

		const { POST } = await import("@/app/api/subscriptions/route");
		const req = new NextRequest("http://localhost/api/subscriptions", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({ plan: "premium" }),
		});

		const res = await POST(req);
		expect(res.status).toBe(403);

		const json = await res.json();
		expect(json).toMatchObject({
			error: "관리자만 구독을 생성할 수 있습니다",
		});
		expect(subscriptionUpdateManyMock).not.toHaveBeenCalled();
		expect(subscriptionCreateMock).not.toHaveBeenCalled();
	});
});

describe("GET /api/subscriptions", () => {
	it("returns 401 when unauthenticated", async () => {
		authMock.mockResolvedValue(null);

		const { GET } = await import("@/app/api/subscriptions/route");
		const req = new NextRequest("http://localhost/api/subscriptions", {
			method: "GET",
		});

		const res = await GET(req);
		expect(res.status).toBe(401);

		const json = await res.json();
		expect(json).toMatchObject({
			error: "인증이 필요합니다",
			code: "UNAUTHORIZED",
		});
		expect(dbConnectMock).not.toHaveBeenCalled();
	});
});

