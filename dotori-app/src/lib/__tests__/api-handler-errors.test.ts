import { describe, it, expect, vi } from "vitest";

// api-handler.ts imports @/auth, @/lib/db, @/lib/logger — mock them
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		withRequestId: vi.fn(() => ({
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		})),
	},
}));

import {
	ApiError,
	NotFoundError,
	ConflictError,
	BadRequestError,
	ForbiddenError,
} from "../api-handler";

/* ─── ApiError ─── */

describe("ApiError", () => {
	it("status와 message 정확히 보존", () => {
		const e = new ApiError("커스텀 에러", 422);
		expect(e.status).toBe(422);
		expect(e.message).toBe("커스텀 에러");
	});

	it("Error를 상속", () => {
		const e = new ApiError("에러", 500);
		expect(e).toBeInstanceOf(Error);
		expect(e).toBeInstanceOf(ApiError);
	});

	it("name 프로퍼티는 'Error' (기본 Error 상속)", () => {
		const e = new ApiError("에러", 400);
		expect(e.name).toBe("Error");
	});
});

/* ─── NotFoundError ─── */

describe("NotFoundError", () => {
	it("status=404, 기본 메시지='리소스를 찾을 수 없습니다'", () => {
		const e = new NotFoundError();
		expect(e.status).toBe(404);
		expect(e.message).toBe("리소스를 찾을 수 없습니다");
	});

	it("커스텀 메시지 전달 가능", () => {
		const e = new NotFoundError("시설을 찾을 수 없습니다");
		expect(e.status).toBe(404);
		expect(e.message).toBe("시설을 찾을 수 없습니다");
	});

	it("ApiError를 상속", () => {
		expect(new NotFoundError()).toBeInstanceOf(ApiError);
	});
});

/* ─── ConflictError ─── */

describe("ConflictError", () => {
	it("status=409, 기본 메시지='이미 존재하는 리소스입니다'", () => {
		const e = new ConflictError();
		expect(e.status).toBe(409);
		expect(e.message).toBe("이미 존재하는 리소스입니다");
	});

	it("커스텀 메시지 전달 가능", () => {
		const e = new ConflictError("이미 등록된 알림입니다");
		expect(e.message).toBe("이미 등록된 알림입니다");
	});
});

/* ─── BadRequestError ─── */

describe("BadRequestError", () => {
	it("status=400, 기본 메시지='잘못된 요청입니다'", () => {
		const e = new BadRequestError();
		expect(e.status).toBe(400);
		expect(e.message).toBe("잘못된 요청입니다");
	});

	it("커스텀 메시지 전달 가능", () => {
		const e = new BadRequestError("유효하지 않은 카테고리입니다");
		expect(e.message).toBe("유효하지 않은 카테고리입니다");
	});
});

/* ─── ForbiddenError ─── */

describe("ForbiddenError", () => {
	it("status=403, 기본 메시지='권한이 없습니다'", () => {
		const e = new ForbiddenError();
		expect(e.status).toBe(403);
		expect(e.message).toBe("권한이 없습니다");
	});

	it("커스텀 메시지 전달 가능", () => {
		const e = new ForbiddenError("관리자 전용");
		expect(e.message).toBe("관리자 전용");
	});
});
