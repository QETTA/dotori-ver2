/**
 * DS Card Tokens — 카드 / 서피스 스타일 레지스트리
 *
 * 모든 카드 컴포넌트는 이 토큰을 조합하여 사용:
 * import { DS_CARD } from '@/lib/design-system/card-tokens'
 */

export const DS_CARD = {
  /** 그림자 + 링 카드 — brand-tinted shadow (2026 Glassmorphism 2.0) */
  raised: {
    base: 'rounded-2xl bg-white shadow-[0_2px_12px_rgba(176,122,74,0.12),0_1px_4px_rgba(176,122,74,0.08)] ring-1 ring-dotori-200/60',
    dark: 'dark:bg-dotori-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] dark:ring-dotori-800/60',
    hover: 'transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(176,122,74,0.18)] hover:ring-dotori-300/60',
  },
  /** 플랫 배경 카드 — warm tint + subtle shadow for depth (통계, 퀵 액션 등) */
  flat: {
    base: 'rounded-xl bg-dotori-50/70 shadow-[0_1px_6px_rgba(176,122,74,0.08)] ring-1 ring-dotori-200/40',
    dark: 'dark:bg-white/[0.07] dark:shadow-[0_1px_6px_rgba(0,0,0,0.25)] dark:ring-dotori-800/40',
    hover: 'transition-all hover:shadow-[0_4px_20px_rgba(176,122,74,0.14)] hover:ring-dotori-300/50 dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)] dark:hover:ring-dotori-700/50',
  },
  /** 프리미엄 카드 — glassmorphism + 강한 brand shadow (히어로/프로필) */
  premium: {
    base: 'rounded-2xl bg-white/92 backdrop-blur-xl shadow-[0_8px_40px_rgba(176,122,74,0.14),0_2px_10px_rgba(176,122,74,0.08)] ring-1 ring-dotori-200/50',
    dark: 'dark:bg-dotori-900/92 dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] dark:ring-dotori-800/40',
    hover: 'transition-all hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(176,122,74,0.18)]',
  },
  /** 좌측 상태 바 카드 (시설 카드 상태 표시) */
  accentBar: {
    base: 'rounded-2xl bg-white shadow-[0_2px_12px_rgba(176,122,74,0.10)] ring-1 ring-dotori-200/60 border-l-4',
    dark: 'dark:bg-dotori-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] dark:ring-dotori-800/60',
  },
} as const

export type DsCardVariant = keyof typeof DS_CARD
