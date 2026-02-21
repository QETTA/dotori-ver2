import { describe, it, expect } from "vitest";
import type { Facility } from "@/types/dotori";
import { generateTransferReasons } from "../why-engine";

describe("generateTransferReasons", () => {
	const sampleFacility: Facility = {
		id: "f1",
		name: "테스트",
		type: "국공립",
		status: "waiting",
		address: "서울시 강남구",
		lat: 37.4952,
		lng: 127.0266,
		capacity: { total: 20, current: 20, waiting: 3 },
		features: [],
		rating: 4.2,
		reviewCount: 12,
		lastSyncedAt: new Date().toISOString(),
	};

	it("returns array when transfer reason context is provided", () => {
		const result = generateTransferReasons({ facility: sampleFacility });
		expect(Array.isArray(result)).toBe(true);
	});

	it("returns public_waitlist reason when facility is public type", () => {
		const facility: Facility = {
			...sampleFacility,
			capacity: { total: 25, current: 25, waiting: 12 },
		};
		const result = generateTransferReasons({ facility });

		const reason = result.find((item) => item.category === "public_waitlist");
		expect(reason).toBeDefined();
		expect(reason?.category).toBe("public_waitlist");
	});

	it("returns teacher turnover reason when teacher count indicates risk", () => {
		const facility: Facility = {
			...sampleFacility,
			type: "민간",
			capacity: { total: 80, current: 50, waiting: 5 },
			teacherCount: 1,
		};
		const result = generateTransferReasons({ facility });

		const reason = result.find((item) => item.category === "teacher_turnover");
		expect(reason).toBeDefined();
		expect(reason?.source).toBe("인력 구성 분석");
	});

	it("does not include public_waitlist reason when waiting count is zero", () => {
		const facility: Facility = {
			...sampleFacility,
			type: "국공립",
			capacity: { total: 20, current: 20, waiting: 0 },
		};

		const result = generateTransferReasons({ facility });

		expect(
			result.some((item) => item.category === "public_waitlist"),
		).toBe(false);
	});

	it("handles facility names with special characters without crashing", () => {
		const facility: Facility = {
			...sampleFacility,
			name: "★도토리&키즈!@#어린이집(테스트)",
		};

		expect(() => generateTransferReasons({ facility })).not.toThrow();
		expect(Array.isArray(generateTransferReasons({ facility }))).toBe(true);
	});
});
