/**
 * TO (Transfer-Out) 예측 엔진
 *
 * Layer 1: FacilitySnapshot 이력 → 주간 변동 추세 (calculateTrend)
 * Layer 2: 졸업 예측 + 시설 매력도 + 지역 수요 보정
 * Score: min(100, round((predicted / capacity) * 100))
 */
import { API_CONFIG } from "@/lib/config/api";
import { log } from "@/lib/logger";
import Facility, { type IFacility } from "@/models/Facility";
import FacilitySnapshot from "@/models/FacilitySnapshot";
import PopulationData from "@/models/PopulationData";
import TOPrediction, { type ITOPrediction } from "@/models/TOPrediction";
import type { Types } from "mongoose";

const cfg = API_CONFIG.TO_PREDICTION;

// ────────────────────────────────────────
// Pure functions (exported for testing)
// ────────────────────────────────────────

interface SnapshotData {
	capacity: { total: number; current: number; waiting: number };
	snapshotAt: Date;
}

export interface RegionDemandData {
	childPopulation: number;
	facilityCount: number;
}

/**
 * 주간 변동 추세 계산.
 * snapshots를 시간순 정렬 후 (vacancy = total - current)의 주간 변화량 평균.
 */
export function calculateTrend(snapshots: SnapshotData[]): number {
	if (snapshots.length < 2) return 0;

	const sorted = [...snapshots].sort(
		(a, b) => a.snapshotAt.getTime() - b.snapshotAt.getTime(),
	);

	const vacancies = sorted.map(
		(s) => s.capacity.total - s.capacity.current,
	);

	let totalDelta = 0;
	for (let i = 1; i < vacancies.length; i++) {
		totalDelta += vacancies[i] - vacancies[i - 1];
	}

	// 주간(7일) 기준으로 정규화
	const firstDate = sorted[0].snapshotAt.getTime();
	const lastDate = sorted[sorted.length - 1].snapshotAt.getTime();
	const weeks = Math.max(1, (lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000));

	return totalDelta / weeks;
}

/**
 * 계절 보정값.
 * 3월(졸업): +3, 9월(추가모집): +1, 4-6월(안정기): -1, 나머지: 0
 */
export function getSeasonalAdjustment(month: number): number {
	if (month === cfg.graduationMonth) return 3;
	if (month === 9) return 1;
	if (month >= 4 && month <= 6) return -1;
	return 0;
}

/**
 * 졸업 월 배수 (내부 헬퍼).
 * 근접월(1-4): 1.0, 감쇠월(5-6): 0.3, 그 외: 0
 */
function graduationMultiplier(month: number): number {
	if ((cfg.graduationProximityMonths as readonly number[]).includes(month)) return 1;
	if ((cfg.graduationDecayMonths as readonly number[]).includes(month)) return cfg.graduationDecayFactor;
	return 0;
}

/**
 * 연령반 이름에서 나이 파싱.
 * "만3세" → 3, "만0세" → 0, 파싱불가 → -1
 */
export function parseAgeFromClassName(className: string): number {
	const match = className.match(/만(\d)세/);
	if (match) return parseInt(match[1], 10);
	return -1;
}

/**
 * 졸업 예측 인원 계산.
 * 최고 연령반 현원 x 월별 배수 (근접월 1.0, 감쇠월 0.3, 그 외 0).
 */
export function calculateGraduation(
	ageClasses: { className: string; capacity: number; current: number }[] | undefined,
	month: number,
	_facilityCategory?: "daycare" | "kindergarten",
): number {
	if (!ageClasses || ageClasses.length === 0) return 0;

	let maxAge = -1;
	let graduationCurrent = 0;
	for (const ac of ageClasses) {
		const age = parseAgeFromClassName(ac.className);
		if (age > maxAge) {
			maxAge = age;
			graduationCurrent = ac.current;
		}
	}

	if (maxAge < 0 || graduationCurrent === 0) return 0;

	return Math.round(graduationCurrent * graduationMultiplier(month));
}

/**
 * 시설 매력도 (0~1).
 * 평점(0.30) + 리뷰수(0.15) + 평가등급(0.25) + 프리미엄(0.10) + 시설특성(0.10) + 교사비율(0.10)
 */
