import { describe, it, expect } from "vitest";
import {
	calculateTrend,
	getSeasonalAdjustment,
	determineConfidence,
	calculatePrediction,
	parseAgeFromClassName,
	calculateGraduation,
	calculateAttractiveness,
	calculateDemandFactor,
} from "../to-prediction.service";

/* ─── Helpers ─── */

function makeSnapshot(total: number, current: number, daysAgo: number) {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return {
		capacity: { total, current, waiting: 0 },
		snapshotAt: date,
	};
}

/* ─── calculateTrend ─── */

describe("calculateTrend", () => {
	it("returns 0 for a single snapshot", () => {
		const snapshots = [makeSnapshot(100, 80, 0)];
		expect(calculateTrend(snapshots)).toBe(0);
	});

	it("detects increasing vacancy trend", () => {
		const snapshots = [
			makeSnapshot(100, 90, 14), // vacancy 10
			makeSnapshot(100, 80, 7),  // vacancy 20
			makeSnapshot(100, 70, 0),  // vacancy 30
		];
		expect(calculateTrend(snapshots)).toBeGreaterThan(0);
	});

	it("detects decreasing vacancy trend", () => {
		const snapshots = [
			makeSnapshot(100, 70, 14), // vacancy 30
			makeSnapshot(100, 80, 7),  // vacancy 20
			makeSnapshot(100, 90, 0),  // vacancy 10
		];
		expect(calculateTrend(snapshots)).toBeLessThan(0);
	});
});

/* ─── getSeasonalAdjustment ─── */

describe("getSeasonalAdjustment", () => {
	it("returns +3 for graduation month (March)", () => {
		expect(getSeasonalAdjustment(3)).toBe(3);
	});

	it("returns +1 for additional enrollment month (September)", () => {
		expect(getSeasonalAdjustment(9)).toBe(1);
	});

	it("returns -1 for stable months (April-June)", () => {
		expect(getSeasonalAdjustment(4)).toBe(-1);
		expect(getSeasonalAdjustment(5)).toBe(-1);
		expect(getSeasonalAdjustment(6)).toBe(-1);
	});

	it("returns 0 for other months", () => {
		expect(getSeasonalAdjustment(1)).toBe(0);
		expect(getSeasonalAdjustment(7)).toBe(0);
		expect(getSeasonalAdjustment(12)).toBe(0);
	});
});

/* ─── determineConfidence ─── */

describe("determineConfidence", () => {
	it("returns low for insufficient snapshots", () => {
		expect(determineConfidence(0)).toBe("low");
		expect(determineConfidence(1)).toBe("low");
		expect(determineConfidence(2)).toBe("low");
	});

	it("returns medium for moderate snapshots", () => {
		expect(determineConfidence(3)).toBe("medium");
		expect(determineConfidence(4)).toBe("medium");
		expect(determineConfidence(5)).toBe("medium");
	});

	it("returns high for sufficient snapshots", () => {
		expect(determineConfidence(6)).toBe("high");
		expect(determineConfidence(10)).toBe("high");
	});
});

/* ─── parseAgeFromClassName ─── */

describe("parseAgeFromClassName", () => {
	it("parses standard age class name", () => {
		expect(parseAgeFromClassName("만3세")).toBe(3);
		expect(parseAgeFromClassName("만5세")).toBe(5);
	});

	it("parses age 0", () => {
		expect(parseAgeFromClassName("만0세")).toBe(0);
	});

	it("returns -1 for unparseable name", () => {
		expect(parseAgeFromClassName("영아반")).toBe(-1);
		expect(parseAgeFromClassName("혼합반")).toBe(-1);
	});
});

/* ─── calculateGraduation ─── */

