export function calculateAge(birthDate: string) {
	const birth = new Date(birthDate);
	const now = new Date();
	const months =
		(now.getFullYear() - birth.getFullYear()) * 12 +
		(now.getMonth() - birth.getMonth());
	if (months < 12) return `${months}개월`;
	const years = Math.floor(months / 12);
	const rem = months % 12;
	return rem > 0 ? `${years}세 ${rem}개월` : `${years}세`;
}

export function getBirthYear(birthDate: string) {
	const birth = new Date(birthDate);
	const year = birth.getFullYear();
	return Number.isNaN(year) ? "출생년도 미확인" : `${year}년생`;
}

export function formatRegion(region: {
	sido: string;
	sigungu: string;
	dong?: string;
}) {
	return [region.sido, region.sigungu, region.dong].filter(Boolean).join(" ") || "지역 미설정";
}
