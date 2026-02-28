import { describe, expect, it } from "vitest";
import { computeFunnelStep, toDashboard } from "@/hooks/use-home-dashboard";

function makeApiHomeData(overrides: Record<string, unknown> = {}) {
	return {
		user: {
			id: "user1",
			nickname: "테스트맘",
			region: { sido: "서울특별시", sigungu: "강남구" },
			onboardingCompleted: true,
			interests: ["fac1"],
			children: [],
			plan: "free",
			gpsVerified: false,
		},
		nearbyFacilities: [],
		interestFacilities: [],
		hotPosts: [],
		alertCount: 0,
		waitlistCount: 0,
		documentCount: 0,
		sources: { isalang: { name: "아이사랑", updatedAt: "2026-02-01" } },
		totalFacilities: 20027,
		...overrides,
	};
}

describe("computeFunnelStep", () => {
	it("returns step 0 for fresh user (no interests, no waitlist)", () => {
		const data = makeApiHomeData({
			user: { ...makeApiHomeData().user, interests: [] },
			waitlistCount: 0,
			documentCount: 0,
		});
		expect(computeFunnelStep(data)).toBe(0);
	});

	it("returns step 1 when user has interests but no waitlist", () => {
		const data = makeApiHomeData({
			waitlistCount: 0,
			documentCount: 0,
		});
		expect(computeFunnelStep(data)).toBe(1);
	});

	it("returns step 2 when user is on waitlist", () => {
		const data = makeApiHomeData({
			waitlistCount: 2,
			documentCount: 0,
		});
		expect(computeFunnelStep(data)).toBe(2);
	});

	it("returns step 3 when user has documents and waitlist", () => {
		const data = makeApiHomeData({
			waitlistCount: 1,
			documentCount: 3,
		});
		expect(computeFunnelStep(data)).toBe(3);
	});

	it("returns step 0 when documents > 0 but waitlist = 0 (documents alone insufficient)", () => {
		const data = makeApiHomeData({
			user: { ...makeApiHomeData().user, interests: [] },
			waitlistCount: 0,
			documentCount: 5,
		});
		expect(computeFunnelStep(data)).toBe(0);
	});
});

describe("toDashboard", () => {
	it("maps all fields correctly", () => {
		const data = makeApiHomeData({
			alertCount: 3,
			waitlistCount: 2,
			bestWaitlistPosition: 5,
			waitlistFacilityName: "행복어린이집",
			totalFacilities: 35000,
			hotPosts: [{ id: "p1", content: "글", likes: 10 }],
		});

		const dashboard = toDashboard(data);

		expect(dashboard.nickname).toBe("테스트맘");
		expect(dashboard.totalFacilities).toBe(35000);
		expect(dashboard.interestCount).toBe(1);
		expect(dashboard.waitlistCount).toBe(2);
		expect(dashboard.alertCount).toBe(3);
		expect(dashboard.bestWaitlistPosition).toBe(5);
		expect(dashboard.waitlistFacilityName).toBe("행복어린이집");
		expect(dashboard.hotPosts).toHaveLength(1);
	});

	it("uses defaults when user is null", () => {
		const data = makeApiHomeData({ user: null });
		const dashboard = toDashboard(data);

		expect(dashboard.nickname).toBe("사용자");
		expect(dashboard.interestCount).toBe(0);
	});

	it("defaults totalFacilities to 20027 when undefined", () => {
		const data = makeApiHomeData({ totalFacilities: undefined });
		const dashboard = toDashboard(data);

		expect(dashboard.totalFacilities).toBe(20027);
	});

	it("returns interestCount 0 when interests is empty", () => {
		const data = makeApiHomeData({
			user: { ...makeApiHomeData().user, interests: [] },
		});
		const dashboard = toDashboard(data);

		expect(dashboard.interestCount).toBe(0);
	});

	it("passes hotPosts through", () => {
		const posts = [
			{ id: "p1", content: "글1", category: "review", likes: 5, commentCount: 2, createdAt: "2026-02-01" },
			{ id: "p2", content: "글2", category: "question", likes: 3, commentCount: 1, createdAt: "2026-02-02" },
		];
		const data = makeApiHomeData({ hotPosts: posts });
		const dashboard = toDashboard(data);

		expect(dashboard.hotPosts).toHaveLength(2);
		expect(dashboard.hotPosts[0].id).toBe("p1");
	});
});
