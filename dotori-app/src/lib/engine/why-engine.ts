/**
 * 근거(why) 엔진 — 시설 데이터 기반 인사이트 생성
 *
 * 하드코딩이 아닌, 실제 시설 데이터(정원/현원/대기/유형/평가등급/특징)에서
 * 자동으로 추론한 근거 문장을 반환한다.
 */

import type { ChildProfile, Facility } from "@/types/dotori";
import { getChildAgeMonths, formatAge } from "./child-age-utils";

export interface WhyInsight {
	/** 요약 문장 */
	text: string;
	/** 아이콘 색상: forest(긍정), dotori(중립), warning(주의) */
	sentiment: "positive" | "neutral" | "caution";
	/** 데이터 출처 */
	source: string;
}

export type TransferReasonCategory =
	| "class_dissatisfaction"
	| "teacher_turnover"
	| "director_distrust"
	| "facility_poor"
	| "public_waitlist"
	| "relocation"
	| "sibling_separation"
	| "program_dissatisfaction"
	| "safety_concern";

export interface TransferReason {
	category: TransferReasonCategory;
	text: string;
	sentiment: "positive" | "neutral" | "caution";
	source: string;
}

export interface TransferReasonContext {
	/** 이동 대상 시설 */
	facility: Facility;
	/** 기존 시설(이사/이동 전) 정보 */
	previousFacility?: Facility | null;
	/** 형제 자녀 수 */
	siblingCount?: number;
	/** 국공립 대기 당첨이 이미 난 경우 */
	publicWaitlistWon?: boolean;
}

function getLocationUnit(address?: string): string {
	if (!address) return "";
	return address.trim().split(/\s+/).slice(0, 2).join(" ");
}

function hasKeywordFeature(
	facility: Facility,
	keywords: string[],
): boolean {
	return facility.features.some((feature) =>
		keywords.some((keyword) => feature.includes(keyword)),
	);
}

function isHighCrowdByTeacher(facility: Facility): boolean {
	if (!facility.teacherCount || facility.teacherCount <= 0) return facility.capacity.current > 35;
	return facility.capacity.current / facility.teacherCount >= 10;
}

