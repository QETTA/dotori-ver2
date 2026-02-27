import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock models
const mockUserCountDocuments = vi.fn();
const mockVisitAggregate = vi.fn();
const mockWaitlistAggregate = vi.fn();
const mockReviewAggregate = vi.fn();
const mockCPAGetStats = vi.fn();

vi.mock("@/models/User", () => ({
	default: { countDocuments: (...args: unknown[]) => mockUserCountDocuments(...args) },
}));
vi.mock("@/models/Visit", () => ({
	default: { aggregate: (...args: unknown[]) => mockVisitAggregate(...args) },
}));
vi.mock("@/models/Waitlist", () => ({
	default: { aggregate: (...args: unknown[]) => mockWaitlistAggregate(...args) },
}));
vi.mock("@/models/Review", () => ({
	default: { aggregate: (...args: unknown[]) => mockReviewAggregate(...args) },
}));
vi.mock("@/lib/services/cpa.service", () => ({
	cpaService: {
		getStatsByFacility: (...args: unknown[]) => mockCPAGetStats(...args),
	},
}));

import { getStats, batchGetStats } from "../facility-stats.service";

const FACILITY_ID = "507f1f77bcf86cd799439012";

function setupMocks(overrides?: {
	interests?: number;
	visits?: { _id: string; count: number }[];
	waitlists?: { _id: string; count: number }[];
	reviews?: { avgRating: number; count: number }[];
	cpa?: { visitRequests: number; waitlistApplies: number; interestAdds: number; esignCompletes: number; total: number };
}) {
	mockUserCountDocuments.mockResolvedValue(overrides?.interests ?? 0);
	mockVisitAggregate.mockResolvedValue(overrides?.visits ?? []);
	mockWaitlistAggregate.mockResolvedValue(overrides?.waitlists ?? []);
	mockReviewAggregate.mockResolvedValue(overrides?.reviews ?? []);
	mockCPAGetStats.mockResolvedValue(
		overrides?.cpa ?? { visitRequests: 0, waitlistApplies: 0, interestAdds: 0, esignCompletes: 0, total: 0 },
	);
}

describe("facility-stats.service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getStats", () => {
		it("aggregates interests count", async () => {
			setupMocks({ interests: 15 });

			const stats = await getStats(FACILITY_ID, 30);

			expect(stats.interests).toBe(15);
			expect(stats.facilityId).toBe(FACILITY_ID);
		});

		it("aggregates visit stats by status", async () => {
			setupMocks({
				visits: [
					{ _id: "requested", count: 5 },
					{ _id: "confirmed", count: 3 },
					{ _id: "completed", count: 2 },
					{ _id: "cancelled", count: 1 },
				],
			});

			const stats = await getStats(FACILITY_ID, 30);

			expect(stats.visits.requested).toBe(5);
			expect(stats.visits.confirmed).toBe(3);
			expect(stats.visits.completed).toBe(2);
			expect(stats.visits.cancelled).toBe(1);
			expect(stats.visits.total).toBe(11);
		});

		it("aggregates waitlist stats by status", async () => {
			setupMocks({
				waitlists: [
					{ _id: "pending", count: 8 },
					{ _id: "accepted", count: 2 },
				],
			});

			const stats = await getStats(FACILITY_ID, 30);

			expect(stats.waitlists.pending).toBe(8);
			expect(stats.waitlists.accepted).toBe(2);
			expect(stats.waitlists.total).toBe(10);
		});

		it("aggregates review stats with average rating", async () => {
			setupMocks({
				reviews: [{ avgRating: 4.3333, count: 12 }],
			});

			const stats = await getStats(FACILITY_ID);

			expect(stats.reviews.count).toBe(12);
			expect(stats.reviews.avgRating).toBe(4.3);
		});

		it("returns zeros for empty facility", async () => {
			setupMocks();

			const stats = await getStats(FACILITY_ID, 30);

			expect(stats.interests).toBe(0);
			expect(stats.visits.total).toBe(0);
			expect(stats.waitlists.total).toBe(0);
			expect(stats.reviews.count).toBe(0);
			expect(stats.reviews.avgRating).toBe(0);
			expect(stats.cpa.total).toBe(0);
		});

		it("includes CPA stats", async () => {
			setupMocks({
				cpa: { visitRequests: 5, waitlistApplies: 3, interestAdds: 10, esignCompletes: 2, total: 20 },
			});

			const stats = await getStats(FACILITY_ID, 30);

			expect(stats.cpa.total).toBe(20);
			expect(stats.cpa.byType.visit_request).toBe(5);
		});

		it("clamps days to maxDays", async () => {
			setupMocks();

			const stats = await getStats(FACILITY_ID, 9999);

			// period.start should be ~365 days ago, not 9999
			const daysDiff = (stats.period.end.getTime() - stats.period.start.getTime()) / (1000 * 60 * 60 * 24);
			expect(daysDiff).toBeLessThanOrEqual(366);
		});
	});

	describe("batchGetStats", () => {
		it("returns stats for multiple facilities", async () => {
			setupMocks({ interests: 5 });

			const results = await batchGetStats([FACILITY_ID, "507f1f77bcf86cd799439013"], 30);

			expect(results).toHaveLength(2);
			expect(results[0].facilityId).toBe(FACILITY_ID);
			expect(results[1].facilityId).toBe("507f1f77bcf86cd799439013");
		});
	});
});
