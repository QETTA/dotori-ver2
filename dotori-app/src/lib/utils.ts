import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DS_FRESHNESS } from "@/lib/design-system/tokens";

/** Tailwind 클래스 병합 (clsx + tailwind-merge) */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** 상대 시간 포맷 (한국어) */
export function formatRelativeTime(dateString: string): string {
	const now = Date.now();
	const date = new Date(dateString).getTime();
	const diff = now - date;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return "방금 전";
	if (minutes < 60) return `${minutes}분 전`;
	if (hours < 24) return `${hours}시간 전`;
	if (days < 7) return `${days}일 전`;
	return new Date(dateString).toLocaleDateString("ko-KR", {
		month: "short",
		day: "numeric",
	});
}

/** 시설 상태 → 한국어 라벨 */
export function facilityStatusLabel(
	status: "available" | "waiting" | "full",
): string {
	const map = { available: "빈자리 있음", waiting: "대기 중", full: "마감" };
	return map[status];
}

/** 시설 유형 → Badge 색상 */
export function facilityTypeBadgeColor(
	type: string,
): "blue" | "amber" | "forest" | "purple" | "pink" | "zinc" {
	const map: Record<
		string,
		"blue" | "amber" | "forest" | "purple" | "pink" | "zinc"
	> = {
		국공립: "blue",
		민간: "amber",
		가정: "forest",
		직장: "purple",
		협동: "pink",
		사회복지: "zinc",
		국립유치원: "blue",
		공립유치원: "blue",
		사립유치원: "purple",
	};
	return map[type] ?? "zinc";
}

/** 데이터 신선도 → 색상 (DS_FRESHNESS가 단일 소스) */
export function freshnessColor(
	freshness: "realtime" | "recent" | "cached",
): string {
	return DS_FRESHNESS[freshness].base;
}

/** 거리(미터) → 한국어 포맷 */
export function formatDistance(meters: number): string {
	if (meters < 100) return `${Math.round(meters)}m`;
	if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
	if (meters < 10000) return `${(meters / 1000).toFixed(1)}km`;
	return `${Math.round(meters / 1000)}km`;
}

/** Community 카테고리 코드 → 한글 라벨 매핑 */
export const CATEGORY_LABELS: Record<string, string> = {
	review: "이동 후기",
	question: "유보통합",
	info: "시설 정보",
	feedback: "자유글",
};
