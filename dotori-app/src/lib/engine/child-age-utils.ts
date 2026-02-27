/**
 * 아이 나이 계산 공유 유틸
 *
 * nba-engine, why-engine, report-engine 등에서 공통으로 사용
 */

/** 생년월일 → 개월 수 계산 (기준일 지정 가능, 기본: 현재) */
export function getChildAgeMonths(birthDate: string, referenceDate?: Date): number {
	const birth = new Date(birthDate);
	if (Number.isNaN(birth.getTime())) return -1;
	const ref = referenceDate || new Date();
	return (
		(ref.getFullYear() - birth.getFullYear()) * 12 +
		(ref.getMonth() - birth.getMonth())
	);
}

/** 개월 수 → 한국어 나이 표시 */
export function formatAge(months: number): string {
	if (months < 12) return `${months}개월`;
	const years = Math.floor(months / 12);
	const rem = months % 12;
	return rem > 0 ? `만 ${years}세 ${rem}개월` : `만 ${years}세`;
}

/** 한국 어린이집 연령반 (만 나이 기준, 3월 1일 기준 연도) */
export function getClassAge(birthDate: string, targetYear?: number): {
	classAge: number;
	className: string;
} {
	const birth = new Date(birthDate);
	const now = new Date();
	const refYear = targetYear ?? (now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1);
	const classAge = refYear - birth.getFullYear();
	const names: Record<number, string> = {
		0: "영아반(0세)",
		1: "영아반(1세)",
		2: "영아반(2세)",
		3: "유아반(3세)",
		4: "유아반(4세)",
		5: "유아반(5세)",
	};
	return {
		classAge: Math.max(0, classAge),
		className: names[Math.max(0, Math.min(5, classAge))] || "취학 전",
	};
}
