export function buildResultLabel({
	selectedSido,
	selectedSigungu,
	selectedTypes,
	total,
	isLoading,
}: {
	selectedSido: string;
	selectedSigungu: string;
	selectedTypes: string[];
	total: number;
	isLoading: boolean;
}): string {
	if (isLoading) return "검색 중...";

	const district = selectedSigungu || selectedSido || "전국";
	const typeLabel = selectedTypes.length === 1 ? `${selectedTypes[0]} ` : "";

	return `${district} ${typeLabel}어린이집 ${total.toLocaleString()}개`;
}

export function isValidFacilityType(
	value: string,
	allowed: readonly string[],
): value is string {
	return allowed.includes(value);
}
