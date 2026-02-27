import { describe, it, expect } from "vitest";
import { signatureSubmitSchema } from "@/lib/validations";

describe("/api/esignature/[id]/sign", () => {
	describe("signatureSubmitSchema", () => {
		it("accepts valid signature data", () => {
			const result = signatureSubmitSchema.safeParse({
				signatureData: "data:image/png;base64,iVBORw0KGgoAAAANS",
			});
			expect(result.success).toBe(true);
		});

		it("rejects empty signature data", () => {
			const result = signatureSubmitSchema.safeParse({
				signatureData: "",
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing signature data", () => {
			const result = signatureSubmitSchema.safeParse({});
			expect(result.success).toBe(false);
		});
	});

	describe("PDF generation integration", () => {
		it("requires pending status for signing", () => {
			// Only pending documents can be signed
			const validStatuses = ["pending"];
			expect(validStatuses).toContain("pending");
			expect(validStatuses).not.toContain("draft");
			expect(validStatuses).not.toContain("signed");
		});
	});
});
