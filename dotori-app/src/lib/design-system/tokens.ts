/**
 * Dotori Design System — Token Registry
 * Brand Kit v2.2 · Tailwind CSS 4
 *
 * 이 파일이 단일 진실 소스(single source of truth)입니다.
 * 컴포넌트에서 직접 색상/클래스 문자열을 하드코딩하지 마세요.
 */

// ─────────────────────────────────────────────
// 버튼 변형 (기존 유지)
// ─────────────────────────────────────────────

export type DsButtonVariant = "primary" | "secondary" | "ghost";
export type DsButtonTone = "dotori" | "forest" | "amber";

export const DS_BUTTON_PRIMARY_COLOR = {
	dotori: "dotori",
	forest: "green",
	amber: "amber",
} as const;

export const DS_BUTTON_TONE_CLASS: Record<DsButtonVariant, Record<DsButtonTone, string>> = {
	primary: {
		dotori: "",
		forest: "",
		amber: "",
	},
	secondary: {
		dotori: "border-dotori-300 text-dotori-700 hover:bg-dotori-50",
		forest: "border-forest-300 text-forest-700 hover:bg-forest-50",
		amber: "border-amber-300 text-amber-700 hover:bg-amber-50",
	},
	ghost: {
		dotori: "text-dotori-700 hover:bg-dotori-50",
		forest: "text-forest-700 hover:bg-forest-50",
		amber: "text-amber-700 hover:bg-amber-50",
	},
};

// ─────────────────────────────────────────────
// 색상 팔레트 (HEX — globals.css @theme과 동기화)
// ─────────────────────────────────────────────

export const DS_COLORS = {
	dotori: {
		50:  "#faf7f2",
		100: "#f5ede0",
		200: "#e8d5be",
		300: "#d4b48e",
		400: "#c8956a", // ★ 브랜드 메인
		500: "#b07a4a", // 텍스트 안전 (WCAG AA 4.1:1)
		600: "#96633a",
		700: "#7a4e30",
		800: "#5a3a24",
		900: "#2d2418", // ★ 다크 텍스트
		950: "#1a1510",
	},
	forest: {
		50:  "#e8f5e4",
		100: "#c8e4c0",
		200: "#a0d098",
		300: "#78bc70",
		400: "#6a9a60",
		500: "#4a7a42", // ★ 성공 메인
		600: "#3a6034",
		700: "#2e4c2a",
		800: "#223820",
		900: "#162416",
	},
	semantic: {
		success: "#4a7a42", // = forest-500
		warning: "#d4a030",
		danger:  "#c44040",
		info:    "#4a80b0",
		blush:   "#d4907a",
	},
} as const;

// ─────────────────────────────────────────────
// 타이포 스케일 (globals.css @theme의 --text-* 토큰과 대응)
// ─────────────────────────────────────────────

export const DS_TYPOGRAPHY = {
	/** 32px / lh 1.3 / fw 900 / ls -0.5px — 페이지 메인 타이틀 */
	display: "text-display",
	/** 24px / lh 1.35 / fw 800 / ls -0.3px — 섹션 헤딩 */
	h1: "text-h1",
	/** 20px / lh 1.4 / fw 700 — 카드 제목 */
	h2: "text-h2",
	/** 16px / lh 1.5 / fw 700 — 서브 헤딩 */
	h3: "text-h3",
	/** 15px / lh 1.6 / fw 400 — 본문 */
	body: "text-body",
	/** 13px / lh 1.6 / fw 400 — 보조 텍스트 */
	bodySm: "text-body-sm",
	/** 11px / lh 1.5 / fw 400 / ls 0.5px — 캡션 */
	caption: "text-caption",
	/** 10px / lh 1.4 / fw 700 / ls 1px — 배지/레이블 */
	label: "text-label",
} as const;

// ─────────────────────────────────────────────
// 유리 효과 (CSS utility 클래스 — globals.css @utility와 대응)
// ─────────────────────────────────────────────

