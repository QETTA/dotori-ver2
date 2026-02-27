/**
 * 시설 비교 리포트 + 입소 준비 체크리스트 생성 엔진
 *
 * 실제 시설 데이터를 기반으로 구조화된 리포트와 체크리스트를 생성한다.
 */

import type { ChildProfile, Facility } from "@/types/dotori";
import { getChildAgeMonths, formatAge } from "./child-age-utils";

/* ═══ 리포트 ═══ */

export interface ReportSection {
	title: string;
	items: ReportItem[];
}

export interface ReportItem {
	label: string;
	values: string[]; // 시설별 값 (facilities 순서)
	highlight?: number; // 최우수 시설 인덱스
}

export interface FacilityReport {
	title: string;
	facilities: { id: string; name: string }[];
	sections: ReportSection[];
	summary: string;
	generatedAt: string;
}

/** 시설 비교 리포트 생성 (2~3개 시설) */
export function generateReport(
	facilities: Facility[],
	child?: ChildProfile | null,
): FacilityReport {
	const names = facilities.map((f) => f.name);
	const sections: ReportSection[] = [];

	// ── 기본 정보 섹션 ──
	sections.push({
		title: "기본 정보",
		items: [
			{ label: "유형", values: facilities.map((f) => f.type) },
			{
				label: "상태",
				values: facilities.map((f) =>
					f.status === "available"
						? "입소 가능"
						: f.status === "waiting"
							? "대기"
							: "마감",
				),
			},
			{
				label: "주소",
				values: facilities.map((f) => f.address),
			},
		],
	});

	// ── 정원 현황 섹션 ──
	// NOTE: capacity.current는 미수집(항상 0)이므로 사용하지 않음
	const statusLabels = facilities.map((f) =>
		f.status === "available"
			? "빈자리 있음"
			: f.status === "waiting"
				? "대기"
				: "마감",
	);
	const bestStatusIdx = statusLabels.indexOf("빈자리 있음");

	sections.push({
		title: "정원 현황",
		items: [
			{
				label: "정원",
				values: facilities.map((f) => `${f.capacity.total}명`),
			},
			{
				label: "입소 상태",
				values: statusLabels,
				highlight: bestStatusIdx >= 0 ? bestStatusIdx : undefined,
			},
			{
				label: "대기",
				values: facilities.map((f) =>
					f.capacity.waiting > 0 ? `${f.capacity.waiting}명` : "없음",
				),
			},
		],
	});

	// ── 품질 평가 섹션 ──
	const ratings = facilities.map((f) => f.rating);
	const bestRatingIdx = ratings.indexOf(Math.max(...ratings));

	sections.push({
		title: "품질 평가",
		items: [
			{
				label: "평점",
				values: facilities.map(
					(f) => (f.rating > 0 ? `${f.rating}점` : "정보 없음"),
				),
				highlight: bestRatingIdx >= 0 && ratings[bestRatingIdx] > 0 ? bestRatingIdx : undefined,
			},
			{
				label: "리뷰 수",
				values: facilities.map((f) => `${f.reviewCount}개`),
			},
			{
				label: "평가등급",
				values: facilities.map(
					(f) => f.evaluationGrade || "미평가",
				),
			},
		],
	});

	// ── 운영 정보 섹션 ──
	sections.push({
		title: "운영 정보",
		items: [
			{
				label: "운영시간",
				values: facilities.map((f) =>
					f.operatingHours
						? `${f.operatingHours.open}~${f.operatingHours.close}`
						: "정보 없음",
				),
			},
			{
				label: "연장보육",
				values: facilities.map((f) =>
					f.operatingHours?.extendedCare ? "운영" : "미운영",
				),
			},
		],
	});

	// ── 특징 비교 섹션 ──
	const allFeatures = new Set(facilities.flatMap((f) => f.features));
	if (allFeatures.size > 0) {
		sections.push({
			title: "특징 비교",
			items: [...allFeatures].slice(0, 8).map((feat) => ({
				label: feat,
				values: facilities.map((f) =>
					f.features.includes(feat) ? "O" : "-",
				),
			})),
		});
	}

	// ── 요약 생성 ──
	const summaryParts: string[] = [];

	// 입소 가능 시설 비교
	const availableFacilities = facilities.filter(
		(f) => f.status === "available",
	);
	if (availableFacilities.length > 0) {
		if (availableFacilities.length === 1) {
			summaryParts.push(
				`${availableFacilities[0].name}만 현재 입소 가능해요`,
			);
		} else {
			const names = availableFacilities.map((f) => f.name).join(", ");
			summaryParts.push(`${names} 모두 입소 가능 상태예요`);
		}
	}

	// 평점 비교
	const ratedFacilities = facilities.filter((f) => f.rating > 0);
	if (ratedFacilities.length >= 2) {
		const bestRated = ratedFacilities.reduce((a, b) =>
			a.rating > b.rating ? a : b,
		);
		summaryParts.push(
			`평점은 ${bestRated.name}이(가) ${bestRated.rating}점으로 가장 높아요`,
		);
	}

	// 아이 기반
	if (child) {
		const ageMonths = getChildAgeMonths(child.birthDate);
		if (ageMonths < 24) {
			const homeFac = facilities.find((f) => f.type === "가정");
			if (homeFac) {
				summaryParts.push(
					`${child.name} 나이(${formatAge(ageMonths)})에는 가정어린이집(${homeFac.name})도 고려해보세요`,
				);
			}
		}
	}

	const summary =
		summaryParts.length > 0
			? summaryParts.join(". ") + "."
			: `${names.join(", ")} 비교 리포트예요. 각 항목을 비교해보세요.`;

	return {
		title: `${names.join(" vs ")} 비교 리포트`,
		facilities: facilities.map((f) => ({ id: f.id, name: f.name })),
		sections,
		summary,
		generatedAt: new Date().toISOString(),
	};
}