/** 시설에 대한 데이터 기반 인사이트 목록 생성 (최대 5개) */
export function generateWhyInsights(
	facility: Facility,
	child?: ChildProfile | null,
): WhyInsight[] {
	const insights: WhyInsight[] = [];

	// ── 1. 여석/정원 분석 ──
	const total = facility.capacity.total || 1; // 0 나누기 방어
	const toCount = total - facility.capacity.current;
	const occupancyRate = facility.capacity.current / total;

	if (facility.status === "available" && toCount > 0) {
		insights.push({
			text: `현재 ${toCount}자리 여석이 있어요 (정원 ${facility.capacity.total}명 중 ${facility.capacity.current}명 등원)`,
			sentiment: "positive",
			source: "아이사랑 정원현황",
		});
	} else if (facility.status === "waiting") {
		insights.push({
			text: `대기 ${facility.capacity.waiting}명이에요. 평균 대기 기간은 시설마다 달라요`,
			sentiment: "caution",
			source: "아이사랑 대기현황",
		});
	} else if (facility.status === "full") {
		insights.push({
			text: `현재 정원이 가득 차 있어요 (${facility.capacity.current}/${facility.capacity.total}명)`,
			sentiment: "caution",
			source: "아이사랑 정원현황",
		});
	}

	// ── 2. 정원 대비 규모 분석 ──
	if (facility.capacity.total >= 100) {
		insights.push({
			text: `정원 ${facility.capacity.total}명 규모의 대형 시설이에요. 반별 인원이 안정적일 수 있어요`,
			sentiment: "positive",
			source: "시설 정보",
		});
	} else if (facility.capacity.total <= 20) {
		insights.push({
			text: `정원 ${facility.capacity.total}명 소규모 시설이에요. 개별 케어에 유리할 수 있어요`,
			sentiment: "neutral",
			source: "시설 정보",
		});
	}

	// ── 3. 유형별 특성 ──
	const typeInsights: Record<string, { text: string; source: string }> = {
		국공립: {
			text: "국공립은 보육료가 저렴하고 평가인증 비율이 높아요 (경쟁률 높음)",
			source: "보건복지부 통계",
		},
		가정: {
			text: "가정어린이집은 소규모로 가정적인 분위기예요. 영아에게 적합해요",
			source: "보건복지부 유형 정보",
		},
		직장: {
			text: "직장어린이집은 출퇴근 동선에 편리하고 기업 지원이 있어요",
			source: "보건복지부 유형 정보",
		},
		민간: {
			text: "민간어린이집은 다양한 교육 프로그램을 운영하는 경우가 많아요",
			source: "보건복지부 유형 정보",
		},
	};
	if (typeInsights[facility.type]) {
		insights.push({
			...typeInsights[facility.type],
			sentiment: "neutral",
		});
	}

	// ── 4. 평가등급 ──
	if (facility.evaluationGrade) {
		const gradeMap: Record<string, { text: string; sentiment: WhyInsight["sentiment"] }> = {
			A: {
				text: "평가인증 A등급이에요. 최상위 보육 품질로 인정받았어요",
				sentiment: "positive",
			},
			B: {
				text: "평가인증 B등급이에요. 양호한 보육 환경이에요",
				sentiment: "positive",
			},
			C: {
				text: "평가인증 C등급이에요. 기본 요건을 충족해요",
				sentiment: "neutral",
			},
			D: {
				text: "평가인증 D등급이에요. 개선이 진행 중일 수 있어요",
				sentiment: "caution",
			},
		};
		const grade = gradeMap[facility.evaluationGrade];
		if (grade) {
			insights.push({
				text: grade.text,
				sentiment: grade.sentiment,
				source: "한국보육진흥원 평가",
			});
		}
	}

	// ── 5. 연장보육 ──
	if (facility.operatingHours?.extendedCare) {
		insights.push({
			text: `연장보육(${facility.operatingHours.close}까지) 운영 시설이에요. 맞벌이 가정에 유리해요`,
			sentiment: "positive",
			source: "시설 운영정보",
		});
	}

	// ── 6. 평점 ──
	if (facility.rating >= 4.5 && facility.reviewCount >= 5) {
		insights.push({
			text: `평점 ${facility.rating}점 (${facility.reviewCount}개 리뷰). 이용자 만족도가 높아요`,
			sentiment: "positive",
			source: "이용자 리뷰",
		});
	} else if (facility.rating > 0 && facility.rating < 3.0 && facility.reviewCount >= 3) {
		insights.push({
			text: `평점 ${facility.rating}점 (${facility.reviewCount}개 리뷰). 최근 리뷰를 확인해보세요`,
			sentiment: "caution",
			source: "이용자 리뷰",
		});
	}

	// ── 7. 충원율 기반 경쟁 분석 ──
	if (occupancyRate >= 0.95 && facility.capacity.waiting > 10) {
		insights.push({
			text: `충원율 ${Math.round(occupancyRate * 100)}%에 대기 ${facility.capacity.waiting}명. 인기 시설이에요`,
			sentiment: "caution",
			source: "정원 데이터 분석",
		});
	} else if (occupancyRate < 0.7 && facility.status === "available") {
		insights.push({
			text: `충원율 ${Math.round(occupancyRate * 100)}%로 여유가 있어요. 입소 확률이 높아요`,
			sentiment: "positive",
			source: "정원 데이터 분석",
		});
	}

	// ── 8. 아이 나이 기반 매칭 (child가 있을 때) ──
	if (child) {
		const ageMonths = getChildAgeMonths(child.birthDate);
		if (ageMonths < 12 && facility.type === "가정") {
			insights.push({
				text: `${child.name}은(는) ${ageMonths}개월이에요. 가정어린이집은 영아 케어에 적합해요`,
				sentiment: "positive",
				source: "아이 맞춤 분석",
			});
		} else if (ageMonths >= 36 && facility.features.includes("누리과정")) {
			insights.push({
				text: `${child.name} 나이에 맞는 누리과정 운영 시설이에요`,
				sentiment: "positive",
				source: "아이 맞춤 분석",
			});
		} else {
			const age = formatAge(ageMonths);
			insights.push({
				text: `${child.name}(${age}) 연령 기준으로 분석했어요`,
				sentiment: "neutral",
				source: "아이 맞춤 분석",
			});
		}
	}

	// ── 9. 특징 기반 하이라이트 ──
	const highlightFeatures = [
		{ keyword: "텃밭", text: "텃밭 활동으로 자연 체험 교육을 해요" },
		{ keyword: "영어", text: "영어 프로그램을 운영하고 있어요" },
		{ keyword: "숲", text: "숲 체험 활동이 있어 야외 활동이 풍부해요" },
		{ keyword: "급식", text: "자체 급식을 운영해요" },
		{ keyword: "CCTV", text: "CCTV가 설치되어 있어요" },
		{ keyword: "차량", text: "통학 차량을 운영해요" },
	];
	for (const hf of highlightFeatures) {
		if (facility.features.some((f) => f.includes(hf.keyword))) {
			insights.push({
				text: hf.text,
				sentiment: "neutral",
				source: "시설 특징",
			});
			break; // 하나만
		}
	}

	// 최대 5개, 우선순위: positive > caution > neutral
	const priority: Record<string, number> = {
		positive: 3,
		caution: 2,
		neutral: 1,
	};
	return insights
		.sort((a, b) => priority[b.sentiment] - priority[a.sentiment])
		.slice(0, 5);
}

