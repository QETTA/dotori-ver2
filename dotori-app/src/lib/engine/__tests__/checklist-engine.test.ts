import { describe, it, expect } from "vitest";
import { calculateAgeClass } from "../checklist-engine";

describe("calculateAgeClass", () => {
	it("returns 만0세반 for under 12 months", () => {
		const today = new Date();
		const birthDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
		expect(calculateAgeClass(birthDate.toISOString().slice(0, 10))).toBe("만0세반");
	});

	it("returns 만1세반 for 12-23 months", () => {
		const today = new Date();
		const birthDate = new Date(today.getFullYear() - 1, today.getMonth() - 3, today.getDate());
		expect(calculateAgeClass(birthDate.toISOString().slice(0, 10))).toBe("만1세반");
	});

	it("returns 만5세반 for 60+ months", () => {
		const today = new Date();
		const birthDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
		expect(calculateAgeClass(birthDate.toISOString().slice(0, 10))).toBe("만5세반");
	});
});