describe("calculateGraduation", () => {
	const ageClasses = [
		{ className: "만0세", capacity: 10, current: 8 },
		{ className: "만1세", capacity: 15, current: 12 },
		{ className: "만2세", capacity: 20, current: 18 },
	];

	it("returns full graduation count in proximity months (March)", () => {
		expect(calculateGraduation(ageClasses, 3)).toBe(18);
	});

	it("returns full graduation count in other proximity months", () => {
		expect(calculateGraduation(ageClasses, 1)).toBe(18);
		expect(calculateGraduation(ageClasses, 2)).toBe(18);
		expect(calculateGraduation(ageClasses, 4)).toBe(18);
	});

	it("returns 0 for non-proximity, non-decay months", () => {
		expect(calculateGraduation(ageClasses, 7)).toBe(0);
		expect(calculateGraduation(ageClasses, 10)).toBe(0);
	});

	it("returns decayed count in decay months", () => {
		// 18 * 0.3 = 5.4 → round = 5
		expect(calculateGraduation(ageClasses, 5)).toBe(5);
		expect(calculateGraduation(ageClasses, 6)).toBe(5);
	});

	it("returns 0 when no ageClasses", () => {
		expect(calculateGraduation(undefined, 3)).toBe(0);
		expect(calculateGraduation([], 3)).toBe(0);
	});
});

/* ─── calculateAttractiveness ─── */

describe("calculateAttractiveness", () => {
	it("returns high score for top-rated facility", () => {
		const facility = {
			rating: 5,
			reviewCount: 100,
			evaluationGrade: "A",
			isPremium: true,
			features: Array.from({ length: 15 }, (_, i) => `feature${i}`),
			teacherCount: 5,
			capacity: { total: 20, current: 20 },
		};
		const score = calculateAttractiveness(facility);
		expect(score).toBeGreaterThan(0.9);
		expect(score).toBeLessThanOrEqual(1);
	});

	it("returns low score for default/empty facility", () => {
		const facility = {
			capacity: { total: 50, current: 30 },
		};
		const score = calculateAttractiveness(facility);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThan(0.5);
	});

	it("uses default score for null evaluationGrade", () => {
		const facilityWithGrade = {
			rating: 4,
			evaluationGrade: "A",
			capacity: { total: 50, current: 30 },
		};
		const facilityWithoutGrade = {
			rating: 4,
			evaluationGrade: null,
			capacity: { total: 50, current: 30 },
		};
		const withGrade = calculateAttractiveness(facilityWithGrade);
		const withoutGrade = calculateAttractiveness(facilityWithoutGrade);
		expect(withGrade).toBeGreaterThan(withoutGrade);
	});

	it("clamps result between 0 and 1", () => {
		const facility = {
			rating: 0,
			reviewCount: 0,
			evaluationGrade: "D",
			features: [],
			capacity: { total: 100, current: 50 },
		};
		const score = calculateAttractiveness(facility);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(1);
	});
});

/* ─── calculateDemandFactor ─── */

describe("calculateDemandFactor", () => {
	it("returns 1.0 when no region data", () => {
		expect(calculateDemandFactor(null, 50)).toBe(1.0);
		expect(calculateDemandFactor(undefined, 50)).toBe(1.0);
	});

	it("caps at 2.0 for high demand", () => {
		const regionData = { childPopulation: 10000, facilityCount: 10 };
		expect(calculateDemandFactor(regionData, 50)).toBe(2.0);
	});

	it("caps at 0.5 for low demand", () => {
		const regionData = { childPopulation: 10, facilityCount: 100 };
		expect(calculateDemandFactor(regionData, 50)).toBe(0.5);
	});
});

/* ─── calculatePrediction ─── */

