import { describe, it, expect } from "vitest";
import { generateSignedPDF } from "@/lib/pdf-generator";

describe("pdf-generator", () => {
	it("generates a Uint8Array PDF", async () => {
		const result = await generateSignedPDF({
			title: "Admission Application",
			documentType: "admission",
			signerName: "Kim Dotori",
			signatureDataUrl: "",
			facilityName: "Happy Daycare",
			signedAt: new Date("2026-02-26T10:00:00Z"),
		});

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});

	it("generates valid PDF with signature data", async () => {
		// Minimal valid 1x1 white PNG in base64
		const minimalPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

		const result = await generateSignedPDF({
			title: "Health Certificate",
			documentType: "health_check",
			signerName: "Park Parent",
			signatureDataUrl: minimalPng,
			facilityName: "Love Daycare",
			signedAt: new Date("2026-02-26T14:30:00Z"),
		});

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(100);

		// PDF starts with %PDF
		const header = String.fromCharCode(...result.slice(0, 5));
		expect(header).toBe("%PDF-");
	});

	it("handles empty signature gracefully", async () => {
		const result = await generateSignedPDF({
			title: "Vaccination Certificate",
			documentType: "vaccination",
			signerName: "Lee Parent",
			signatureDataUrl: "",
			facilityName: "Star Kindergarten",
			signedAt: new Date(),
		});

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});

	it("handles invalid signature data gracefully", async () => {
		const result = await generateSignedPDF({
			title: "Resident Registration",
			documentType: "resident_cert",
			signerName: "Choi Parent",
			signatureDataUrl: "data:image/png;base64,INVALID_BASE64",
			facilityName: "Rainbow Daycare",
			signedAt: new Date(),
		});

		// Should not throw, should still produce a PDF
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});
});
