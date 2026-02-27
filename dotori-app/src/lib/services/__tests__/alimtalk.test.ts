import { describe, it, expect } from "vitest";
import {
	ALIMTALK_TEMPLATES,
	isAlimtalkConfigured,
	type AlimtalkTemplateKey,
} from "../../kakao-alimtalk";

describe("kakao-alimtalk", () => {
	describe("ALIMTALK_TEMPLATES", () => {
		it("has all required template keys", () => {
			const expectedKeys: AlimtalkTemplateKey[] = [
				"vacancy",
				"waitlist_update",
				"sign_request",
				"sign_complete",
				"admission_confirm",
				"subscription_expiry",
			];
			for (const key of expectedKeys) {
				expect(ALIMTALK_TEMPLATES[key]).toBeTruthy();
				expect(typeof ALIMTALK_TEMPLATES[key]).toBe("string");
			}
		});

		it("template IDs follow naming convention DOTORI_*", () => {
			for (const value of Object.values(ALIMTALK_TEMPLATES)) {
				expect(value).toMatch(/^DOTORI_/);
			}
		});

		it("template IDs are unique", () => {
			const values = Object.values(ALIMTALK_TEMPLATES);
			const unique = new Set(values);
			expect(unique.size).toBe(values.length);
		});
	});

	describe("isAlimtalkConfigured", () => {
		it("returns false when env vars are not set (test default)", () => {
			expect(isAlimtalkConfigured()).toBe(false);
		});
	});
});
