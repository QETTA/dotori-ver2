import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, dbConnectMock } = vi.hoisted(() => ({
	authMock: vi.fn(),
	dbConnectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
	auth: authMock,
}));

vi.mock("@/lib/db", () => ({
	default: dbConnectMock,
}));

beforeEach(() => {
	vi.clearAllMocks();
	authMock.mockResolvedValue(null);
	dbConnectMock.mockResolvedValue(undefined);
});

function ensureCryptoRandomUUID(): void {
	if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
		return;
	}

	(globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
		randomUUID: () => "00000000-0000-4000-8000-000000000000",
	} as Crypto;
}

describe("POST /api/chat", () => {
	it("returns 400 for an empty message", async () => {
		ensureCryptoRandomUUID();

		const { POST } = await import("@/app/api/chat/route");
		const req = new NextRequest("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ message: "" }),
		});

		const res = await POST(req);
		expect(res.status).toBe(400);

		const json = await res.json();
		expect(json).toMatchObject({
			error: "message는 필수입니다",
			code: "BAD_REQUEST",
		});
	});

	it("returns 400 when the message exceeds length limit", async () => {
		ensureCryptoRandomUUID();

		const { POST } = await import("@/app/api/chat/route");
		const req = new NextRequest("http://localhost:3000/api/chat", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ message: "a".repeat(2001) }),
		});

		const res = await POST(req);
		expect(res.status).toBe(400);

		const json = await res.json();
		expect(json).toMatchObject({
			error: "메시지는 2000자 이내로 입력해주세요",
			code: "BAD_REQUEST",
		});
	});
});

