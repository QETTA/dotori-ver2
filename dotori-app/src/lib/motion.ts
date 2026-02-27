/**
 * 도토리 모션 프리셋 — 2026 UX 표준
 * motion/react v12 기반, 전 컴포넌트 공유
 *
 * 사용법:
 *   import { fadeUp, stagger, spring, glass } from "@/lib/motion";
 *   <motion.div {...fadeUp}>
 *   <motion.ul {...stagger.container}> <motion.li {...stagger.item}>
 */
import type { Variants, Transition } from "motion/react";

/* ── Easing ── */
export const ease = {
	/** 기본 ease-out (페이지 전환, 카드 진입) */
	out: [0.25, 0.1, 0.25, 1] as const,
	/** 빠른 ease-out (칩, 토글) */
	snap: [0.32, 0.72, 0, 1] as const,
	/** 부드러운 감속 (모달, 바텀시트) */
	gentle: [0.16, 1, 0.3, 1] as const,
} as const;

/* ── Spring 프리셋 ── */
export const spring = {
	/** 카드 탭/호버 (FacilityCard 등) */
	card: { type: "spring" as const, stiffness: 360, damping: 30 },
	/** 칩/태그 선택 (SourceChip 등) */
	chip: { type: "spring" as const, stiffness: 360, damping: 28 },
	/** 바텀시트 드래그 */
	sheet: { type: "spring" as const, stiffness: 300, damping: 30 },
	/** 레이아웃 시프트 */
	layout: { type: "spring" as const, stiffness: 300, damping: 30 },
} as const;

/* ── Fade + Slide 프리셋 ── */
export const fadeUp = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.3, ease: ease.out } satisfies Transition,
} as const;

export const fadeIn = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	transition: { duration: 0.25, ease: ease.out } satisfies Transition,
} as const;

export const fadeScale = {
	initial: { opacity: 0, scale: 0.985 },
	animate: { opacity: 1, scale: 1 },
	transition: { duration: 0.2, ease: ease.out } satisfies Transition,
} as const;

/* ── 페이지 전환 (PageTransition 호환) ── */
export const pageTransition = {
	initial: { opacity: 0, y: 6 },
	target: { opacity: 1, y: 0 },
	transition: { duration: 0.25, ease: ease.out } satisfies Transition,
} as const;

/* ── Stagger (리스트 순차 등장) ── */
export const stagger = {
	/** 부모 컨테이너에 적용 */
	container: {
		variants: {
			hidden: { opacity: 1 },
			show: {
				opacity: 1,
				transition: { staggerChildren: 0.06 },
			},
		} satisfies Variants,
		initial: "hidden" as const,
		animate: "show" as const,
	},
	/** 자식 아이템에 적용 */
	item: {
		variants: {
			hidden: { opacity: 0, y: 6 },
			show: {
				opacity: 1,
				y: 0,
				transition: { ease: "easeOut", duration: 0.24 },
			},
		} satisfies Variants,
	},
	/** 빠른 스태거 (검색 결과 등) */
	fast: {
		container: {
			variants: {
				hidden: { opacity: 1 },
				show: {
					opacity: 1,
					transition: { staggerChildren: 0.04 },
				},
			} satisfies Variants,
			initial: "hidden" as const,
			animate: "show" as const,
		},
		item: {
			variants: {
				hidden: { opacity: 0, y: 4 },
				show: {
					opacity: 1,
					y: 0,
					transition: { ease: "easeOut", duration: 0.18 },
				},
			} satisfies Variants,
		},
	},
} as const;

/* ── 벤토 그리드 (더 드라마틱한 진입) ── */
export const bento = {
	container: {
		variants: {
			hidden: { opacity: 1 },
			show: {
				opacity: 1,
				transition: { staggerChildren: 0.08, delayChildren: 0.1 },
			},
		} satisfies Variants,
		initial: "hidden" as const,
		animate: "show" as const,
	},
	item: {
		variants: {
			hidden: { opacity: 0, y: 12, scale: 0.97 },
			show: {
				opacity: 1,
				y: 0,
				scale: 1,
				transition: { type: "spring" as const, stiffness: 340, damping: 28 },
			},
		} satisfies Variants,
	},
} as const;

/* ── 인터랙션 (whileHover, whileTap) ── */
export const tap = {
	/** 카드 탭 피드백 */
	card: {
		whileHover: { scale: 1.01 },
		whileTap: { scale: 0.985 },
		transition: spring.card,
	},
	/** 버튼 탭 피드백 */
	button: {
		whileTap: { scale: 0.98 },
		transition: spring.chip,
	},
	/** 칩/태그 탭 */
	chip: {
		whileTap: { scale: 0.975 },
		transition: spring.chip,
	},
} as const;

/* ── 스켈레톤 → 콘텐츠 전환 (AnimatePresence) ── */
export const morphTransition = {
	exit: { opacity: 0, scale: 0.98 },
	transition: { duration: 0.15, ease: ease.out } satisfies Transition,
} as const;