export const DS_GLASS = {
	/** 헤더/네비게이션 바 — glass-header (다크모드 포함) */
	HEADER:  "glass-header",
	/** 플로팅 바텀 내비 — glass-float (다크모드 포함) */
	FLOAT:   "glass-float",
	/** 바텀시트/모달 — glass-sheet (다크모드 포함) */
	SHEET:   "glass-sheet",
	/** 플로팅 카드 — glass-card (다크모드 포함) */
	CARD:    "glass-card",
	/** 배경 오버레이 — glass-overlay (다크모드 포함) */
	OVERLAY: "glass-overlay",
} as const;

// ─────────────────────────────────────────────
// 앱 레이아웃 유틸리티 (CSS utility — globals.css @utility와 대응)
// ─────────────────────────────────────────────

export const DS_LAYOUT = {
	/** 메인 페이지 컨테이너 — 바텀 탭 높이 + safe-area 보정 */
	PAGE_SHELL:    "app-page-shell",
	/** 스크롤 영역 */
	SCROLL_REGION: "app-scroll-region",
	/** max-w-md 중앙 정렬 콘텐츠 래퍼 */
	CONTENT_SHELL: "app-content-shell",
	/** 소프트 그라데이션 카드 */
	CARD_SOFT:     "app-card-soft",
} as const;

// ─────────────────────────────────────────────
// 시설 상태 색상 (FacilityCard 공유)
// ─────────────────────────────────────────────

export const DS_STATUS = {
	available: {
		label:  "TO 있음",
		dot:    "bg-forest-500",
		pill:   "bg-forest-100 text-forest-900 dark:bg-forest-900/20 dark:text-forest-100",
		border: "border-l-4 border-l-forest-500/80",
	},
	waiting: {
		label:  "대기",
		dot:    "bg-warning",
		pill:   "bg-dotori-100 text-dotori-900 dark:bg-dotori-800 dark:text-dotori-50",
		border: "border-l-4 border-l-warning/80",
	},
	full: {
		label:  "마감",
		dot:    "bg-danger",
		pill:   "bg-dotori-100 text-dotori-900 dark:bg-dotori-800 dark:text-dotori-50",
		border: "border-l-4 border-l-danger/80",
	},
} as const;

export type DsStatus = keyof typeof DS_STATUS;

// ─────────────────────────────────────────────
// AI 감성 스타일 (AiBriefingCard 공유 — CSS 문자열만, 아이콘은 컴포넌트 유지)
// ─────────────────────────────────────────────

export const DS_SENTIMENT = {
	positive: {
		label:     "긍정",
		wrap:      "bg-forest-50 ring-forest-200 dark:bg-forest-900/20 dark:ring-forest-700/40",
		iconClass: "text-forest-700 dark:text-forest-200",
	},
	neutral: {
		label:     "중립",
		wrap:      "bg-dotori-50 ring-dotori-200 dark:bg-dotori-900/40 dark:ring-dotori-700/40",
		iconClass: "text-dotori-700 dark:text-dotori-100",
	},
	caution: {
		label:     "주의",
		wrap:      "bg-dotori-100/60 ring-warning/35 dark:bg-dotori-900/40",
		iconClass: "text-warning",
	},
} as const;

export type DsSentiment = keyof typeof DS_SENTIMENT;

// ─────────────────────────────────────────────
// 데이터 신선도 색상 (SourceChip / freshnessColor 단일 소스)
// ─────────────────────────────────────────────

export const DS_FRESHNESS = {
	realtime: {
		/** light + dark base — freshnessColor() 반환값 */
		base: "text-forest-600 bg-forest-50",
		dark: "dark:bg-forest-900/20 dark:text-forest-200",
		dot:  "bg-forest-500 motion-safe:animate-pulse",
	},
	recent: {
		base: "text-amber-700 bg-amber-50",
		dark: "dark:bg-amber-900/20 dark:text-amber-200",
		dot:  "bg-amber-500 dark:bg-amber-400",
	},
	cached: {
		base: "text-dotori-500 bg-dotori-100",
		dark: "dark:bg-dotori-800 dark:text-dotori-100",
		dot:  "bg-dotori-300 dark:bg-dotori-600",
	},
} as const;

export type DsFreshness = keyof typeof DS_FRESHNESS;