describe("calculatePrediction", () => {
	const baseDate = new Date(2026, 0, 15); // January 15

	it("returns correct structure", () => {
		const facility = { capacity: { total: 100, current: 80, waiting: 0 } };
		const snapshots = [
			makeSnapshot(100, 80, 14),
			makeSnapshot(100, 80, 7),
			makeSnapshot(100, 80, 0),
		];

		const result = calculatePrediction(facility, snapshots, baseDate);

		expect(result).toHaveProperty("overallScore");
		expect(result).toHaveProperty("predictedVacancies");
		expect(result).toHaveProperty("confidence");
		expect(result).toHaveProperty("byAgeClass");
		expect(result).toHaveProperty("factors");
		expect(result.overallScore).toBeGreaterThanOrEqual(0);
		expect(result.overallScore).toBeLessThanOrEqual(100);
		expect(result.predictedVacancies).toBeGreaterThanOrEqual(0);
	});

	it("handles fully occupied facility", () => {
		const facility = { capacity: { total: 100, current: 100, waiting: 5 } };
		const snapshots = [
			makeSnapshot(100, 100, 14),
			makeSnapshot(100, 100, 7),
			makeSnapshot(100, 100, 0),
		];

		const result = calculatePrediction(facility, snapshots, baseDate);

		expect(result.predictedVacancies).toBe(0);
		expect(result.overallScore).toBe(0);
	});

	it("includes age class predictions when available", () => {
		const facility = {
			capacity: { total: 60, current: 40, waiting: 0 },
			ageClasses: [
				{ className: "만0세", capacity: 20, current: 15, waiting: 0 },
				{ className: "만1세", capacity: 20, current: 15, waiting: 0 },
				{ className: "만2세", capacity: 20, current: 10, waiting: 0 },
			],
		};
		const snapshots = [
			makeSnapshot(60, 40, 14),
			makeSnapshot(60, 40, 7),
			makeSnapshot(60, 40, 0),
		];

		const result = calculatePrediction(facility, snapshots, baseDate);

		expect(result.byAgeClass).toHaveLength(3);
		expect(result.byAgeClass[0].className).toBe("만0세");
		expect(result.byAgeClass[0].currentVacancy).toBe(5);
	});

	it("includes waiting list as negative factor", () => {
		const facility = { capacity: { total: 100, current: 80, waiting: 10 } };
		const snapshots = [
			makeSnapshot(100, 80, 14),
			makeSnapshot(100, 80, 7),
			makeSnapshot(100, 80, 0),
		];

		const result = calculatePrediction(facility, snapshots, baseDate);

		const waitingFactor = result.factors.find((f) => f.name === "대기자");
		expect(waitingFactor).toBeDefined();
		expect(waitingFactor!.impact).toBeLessThan(0);
	});

	it("backward compatible: no regionData produces same Layer 1 result", () => {
		const facility = { capacity: { total: 100, current: 80, waiting: 0 } };
		const snapshots = [
			makeSnapshot(100, 80, 14),
			makeSnapshot(100, 80, 7),
			makeSnapshot(100, 80, 0),
		];

		// July: seasonal=0, no ageClasses, no regionData → pure Layer 1
		const julyDate = new Date(2026, 6, 15);
		const result = calculatePrediction(facility, snapshots, julyDate);

		// currentVacancy=20, trend=0, seasonal=0, graduation=0, demandPressure=0
		expect(result.predictedVacancies).toBe(20);
	});

	it("includes graduation factor when ageClasses present in proximity month", () => {
		const facility = {
			capacity: { total: 60, current: 40, waiting: 0 },
			ageClasses: [
				{ className: "만0세", capacity: 20, current: 15, waiting: 0 },
				{ className: "만2세", capacity: 40, current: 25, waiting: 0 },
			],
		};
		const snapshots = [
			makeSnapshot(60, 40, 14),
			makeSnapshot(60, 40, 7),
			makeSnapshot(60, 40, 0),
		];

		// March: proximity month → graduation = 25 (만2세 current)
		const marchDate = new Date(2026, 2, 15);
		const result = calculatePrediction(facility, snapshots, marchDate);

		const gradFactor = result.factors.find((f) => f.name === "졸업예측");
		expect(gradFactor).toBeDefined();
		expect(gradFactor!.impact).toBe(25);
		expect(result.predictedVacancies).toBeGreaterThan(20);
	});

	it("includes demand pressure when regionData provided", () => {
		const facility = {
			capacity: { total: 100, current: 80, waiting: 0 },
			rating: 4.5,
			reviewCount: 30,
		};
		const snapshots = [
			makeSnapshot(100, 80, 14),
			makeSnapshot(100, 80, 7),
			makeSnapshot(100, 80, 0),
		];

		// High demand region: childrenPerFacility=200, capacity=100 → factor=2.0
		const regionData = { childPopulation: 5000, facilityCount: 25 };
		const julyDate = new Date(2026, 6, 15);
		const withDemand = calculatePrediction(facility, snapshots, julyDate, regionData);
		const withoutDemand = calculatePrediction(facility, snapshots, julyDate);

		expect(withDemand.predictedVacancies).toBeLessThan(withoutDemand.predictedVacancies);
		const demandFactor = withDemand.factors.find((f) => f.name === "지역수요");
		expect(demandFactor).toBeDefined();
		expect(demandFactor!.impact).toBeLessThan(0);
	});
});