/* ── 글래스 모피즘 (Tailwind 클래스 조합) ── */
export const glass = {
	/** 헤더/내비게이션 바 */
	header: "bg-white/80 backdrop-blur-lg backdrop-saturate-150 border-b border-dotori-100/50",
	/** 바텀시트/모달 오버레이 */
	sheet: "bg-white/90 backdrop-blur-xl backdrop-saturate-150 rounded-t-2xl",
	/** 플로팅 카드 */
	card: "bg-white/85 backdrop-blur-md backdrop-saturate-125 shadow-lg rounded-2xl",
	/** 오버레이 배경 (어두운) */
	overlay: "bg-dotori-900/40 backdrop-blur-sm",
} as const;

/* ── Scroll-triggered FadeIn (Studio whileInView pattern) ── */
export const scrollFadeIn = {
	initial: { opacity: 0, y: 16 },
	whileInView: { opacity: 1, y: 0 },
	viewport: { once: true, margin: "-80px" },
	transition: { duration: 0.5, ease: ease.gentle } satisfies Transition,
} as const;

export const scrollStagger = {
	container: {
		initial: "hidden" as const,
		whileInView: "show" as const,
		viewport: { once: true, margin: "-60px" },
		variants: {
			hidden: { opacity: 1 },
			show: {
				opacity: 1,
				transition: { staggerChildren: 0.12 },
			},
		} satisfies Variants,
	},
	item: {
		variants: {
			hidden: { opacity: 0, y: 12 },
			show: {
				opacity: 1,
				y: 0,
				transition: { duration: 0.4, ease: "easeOut" },
			},
		} satisfies Variants,
	},
} as const;

/* ── Hover Lift (Radiant BentoCard pattern) ── */
export const hoverLift = {
	whileHover: { y: -3, scale: 1.015 },
	whileTap: { scale: 0.985 },
	transition: { type: "spring" as const, stiffness: 300, damping: 24 },
} as const;

/* ── Swipe Card (drag x + exit) ── */
export const swipeCard = {
	drag: "x" as const,
	dragConstraints: { left: 0, right: 0 },
	dragElastic: 0.7,
	exitTransition: { duration: 0.3, ease: ease.out } satisfies Transition,
	threshold: 100,
} as const;

/* ── Pull to Refresh (drag y + rotate indicator) ── */
export const pullToRefresh = {
	drag: "y" as const,
	dragConstraints: { top: 0, bottom: 80 },
	dragElastic: 0.5,
	threshold: 60,
	transition: { type: "spring" as const, stiffness: 300, damping: 26 },
} as const;

/* ── Number Tick (AnimatePresence popLayout slide) ── */
export const numberTick = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -12 },
	transition: { duration: 0.2, ease: ease.snap } satisfies Transition,
} as const;

/* ── Chart Reveal (whileInView pathLength + stagger) ── */
export const chartReveal = {
	initial: { pathLength: 0, opacity: 0 },
	whileInView: { pathLength: 1, opacity: 1 },
	viewport: { once: true, margin: "-60px" },
	transition: { type: "spring" as const, stiffness: 40, damping: 18, delay: 0.15 },
} as const;

/* ── Sheet Drag (bottom sheet snap points) ── */
export const sheetDrag = {
	drag: "y" as const,
	dragConstraints: { top: 0, bottom: 0 },
	dragElastic: 0.4,
	transition: spring.sheet,
} as const;

/* ── Pulse (트렌딩 아이콘, 알림 배지) ── */
export const pulse = {
	animate: { scale: [1, 1.08, 1] as number[] },
	transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
};

/* ── Glow Card (Chat 빈 상태 아이콘 spring 진입) ── */
export const glowCard = {
	initial: { scale: 0.9, opacity: 0 },
	animate: { scale: 1, opacity: 1 },
	transition: { type: "spring" as const, stiffness: 200, damping: 15 },
} as const;

/* ── Sticky Reveal (StickyBottomCTA entry) ── */
export const stickyReveal = {
	initial: { y: 100, opacity: 0 },
	animate: { y: 0, opacity: 1 },
	transition: {
		type: "spring" as const,
		stiffness: 260,
		damping: 28,
		delay: 0.3,
	},
} as const;

/* ── Gradient Text (className utility) — maximum contrast on cream bg ── */
export const gradientText =
	"bg-gradient-to-r from-dotori-950 via-dotori-600 to-amber-500 bg-clip-text text-transparent dark:from-dotori-200 dark:via-dotori-400 dark:to-amber-400";

/** Gradient text with stronger range for hero sections */
export const gradientTextHero =
	"bg-gradient-to-r from-dotori-950 via-amber-700 to-amber-400 bg-clip-text text-transparent dark:from-dotori-200 dark:via-amber-400 dark:to-amber-300";

/* ── Reduced Motion 유틸 ── */
export const noMotion = { duration: 0 } satisfies Transition;
