/**
 * 7대 이동 트리거 감지 엔진
 *
 * KAKAO_CHANNEL 기반 7개 이벤트 트리거로 대상 사용자 매칭.
 * 실제 알림톡 발송은 Solapi 계약 후 활성화 (현재 stub).
 */
import type { CampaignTriggerType } from "@/models/Campaign";
import Facility from "@/models/Facility";
import User from "@/models/User";

export interface TriggerContext {
	triggerId: CampaignTriggerType;
	detectedAt: Date;
	affectedRegions: string[];
	metadata: Record<string, unknown>;
}

export interface MatchedUser {
	userId: string;
	nickname: string;
	region: { sido: string; sigungu: string };
	childCount: number;
	matchReason: string;
}

/* ─── Trigger Detection ─── */

/**
 * Detect active triggers based on current date and data state.
 */
export async function detectTriggers(): Promise<TriggerContext[]> {
	const triggers: TriggerContext[] = [];
	const now = new Date();
	const month = now.getMonth() + 1;

	// Trigger 1: 졸업/진급 (2~3월)
	if (month === 2 || month === 3) {
		triggers.push({
			triggerId: "graduation",
			detectedAt: now,
			affectedRegions: ["전국"],
			metadata: { description: "졸업/진급 시즌 — 시설 이동 수요 증가" },
		});
	}

	// Trigger 3: 빈자리 발생 — facilities with vacancy
	const vacancyFacilities = await Facility.countDocuments({
		$expr: { $gt: ["$capacity.total", "$capacity.current"] },
	});
	if (vacancyFacilities > 0) {
		triggers.push({
			triggerId: "vacancy",
			detectedAt: now,
			affectedRegions: ["전국"],
			metadata: { facilitiesWithVacancy: vacancyFacilities },
		});
	}

	// Trigger 6: 계절 입소 (3월/9월)
	if (month === 3 || month === 9) {
		triggers.push({
			triggerId: "seasonal_admission",
			detectedAt: now,
			affectedRegions: ["전국"],
			metadata: { season: month === 3 ? "spring" : "fall" },
		});
	}

	// Triggers 2, 4, 5, 7 require external data (KOSIS, 평가원 등) — stub
	return triggers;
}

/**
 * Match users for a specific trigger based on audience criteria.
 */
export async function matchUsersForTrigger(params: {
	triggerId: CampaignTriggerType;
	audience: {
		regions?: string[];
		childAgeRange?: { min: number; max: number };
		facilityTypes?: string[];
	};
	limit?: number;
}): Promise<MatchedUser[]> {
	const { triggerId, audience, limit = 1000 } = params;

	const filter: Record<string, unknown> = {};

	// Region filter
	if (audience.regions && audience.regions.length > 0 && !audience.regions.includes("전국")) {
		filter["region.sido"] = { $in: audience.regions };
	}

	// Child age range filter
	if (audience.childAgeRange) {
		const now = new Date();
		const maxBirth = new Date(
			now.getFullYear() - audience.childAgeRange.min,
			now.getMonth(),
			now.getDate(),
		);
		const minBirth = new Date(
			now.getFullYear() - audience.childAgeRange.max,
			now.getMonth(),
			now.getDate(),
		);
		filter["children.birthDate"] = {
			$gte: minBirth.toISOString().slice(0, 10),
			$lte: maxBirth.toISOString().slice(0, 10),
		};
	}

	const users = await User.find(filter)
		.select("nickname region children")
		.limit(limit)
		.lean<{ _id: unknown; nickname: string; region: { sido: string; sigungu: string }; children: unknown[] }[]>();

	return users.map((u) => ({
		userId: String(u._id),
		nickname: u.nickname,
		region: u.region,
		childCount: u.children?.length ?? 0,
		matchReason: getMatchReason(triggerId),
	}));
}

function getMatchReason(triggerId: CampaignTriggerType): string {
	const reasons: Record<CampaignTriggerType, string> = {
		graduation: "졸업/진급 시즌 대상",
		relocation: "거주지 이동 감지",
		vacancy: "관심 시설 빈자리 발생",
		evaluation_change: "시설 평가 등급 변경",
		policy_change: "보육 정책 변경 안내 대상",
		seasonal_admission: "계절 입소 모집 대상",
		sibling_priority: "형제 입소 우선순위 대상",
	};
	return reasons[triggerId];
}

/* ─── Trigger Descriptions (for admin UI) ─── */

export const TRIGGER_DESCRIPTIONS: Record<CampaignTriggerType, {
	name: string;
	description: string;
	frequency: string;
}> = {
	graduation: {
		name: "졸업/진급",
		description: "매년 2~3월 졸업/진급에 따른 시설 이동 수요",
		frequency: "매년 2~3월",
	},
	relocation: {
		name: "직장/거주지 이동",
		description: "직장 또는 거주지 이동으로 새 시설 탐색 필요",
		frequency: "상시",
	},
	vacancy: {
		name: "빈자리 발생",
		description: "관심 시설에 TO 1+ 발생",
		frequency: "상시",
	},
	evaluation_change: {
		name: "시설 평가 변경",
		description: "시설 평가인증 등급 변경",
		frequency: "연 1회",
	},
	policy_change: {
		name: "정책 변경",
		description: "유보통합/보육료 등 정책 변경",
		frequency: "비정기",
	},
	seasonal_admission: {
		name: "계절 입소",
		description: "3월/9월 정기 입소 모집",
		frequency: "연 2회",
	},
	sibling_priority: {
		name: "형제 입소 우선순위",
		description: "형제가 재원중인 시설 우선 입소",
		frequency: "상시",
	},
};
