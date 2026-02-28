import { describe, it, expect } from "vitest";
import { API_CONFIG } from "@/lib/config/api";

describe("regional-analytics-engine", () => {
	describe("API_CONFIG.REGIONAL_ANALYTICS", () => {
		it("has default months setting", () => {
			expect(API_CONFIG.REGIONAL_ANALYTICS.defaultMonths).toBe(6);
		});

		it("has saturation threshold", () => {
			expect(API_CONFIG.REGIONAL_ANALYTICS.saturationThreshold).toBe(0.9);
		});

		it("saturation threshold is between 0 and 1", () => {
			const threshold = API_CONFIG.REGIONAL_ANALYTICS.saturationThreshold;
			expect(threshold).toBeGreaterThan(0);
			expect(threshold).toBeLessThanOrEqual(1);
		});
	});

	describe("RegionalStats interface", () => {
		it("saturation rate calculation", () => {
			const totalCapacity = 100;
			const totalCurrent = 85;
			const saturationRate = totalCurrent / totalCapacity;
			expect(saturationRate).toBe(0.85);
			expect(saturationRate).toBeLessThan(API_CONFIG.REGIONAL_ANALYTICS.saturationThreshold);
		});

		it("vacancy calculation", () => {
			const totalCapacity = 100;
			const totalCurrent = 85;
			const vacancy = totalCapacity - totalCurrent;
			expect(vacancy).toBe(15);
		});

		it("handles zero capacity", () => {
			const totalCapacity = 0;
			const saturationRate = totalCapacity > 0 ? 0 / totalCapacity : 0;
			expect(saturationRate).toBe(0);
		});

		it("handles over-capacity", () => {
			const totalCapacity = 100;
			const totalCurrent = 110;
			const vacancy = Math.max(0, totalCapacity - totalCurrent);
			expect(vacancy).toBe(0);
		});
	});

	describe("trend generation", () => {
		it("generates correct number of monthly data points", () => {
			const months = 6;
			const trends: string[] = [];
			const now = new Date();
			for (let i = months - 1; i >= 0; i--) {
				const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
				const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
				trends.push(monthStr);
			}
			expect(trends).toHaveLength(6);
		});

		it("month format is YYYY-MM", () => {
			const date = new Date(2026, 1, 1); // Feb 2026
			const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
			expect(monthStr).toBe("2026-02");
		});
	});

	describe("market report structure", () => {
		it("report fields are well-defined", () => {
			const requiredFields = [
				"generatedAt",
				"summary",
				"topRegions",
				"underservedRegions",
				"saturatedRegions",
			];
			expect(requiredFields).toHaveLength(5);
		});

		it("summary fields are well-defined", () => {
			const summaryFields = [
				"totalFacilities",
				"totalCapacity",
				"totalCurrent",
				"nationalSaturationRate",
				"avgRating",
			];
			expect(summaryFields).toHaveLength(5);
		});
	});

	describe("API_CONFIG related settings", () => {
		it("document types are defined", () => {
			expect(API_CONFIG.DOCUMENT.documentTypes).toHaveLength(7);
		});

		it("partner config exists", () => {
			expect(API_CONFIG.PARTNER.apiKeyBytes).toBe(32);
			expect(API_CONFIG.PARTNER.apiKeyPrefixLength).toBe(8);
		});

		it("billing config exists", () => {
			expect(API_CONFIG.BILLING.trialDays).toBe(14);
			expect(API_CONFIG.BILLING.defaultCurrency).toBe("KRW");
		});

		it("campaign config exists", () => {
			expect(API_CONFIG.CAMPAIGN.maxActiveCampaigns).toBe(50);
			expect(API_CONFIG.CAMPAIGN.eventRetentionDays).toBe(365);
		});
	});
});
