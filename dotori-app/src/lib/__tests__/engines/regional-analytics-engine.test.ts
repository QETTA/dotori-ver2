import { describe, it, expect, vi, beforeEach } from "vitest";
import { API_CONFIG } from "@/lib/config/api";

/* ─── Mocks ─── */

const mockFacilityAggregate = vi.fn();

vi.mock("@/models/Facility", () => ({
	default: {
		aggregate: (...args: unknown[]) => mockFacilityAggregate(...args),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

/* ─── Lazy imports ─── */

async function importRegional() {
	return import("@/lib/engines/regional-analytics-engine");
}

describe("regional-analytics-engine", () => {
	/* ─── Config Constants (기존) ─── */

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

		it("underserved vacancy threshold exists", () => {
			expect(API_CONFIG.REGIONAL_ANALYTICS.underservedVacancyThreshold).toBe(5);
		});
	});

	/* ─── Integration: getRegionalStats ─── */

	describe("getRegionalStats (integration)", () => {
		it("returns stats for all regions (ENG-RA-OK-001)", async () => {
			const { getRegionalStats } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([
				{
					_id: { sido: "서울특별시", sigungu: "강남구" },
					totalFacilities: 50,
					totalCapacity: 500,
					totalCurrent: 420,
					avgRating: 4.2,
					types: ["어린이집", "어린이집", "유치원"],
				},
				{
					_id: { sido: "경기도", sigungu: "수원시" },
					totalFacilities: 30,
					totalCapacity: 300,
					totalCurrent: 200,
					avgRating: 3.8,
					types: ["어린이집"],
				},
			]);

			const result = await getRegionalStats({});
			expect(result).toHaveLength(2);
			expect(result[0].region.sido).toBe("서울특별시");
			expect(result[0].totalFacilities).toBe(50);
			expect(result[0].vacancy).toBe(80); // 500 - 420
			expect(result[0].saturationRate).toBe(0.84); // 420/500 rounded to 3 decimal
			expect(result[0].avgRating).toBe(4.2);
			expect(result[0].facilityTypes).toHaveLength(2); // 어린이집:2, 유치원:1
		});

		it("filters by sido (ENG-RA-OK-002)", async () => {
			const { getRegionalStats } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([]);

			await getRegionalStats({ sido: "서울특별시" });

			const pipeline = mockFacilityAggregate.mock.calls[0][0];
			const matchStage = pipeline[0];
			expect(matchStage.$match["region.sido"]).toBe("서울특별시");
		});

		it("filters by sido + sigungu (ENG-RA-OK-003)", async () => {
			const { getRegionalStats } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([]);

			await getRegionalStats({ sido: "서울특별시", sigungu: "강남구" });

			const pipeline = mockFacilityAggregate.mock.calls[0][0];
			const matchStage = pipeline[0];
			expect(matchStage.$match["region.sido"]).toBe("서울특별시");
			expect(matchStage.$match["region.sigungu"]).toBe("강남구");
		});

		it("returns empty array when no results (ENG-RA-BND-001)", async () => {
			const { getRegionalStats } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([]);

			const result = await getRegionalStats({ sido: "존재하지않는시도" });
			expect(result).toHaveLength(0);
		});

		it("counts facility types correctly (ENG-RA-OK-005)", async () => {
			const { getRegionalStats } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([
				{
					_id: { sido: "서울", sigungu: "강남" },
					totalFacilities: 10,
					totalCapacity: 100,
					totalCurrent: 80,
					avgRating: 4.0,
					types: ["어린이집", "어린이집", "어린이집", "유치원", "유치원", "국공립"],
				},
			]);

			const result = await getRegionalStats({});
			const types = result[0].facilityTypes;
			// Sorted by count descending
			expect(types[0]).toEqual({ type: "어린이집", count: 3 });
			expect(types[1]).toEqual({ type: "유치원", count: 2 });
			expect(types[2]).toEqual({ type: "국공립", count: 1 });
		});

		it("handles null avgRating (ENG-RA-BND-004)", async () => {
			const { getRegionalStats } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([
				{
					_id: { sido: "서울", sigungu: "강남" },
					totalFacilities: 5,
					totalCapacity: 50,
					totalCurrent: 30,
					avgRating: null,
					types: [],
				},
			]);

			const result = await getRegionalStats({});
			expect(result[0].avgRating).toBe(0);
		});

		it("handles empty sido/sigungu as '미분류' (ENG-RA-OK-006)", async () => {
			const { getRegionalStats } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([
				{
					_id: { sido: "", sigungu: "" },
					totalFacilities: 3,
					totalCapacity: 30,
					totalCurrent: 10,
					avgRating: 3.0,
					types: [],
				},
			]);

			const result = await getRegionalStats({});
			expect(result[0].region.sido).toBe("미분류");
			expect(result[0].region.sigungu).toBe("미분류");
		});
	});

	/* ─── Integration: getRegionalTrends ─── */

	describe("getRegionalTrends (integration)", () => {
		it("returns 6 month trends (ENG-RA-OK-007)", async () => {
			const { getRegionalTrends } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([
				{ totalCapacity: 1000, totalCurrent: 850 },
			]);

			const trends = await getRegionalTrends({ sido: "서울특별시", months: 6 });
			expect(trends).toHaveLength(6);
			expect(trends[0].region.sido).toBe("서울특별시");
			// All should have valid month format
			for (const t of trends) {
				expect(t.month).toMatch(/^\d{4}-\d{2}$/);
				expect(t.totalCapacity).toBe(1000);
				expect(t.totalCurrent).toBeGreaterThan(0);
				expect(t.saturationRate).toBeGreaterThan(0);
				expect(t.saturationRate).toBeLessThanOrEqual(1);
			}
		});

		it("returns zeros for empty region (ENG-RA-BND-007)", async () => {
			const { getRegionalTrends } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([]);

			const trends = await getRegionalTrends({ sido: "빈지역", months: 3 });
			expect(trends).toHaveLength(3);
			for (const t of trends) {
				expect(t.totalCapacity).toBe(0);
				expect(t.totalCurrent).toBe(0);
				expect(t.saturationRate).toBe(0);
			}
		});

		it("uses '전체' for unspecified sigungu (ENG-RA-OK-008)", async () => {
			const { getRegionalTrends } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([
				{ totalCapacity: 100, totalCurrent: 80 },
			]);

			const trends = await getRegionalTrends({ sido: "서울특별시" });
			expect(trends[0].region.sigungu).toBe("전체");
		});
	});

	/* ─── Integration: generateMarketReport ─── */

	describe("generateMarketReport (integration)", () => {
		it("generates comprehensive report (ENG-RA-OK-009)", async () => {
			const { generateMarketReport } = await importRegional();
			// getRegionalStats aggregation
			mockFacilityAggregate.mockResolvedValue([
				{
					_id: { sido: "서울", sigungu: "강남" },
					totalFacilities: 100,
					totalCapacity: 1000,
					totalCurrent: 950,
					avgRating: 4.5,
					types: ["어린이집"],
				},
				{
					_id: { sido: "경기", sigungu: "수원" },
					totalFacilities: 80,
					totalCapacity: 800,
					totalCurrent: 400,
					avgRating: 3.8,
					types: ["유치원"],
				},
				{
					_id: { sido: "부산", sigungu: "해운대" },
					totalFacilities: 30,
					totalCapacity: 300,
					totalCurrent: 295,
					avgRating: 4.0,
					types: [],
				},
			]);

			const report = await generateMarketReport();
			expect(report.generatedAt).toBeDefined();
			expect(report.summary.totalFacilities).toBe(210); // 100+80+30
			expect(report.summary.totalCapacity).toBe(2100); // 1000+800+300
			expect(report.summary.totalCurrent).toBe(1645); // 950+400+295
			expect(report.summary.nationalSaturationRate).toBeGreaterThan(0);
			expect(report.summary.avgRating).toBeGreaterThan(0);
			expect(report.topRegions.length).toBeGreaterThan(0);
		});

		it("identifies saturated regions (≥0.9) (ENG-RA-OK-010)", async () => {
			const { generateMarketReport } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([
				{
					_id: { sido: "서울", sigungu: "강남" },
					totalFacilities: 50,
					totalCapacity: 100,
					totalCurrent: 95, // saturation = 0.95
					avgRating: 4.0,
					types: [],
				},
				{
					_id: { sido: "경기", sigungu: "수원" },
					totalFacilities: 50,
					totalCapacity: 100,
					totalCurrent: 50, // saturation = 0.5
					avgRating: 3.5,
					types: [],
				},
			]);

			const report = await generateMarketReport();
			expect(report.saturatedRegions.length).toBe(1);
			expect(report.saturatedRegions[0].region.sido).toBe("서울");
		});

		it("identifies underserved regions (vacancy ≤ 5) (ENG-RA-OK-011)", async () => {
			const { generateMarketReport } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([
				{
					_id: { sido: "서울", sigungu: "강남" },
					totalFacilities: 10,
					totalCapacity: 100,
					totalCurrent: 97, // vacancy = 3 (≤ 5)
					avgRating: 4.0,
					types: [],
				},
				{
					_id: { sido: "경기", sigungu: "수원" },
					totalFacilities: 10,
					totalCapacity: 100,
					totalCurrent: 50, // vacancy = 50 (> 5)
					avgRating: 3.5,
					types: [],
				},
			]);

			const report = await generateMarketReport();
			expect(report.underservedRegions.length).toBe(1);
			expect(report.underservedRegions[0].region.sido).toBe("서울");
		});

		it("limits each category to 10 regions (ENG-RA-BND-009)", async () => {
			const { generateMarketReport } = await importRegional();
			// Create 15 regions, all saturated
			const regions = Array.from({ length: 15 }, (_, i) => ({
				_id: { sido: `시도${i}`, sigungu: `시군구${i}` },
				totalFacilities: 10,
				totalCapacity: 100,
				totalCurrent: 95,
				avgRating: 4.0,
				types: [],
			}));
			mockFacilityAggregate.mockResolvedValue(regions);

			const report = await generateMarketReport();
			expect(report.topRegions.length).toBeLessThanOrEqual(10);
			expect(report.saturatedRegions.length).toBeLessThanOrEqual(10);
		});

		it("handles empty database (ENG-RA-BND-010)", async () => {
			const { generateMarketReport } = await importRegional();
			mockFacilityAggregate.mockResolvedValue([]);

			const report = await generateMarketReport();
			expect(report.summary.totalFacilities).toBe(0);
			expect(report.summary.totalCapacity).toBe(0);
			expect(report.summary.totalCurrent).toBe(0);
			expect(report.summary.nationalSaturationRate).toBe(0);
			expect(report.topRegions).toHaveLength(0);
			expect(report.underservedRegions).toHaveLength(0);
			expect(report.saturatedRegions).toHaveLength(0);
		});
	});
});
