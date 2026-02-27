import { describe, it, expect } from "vitest";
import { isModusignConfigured } from "@/lib/external/modusign-api";

describe("modusign-api", () => {
	describe("isModusignConfigured", () => {
		it("returns false when env vars are not set", () => {
			// Default state: MODUSIGN_API_KEY and MODUSIGN_API_SECRET are empty
			expect(isModusignConfigured()).toBe(false);
		});

		it("returns boolean type", () => {
			expect(typeof isModusignConfigured()).toBe("boolean");
		});
	});

	describe("createDocument stub", () => {
		it("returns stub when not configured", async () => {
			const { createDocument } = await import("@/lib/external/modusign-api");
			const result = await createDocument({
				title: "테스트 서류",
				signerEmail: "test@example.com",
				signerName: "테스트",
			});

			expect(result.id).toContain("stub-");
			expect(result.title).toBe("테스트 서류");
			expect(result.status).toBe("draft");
		});
	});

	describe("getDocumentStatus stub", () => {
		it("returns stub when not configured", async () => {
			const { getDocumentStatus } = await import("@/lib/external/modusign-api");
			const result = await getDocumentStatus("test-doc-id");

			expect(result.id).toBe("test-doc-id");
			expect(result.status).toBe("draft");
		});
	});

	describe("getSignedPdf stub", () => {
		it("returns null when not configured", async () => {
			const { getSignedPdf } = await import("@/lib/external/modusign-api");
			const result = await getSignedPdf("test-doc-id");

			expect(result).toBeNull();
		});
	});
});
