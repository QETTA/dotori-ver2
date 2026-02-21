/**
 * 서류 제출 체크리스트 엔진
 *
 * 어린이집 유형 + 아이 프로필 기반으로 입소 신청 서류 체크리스트 생성
 * 참조: 아이사랑 포털 입소 안내 + 보건복지부 지침
 */

import type { ChecklistBlock } from "@/types/dotori";

interface ChecklistInput {
	facilityType: "국공립" | "민간" | "가정" | "직장" | "협동" | "사회복지";
	childBirthDate?: string; // YYYY-MM-DD
	hasMultipleChildren?: boolean; // 다자녀
	isDualIncome?: boolean; // 맞벌이
	isSingleParent?: boolean; // 한부모
	hasDisability?: boolean; // 장애
	region?: string; // 시군구
}

interface ChecklistItem {
	id: string;
	text: string;
	detail?: string;
	checked: boolean;
	required: boolean;
}

interface ChecklistCategory {
	title: string;
	items: ChecklistItem[];
}

/* ─── 기본 서류 (모든 유형 공통) ─── */

const BASE_DOCS: ChecklistItem[] = [
	{
		id: "base-1",
		text: "어린이집 입소신청서",
		detail: "아이사랑 포털 또는 어린이집에서 양식 제공",
		checked: false,
		required: true,
	},
	{
		id: "base-2",
		text: "주민등록등본",
		detail: "발급일 1개월 이내, 주민센터/정부24에서 발급",
		checked: false,
		required: true,
	},
	{
		id: "base-3",
		text: "건강보험자격확인서",
		detail: "국민건강보험공단 사이트에서 발급",
		checked: false,
		required: true,
	},
	{
		id: "base-4",
		text: "예방접종증명서",
		detail: "질병관리청 예방접종도우미에서 발급",
		checked: false,
		required: true,
	},
	{
		id: "base-5",
		text: "건강검진 결과통보서 (영유아)",
		detail: "국민건강보험공단 건강검진 대상자 확인",
		checked: false,
		required: true,
	},
];

/* ─── 유형별 추가 서류 ─── */

const TYPE_SPECIFIC_DOCS: Record<string, ChecklistItem[]> = {
	국공립: [
		{
			id: "public-1",
			text: "소득증빙서류",
			detail: "건강보험료 납부확인서 또는 소득금액증명원",
			checked: false,
			required: true,
		},
		{
			id: "public-2",
			text: "보육료 지원 결정 통지서",
			detail: "복지로에서 사전 신청 필요 (아동수당 연계)",
			checked: false,
			required: true,
		},
	],
	민간: [
		{
			id: "private-1",
			text: "보육료 지원 결정 통지서",
			detail: "복지로에서 사전 신청 (양육수당 → 보육료 전환)",
			checked: false,
			required: true,
		},
	],
	가정: [
		{
			id: "home-1",
			text: "보육료 지원 결정 통지서",
			detail: "복지로에서 사전 신청",
			checked: false,
			required: true,
		},
	],
	직장: [
		{
			id: "work-1",
			text: "재직증명서",
			detail: "회사 인사부서에서 발급 (3개월 이내)",
			checked: false,
			required: true,
		},
		{
			id: "work-2",
			text: "사업자등록증 사본 (자영업)",
			detail: "자영업자의 경우 사업자등록증으로 대체",
			checked: false,
			required: false,
		},
	],
	협동: [
		{
			id: "coop-1",
			text: "협동조합 가입신청서",
			detail: "해당 어린이집 협동조합에서 양식 제공",
			checked: false,
			required: true,
		},
		{
			id: "coop-2",
			text: "출자금 납부 확인서",
			detail: "조합비/출자금 규모는 각 조합별 상이",
			checked: false,
			required: true,
		},
	],
	사회복지: [
		{
			id: "welfare-1",
			text: "보육료 지원 결정 통지서",
			detail: "복지로에서 사전 신청",
			checked: false,
			required: true,
		},
	],
};

/* ─── 가점 서류 (우선순위 증빙) ─── */

