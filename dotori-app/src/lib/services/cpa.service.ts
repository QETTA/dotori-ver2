/**
 * CPA (Cost Per Action) 이벤트 트래킹 서비스
 *
 * 견학 신청, 대기 등록, 관심 추가, 전자서명 완료 등
 * 수익 직결 이벤트를 건별 추적.
 *
 * fire-and-forget 패턴: 실패해도 비즈니스 로직 차단 안 함.
 */
import mongoose from "mongoose";
import CPAEvent, { type CPAEventType } from "@/models/CPAEvent";
import { log } from "@/lib/logger";

export interface RecordCPAInput {
	eventType: CPAEventType;
	userId: string;
	facilityId: string;
	targetId: string;
	metadata?: Record<string, unknown>;
}

export interface CPAStats {
	visitRequests: number;
	waitlistApplies: number;
	interestAdds: number;
	esignCompletes: number;
	total: number;
}

/**
 * CPA 이벤트 기록 (fire-and-forget)
 */
export async function recordCPA(input: RecordCPAInput): Promise<void> {
	try {
		await CPAEvent.create({
			eventType: input.eventType,
			userId: new mongoose.Types.ObjectId(input.userId),
			facilityId: new mongoose.Types.ObjectId(input.facilityId),
			targetId: new mongoose.Types.ObjectId(input.targetId),
			metadata: input.metadata,
			occurredAt: new Date(),
		});
	} catch (err) {
		log.warn("CPA 이벤트 기록 실패", {
			eventType: input.eventType,
			error: err instanceof Error ? err.message : String(err),
		});
	}
}

/**
 * 시설별 CPA 통계 집계
 */
export async function getStatsByFacility(
	facilityId: string,
	period: { start: Date; end: Date },
): Promise<CPAStats> {
	if (!mongoose.Types.ObjectId.isValid(facilityId)) {
		return { visitRequests: 0, waitlistApplies: 0, interestAdds: 0, esignCompletes: 0, total: 0 };
	}

	const results = await CPAEvent.aggregate<{ _id: CPAEventType; count: number }>([
		{
			$match: {
				facilityId: new mongoose.Types.ObjectId(facilityId),
				occurredAt: { $gte: period.start, $lte: period.end },
			},
		},
		{
			$group: {
				_id: "$eventType",
				count: { $sum: 1 },
			},
		},
	]);

	const countMap = new Map(results.map((r) => [r._id, r.count]));

	const visitRequests = countMap.get("visit_request") ?? 0;
	const waitlistApplies = countMap.get("waitlist_apply") ?? 0;
	const interestAdds = countMap.get("interest_add") ?? 0;
	const esignCompletes = countMap.get("esign_complete") ?? 0;

	return {
		visitRequests,
		waitlistApplies,
		interestAdds,
		esignCompletes,
		total: visitRequests + waitlistApplies + interestAdds + esignCompletes,
	};
}

export const cpaService = {
	recordCPA,
	getStatsByFacility,
};