export function calculateAttractiveness(facility: {
	rating?: number;
	reviewCount?: number;
	evaluationGrade?: string | null;
	isPremium?: boolean;
	features?: string[];
	teacherCount?: number;
	capacity: { total: number; current: number };
}): number {
	const { weights, reviewCap, featureCap, idealStaffRatio } = cfg.attractiveness;

	const ratingScore = (facility.rating ?? 0) / 5;
	const reviewScore = Math.min(facility.reviewCount ?? 0, reviewCap) / reviewCap;

	const gradeMap: Record<string, number> = { A: 1, B: 0.75, C: 0.5, D: 0.25 };
	const evalScore = facility.evaluationGrade
		? (gradeMap[facility.evaluationGrade] ?? cfg.defaultAttractivenessScore)
		: cfg.defaultAttractivenessScore;

	const premiumScore = facility.isPremium ? 1 : 0;
	const featureScore = Math.min(facility.features?.length ?? 0, featureCap) / featureCap;

	let staffScore: number = cfg.defaultAttractivenessScore;
	if (facility.teacherCount && facility.capacity.current > 0) {
		const actualRatio = facility.teacherCount / facility.capacity.current;
		staffScore = Math.max(0, Math.min(1, actualRatio / idealStaffRatio));
	}

	const score =
		weights.rating * ratingScore +
		weights.reviewPopularity * reviewScore +
		weights.evaluation * evalScore +
		weights.premium * premiumScore +
		weights.featureRichness * featureScore +
		weights.staffRatio * staffScore;

	return Math.max(0, Math.min(1, score));
}

/**
 * 지역 수요 계수 (0.5~2.0).
 * 인구 데이터 없으면 1.0 (중립).
 */
export function calculateDemandFactor(
	regionData: RegionDemandData | null | undefined,
	capacity: number,
): number {
	if (!regionData || regionData.facilityCount === 0 || capacity === 0) {
		return cfg.demand.defaultFactor;
	}

	const childrenPerFacility = regionData.childPopulation / regionData.facilityCount;
	const factor = childrenPerFacility / capacity;

	return Math.max(cfg.demand.minFactor, Math.min(cfg.demand.maxFactor, factor));
}

/**
 * 신뢰도 결정.
 * 스냅샷 수 < minRequired → low, < minRequired*2 → medium, else high.
 * 인구 데이터/연령반 데이터 보유 시 보너스.
 */
export function determineConfidence(
	snapshotCount: number,
	options?: { hasPopulationData?: boolean; hasAgeClasses?: boolean },
): ITOPrediction["confidence"] {
	let effectiveCount = snapshotCount;
	if (options?.hasPopulationData) effectiveCount += 1;
	if (options?.hasAgeClasses) effectiveCount += 1;

	if (effectiveCount < cfg.minSnapshotsRequired) return "low";
	if (effectiveCount < cfg.minSnapshotsRequired * 2) return "medium";
	return "high";
}

/**
 * 단일 시설 예측 계산 (순수 함수).
 */
