import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { API_CONFIG } from "@/lib/config/api";

describe("notification.service config", () => {
	it("subscription expiry warning days is configured", () => {
		expect(API_CONFIG.SUBSCRIPTION.expiryWarningDays).toBeGreaterThan(0);
		expect(API_CONFIG.SUBSCRIPTION.expiryWarningDays).toBeLessThanOrEqual(30);
	});

	it("esignature expiration days is configured", () => {
		expect(API_CONFIG.ESIGNATURE.expirationDays).toBeGreaterThan(0);
	});

	it("subscription default period is configured", () => {
		expect(API_CONFIG.SUBSCRIPTION.defaultPeriodMonths).toBeGreaterThan(0);
	});
});
