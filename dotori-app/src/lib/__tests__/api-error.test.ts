import { describe, it, expect } from "vitest";
import {
	getLegacyApiErrorCodeByStatus,
	getCanonicalApiErrorCode,
	createApiErrorPayload,
} from "../api-error";

/* ─── getLegacyApiErrorCodeByStatus ─── */

describe("getLegacyApiErrorCodeByStatus", () => {
	const expectedMap: [number, string][] = [
		[400, "BAD_REQUEST"],
		[401, "UNAUTHORIZED"],
		[403, "FORBIDDEN"],
		[404, "NOT_FOUND"],
		[409, "CONFLICT"],
		[429, "RATE_LIMITED"],
		[500, "INTERNAL_ERROR"],
	];

	for (const [status, code] of expectedMap) {
		it(`${status} → '${code}'`, () => {
			expect(getLegacyApiErrorCodeByStatus(status)).toBe(code);
		});
	}

	it("미매핑 4xx 상태코드 → 'BAD_REQUEST' (fallback)", () => {
		expect(getLegacyApiErrorCodeByStatus(418)).toBe("BAD_REQUEST");
		expect(getLegacyApiErrorCodeByStatus(499)).toBe("BAD_REQUEST");
	});

	it("미매핑 5xx 상태코드 → 'INTERNAL_ERROR' (fallback)", () => {
		expect(getLegacyApiErrorCodeByStatus(502)).toBe("INTERNAL_ERROR");
		expect(getLegacyApiErrorCodeByStatus(0)).toBe("INTERNAL_ERROR");
	});
});

/* ─── getCanonicalApiErrorCode ─── */

describe("getCanonicalApiErrorCode", () => {
	/* 상태코드만으로 결정 */
	const statusMap: [number, string][] = [
		[400, "VALIDATION_ERROR"],
		[401, "UNAUTHENTICATED"],
		[403, "FORBIDDEN"],
		[404, "NOT_FOUND"],
		[409, "CONFLICT"],
		[429, "RATE_LIMITED"],
		[413, "PAYLOAD_TOO_LARGE"],
		[415, "UNSUPPORTED_MEDIA_TYPE"],
		[422, "UNPROCESSABLE_ENTITY"],
		[500, "INTERNAL_ERROR"],
		[502, "UPSTREAM_BAD_GATEWAY"],
		[503, "SERVICE_UNAVAILABLE"],
		[504, "UPSTREAM_TIMEOUT"],
	];

	for (const [status, canonical] of statusMap) {
		it(`status ${status} (code 없음) → '${canonical}'`, () => {
			expect(getCanonicalApiErrorCode(status)).toBe(canonical);
		});
	}

	/* 레거시 코드 → 캐노니컬 변환 */

	it("레거시 'BAD_REQUEST' → 'VALIDATION_ERROR'", () => {
		expect(getCanonicalApiErrorCode(400, "BAD_REQUEST")).toBe("VALIDATION_ERROR");
	});

	it("레거시 'UNAUTHORIZED' → 'UNAUTHENTICATED'", () => {
		expect(getCanonicalApiErrorCode(401, "UNAUTHORIZED")).toBe("UNAUTHENTICATED");
	});

	it("레거시 전용 'RATE_LIMITED' → canonical 'RATE_LIMITED'", () => {
		expect(getCanonicalApiErrorCode(429, "RATE_LIMITED")).toBe("RATE_LIMITED");
	});

	/* 이미 캐노니컬 코드 → 그대로 반환 */

	it("캐노니컬 'VALIDATION_ERROR' → 그대로 반환", () => {
		expect(getCanonicalApiErrorCode(400, "VALIDATION_ERROR")).toBe("VALIDATION_ERROR");
	});

	it("캐노니컬 'INTERNAL_ERROR' → 그대로 반환", () => {
		expect(getCanonicalApiErrorCode(500, "INTERNAL_ERROR")).toBe("INTERNAL_ERROR");
	});

	/* 미매핑 상태코드 + 미매핑 코드 → fallback */

	it("미매핑 4xx 상태코드 + 미매핑 코드 → 'VALIDATION_ERROR'", () => {
		expect(getCanonicalApiErrorCode(418, "UNKNOWN_CODE")).toBe("VALIDATION_ERROR");
	});

	it("미매핑 4xx 상태코드 (code 없음) → 'VALIDATION_ERROR'", () => {
		expect(getCanonicalApiErrorCode(418)).toBe("VALIDATION_ERROR");
	});
});

/* ─── createApiErrorPayload ─── */

describe("createApiErrorPayload", () => {
	it("기본 구조: error 객체 + top-level 필드", () => {
		const p = createApiErrorPayload({
			status: 400,
			message: "잘못된 요청",
			requestId: "req-123",
			code: "BAD_REQUEST",
		});

		// error 객체
		expect(p.error.code).toBe("VALIDATION_ERROR"); // BAD_REQUEST → canonical
		expect(p.error.message).toBe("잘못된 요청");
		expect(p.error.details).toBeNull(); // default
		expect(p.error.requestId).toBe("req-123");

		// top-level
		expect(p.code).toBe("BAD_REQUEST"); // 원래 code 유지
		expect(p.message).toBe("잘못된 요청");
		expect(p.details).toBeNull();
		expect(p.requestId).toBe("req-123");
	});

	it("code 미지정 → canonical code가 top-level code로", () => {
		const p = createApiErrorPayload({ status: 404, message: "없음" });
		expect(p.error.code).toBe("NOT_FOUND");
		expect(p.code).toBe("NOT_FOUND"); // code || canonicalCode
	});

	it("details 전달 → error.details에 반영", () => {
		const details = { fields: [{ path: "name", reason: "too_short" }] };
		const p = createApiErrorPayload({
			status: 400,
			message: "검증 실패",
			details,
		});
		expect(p.error.details).toEqual(details);
		expect(p.details).toEqual(details);
	});

	it("legacyError 전달 → legacyError 필드 추가", () => {
		const p = createApiErrorPayload({
			status: 500,
			message: "오류",
			legacyError: "old format error",
		});
		expect(p.legacyError).toBe("old format error");
	});

	it("legacyError 미전달 → legacyError 필드 없음", () => {
		const p = createApiErrorPayload({ status: 500, message: "오류" });
		expect(p).not.toHaveProperty("legacyError");
	});

	it("requestId 미전달 → 자동 생성 (UUID 형태)", () => {
		const p = createApiErrorPayload({ status: 500, message: "오류" });
		expect(p.requestId).toBeTruthy();
		expect(typeof p.requestId).toBe("string");
		// UUID v4 형태 검증 (8-4-4-4-12)
		expect(p.requestId).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
	});
});