/* ═══ 체크리스트 ═══ */

export interface ChecklistCategory {
	title: string;
	items: ChecklistItem[];
}

export interface ChecklistItem {
	id: string;
	text: string;
	detail?: string;
	checked: boolean;
}

export type TransferChecklistItem = ChecklistItem;

export interface EnrollmentChecklist {
	title: string;
	facilityId?: string;
	facilityName?: string;
	categories: ChecklistCategory[];
	generatedAt: string;
}

/** 입소 준비 체크리스트 생성 */
export function generateChecklist(
	facility?: Facility | null,
	child?: ChildProfile | null,
): EnrollmentChecklist {
	const categories: ChecklistCategory[] = [];

	// ── 1. 서류 준비 ──
	const docs: ChecklistItem[] = [
		{
			id: "doc_1",
			text: "입소신청서 작성",
			detail: "아이사랑포털(childcare.go.kr)에서 온라인 신청 가능",
			checked: false,
		},
		{
			id: "doc_2",
			text: "주민등록등본 발급",
			detail: "정부24에서 무료 발급 가능 (3개월 이내)",
			checked: false,
		},
		{
			id: "doc_3",
			text: "건강검진 결과표",
			detail: "영유아 건강검진 결과 (6개월 이내)",
			checked: false,
		},
		{
			id: "doc_4",
			text: "예방접종 증명서",
			detail: "질병관리청 예방접종도우미에서 발급",
			checked: false,
		},
	];

	// 맞벌이 가산점 서류
	if (facility?.type === "국공립") {
		docs.push(
			{
				id: "doc_5",
				text: "재직증명서 (양육자)",
				detail: "국공립 맞벌이 가산점에 필요",
				checked: false,
			},
			{
				id: "doc_6",
				text: "건강보험 자격득실 확인서",
				detail: "맞벌이 증빙용",
				checked: false,
			},
		);
	}

	categories.push({ title: "서류 준비", items: docs });

	// ── 2. 시설 확인 ──
	const facilityCheck: ChecklistItem[] = [
		{
			id: "fac_1",
			text: "시설 방문 예약",
			detail: facility
				? `${facility.name}에 전화 (${facility.phone || "전화번호 확인 필요"})`
				: "관심 시설에 전화로 방문 예약",
			checked: false,
		},
		{
			id: "fac_2",
			text: "CCTV 설치 여부 확인",
			checked: false,
		},
		{
			id: "fac_3",
			text: "급식 메뉴/알레르기 대응 확인",
			checked: false,
		},
		{
			id: "fac_4",
			text: "교사 대 아동 비율 확인",
			detail: "0세: 1:3, 1세: 1:5, 2세: 1:7, 3세 이상: 1:15 기준",
			checked: false,
		},
	];

	if (facility?.evaluationGrade) {
		facilityCheck.push({
			id: "fac_5",
			text: `평가인증 ${facility.evaluationGrade}등급 확인`,
			detail: "한국보육진흥원 홈페이지에서 상세 결과 확인 가능",
			checked: false,
		});
	}

	if (facility?.operatingHours?.extendedCare) {
		facilityCheck.push({
			id: "fac_6",
			text: "연장보육 신청 방법 확인",
			detail: `운영시간: ${facility.operatingHours.open}~${facility.operatingHours.close}`,
			checked: false,
		});
	}

	categories.push({ title: "시설 확인", items: facilityCheck });

	// ── 이동 체크리스트 ──
	const transferChecklist: TransferChecklistItem[] = [
		{
			id: "transfer_1",
			text: "새 시설 방문 예약",
			detail: "방문 일정과 가능 시간을 미리 확정해 둔 뒤 입소 계획을 세워요",
			checked: false,
		},
		{
			id: "transfer_2",
			text: "현 시설 퇴소 통보 (최소 1개월 전)",
			detail: "퇴소 사유와 시작일을 알려 계약 조건을 확인하세요",
			checked: false,
		},
		{
			id: "transfer_7",
			text: "현재 시설에 퇴소 예정 통보 (30일 전 권장)",
			checked: false,
		},
		{
			id: "transfer_8",
			text: "입소 예정 시설에 입소 확정 연락",
			checked: false,
		},
		{
			id: "transfer_9",
			text: "보육료 지원 변경 신청 (아이사랑카드)",
			checked: false,
		},
		{
			id: "transfer_3",
			text: "아이사랑포털 퇴소 처리",
			detail: "아이사랑 앱/웹에서 퇴소 신청을 마무리해요",
			checked: false,
		},
		{
			id: "transfer_4",
			text: "새 시설 입소 신청 서류 준비",
			detail: "주민센터 발급서류 및 예방접종 증명서를 미리 준비하세요",
			checked: false,
		},
		{
			id: "transfer_5",
			text: "입소 일정 조율 (공백 최소화)",
			detail: "현 시설 퇴소일과 새 시설 시작일이 이어지도록 조율해요",
			checked: false,
		},
		{
			id: "transfer_6",
			text: "아이 감정 케어 준비 (새 환경 적응)",
			detail: "낯선 환경 적응을 위한 루틴/안심 물건을 준비하면 좋아요",
			checked: false,
		},
	];
	categories.push({ title: "이동 체크리스트", items: transferChecklist });

	// ── 3. 아이 준비물 ──
	const childPrep: ChecklistItem[] = [
		{ id: "child_1", text: "낮잠 이불세트", checked: false },
		{ id: "child_2", text: "여벌 옷 2~3벌", checked: false },
		{
			id: "child_3",
			text: "실내화",
			detail: "이름표 부착",
			checked: false,
		},
		{ id: "child_4", text: "물티슈/기저귀 (영아)", checked: false },
		{ id: "child_5", text: "이름 라벨 스티커", checked: false },
	];

	// 나이 기반 추가
	if (child) {
		const ageMonths = getChildAgeMonths(child.birthDate);
		if (ageMonths < 18) {
			childPrep.push({
				id: "child_6",
				text: "젖병/분유/이유식 용기",
				detail: `${child.name} (${formatAge(ageMonths)}) 나이 기준`,
				checked: false,
			});
		}
		if (ageMonths >= 24) {
			childPrep.push({
				id: "child_7",
				text: "개인 컵/칫솔/치약",
				detail: `${child.name} (${formatAge(ageMonths)}) 나이 기준`,
				checked: false,
			});
		}
	}

	categories.push({ title: "아이 준비물", items: childPrep });

	// ── 4. 입소 전 확인 ──
	const preEnroll: ChecklistItem[] = [
		{
			id: "pre_1",
			text: "적응 프로그램 일정 확인",
			detail: "보통 1~2주 적응 기간 운영",
			checked: false,
		},
		{
			id: "pre_2",
			text: "등/하원 시간 및 방법 확인",
			checked: false,
		},
		{
			id: "pre_3",
			text: "비상연락처 제출",
			checked: false,
		},
		{
			id: "pre_4",
			text: "보육료 결제 방법 확인",
			detail: "아이행복카드 또는 국민행복카드 준비",
			checked: false,
		},
	];

	categories.push({ title: "입소 전 확인", items: preEnroll });

	return {
		title: facility
			? `${facility.name} 입소 준비 체크리스트`
			: "시설 입소 준비 체크리스트",
		facilityId: facility?.id,
		facilityName: facility?.name,
		categories,
		generatedAt: new Date().toISOString(),
	};
}
