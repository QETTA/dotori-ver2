// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

/* ─── Hoisted Mocks ─── */
const { apiFetchMock } = vi.hoisted(() => ({
	apiFetchMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
	apiFetch: apiFetchMock,
}));

function makeApiResponse(overrides: Record<string, unknown> = {}) {
	return {
		user: {
			id: "user1",
			nickname: "테스트맘",
			region: { sido: "서울특별시", sigungu: "강남구" },
			onboardingCompleted: true,
			interests: ["fac1", "fac2"],
			children: [],
			plan: "free",
			gpsVerified: false,
		},
		nearbyFacilities: [{ id: "f1", name: "근처시설" }],
		interestFacilities: [],
		hotPosts: [{ id: "p1", content: "글1" }],
		alertCount: 2,
		waitlistCount: 1,
		documentCount: 0,
		bestWaitlistPosition: 3,
		waitlistFacilityName: "행복어린이집",
		sources: { isalang: { name: "아이사랑", updatedAt: "2026-02-01" } },
		totalFacilities: 25000,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("useHomeDashboard", () => {
	it("transforms API response into dashboard object", async () => {
		apiFetchMock.mockResolvedValueOnce(makeApiResponse());

		const { useHomeDashboard } = await import("@/hooks/use-home-dashboard");
		const { result } = renderHook(() => useHomeDashboard());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.dashboard).not.toBeNull();
		expect(result.current.dashboard!.nickname).toBe("테스트맘");
		expect(result.current.dashboard!.totalFacilities).toBe(25000);
		expect(result.current.dashboard!.interestCount).toBe(2);
		expect(result.current.dashboard!.waitlistCount).toBe(1);
		expect(result.current.dashboard!.alertCount).toBe(2);
		expect(result.current.dashboard!.bestWaitlistPosition).toBe(3);
	});

	it("computes funnelStep 0 for fresh user", async () => {
		apiFetchMock.mockResolvedValueOnce(makeApiResponse({
			user: { ...makeApiResponse().user, interests: [] },
			waitlistCount: 0,
			documentCount: 0,
		}));

		const { useHomeDashboard } = await import("@/hooks/use-home-dashboard");
		const { result } = renderHook(() => useHomeDashboard());

		await waitFor(() => {
			expect(result.current.dashboard).not.toBeNull();
		});

		expect(result.current.dashboard!.funnelStep).toBe(0);
	});

	it("computes funnelStep 1 when interests exist", async () => {
		apiFetchMock.mockResolvedValueOnce(makeApiResponse({
			waitlistCount: 0,
			documentCount: 0,
		}));

		const { useHomeDashboard } = await import("@/hooks/use-home-dashboard");
		const { result } = renderHook(() => useHomeDashboard());

		await waitFor(() => {
			expect(result.current.dashboard).not.toBeNull();
		});

		expect(result.current.dashboard!.funnelStep).toBe(1);
	});

	it("computes funnelStep 2 when on waitlist", async () => {
		apiFetchMock.mockResolvedValueOnce(makeApiResponse({
			waitlistCount: 2,
			documentCount: 0,
		}));

		const { useHomeDashboard } = await import("@/hooks/use-home-dashboard");
		const { result } = renderHook(() => useHomeDashboard());

		await waitFor(() => {
			expect(result.current.dashboard).not.toBeNull();
		});

		expect(result.current.dashboard!.funnelStep).toBe(2);
	});

	it("computes funnelStep 3 when documents + waitlist", async () => {
		apiFetchMock.mockResolvedValueOnce(makeApiResponse({
			waitlistCount: 1,
			documentCount: 3,
		}));

		const { useHomeDashboard } = await import("@/hooks/use-home-dashboard");
		const { result } = renderHook(() => useHomeDashboard());

		await waitFor(() => {
			expect(result.current.dashboard).not.toBeNull();
		});

		expect(result.current.dashboard!.funnelStep).toBe(3);
	});

	it("uses default nickname when user is null", async () => {
		apiFetchMock.mockResolvedValueOnce(makeApiResponse({ user: null }));

		const { useHomeDashboard } = await import("@/hooks/use-home-dashboard");
		const { result } = renderHook(() => useHomeDashboard());

		await waitFor(() => {
			expect(result.current.dashboard).not.toBeNull();
		});

		expect(result.current.dashboard!.nickname).toBe("사용자");
		expect(result.current.dashboard!.interestCount).toBe(0);
	});

	it("returns isLoading true initially", async () => {
		apiFetchMock.mockResolvedValueOnce(makeApiResponse());

		const { useHomeDashboard } = await import("@/hooks/use-home-dashboard");
		const { result } = renderHook(() => useHomeDashboard());

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});
	});

	it("returns dashboard null and error on failure", async () => {
		apiFetchMock.mockRejectedValueOnce(new Error("API 오류"));

		const { useHomeDashboard } = await import("@/hooks/use-home-dashboard");
		const { result } = renderHook(() => useHomeDashboard());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.dashboard).toBeNull();
		expect(result.current.error).toBe("API 오류");
	});
});
