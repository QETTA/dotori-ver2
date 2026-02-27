import { describe, it, expect } from "vitest";
import { isAlimtalkConfigured, ALIMTALK_TEMPLATES } from "@/lib/kakao-alimtalk";

describe("notification service - send functions", () => {
	describe("isAlimtalkConfigured", () => {
		it("returns false when Solapi env vars are not set", () => {
			// Default: SOLAPI_API_KEY, SOLAPI_SECRET, KAKAO_SENDER_KEY are empty
			expect(isAlimtalkConfigured()).toBe(false);
		});
	});

	describe("ALIMTALK_TEMPLATES", () => {
		it("has vacancy template", () => {
			expect(ALIMTALK_TEMPLATES.vacancy).toBe("DOTORI_VACANCY_001");
		});

		it("has sign_request template", () => {
			expect(ALIMTALK_TEMPLATES.sign_request).toBe("DOTORI_SIGN_001");
		});

		it("has subscription_expiry template", () => {
			expect(ALIMTALK_TEMPLATES.subscription_expiry).toBe("DOTORI_SUB_001");
		});

		it("has all required templates", () => {
			const templateKeys = Object.keys(ALIMTALK_TEMPLATES);
			expect(templateKeys).toContain("vacancy");
			expect(templateKeys).toContain("waitlist_update");
			expect(templateKeys).toContain("sign_request");
			expect(templateKeys).toContain("sign_complete");
			expect(templateKeys).toContain("admission_confirm");
			expect(templateKeys).toContain("subscription_expiry");
		});
	});

	describe("notification service exports", () => {
		it("exports sendVacancyAlert", async () => {
			const mod = await import("@/lib/services/notification.service");
			expect(typeof mod.sendVacancyAlert).toBe("function");
		});

		it("exports sendExpiryWarning", async () => {
			const mod = await import("@/lib/services/notification.service");
			expect(typeof mod.sendExpiryWarning).toBe("function");
		});

		it("exports sendSignRequest", async () => {
			const mod = await import("@/lib/services/notification.service");
			expect(typeof mod.sendSignRequest).toBe("function");
		});

		it("exports process functions", async () => {
			const mod = await import("@/lib/services/notification.service");
			expect(typeof mod.processSubscriptionExpiryWarnings).toBe("function");
			expect(typeof mod.processDocumentExpiryWarnings).toBe("function");
		});
	});
});
