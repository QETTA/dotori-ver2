/**
 * DS Card Tokens — 카드 / 서피스 스타일 레지스트리
 *
 * 모든 카드 컴포넌트는 이 토큰을 조합하여 사용:
 * import { DS_CARD } from '@/lib/design-system/card-tokens'
 */

export const DS_CARD = {
  /** 그림자 + 링 카드 — brand-tinted shadow (2026 Glassmorphism 2.0) */
  raised: {
    base: 'rounded-2xl bg-white shadow-[0_2px_8px_rgba(176,122,74,0.08),0_1px_3px_rgba(176,122,74,0.05)] ring-1 ring-dotori-100/70',
    dark: 'dark:bg-dotori-900 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:ring-dotori-800/60',
    hover: 'transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(176,122,74,0.12)]',
  },
  /** 플랫 배경 카드 — warm tint + subtle shadow for depth (통계, 퀵 액션 등) */
  flat: {
    base: 'rounded-xl bg-dotori-50/60 shadow-[0_1px_4px_rgba(176,122,74,0.06)] ring-1 ring-dotori-100/50',
    dark: 'dark:bg-white/[0.06] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)] dark:ring-dotori-800/40',
    hover: 'transition-all hover:shadow-[0_4px_16px_rgba(176,122,74,0.1)] hover:ring-dotori-200/60 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] dark:hover:ring-dotori-700/50',
  },
  /** 프리미엄 카드 — glassmorphism + 강한 brand shadow (히어로/프로필) */
  premium: {
    base: 'rounded-2xl bg-white/90 backdrop-blur-lg shadow-[0_8px_32px_rgba(176,122,74,0.08),0_2px_8px_rgba(176,122,74,0.04)] ring-1 ring-dotori-100/50',
    dark: 'dark:bg-dotori-900/90 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] dark:ring-dotori-800/40',
    hover: 'transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(176,122,74,0.12)]',
  },
  /** 좌측 상태 바 카드 (시설 카드 상태 표시) */
  accentBar: {
    base: 'rounded-2xl bg-white shadow-[0_2px_8px_rgba(176,122,74,0.06)] ring-1 ring-dotori-100/70 border-l-4',
    dark: 'dark:bg-dotori-900 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:ring-dotori-800/60',
  },
} as const

export type DsCardVariant = keyof typeof DS_CARD