export function calculatePrediction(
	facility: {
		capacity: { total: number; current: number; waiting: number };
		ageClasses?: { className: string; capacity: number; current: number; waiting: number }[];
		facilityCategory?: "daycare" | "kindergarten";
		rating?: number;
		reviewCount?: number;
		evaluationGrade?: string | null;
		isPremium?: boolean;
		features?: string[];
		teacherCount?: number;
	},
	snapshots: SnapshotData[],
	now: Date = new Date(),
	regionData?: RegionDemandData | null,
): {
	overallScore: number;
	predictedVacancies: number;
	confidence: ITOPrediction["confidence"];
	byAgeClass: ITOPrediction["byAgeClass"];
	factors: ITOPrediction["factors"];
} {
	const month = now.getMonth() + 1;
	const currentVacancy = Math.max(0, facility.capacity.total - facility.capacity.current);
	const trend = calculateTrend(snapshots);
	const seasonal = getSeasonalAdjustment(month);
	const snapshotCount = snapshots.length;

	// Layer 2
	const graduation = calculateGraduation(facility.ageClasses, month, facility.facilityCategory);
	const attractiveness = calculateAttractiveness(facility);
	const demandFactor = calculateDemandFactor(regionData, facility.capacity.total);
	const demandPressure = Math.round((demandFactor - 1.0) * attractiveness * currentVacancy);

	const confidence = determineConfidence(snapshotCount, {
		hasPopulationData: !!regionData,
		hasAgeClasses: !!facility.ageClasses?.length,
	});

	// 4주 투영 + 계절 보정 + 졸업 - 수요 압력
	const predictedVacancies = Math.max(
		0,
		Math.round(currentVacancy + trend * 4 + seasonal + graduation - demandPressure),
	);

	// Score: 빈자리 비율 기반 (0-100)
	const capacity = Math.max(1, facility.capacity.total);
	const overallScore = Math.min(100, Math.round((predictedVacancies / capacity) * 100));

	// Factors
	const factors: ITOPrediction["factors"] = [];
	if (trend !== 0) {
		factors.push({
			name: "주간추세",
			impact: Math.round(trend * 4),
			description: trend > 0 ? "빈자리 증가 추세" : "빈자리 감소 추세",
		});
	}
	if (seasonal !== 0) {
		factors.push({
			name: "계절보정",
			impact: seasonal,
			description:
				seasonal > 0
					? "졸업/추가모집 시기로 빈자리 증가 예상"
					: "안정기로 변동 적음",
		});
	}
	if (graduation > 0) {
		factors.push({
			name: "졸업예측",
			impact: graduation,
			description: "졸업·진급 시기로 빈자리 증가 예상",
		});
	}
	if (demandPressure !== 0) {
		factors.push({
			name: "지역수요",
			impact: -demandPressure,
			description:
				demandPressure > 0
					? "높은 지역 수요로 빈자리 감소 예상"
					: "낮은 지역 수요로 빈자리 증가 예상",
		});
	}
	if (facility.capacity.waiting > 0) {
		factors.push({
			name: "대기자",
			impact: -Math.min(facility.capacity.waiting, predictedVacancies),
			description: `현재 대기자 ${facility.capacity.waiting}명`,
		});
	}

	// 연령반별 예측
	const gradMultiplier = graduationMultiplier(month);
	let maxAge = -1;
	if (facility.ageClasses) {
		for (const ac of facility.ageClasses) {
			const age = parseAgeFromClassName(ac.className);
			if (age > maxAge) maxAge = age;
		}
	}

	const byAgeClass: ITOPrediction["byAgeClass"] =
		facility.ageClasses?.map((ac) => {
			const acVacancy = Math.max(0, ac.capacity - ac.current);
			const age = parseAgeFromClassName(ac.className);
			const isGrad = age === maxAge && maxAge >= 0 && gradMultiplier > 0;
			const gradBoost = isGrad ? Math.round(ac.current * gradMultiplier) : 0;
			const acPredicted = Math.max(0, Math.round(acVacancy + trend + seasonal + gradBoost));
			return {
				className: ac.className,
				currentVacancy: acVacancy,
				predictedVacancy: acPredicted,
				confidence,
			};
		}) ?? [];

	return { overallScore, predictedVacancies, confidence, byAgeClass, factors };
}

// ────────────────────────────────────────
// Service functions
// ────────────────────────────────────────

/**
 * 단일 시설 TO 예측 조회.
 * 유효한 캐시가 있으면 반환, 없으면 계산+저장.
 */
export async function getPrediction(
	facilityId: string,
): Promise<ITOPrediction | null> {
	// 캐시 확인
	const cached = await TOPrediction.findOne({
		facilityId,
		validUntil: { $gt: new Date() },
	});
	if (cached) return cached;

	// 시설 조회
	const facility = await Facility.findById(facilityId).lean() as IFacility | null;
	if (!facility) return null;

	// 스냅샷 조회 (최근 90일)
	const snapshots = await FacilitySnapshot.find({
		facilityId: facility._id,
	})
		.sort({ snapshotAt: -1 })
		.limit(30)
		.lean();

	if (snapshots.length < cfg.minSnapshotsRequired) return null;

	// Layer 2: 지역 수요 데이터 (없으면 graceful fallback)
	let regionData: RegionDemandData | null = null;
	try {
		const sido = facility.region?.sido;
		if (sido) {
			const currentYear = new Date().getFullYear();
			const popData = await PopulationData.find({
				regionCode: sido,
				year: currentYear,
			}).lean();

			if (popData.length > 0) {
				const childPop = popData.reduce((sum, p) => sum + p.population, 0);
				const facCount = await Facility.countDocuments({ "region.sido": sido });
				regionData = { childPopulation: childPop, facilityCount: facCount };
			}
		}
	} catch {
		// Layer 2 인구 데이터 미사용 → Layer 1 결과와 동일
	}

	const now = new Date();
	const prediction = calculatePrediction(
		{
			capacity: facility.capacity,
			ageClasses: facility.ageClasses,
			facilityCategory: facility.facilityCategory,
			rating: facility.rating,
			reviewCount: facility.reviewCount,
			evaluationGrade: facility.evaluationGrade,
			isPremium: facility.isPremium,
			features: facility.features,
			teacherCount: facility.teacherCount,
		},
		snapshots as SnapshotData[],
		now,
		regionData,
	);

	const validUntil = new Date(
		now.getTime() + cfg.validityDays * 24 * 60 * 60 * 1000,
	);

	// Upsert (facilityId unique index)
	const doc = await TOPrediction.findOneAndUpdate(
		{ facilityId: facility._id },
		{
			$set: {
				...prediction,
				facilityId: facility._id,
				snapshotCount: snapshots.length,
				calculatedAt: now,
				validUntil,
			},
		},
		{ upsert: true, new: true },
	);

	return doc;
}

