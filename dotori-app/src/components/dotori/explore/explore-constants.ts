export const EXPLORE_TYPE_FILTERS = [
	"국공립",
	"민간",
	"가정",
	"직장",
	"협동",
	"사회복지",
	"국립유치원",
	"공립유치원",
	"사립유치원",
] as const;

export type ExploreSortKey = "distance" | "rating" | "capacity";

export const EXPLORE_SORT_OPTIONS: ReadonlyArray<{
	key: ExploreSortKey;
	label: string;
}> = [
	{ key: "distance", label: "거리순" },
	{ key: "rating", label: "평점순" },
	{ key: "capacity", label: "정원순" },
];

export const RECENT_SEARCHES_KEY = "dotori_recent_searches";
export const MAX_RECENT_SEARCHES = 5;
export const SEARCH_DEBOUNCE_MS = 300;
export const FACILITY_LOAD_TIMEOUT_MS = 8000;

export const MOVE_SCENARIO_CHIPS = [
	"반편성 불만",
	"교사 교체",
	"국공립 당첨",
	"이사 예정",
	"설명회 실망",
	"빈자리 급구",
] as const;

export const POPULAR_SEARCHES = [
	"반편성 불만",
	"설명회 실망",
	"빈자리 급구",
	"교사 교체",
	"국공립 당첨",
	"이사 예정",
	"국공립",
	"강남구",
	"연장보육",
	"통학버스",
	"영아전문",
] as const;
