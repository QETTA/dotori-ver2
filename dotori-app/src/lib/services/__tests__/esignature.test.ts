import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
	isValidTransition,
	getRequiredDocuments,
} from "../esignature.service";

describe("esignature.service", () => {
	describe("isValidTransition", () => {
		it("allows draft → pending", () => {
			expect(isValidTransition("draft", "pending")).toBe(true);
		});

		it("allows pending → signed", () => {
			expect(isValidTransition("pending", "signed")).toBe(true);
		});

		it("allows signed → submitted", () => {
			expect(isValidTransition("signed", "submitted")).toBe(true);
		});

		it("allows any active state → expired", () => {
			expect(isValidTransition("draft", "expired")).toBe(true);
			expect(isValidTransition("pending", "expired")).toBe(true);
			expect(isValidTransition("signed", "expired")).toBe(true);
			expect(isValidTransition("submitted", "expired")).toBe(true);
		});

		it("rejects backward transitions", () => {
			expect(isValidTransition("pending", "draft")).toBe(false);
			expect(isValidTransition("signed", "pending")).toBe(false);
			expect(isValidTransition("submitted", "signed")).toBe(false);
		});

		it("rejects expired → anything", () => {
			expect(isValidTransition("expired", "draft")).toBe(false);
			expect(isValidTransition("expired", "pending")).toBe(false);
		});

		it("rejects skip transitions", () => {
			expect(isValidTransition("draft", "signed")).toBe(false);
			expect(isValidTransition("draft", "submitted")).toBe(false);
			expect(isValidTransition("pending", "submitted")).toBe(false);
		});
	});

	describe("getRequiredDocuments", () => {
		it("returns enrollment + consent docs for daycare (14 = 7서류 + 7동의서)", () => {
			const docs = getRequiredDocuments("daycare");
			// 기존 서류
			expect(docs).toContain("입소신청서");
			expect(docs).toContain("건강검진확인서");
			expect(docs).toContain("예방접종증명서");
			expect(docs).toContain("주민등록등본");
			expect(docs).toContain("영유아건강검진결과통보서");
			// 동의서
			expect(docs).toContain("입소동의서");
			expect(docs).toContain("개인정보동의서");
			expect(docs.length).toBe(14);
		});

		it("returns docs for kindergarten (11 = 4서류 + 7동의서)", () => {
			const docs = getRequiredDocuments("kindergarten");
			expect(docs).toContain("입소신청서");
			expect(docs).toContain("건강검진확인서");
			expect(docs).not.toContain("영유아건강검진결과통보서");
			// 동의서
			expect(docs).toContain("입소동의서");
			expect(docs).toContain("귀가동의서");
			expect(docs.length).toBe(11);
		});
	});
});
