/**
 * 시설 통계 집계 서비스
 *
 * B2B SaaS 대시보드용: 시설이 자체 조회수·관심수·견학수 확인.
 * CPA 이벤트, 견학, 대기, 리뷰, TO예측 데이터를 통합 집계.
 */
import mongoose from "mongoose";
import { API_CONFIG } from "@/lib/config/api";
import User from "@/models/User";
import Visit from "@/models/Visit";
import Waitlist from "@/models/Waitlist";
import Review from "@/models/Review";
import { cpaService } from "@/lib/services/cpa.service";
import type { CPAStats } from "@/lib/services/cpa.service";

export interface FacilityStats {
	facilityId: string;
	period: { start: Date; end: Date };
	interests: number;
	visits: {
		total: number;
		requested: number;
		confirmed: number;
		completed: number;
		cancelled: number;
	};
	waitlists: {
		total: number;
		pending: number;
		accepted: number;
	};
	reviews: {
		count: number;
		avgRating: number;
	};
	cpa: {
		total: number;
		byType: Record<string, number>;
	};
}

function getPeriod(days?: number): { start: Date; end: Date } {
	const d = Math.min(
		Math.max(days ?? API_CONFIG.FACILITY_STATS.defaultDays, 1),
		API_CONFIG.FACILITY_STATS.maxDays,
	);
	const end = new Date();
	const start = new Date();
	start.setDate(start.getDate() - d);
	return { start, end };
}

export async function getStats(
	facilityId: string,
	days?: number,
): Promise<FacilityStats> {
	const period = getPeriod(days);
	const fid = new mongoose.Types.ObjectId(facilityId);

	const [interests, visitAgg, waitlistAgg, reviewAgg, cpaStats] =
		await Promise.allSettled([
			// interests: User.interests 배열에 facilityId 포함된 사용자 수
			User.countDocuments({ interests: fid }),

			// visits: 상태별 집계
			Visit.aggregate<{ _id: string; count: number }>([
				{
					$match: {
						facilityId: fid,
						createdAt: { $gte: period.start, $lte: period.end },
					},
				},
				{ $group: { _id: "$status", count: { $sum: 1 } } },
			]),

			// waitlists: 상태별 집계
			Waitlist.aggregate<{ _id: string; count: number }>([
				{
					$match: {
						facilityId: fid,
						createdAt: { $gte: period.start, $lte: period.end },
					},
				},
				{ $group: { _id: "$status", count: { $sum: 1 } } },
			]),

			// reviews: 평균 평점 + 개수
			Review.aggregate<{ avgRating: number; count: number }>([
				{
					$match: {
						facilityId: fid,
						createdAt: { $gte: period.start, $lte: period.end },
					},
				},
				{
					$group: {
						_id: null,
						avgRating: { $avg: "$rating" },
						count: { $sum: 1 },
					},
				},
			]),

			// CPA 통계
			cpaService.getStatsByFacility(facilityId, period),
		]);

	// visits 파싱
	const visitMap = new Map<string, number>();
	if (visitAgg.status === "fulfilled") {
		for (const v of visitAgg.value) visitMap.set(v._id, v.count);
	}
	const requested = visitMap.get("requested") ?? 0;
	const confirmed = visitMap.get("confirmed") ?? 0;
	const completed = visitMap.get("completed") ?? 0;
	const cancelled = visitMap.get("cancelled") ?? 0;

	// waitlists 파싱
	const waitMap = new Map<string, number>();
	if (waitlistAgg.status === "fulfilled") {
		for (const w of waitlistAgg.value) waitMap.set(w._id, w.count);
	}
	const pending = waitMap.get("pending") ?? 0;
	const accepted = waitMap.get("accepted") ?? 0;

	// reviews 파싱
	const reviewData =
		reviewAgg.status === "fulfilled" ? reviewAgg.value[0] : undefined;

	// CPA 파싱
	const cpa: CPAStats =
		cpaStats.status === "fulfilled"
			? cpaStats.value
			: { visitRequests: 0, waitlistApplies: 0, interestAdds: 0, esignCompletes: 0, total: 0 };

	return {
		facilityId,
		period,
		interests: interests.status === "fulfilled" ? interests.value : 0,
		visits: {
			total: requested + confirmed + completed + cancelled,
			requested,
			confirmed,
			completed,
			cancelled,
		},
		waitlists: {
			total: pending + accepted,
			pending,
			accepted,
		},
		reviews: {
			count: reviewData?.count ?? 0,
			avgRating: Math.round((reviewData?.avgRating ?? 0) * 10) / 10,
		},
		cpa: {
			total: cpa.total,
			byType: {
				visit_request: cpa.visitRequests,
				waitlist_apply: cpa.waitlistApplies,
				interest_add: cpa.interestAdds,
				esign_complete: cpa.esignCompletes,
			},
		},
	};
}

export async function batchGetStats(
	facilityIds: string[],
	days?: number,
): Promise<FacilityStats[]> {
	return Promise.all(facilityIds.map((id) => getStats(id, days)));
}

export const facilityStatsService = {
	getStats,
	batchGetStats,
};
