import { NextResponse } from "next/server";
import { acquireCronLock, releaseCronLock } from "@/lib/cron-lock";
import { verifyCronSecret } from "@/lib/cron-auth";
import dbConnect from "@/lib/db";
import PopulationData from "@/models/PopulationData";
import { log } from "@/lib/logger";
import { createApiErrorResponse } from "@/lib/api-error";

const JOB_NAME = "sync-population";

const KOSIS_API_KEY = process.env.KOSIS_API_KEY || "";
const MOIS_API_KEY = process.env.MOIS_API_KEY || "";

interface PopulationRecord {
	regionCode: string;
	year: number;
	ageGroup: string;
	population: number;
	dataSource: "KOSIS" | "행안부";
}

/**
 * KOSIS 통계 API에서 연령별 인구 데이터 수집
 */
async function fetchChildPopulation(): Promise<PopulationRecord[]> {
	if (!KOSIS_API_KEY) {
		log.warn("KOSIS_API_KEY 미설정 — 인구 동기화 건너뜀");
		return [];
	}

	try {
		const currentYear = new Date().getFullYear();
		const url = new URL("https://kosis.kr/openapi/Param/statisticsParameterData.do");
		url.searchParams.set("method", "getList");
		url.searchParams.set("apiKey", KOSIS_API_KEY);
		url.searchParams.set("itmId", "T10+");
		url.searchParams.set("objL1", "ALL");
		url.searchParams.set("objL2", "ALL");
		url.searchParams.set("format", "json");
		url.searchParams.set("jsonVD", "Y");
		url.searchParams.set("prdSe", "Y");
		url.searchParams.set("startPrdDe", String(currentYear - 1));
		url.searchParams.set("endPrdDe", String(currentYear));
		url.searchParams.set("orgId", "101");
		url.searchParams.set("tblId", "DT_1B040M5");

		const response = await fetch(url.toString(), {
			signal: AbortSignal.timeout(30_000),
		});

		if (!response.ok) {
			log.error("KOSIS API 응답 오류", { status: response.status });
			return [];
		}

		const data = await response.json();
		const items = Array.isArray(data) ? data : [];

		return items
			.filter((item: Record<string, string>) => {
				const age = Number.parseInt(item.ITM_NM || "0", 10);
				return age >= 0 && age <= 6;
			})
			.map((item: Record<string, string>) => ({
				regionCode: item.C1 || "",
				year: Number.parseInt(item.PRD_DE || String(currentYear), 10),
				ageGroup: `만${item.ITM_NM}세`,
				population: Number.parseInt(item.DT || "0", 10),
				dataSource: "KOSIS" as const,
			}));
	} catch (err) {
		log.error("KOSIS 인구 데이터 수집 실패", {
			error: err instanceof Error ? err.message : String(err),
		});
		return [];
	}
}

/**
 * 행안부 인구통계 API에서 인구 추세 데이터 수집
 */
async function fetchPopulationTrend(): Promise<PopulationRecord[]> {
	if (!MOIS_API_KEY) {
		log.warn("MOIS_API_KEY 미설정 — 행안부 동기화 건너뜀");
		return [];
	}

	try {
		const currentYear = new Date().getFullYear();
		const url = new URL("https://api.mois.go.kr/population/v1/age-group");
		url.searchParams.set("serviceKey", MOIS_API_KEY);
		url.searchParams.set("pageNo", "1");
		url.searchParams.set("numOfRows", "1000");
		url.searchParams.set("type", "json");
		url.searchParams.set("year", String(currentYear));

		const response = await fetch(url.toString(), {
			signal: AbortSignal.timeout(30_000),
		});

		if (!response.ok) {
			log.error("행안부 API 응답 오류", { status: response.status });
			return [];
		}

		const data = await response.json();
		const items = data?.response?.body?.items?.item || [];

		return (Array.isArray(items) ? items : [])
			.filter((item: Record<string, string | number>) => {
				const age = Number(item.age || 0);
				return age >= 0 && age <= 6;
			})
			.map((item: Record<string, string | number>) => ({
				regionCode: String(item.regionCode || ""),
				year: Number(item.year || currentYear),
				ageGroup: `만${item.age}세`,
				population: Number(item.population || 0),
				dataSource: "행안부" as const,
			}));
	} catch (err) {
		log.error("행안부 인구 데이터 수집 실패", {
			error: err instanceof Error ? err.message : String(err),
		});
		return [];
	}
}

/**
 * GET /api/cron/sync-population
 *
 * KOSIS + 행안부 인구 데이터 동기화 크론
 * Authorization: Bearer {CRON_SECRET}
 */
export async function GET(req: Request) {
	if (!verifyCronSecret(req)) {
		return createApiErrorResponse({
			status: 401,
			code: "UNAUTHORIZED",
			message: "인증이 필요합니다",
		});
	}

	let ownerToken: string | null = null;

	try {
		await dbConnect();

		ownerToken = await acquireCronLock(JOB_NAME, 300_000);
		if (!ownerToken) {
			return createApiErrorResponse({
				status: 409,
				code: "CONFLICT",
				message: "이미 실행 중입니다",
			});
		}

		try {
			const [kosisRecords, moisRecords] = await Promise.all([
				fetchChildPopulation(),
				fetchPopulationTrend(),
			]);

			const allRecords = [...kosisRecords, ...moisRecords];
			let upserted = 0;
			let failed = 0;

			for (const record of allRecords) {
				try {
					await PopulationData.findOneAndUpdate(
						{
							regionCode: record.regionCode,
							year: record.year,
							ageGroup: record.ageGroup,
						},
						{
							$set: {
								population: record.population,
								dataSource: record.dataSource,
								syncedAt: new Date(),
							},
						},
						{ upsert: true },
					);
					upserted++;
				} catch {
					failed++;
				}
			}

			return NextResponse.json({
				data: {
					kosisRecords: kosisRecords.length,
					moisRecords: moisRecords.length,
					upserted,
					failed,
					timestamp: new Date().toISOString(),
				},
			});
		} finally {
			await releaseCronLock(JOB_NAME, ownerToken);
		}
	} catch (err) {
		log.error("인구 데이터 동기화 실패", {
			error: err instanceof Error ? err.message : String(err),
		});
		return createApiErrorResponse({
			status: 500,
			code: "INTERNAL_ERROR",
			message: "처리에 실패했습니다",
		});
	}
}
