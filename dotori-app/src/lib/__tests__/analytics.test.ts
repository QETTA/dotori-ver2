import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/api", () => ({
	API_CONFIG: {
		ANALYTICS: { devMode: true, measurementId: "" },
	},
}));

import { trackEvent, trackPageView, ANALYTICS_EVENTS } from "../analytics";

describe("analytics", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("ANALYTICS_EVENTS", () => {
		it("has standard event constants", () => {
			expect(ANALYTICS_EVENTS.facility_view).toBe("facility_view");
			expect(ANALYTICS_EVENTS.kakao_share).toBe("kakao_share");
			expect(ANALYTICS_EVENTS.esignature_create).toBe("esignature_create");
			expect(ANALYTICS_EVENTS.subscription_start).toBe("subscription_start");
		});

		it("all event values are unique", () => {
			const values = Object.values(ANALYTICS_EVENTS);
			const unique = new Set(values);
			expect(unique.size).toBe(values.length);
		});

		it("all event values are lowercase snake_case", () => {
			for (const value of Object.values(ANALYTICS_EVENTS)) {
				expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
			}
		});
	});

	describe("trackEvent", () => {
		it("logs to console in dev mode", () => {
			const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
			trackEvent("test_event", "test_category", { key: "value" });
			expect(spy).toHaveBeenCalledWith(
				"[analytics]",
				"test_category",
				"test_event",
				{ key: "value" },
			);
		});
	});

	describe("trackPageView", () => {
		it("logs page view to console in dev mode", () => {
			const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
			trackPageView("/explore", "탐색");
			expect(spy).toHaveBeenCalledWith(
				"[analytics] pageview",
				"/explore",
				"탐색",
			);
		});
	});
});
