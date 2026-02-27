import { describe, it, expect } from "vitest";
import {
	CONSENT_TEMPLATES,
	ENROLLMENT_TEMPLATES,
	ALL_TEMPLATES,
	getTemplate,
	getRequiredTemplates,
	getConsentTemplates,
	getEnrollmentTemplates,
} from "@/lib/esignature-templates";

describe("esignature-templates", () => {
	describe("CONSENT_TEMPLATES", () => {
		it("defines exactly 7 consent templates", () => {
			expect(CONSENT_TEMPLATES).toHaveLength(7);
		});

		it("all consent templates have category 'consent'", () => {
			for (const t of CONSENT_TEMPLATES) {
				expect(t.category).toBe("consent");
			}
		});

		it("all consent templates require signature", () => {
			for (const t of CONSENT_TEMPLATES) {
				expect(t.signatureRequired).toBe(true);
			}
		});

		it("includes all 7 required document types", () => {
			const types = CONSENT_TEMPLATES.map((t) => t.documentType);
			expect(types).toContain("입소동의서");
			expect(types).toContain("개인정보동의서");
			expect(types).toContain("귀가동의서");
			expect(types).toContain("투약의뢰서");
			expect(types).toContain("현장학습동의서");
			expect(types).toContain("차량운행동의서");
			expect(types).toContain("CCTV열람동의서");
		});

		it("all consent templates have at least one required field", () => {
			for (const t of CONSENT_TEMPLATES) {
				const requiredFields = t.fields.filter((f) => f.required);
				expect(requiredFields.length).toBeGreaterThan(0);
			}
		});

		it("all consent templates have legal clauses", () => {
			for (const t of CONSENT_TEMPLATES) {
				expect(t.legalClauses.length).toBeGreaterThan(0);
			}
		});
	});

	describe("ENROLLMENT_TEMPLATES", () => {
		it("defines exactly 7 enrollment templates", () => {
			expect(ENROLLMENT_TEMPLATES).toHaveLength(7);
		});

		it("all enrollment templates have category 'enrollment'", () => {
			for (const t of ENROLLMENT_TEMPLATES) {
				expect(t.category).toBe("enrollment");
			}
		});

		it("preserves existing 7 document types", () => {
			const types = ENROLLMENT_TEMPLATES.map((t) => t.documentType);
			expect(types).toContain("입소신청서");
			expect(types).toContain("건강검진확인서");
			expect(types).toContain("예방접종증명서");
			expect(types).toContain("영유아건강검진결과통보서");
			expect(types).toContain("주민등록등본");
			expect(types).toContain("재직증명서");
			expect(types).toContain("소득증빙서류");
		});
	});

	describe("ALL_TEMPLATES", () => {
		it("contains 14 total templates (7 consent + 7 enrollment)", () => {
			expect(ALL_TEMPLATES).toHaveLength(14);
		});
	});

	describe("getTemplate", () => {
		it("returns template for valid document type", () => {
			const t = getTemplate("입소동의서");
			expect(t).toBeDefined();
			expect(t!.documentType).toBe("입소동의서");
			expect(t!.category).toBe("consent");
		});

		it("returns template for enrollment document type", () => {
			const t = getTemplate("입소신청서");
			expect(t).toBeDefined();
			expect(t!.category).toBe("enrollment");
		});

		it("returns undefined for unknown document type", () => {
			const t = getTemplate("없는서류");
			expect(t).toBeUndefined();
		});
	});

	describe("getRequiredTemplates", () => {
		it("returns more templates for daycare than kindergarten", () => {
			const daycare = getRequiredTemplates("daycare");
			const kindergarten = getRequiredTemplates("kindergarten");
			expect(daycare.length).toBeGreaterThan(kindergarten.length);
		});

		it("daycare includes 영유아건강검진결과통보서", () => {
			const daycare = getRequiredTemplates("daycare");
			const types = daycare.map((t) => t.documentType);
			expect(types).toContain("영유아건강검진결과통보서");
		});

		it("kindergarten excludes 영유아건강검진결과통보서", () => {
			const kindergarten = getRequiredTemplates("kindergarten");
			const types = kindergarten.map((t) => t.documentType);
			expect(types).not.toContain("영유아건강검진결과통보서");
		});
	});

	describe("getConsentTemplates", () => {
		it("returns exactly 7 consent templates", () => {
			expect(getConsentTemplates()).toHaveLength(7);
		});
	});

	describe("getEnrollmentTemplates", () => {
		it("returns exactly 7 enrollment templates", () => {
			expect(getEnrollmentTemplates()).toHaveLength(7);
		});
	});
});