function getPriorityDocs(input: ChecklistInput): ChecklistItem[] {
	const docs: ChecklistItem[] = [];

	if (input.hasMultipleChildren) {
		docs.push({
			id: "priority-multi",
			text: "다자녀 증빙 (가족관계증명서)",
			detail: "자녀 3명 이상 시 입소 우선순위 가점",
			checked: false,
			required: true,
		});
	}

	if (input.isDualIncome) {
		docs.push(
			{
				id: "priority-dual-1",
				text: "맞벌이 증빙 (부 재직증명서)",
				detail: "3개월 이내 발급, 4대보험 가입 확인",
				checked: false,
				required: true,
			},
			{
				id: "priority-dual-2",
				text: "맞벌이 증빙 (모 재직증명서)",
				detail: "3개월 이내 발급, 4대보험 가입 확인",
				checked: false,
				required: true,
			},
		);
	}

	if (input.isSingleParent) {
		docs.push({
			id: "priority-single",
			text: "한부모가족 증명서",
			detail: "주민센터/복지로에서 발급 (1순위 입소 대상)",
			checked: false,
			required: true,
		});
	}

	if (input.hasDisability) {
		docs.push({
			id: "priority-disability",
			text: "장애인 등록증 또는 진단서",
			detail: "아동 또는 보호자 장애 증빙 (1순위 입소 대상)",
			checked: false,
			required: true,
		});
	}

	return docs;
}

/* ─── 연령반 산정 ─── */

export function calculateAgeClass(birthDate: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
	if (!match) return "만0세반";

	const [, yearText, monthText, dayText] = match;
	const birthYear = Number.parseInt(yearText, 10);
	const birthMonth = Number.parseInt(monthText, 10) - 1;
	const birthDay = Number.parseInt(dayText, 10);

	if (
		Number.isNaN(birthYear) ||
		Number.isNaN(birthMonth) ||
		Number.isNaN(birthDay)
	) {
		return "만0세반";
	}

	const now = new Date();
	const birth = new Date(birthYear, birthMonth, birthDay);
	if (
		birth.getFullYear() !== birthYear ||
		birth.getMonth() !== birthMonth ||
		birth.getDate() !== birthDay
	) {
		return "만0세반";
	}

	// 만 나이 기준 (당해 3월 1일 기준)
	const cutoff = new Date(now.getFullYear(), 2, 1);
	let age = cutoff.getFullYear() - birth.getFullYear();
	if (
		birth.getMonth() > cutoff.getMonth() ||
		(birth.getMonth() === cutoff.getMonth() && birth.getDate() > cutoff.getDate())
	) {
		age -= 1;
	}

	if (age <= 0) return "만0세반";
	if (age === 1) return "만1세반";
	if (age === 2) return "만2세반";
	if (age === 3) return "만3세반";
	if (age === 4) return "만4세반";
	return "만5세반";
}

/* ─── 메인 체크리스트 생성 ─── */

export function generateChecklist(input: ChecklistInput): ChecklistBlock {
	const categories: ChecklistCategory[] = [];

	// 1. 기본 서류
	categories.push({
		title: "기본 서류",
		items: BASE_DOCS.map((d) => ({ ...d })),
	});

	// 2. 유형별 추가 서류
	const typeDocs = TYPE_SPECIFIC_DOCS[input.facilityType];
	if (typeDocs && typeDocs.length > 0) {
		categories.push({
			title: `${input.facilityType} 어린이집 추가 서류`,
			items: typeDocs.map((d) => ({ ...d })),
		});
	}

	// 3. 가점 서류 (해당 시)
	const priorityDocs = getPriorityDocs(input);
	if (priorityDocs.length > 0) {
		categories.push({
			title: "우선순위 가점 서류",
			items: priorityDocs,
		});
	}

	// 4. 연령반 정보 (생년월일 있을 때)
	if (input.childBirthDate) {
		const ageClass = calculateAgeClass(input.childBirthDate);
		categories.push({
			title: "참고 정보",
			items: [
				{
					id: "info-age",
					text: `배정 연령반: ${ageClass}`,
					detail: "3월 1일 기준 만 나이로 산정",
					checked: true,
					required: false,
				},
			],
		});
	}

	return {
		type: "checklist",
		title: `${input.facilityType} 어린이집 입소 서류 체크리스트`,
		categories: categories.map((cat) => ({
			title: cat.title,
			items: cat.items.map((item) => ({
				id: item.id,
				text: item.text,
				detail: item.detail,
				checked: item.checked,
				required: item.required,
			})),
		})),
	};
}

