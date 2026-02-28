import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	generateDocument,
	bundleDocuments,
	generateAuditCertificate,
	DOCUMENT_TYPES,
	type DocumentType,
} from "@/lib/engines/pdf-document-engine";

/* ─── Mocks ─── */

const mockAuditLogFind = vi.fn();

vi.mock("@/models/AuditLog", () => ({
	default: {
		find: (...args: unknown[]) => ({
			sort: () => ({
				lean: () => mockAuditLogFind(...args),
			}),
		}),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("pdf-document-engine", () => {
	/* ─── Constants ─── */

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

	/* ─── generateDocument ─── */

	describe("generateDocument", () => {
		it("generates a valid PDF for each document type (ENG-PD-OK-001)", async () => {
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

		it("includes additional info in PDF (ENG-PD-OK-002)", async () => {
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

		it("handles empty signature gracefully (ENG-PD-OK-003)", async () => {
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

		it("handles very long childName (ENG-PD-BND-001)", async () => {
			const result = await generateDocument({
				documentType: "입소신청서" as DocumentType,
				data: {
					childName: "A".repeat(500),
					parentName: "Parent",
					facilityName: "Facility",
				},
			});

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("handles many additionalInfo fields (ENG-PD-BND-002)", async () => {
			const additionalInfo: Record<string, string> = {};
			for (let i = 0; i < 50; i++) {
				additionalInfo[`Field ${i}`] = `Value ${i}`;
			}

			const result = await generateDocument({
				documentType: "건강검진결과서" as DocumentType,
				data: {
					childName: "Test",
					parentName: "Parent",
					facilityName: "Facility",
					additionalInfo,
				},
			});

			expect(result).toBeInstanceOf(Uint8Array);
			// Should be bigger than basic PDF due to extra fields
			const basic = await generateDocument({
				documentType: "건강검진결과서" as DocumentType,
				data: {
					childName: "Test",
					parentName: "Parent",
					facilityName: "Facility",
				},
			});
			expect(result.length).toBeGreaterThan(basic.length);
		});

		it("handles invalid data URL signature (ENG-PD-ERR-001)", async () => {
			const result = await generateDocument({
				documentType: "이용계약서" as DocumentType,
				data: {
					childName: "Test",
					parentName: "Parent",
					facilityName: "Facility",
				},
				signatureDataUrl: "not-a-data-url",
			});

			// Should still produce valid PDF (signature skipped)
			expect(result).toBeInstanceOf(Uint8Array);
			const header = String.fromCharCode(...result.slice(0, 5));
			expect(header).toBe("%PDF-");
		});
	});

	/* ─── bundleDocuments ─── */

	describe("bundleDocuments", () => {
		it("bundles multiple documents into one PDF (ENG-PD-OK-005)", async () => {
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

		it("handles single document bundle (ENG-PD-OK-006)", async () => {
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

		it("bundles all 7 document types (ENG-PD-BND-003)", async () => {
			const documents = DOCUMENT_TYPES.map((docType) => ({
				documentType: docType,
				data: {
					childName: "Test Child",
					parentName: "Test Parent",
					facilityName: "Test Facility",
				},
			}));

			const result = await bundleDocuments(documents);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);

			// 7-doc bundle should be significantly larger than 2-doc bundle
			const twoDocBundle = await bundleDocuments(documents.slice(0, 2));
			expect(result.length).toBeGreaterThan(twoDocBundle.length);
		});

		it("handles empty document array (ENG-PD-BND-004)", async () => {
			const result = await bundleDocuments([]);
			expect(result).toBeInstanceOf(Uint8Array);
			// Empty PDF is valid (just no pages)
			const header = String.fromCharCode(...result.slice(0, 5));
			expect(header).toBe("%PDF-");
		});
	});

	/* ─── generateAuditCertificate ─── */

	describe("generateAuditCertificate", () => {
		it("generates certificate with audit events (ENG-PD-OK-007)", async () => {
			mockAuditLogFind.mockResolvedValue([
				{
					action: "document_created",
					userId: "u1",
					timestamp: new Date("2026-02-20T10:00:00Z"),
					ipAddress: "1.2.3.4",
				},
				{
					action: "signature_applied",
					userId: "u1",
					timestamp: new Date("2026-02-20T10:05:00Z"),
					ipAddress: "1.2.3.4",
				},
				{
					action: "document_completed",
					userId: "u1",
					timestamp: new Date("2026-02-20T10:10:00Z"),
					ipAddress: "1.2.3.4",
				},
			]);

			const result = await generateAuditCertificate("doc123");
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(100);

			const header = String.fromCharCode(...result.slice(0, 5));
			expect(header).toBe("%PDF-");

			// Verify mock was called with correct params
			expect(mockAuditLogFind).toHaveBeenCalledWith({
				targetType: "esignature",
				targetId: "doc123",
			});
		});

		it("generates certificate with no events (ENG-PD-BND-005)", async () => {
			mockAuditLogFind.mockResolvedValue([]);

			const result = await generateAuditCertificate("empty-doc");
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);

			const header = String.fromCharCode(...result.slice(0, 5));
			expect(header).toBe("%PDF-");
		});

		it("handles many audit events without overflow (ENG-PD-BND-006)", async () => {
			// Generate 100 audit events
			const events = Array.from({ length: 100 }, (_, i) => ({
				action: `action_${i}`,
				userId: "u1",
				timestamp: new Date(`2026-02-20T${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:00Z`),
				ipAddress: "1.2.3.4",
			}));
			mockAuditLogFind.mockResolvedValue(events);

			const result = await generateAuditCertificate("many-events-doc");
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
			// Should still be a valid PDF (overflow protection at yPos < margin+40)
		});
	});
});
