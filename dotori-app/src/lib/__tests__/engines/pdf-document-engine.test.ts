import { describe, it, expect } from "vitest";
import {
	generateDocument,
	bundleDocuments,
	DOCUMENT_TYPES,
	type DocumentType,
} from "@/lib/engines/pdf-document-engine";

describe("pdf-document-engine", () => {
	describe("DOCUMENT_TYPES", () => {
		it("defines 7 document types", () => {
			expect(DOCUMENT_TYPES).toHaveLength(7);
		});

		it("includes all required types", () => {
			expect(DOCUMENT_TYPES).toContain("입소신청서");
			expect(DOCUMENT_TYPES).toContain("예방접종증명서");
			expect(DOCUMENT_TYPES).toContain("건강검진결과서");
			expect(DOCUMENT_TYPES).toContain("보육교육정보동의서");
			expect(DOCUMENT_TYPES).toContain("이용계약서");
			expect(DOCUMENT_TYPES).toContain("긴급연락처귀가동의서");
			expect(DOCUMENT_TYPES).toContain("알레르기특이사항고지서");
		});
	});

	describe("generateDocument", () => {
		it("generates a valid PDF for each document type", async () => {
			const baseData = {
				childName: "Kim Dotori",
				parentName: "Kim Parent",
				facilityName: "Happy Daycare",
			};

			for (const docType of DOCUMENT_TYPES) {
				const result = await generateDocument({
					documentType: docType,
					data: baseData,
				});

				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBeGreaterThan(0);

				// Verify PDF header
				const header = String.fromCharCode(...result.slice(0, 5));
				expect(header).toBe("%PDF-");
			}
		});

		it("includes additional info in PDF", async () => {
			const result = await generateDocument({
				documentType: "입소신청서" as DocumentType,
				data: {
					childName: "Test Child",
					parentName: "Test Parent",
					facilityName: "Test Facility",
					facilityAddress: "Seoul, Korea",
					childBirthDate: "2022-03-15",
					parentPhone: "010-1234-5678",
					parentEmail: "test@example.com",
					additionalInfo: {
						"Blood Type": "A+",
						"Emergency Contact": "010-9999-8888",
					},
				},
			});

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(100);
		});

		it("handles empty signature gracefully", async () => {
			const result = await generateDocument({
				documentType: "이용계약서" as DocumentType,
				data: {
					childName: "Test",
					parentName: "Parent",
					facilityName: "Facility",
				},
				signatureDataUrl: "",
			});

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe("bundleDocuments", () => {
		it("bundles multiple documents into one PDF", async () => {
			const documents = [
				{
					documentType: "입소신청서" as DocumentType,
					data: {
						childName: "Child A",
						parentName: "Parent A",
						facilityName: "Facility A",
					},
				},
				{
					documentType: "예방접종증명서" as DocumentType,
					data: {
						childName: "Child A",
						parentName: "Parent A",
						facilityName: "Facility A",
					},
				},
			];

			const result = await bundleDocuments(documents);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);

			// Bundled PDF should be larger than a single one
			const single = await generateDocument(documents[0]);
			expect(result.length).toBeGreaterThan(single.length);
		});

		it("handles single document bundle", async () => {
			const result = await bundleDocuments([
				{
					documentType: "건강검진결과서" as DocumentType,
					data: {
						childName: "Test",
						parentName: "Parent",
						facilityName: "Facility",
					},
				},
			]);

			expect(result).toBeInstanceOf(Uint8Array);
			const header = String.fromCharCode(...result.slice(0, 5));
			expect(header).toBe("%PDF-");
		});
	});
});
