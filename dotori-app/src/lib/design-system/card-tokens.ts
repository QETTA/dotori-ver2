/**
 * DS Card Tokens — 카드 / 서피스 스타일 레지스트리
 *
 * 모든 카드 컴포넌트는 이 토큰을 조합하여 사용:
 * import { DS_CARD } from '@/lib/design-system/card-tokens'
 */

export const DS_CARD = {
  /** 그림자 + 링 카드 — brand-tinted shadow (2026 Glassmorphism 2.0) */
  raised: {
    base: 'rounded-2xl bg-white shadow-[0_4px_20px_rgba(176,122,74,0.22),0_1px_6px_rgba(176,122,74,0.14)] ring-1 ring-dotori-300/60',
    dark: 'dark:bg-dotori-900 dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] dark:ring-dotori-700/60',
    hover: 'transition-all hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(176,122,74,0.28)] hover:ring-dotori-400/60',
  },
  /** 플랫 배경 카드 — warm tint + visible shadow for depth (통계, 퀵 액션 등) */
  flat: {
    base: 'rounded-xl bg-dotori-50/70 shadow-[0_2px_10px_rgba(176,122,74,0.16)] ring-1 ring-dotori-300/40',
    dark: 'dark:bg-white/[0.07] dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)] dark:ring-dotori-700/40',
    hover: 'transition-all hover:shadow-[0_8px_28px_rgba(176,122,74,0.24)] hover:ring-dotori-400/50 dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.45)] dark:hover:ring-dotori-600/50',
  },
  /** 프리미엄 카드 — glassmorphism + 강한 brand shadow (히어로/프로필) */
  premium: {
    base: 'rounded-2xl bg-white/92 backdrop-blur-xl shadow-[0_12px_48px_rgba(176,122,74,0.24),0_4px_14px_rgba(176,122,74,0.14)] ring-1 ring-dotori-300/50',
    dark: 'dark:bg-dotori-900/92 dark:shadow-[0_12px_48px_rgba(0,0,0,0.6)] dark:ring-dotori-700/40',
    hover: 'transition-all hover:-translate-y-1.5 hover:shadow-[0_20px_56px_rgba(176,122,74,0.30)]',
  },
  /** 좌측 상태 바 카드 (시설 카드 상태 표시) */
  accentBar: {
    base: 'rounded-2xl bg-white shadow-[0_4px_18px_rgba(176,122,74,0.20)] ring-1 ring-dotori-300/60 border-l-4',
    dark: 'dark:bg-dotori-900 dark:shadow-[0_4px_18px_rgba(0,0,0,0.45)] dark:ring-dotori-700/60',
  },
} as const

export type DsCardVariant = keyof typeof DS_CARD
