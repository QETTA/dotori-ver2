/**
 * KOSIS + 행안부 인구통계 API 래퍼
 *
 * 환경변수:
 *   KOSIS_API_KEY — 국가통계포털 Open API 키
 *   MOIS_API_KEY — 행정안전부 주민등록 인구통계 API 키
 *
 * 키 미설정 시 빈 배열 반환 + 경고 로그 (스텁 동작)
 *
 * 패턴: isalang-api.ts 동일
 */
import { log } from "@/lib/logger";

/* ─── Types ─── */

export interface PopulationData {
	region: string;
	year: number;
	ageGroup: string;
	population: number;
	dataSource: "KOSIS" | "행안부";
}

export interface PopulationTrend {
	region: string;
	years: number[];
	populations: number[];
	changeRate: number;
	dataSource: "KOSIS" | "행안부";
}

/* ─── KOSIS (국가통계포털) ─── */

const KOSIS_BASE_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do";

/**
 * KOSIS에서 영유아(0-5세) 인구 데이터 조회.
 * API 키 미설정 시 빈 배열 반환.
 */
export async function fetchChildPopulation(
	regionCode: string,
	year?: number,
): Promise<PopulationData[]> {
	const apiKey = process.env.KOSIS_API_KEY;
	if (!apiKey) {
		log.warn("KOSIS_API_KEY not set — returning empty array");
		return [];
	}

	const targetYear = year ?? new Date().getFullYear();

	const params = new URLSearchParams({
		method: "getList",
		apiKey,
		itmId: "T2",
		objL1: regionCode,
		objL2: "ALL",
		format: "json",
		jsonVD: "Y",
		prdSe: "Y",
		startPrdDe: String(targetYear),
		endPrdDe: String(targetYear),
		orgId: "101",
		tblId: "DT_1B04005N",
	});

	try {
		const response = await fetch(`${KOSIS_BASE_URL}?${params}`, {
			signal: AbortSignal.timeout(30_000),
		});

		if (!response.ok) {
			log.error("KOSIS API error", {
				status: response.status,
				regionCode,
			});
			return [];
		}

		const data = await response.json();
		if (!Array.isArray(data)) return [];

		return data
			.filter((item: Record<string, string>) => {
				const age = Number.parseInt(item.ITM_NM ?? "", 10);
				return !Number.isNaN(age) && age >= 0 && age <= 5;
			})
			.map((item: Record<string, string>) => ({
				region: item.C1_NM ?? regionCode,
				year: targetYear,
				ageGroup: `${item.ITM_NM}세`,
				population: Number.parseInt(item.DT ?? "0", 10),
				dataSource: "KOSIS" as const,
			}));
	} catch (err) {
		log.error("KOSIS API fetch failed", {
			error: err instanceof Error ? err.message : "unknown",
			regionCode,
		});
		return [];
	}
}

/* ─── 행안부 (주민등록 인구통계) ─── */

const MOIS_BASE_URL = "https://apis.data.go.kr/1741000/juminsu";

/**
 * 행안부에서 지역별 영유아 인구 추이 조회.
 * API 키 미설정 시 빈 배열 반환.
 */
export async function fetchPopulationTrend(
	regionCode: string,
	years = 5,
): Promise<PopulationTrend[]> {
	const apiKey = process.env.MOIS_API_KEY;
	if (!apiKey) {
		log.warn("MOIS_API_KEY not set — returning empty array");
		return [];
	}

	const currentYear = new Date().getFullYear();
	const startYear = currentYear - years;

	const params = new URLSearchParams({
		serviceKey: apiKey,
		type: "json",
		regcode: regionCode,
		startDt: `${startYear}01`,
		endDt: `${currentYear}12`,
	});

	try {
		const response = await fetch(`${MOIS_BASE_URL}/getJuminsuByAge?${params}`, {
			signal: AbortSignal.timeout(30_000),
		});

		if (!response.ok) {
			log.error("MOIS API error", {
				status: response.status,
				regionCode,
			});
			return [];
		}

		const data = await response.json();
		const items = data?.response?.body?.items ?? [];
		if (!Array.isArray(items) || items.length === 0) return [];

		// Group by year, sum 0-5 age populations
		const yearMap = new Map<number, number>();
		for (const item of items) {
			const year = Number.parseInt(item.statsYm?.slice(0, 4) ?? "0", 10);
			const age = Number.parseInt(item.age ?? "", 10);
			if (Number.isNaN(year) || Number.isNaN(age) || age > 5) continue;

			const population = Number.parseInt(item.populationCnt ?? "0", 10);
			yearMap.set(year, (yearMap.get(year) ?? 0) + population);
		}

		const sortedYears = [...yearMap.keys()].sort();
		const populations = sortedYears.map((y) => yearMap.get(y) ?? 0);

		const first = populations[0] || 1;
		const last = populations[populations.length - 1] || 0;
		const changeRate = (last - first) / first;

		return [
			{
				region: regionCode,
				years: sortedYears,
				populations,
				changeRate,
				dataSource: "행안부",
			},
		];
	} catch (err) {
		log.error("MOIS API fetch failed", {
			error: err instanceof Error ? err.message : "unknown",
			regionCode,
		});
		return [];
	}
}
