import type { Facility } from "@/types/dotori";

export type FacilityStatusBadge = {
	color: "forest" | "amber" | "red";
	label: string;
};

export function getTypeBadgeColor(
	type: string,
): "dotori" | "blue" | "amber" | "forest" | "pink" | "emerald" {
	switch (type) {
		case "국공립":
			return "blue";
		case "민간":
			return "amber";
		case "가정":
			return "forest";
		case "직장":
			return "pink";
		case "협동":
			return "emerald";
		case "사회복지":
			return "dotori";
		default:
			return "dotori";
	}
}

export function getQualityColor(score?: number): "forest" | "amber" | "dotori" {
	if (score == null) return "dotori";
	if (score >= 85) return "forest";
	if (score >= 70) return "amber";
	return "dotori";
}

export function getFacilityStatusBadge(
	status: Facility["status"],
): FacilityStatusBadge {
	switch (status) {
		case "available":
			return { color: "forest", label: "빈자리 있음" };
		case "waiting":
			return { color: "amber", label: "대기 중" };
		case "full":
		default:
			return { color: "red", label: "마감" };
	}
}

export function getCapacityProgressColor(
	occupancyRate: number,
): "bg-forest-500" | "bg-warning" | "bg-danger" {
	if (occupancyRate >= 90) return "bg-danger";
	if (occupancyRate >= 60) return "bg-warning";
	return "bg-forest-500";
}

export function getSafeNumber(value?: number | null): number | null {
	if (typeof value !== "number" || Number.isNaN(value)) return null;
	return value;
}

export function getFormattedVerifiedAt(
	verifiedAt: string | number | Date | null | undefined,
): string | null {
	if (!verifiedAt) return null;

	const date = verifiedAt instanceof Date ? verifiedAt : new Date(verifiedAt);
	if (Number.isNaN(date.getTime())) return null;

	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	return `${year}.${month}`;
}

export function getErrorMessage(error: unknown, fallback: string): string {
	if (typeof error === "string") return error.trim() || fallback;
	if (error instanceof Error) return error.message.trim() || fallback;
	return fallback;
}

export function getWaitingHintText(facility: Pick<Facility, "status" | "capacity">): string {
	if (facility.status === "available") {
		return "현재 입소 가능 상태로, 신청 후 곧바로 처리될 수 있어요.";
	}

	if (facility.capacity.waiting <= 0) {
		return "현재 대기 인원이 없어 입소까지 빠르게 마감될 수 있어요.";
	}

	if (facility.capacity.waiting <= 5) {
		return `현재 대기 ${facility.capacity.waiting}명이며 보통 1~3주 내로 처리될 수 있어요.`;
	}

	return `현재 대기 ${facility.capacity.waiting}명, 입소까지 3~8주가량 소요될 수 있어요.`;
}
