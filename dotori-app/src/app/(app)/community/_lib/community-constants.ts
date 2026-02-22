import type { CommunityPost } from "@/types/dotori";

export const tabs = [
	"전체",
	"어린이집 이동",
	"입소 고민",
	"정보 공유",
	"자유 토론",
] as const;

export type TabLabel = (typeof tabs)[number];

export const tabToCategoryParam: Record<TabLabel, CommunityPost["category"] | ""> = {
	전체: "",
	"어린이집 이동": "question",
	"입소 고민": "review",
	"정보 공유": "info",
	"자유 토론": "feedback",
};

export const categoryLabel: Record<CommunityPost["category"], string> = {
	feedback: "자유 토론",
	info: "정보 공유",
	review: "입소 고민",
	question: "어린이집 이동",
};

export const categoryStyle: Record<CommunityPost["category"], string> = {
	feedback: "bg-forest-50 text-forest-700",
	info: "bg-dotori-100 text-dotori-700",
	review: "bg-forest-100 text-forest-700",
	question: "bg-dotori-100 text-dotori-700",
};

export const facilityTypes = new Set([
	"국공립",
	"민간",
	"가정",
	"직장",
	"협동",
	"사회복지",
]);

export const HOT_POST_THRESHOLD = 24;

export const ANONYMOUS_BANNER_STYLES = [
	{
		bg: "bg-dotori-100",
		ring: "ring-dotori-200",
		icon: "text-dotori-700",
	},
	{
		bg: "bg-forest-100",
		ring: "ring-forest-200",
		icon: "text-forest-700",
	},
	{
		bg: "bg-dotori-200",
		ring: "ring-dotori-300",
		icon: "text-dotori-800",
	},
	{
		bg: "bg-forest-200",
		ring: "ring-forest-300",
		icon: "text-forest-800",
	},
] as const;