/**
 * 전체 시설 배치 계산 (크론용).
 * Mongoose cursor 기반으로 메모리 안전.
 * 시도별 인구 데이터를 사전 집계하여 N+1 쿼리 방지.
 */
export async function batchCalculate(): Promise<{
	processed: number;
	skipped: number;
	errors: number;
}> {
	const stats = { processed: 0, skipped: 0, errors: 0 };
	const now = new Date();
	const validUntil = new Date(
		now.getTime() + cfg.validityDays * 24 * 60 * 60 * 1000,
	);

	// 사전 집계: 시도별 인구 데이터 + 시설 카운트
	const regionDemandMap = new Map<string, RegionDemandData>();
	try {
		const currentYear = now.getFullYear();
		const popAgg = await PopulationData.aggregate<{ _id: string; totalPop: number }>([
			{ $match: { year: currentYear } },
			{ $group: { _id: "$regionCode", totalPop: { $sum: "$population" } } },
		]);

		const facAgg = await Facility.aggregate<{ _id: string; count: number }>([
			{ $group: { _id: "$region.sido", count: { $sum: 1 } } },
		]);
		const facCountMap = new Map(facAgg.map((f) => [f._id, f.count]));

		for (const pop of popAgg) {
			const facCount = facCountMap.get(pop._id) ?? 0;
			if (facCount > 0) {
				regionDemandMap.set(pop._id, {
					childPopulation: pop.totalPop,
					facilityCount: facCount,
				});
			}
		}
	} catch {
		// 사전 집계 실패 → 전체 시설 demandFactor=1.0 (Layer 1)
	}

	const cursor = Facility.find({}).cursor({ batchSize: cfg.batchSize });

	for await (const facility of cursor) {
		try {
			const snapshots = await FacilitySnapshot.find({
				facilityId: facility._id,
			})
				.sort({ snapshotAt: -1 })
				.limit(30)
				.lean();

			if (snapshots.length < cfg.minSnapshotsRequired) {
				stats.skipped++;
				continue;
			}

			const regionData = regionDemandMap.get(facility.region?.sido) ?? null;
			const prediction = calculatePrediction(
				{
					capacity: facility.capacity,
					ageClasses: facility.ageClasses,
					facilityCategory: facility.facilityCategory,
					rating: facility.rating,
					reviewCount: facility.reviewCount,
					evaluationGrade: facility.evaluationGrade,
					isPremium: facility.isPremium,
					features: facility.features,
					teacherCount: facility.teacherCount,
				},
				snapshots as SnapshotData[],
				now,
				regionData,
			);

			await TOPrediction.findOneAndUpdate(
				{ facilityId: facility._id as Types.ObjectId },
				{
					$set: {
						...prediction,
						facilityId: facility._id,
						snapshotCount: snapshots.length,
						calculatedAt: now,
						validUntil,
					},
				},
				{ upsert: true },
			);

			stats.processed++;
		} catch (err) {
			stats.errors++;
			log.error("TO prediction batch error", {
				facilityId: String(facility._id),
				error: err instanceof Error ? err.message : "unknown",
			});
		}
	}

	return stats;
}