export function generateTransferReasons({
	facility,
	previousFacility,
	siblingCount,
	publicWaitlistWon = false,
}: TransferReasonContext): TransferReason[] {
	const reasons: TransferReason[] = [];
	const totalCapacity = facility.capacity.total || 1;
	const occupancyRate = facility.capacity.current / totalCapacity;

	const addIfMissing = (reason: TransferReason) => {
		if (!reasons.some((item) => item.category === reason.category)) {
			reasons.push(reason);
		}
	};

	if (isHighCrowdByTeacher(facility) && occupancyRate >= 0.85) {
		addIfMissing({
			category: "class_dissatisfaction",
			text: "현재 반/교사 배치가 빠듯해 반 편성이 불안정할 수 있어요",
			sentiment: "caution",
			source: "보육 운영 데이터",
		});
	}

	if (facility.teacherCount !== undefined && facility.teacherCount <= 2 && facility.capacity.total > 40) {
		addIfMissing({
			category: "teacher_turnover",
			text: "교사 인력이 적어 교체 리스크가 높을 수 있어요",
			sentiment: "caution",
			source: "인력 구성 분석",
		});
	}

	if (facility.evaluationGrade === "D" && facility.rating > 0) {
		addIfMissing({
			category: "director_distrust",
			text: "평가등급이 낮아 운영 신뢰도 점검이 필요해요",
			sentiment: "caution",
			source: "평가인증 데이터",
		});
	}

	if ((facility.rating > 0 && facility.rating < 3.0 && facility.reviewCount >= 3) || facility.evaluationGrade === "D") {
		addIfMissing({
			category: "facility_poor",
			text: "시설 평점이 낮아 시설 상태·청결 점검이 필요해요",
			sentiment: "caution",
			source: "이용자 리뷰/평가",
		});
	}

	if (facility.type === "국공립" && facility.capacity.waiting > 0 && !publicWaitlistWon) {
		addIfMissing({
			category: "public_waitlist",
			text: "국공립 대기자 우선순위 이슈로 이동 일정이 밀릴 수 있어요",
			sentiment: "neutral",
			source: "대기열 운영 데이터",
		});
	}

	if (facility.distance && Number(facility.distance.replace(/[^0-9.]/g, "")) {
		const distance = Number.parseFloat(facility.distance.replace(/[^0-9.]/g, ""));
		if (!Number.isNaN(distance) && distance >= 2) {
			addIfMissing({
				category: "relocation",
				text: "현재 거주시설 대비 이동 거리 이슈가 있어요",
				sentiment: "neutral",
				source: "거리 데이터",
			});
		}
	}

	if (facility.status === "waiting" && facility.capacity.waiting >= 10 && facility.type !== "국공립") {
		addIfMissing({
			category: "relocation",
			text: "현재 대기 인원이 많아 빠른 입소 전환이 어려울 수 있어요",
			sentiment: "caution",
			source: "대기열 분석",
		});
	}

	if (previousFacility && getLocationUnit(previousFacility.address) && getLocationUnit(facility.address) && getLocationUnit(previousFacility.address) !== getLocationUnit(facility.address)) {
		addIfMissing({
			category: "relocation",
			text: "이동 전 기존 시설과 행정동이 다르므로 통학 동선 재설정이 필요해요",
			sentiment: "neutral",
			source: "주소 비교",
		});
	}

	if (typeof siblingCount === "number" && siblingCount > 1) {
		addIfMissing({
			category: "sibling_separation",
			text: "형제가 2명 이상이면 형제 분리 방지를 위해 동반 입소 여부를 먼저 확인하세요",
			sentiment: "neutral",
			source: "입소 계획 안내",
		});
	}

	const hasProgramAnchor = hasKeywordFeature(facility, [
		"누리과정",
		"영어",
		"예술",
		"과학",
		"체험",
		"사회성",
	]);
	if (!hasProgramAnchor && (facility.features.length <= 2 || facility.features.length >= 10)) {
		addIfMissing({
			category: "program_dissatisfaction",
			text: "프로그램 정보가 제한적이라 아이 성장단계별 활동 적합성 점검이 필요해요",
			sentiment: "neutral",
			source: "시설 특징",
		});
	}

	if (!hasKeywordFeature(facility, ["CCTV", "안심", "보안", "안전"]) && occupancyRate >= 0.75) {
		addIfMissing({
			category: "safety_concern",
			text: "안전 안내 항목에 대한 확인이 필요해 보이고 아이사랑에서 운영계획 재확인이 필요해요",
			sentiment: "caution",
			source: "안전 체크",
		});
	}

	return reasons;
}
