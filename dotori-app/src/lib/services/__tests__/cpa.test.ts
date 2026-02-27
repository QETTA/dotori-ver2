import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock CPAEvent model
const mockCreate = vi.fn();
const mockAggregate = vi.fn();
vi.mock("@/models/CPAEvent", () => ({
	default: {
		create: (...args: unknown[]) => mockCreate(...args),
		aggregate: (...args: unknown[]) => mockAggregate(...args),
	},
}));

import { recordCPA, getStatsByFacility } from "../cpa.service";

describe("cpa.service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("recordCPA", () => {
		it("records a CPA event", async () => {
			mockCreate.mockResolvedValue({});

			await recordCPA({
				eventType: "visit_request",
				userId: "507f1f77bcf86cd799439011",
				facilityId: "507f1f77bcf86cd799439012",
				targetId: "507f1f77bcf86cd799439013",
			});

			expect(mockCreate).toHaveBeenCalledOnce();
			const arg = mockCreate.mock.calls[0][0];
			expect(arg.eventType).toBe("visit_request");
		});

		it("records event with metadata", async () => {
			mockCreate.mockResolvedValue({});

			await recordCPA({
				eventType: "esign_complete",
				userId: "507f1f77bcf86cd799439011",
				facilityId: "507f1f77bcf86cd799439012",
				targetId: "507f1f77bcf86cd799439013",
				metadata: { documentType: "입소동의서" },
			});

			const arg = mockCreate.mock.calls[0][0];
			expect(arg.metadata).toEqual({ documentType: "입소동의서" });
		});

		it("does not throw on failure (fire-and-forget)", async () => {
			mockCreate.mockRejectedValue(new Error("DB error"));

			await expect(
				recordCPA({
					eventType: "visit_request",
					userId: "507f1f77bcf86cd799439011",
					facilityId: "507f1f77bcf86cd799439012",
					targetId: "507f1f77bcf86cd799439013",
				}),
			).resolves.toBeUndefined();
		});
	});

	describe("getStatsByFacility", () => {
		it("aggregates stats by event type", async () => {
			mockAggregate.mockResolvedValue([
				{ _id: "visit_request", count: 5 },
				{ _id: "waitlist_apply", count: 3 },
				{ _id: "interest_add", count: 10 },
				{ _id: "esign_complete", count: 2 },
			]);

			const stats = await getStatsByFacility(
				"507f1f77bcf86cd799439012",
				{ start: new Date("2026-01-01"), end: new Date("2026-01-31") },
			);

			expect(stats.visitRequests).toBe(5);
			expect(stats.waitlistApplies).toBe(3);
			expect(stats.interestAdds).toBe(10);
			expect(stats.esignCompletes).toBe(2);
			expect(stats.total).toBe(20);
		});

		it("returns zeros for empty results", async () => {
			mockAggregate.mockResolvedValue([]);

			const stats = await getStatsByFacility(
				"507f1f77bcf86cd799439012",
				{ start: new Date("2026-01-01"), end: new Date("2026-01-31") },
			);

			expect(stats.total).toBe(0);
			expect(stats.visitRequests).toBe(0);
		});

		it("returns zeros for invalid facilityId", async () => {
			const stats = await getStatsByFacility(
				"invalid",
				{ start: new Date("2026-01-01"), end: new Date("2026-01-31") },
			);

			expect(stats.total).toBe(0);
			expect(mockAggregate).not.toHaveBeenCalled();
		});

		it("handles partial event types", async () => {
			mockAggregate.mockResolvedValue([
				{ _id: "visit_request", count: 7 },
			]);

			const stats = await getStatsByFacility(
				"507f1f77bcf86cd799439012",
				{ start: new Date("2026-01-01"), end: new Date("2026-01-31") },
			);

			expect(stats.visitRequests).toBe(7);
			expect(stats.waitlistApplies).toBe(0);
			expect(stats.interestAdds).toBe(0);
			expect(stats.esignCompletes).toBe(0);
			expect(stats.total).toBe(7);
		});
	});
});
