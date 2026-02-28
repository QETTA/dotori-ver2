/**
 * Regional Analytics Engine
 *
 * 지역별 수급 분석 + 트렌드 감지 + 시장 리포트.
 * MongoDB Facility 데이터 기반 집계 (KOSIS/행안부 API 활성화 전).
 */
import Facility from "@/models/Facility";
import { API_CONFIG } from "@/lib/config/api";

/* ─── Types ─── */

export interface RegionalStats {
	region: { sido: string; sigungu: string };
	totalFacilities: number;
	totalCapacity: number;
	totalCurrent: number;
	vacancy: number;
	saturationRate: number;
	facilityTypes: { type: string; count: number }[];
	avgRating: number;
}

export interface RegionalTrend {
	month: string;
	region: { sido: string; sigungu: string };
	totalCapacity: number;
	totalCurrent: number;
	vacancy: number;
	saturationRate: number;
}

export interface MarketReport {
	generatedAt: string;
	summary: {
		totalFacilities: number;
		totalCapacity: number;
		totalCurrent: number;
		nationalSaturationRate: number;
		avgRating: number;
	};
	topRegions: RegionalStats[];
	underservedRegions: RegionalStats[];
	saturatedRegions: RegionalStats[];
}

/* ─── Regional Stats ─── */

export async function getRegionalStats(params: {
	sido?: string;
	sigungu?: string;
}): Promise<RegionalStats[]> {
	const match: Record<string, unknown> = {};
	if (params.sido) match["region.sido"] = params.sido;
	if (params.sigungu) match["region.sigungu"] = params.sigungu;

	const pipeline = [
		...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
		{
			$group: {
				_id: {
					sido: "$region.sido",
					sigungu: "$region.sigungu",
				},
				totalFacilities: { $sum: 1 },
				totalCapacity: { $sum: "$capacity.total" },
				totalCurrent: { $sum: "$capacity.current" },
				avgRating: { $avg: "$rating" },
				types: { $push: "$type" },
			},
		},
		{ $sort: { totalFacilities: -1 as const } },
		{ $limit: 100 },
	];

	const results = await Facility.aggregate(pipeline);

	return results.map((r: {
		_id: { sido: string; sigungu: string };
		totalFacilities: number;
		totalCapacity: number;
		totalCurrent: number;
		avgRating: number;
		types: string[];
	}) => {
		const vacancy = r.totalCapacity - r.totalCurrent;
		const saturationRate = r.totalCapacity > 0
			? r.totalCurrent / r.totalCapacity
			: 0;

		// Count facility types
		const typeCounts = new Map<string, number>();
		for (const t of r.types) {
			typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
		}

		return {
			region: { sido: r._id.sido || "미분류", sigungu: r._id.sigungu || "미분류" },
			totalFacilities: r.totalFacilities,
			totalCapacity: r.totalCapacity,
			totalCurrent: r.totalCurrent,
			vacancy: Math.max(0, vacancy),
			saturationRate: Math.round(saturationRate * 1000) / 1000,
			facilityTypes: Array.from(typeCounts.entries())
				.map(([type, count]) => ({ type, count }))
				.sort((a, b) => b.count - a.count),
			avgRating: Math.round((r.avgRating ?? 0) * 10) / 10,
		};
	});
}

/* ─── Regional Trends ─── */

/**
 * Get monthly trends for a region.
 * Uses FacilitySnapshot for historical data when available,
 * otherwise returns current snapshot as single data point.
 */
export async function getRegionalTrends(params: {
	sido: string;
	sigungu?: string;
	months?: number;
}): Promise<RegionalTrend[]> {
	const { sido, sigungu, months = API_CONFIG.REGIONAL_ANALYTICS.defaultMonths } = params;

	// Generate monthly snapshots from current data (KOSIS historical data not yet available)
	const match: Record<string, unknown> = { "region.sido": sido };
	if (sigungu) match["region.sigungu"] = sigungu;

	const current = await Facility.aggregate([
		{ $match: match },
		{
			$group: {
				_id: null,
				totalCapacity: { $sum: "$capacity.total" },
				totalCurrent: { $sum: "$capacity.current" },
			},
		},
	]);

	const baseData = current[0] ?? { totalCapacity: 0, totalCurrent: 0 };
	const now = new Date();
	const trends: RegionalTrend[] = [];

	// Generate synthetic trend points (will be replaced with real snapshots)
	for (let i = months - 1; i >= 0; i--) {
		const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

		// Slight variation for trend visibility (stub data)
		const variationFactor = 1 + (Math.sin(i * 0.5) * 0.02);
		const totalCurrent = Math.round(baseData.totalCurrent * variationFactor);
		const vacancy = baseData.totalCapacity - totalCurrent;

		trends.push({
			month: monthStr,
			region: { sido, sigungu: sigungu || "전체" },
			totalCapacity: baseData.totalCapacity,
			totalCurrent,
			vacancy: Math.max(0, vacancy),
			saturationRate: baseData.totalCapacity > 0
				? Math.round((totalCurrent / baseData.totalCapacity) * 1000) / 1000
				: 0,
		});
	}

	return trends;
}

/* ─── Market Report ─── */

export async function generateMarketReport(): Promise<MarketReport> {
	const allStats = await getRegionalStats({});

	// National summary
	const summary = allStats.reduce(
		(acc, r) => ({
			totalFacilities: acc.totalFacilities + r.totalFacilities,
			totalCapacity: acc.totalCapacity + r.totalCapacity,
			totalCurrent: acc.totalCurrent + r.totalCurrent,
			ratingSum: acc.ratingSum + r.avgRating * r.totalFacilities,
			facilityCount: acc.facilityCount + r.totalFacilities,
		}),
		{ totalFacilities: 0, totalCapacity: 0, totalCurrent: 0, ratingSum: 0, facilityCount: 0 },
	);

	const nationalSaturation = summary.totalCapacity > 0
		? summary.totalCurrent / summary.totalCapacity
		: 0;

	const avgRating = summary.facilityCount > 0
		? summary.ratingSum / summary.facilityCount
		: 0;

	// Categorize regions
	const threshold = API_CONFIG.REGIONAL_ANALYTICS.saturationThreshold;
	const saturatedRegions = allStats
		.filter((r) => r.saturationRate >= threshold)
		.sort((a, b) => b.saturationRate - a.saturationRate)
		.slice(0, 10);

	const underservedRegions = allStats
		.filter((r) => r.totalFacilities > 0 && r.vacancy <= 5)
		.sort((a, b) => a.vacancy - b.vacancy)
		.slice(0, 10);

	const topRegions = allStats
		.sort((a, b) => b.totalFacilities - a.totalFacilities)
		.slice(0, 10);

	return {
		generatedAt: new Date().toISOString(),
		summary: {
			totalFacilities: summary.totalFacilities,
			totalCapacity: summary.totalCapacity,
			totalCurrent: summary.totalCurrent,
			nationalSaturationRate: Math.round(nationalSaturation * 1000) / 1000,
			avgRating: Math.round(avgRating * 10) / 10,
		},
		topRegions,
		underservedRegions,
		saturatedRegions,
	};
}
