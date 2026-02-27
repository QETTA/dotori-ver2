/**
 * DS Card Tokens — 카드 / 서피스 스타일 레지스트리
 *
 * 모든 카드 컴포넌트는 이 토큰을 조합하여 사용:
 * import { DS_CARD } from '@/lib/design-system/card-tokens'
 */

export const DS_CARD = {
  /** 그림자 + 링 카드 — dark edge (0.18) + warm glow */
  raised: {
    base: 'rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.18),0_8px_24px_rgba(176,122,74,0.16)] ring-1 ring-dotori-300/60',
    dark: 'dark:bg-dotori-900 dark:shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.5)] dark:ring-dotori-700/60',
    hover: 'transition-all hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.20),0_16px_40px_rgba(176,122,74,0.22)] hover:ring-dotori-400/60',
  },
  /** 플랫 배경 카드 — visible edge + warm tint */
  flat: {
    base: 'rounded-xl bg-dotori-50/70 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.14),0_4px_14px_rgba(176,122,74,0.12)] ring-1 ring-dotori-300/40',
    dark: 'dark:bg-white/[0.07] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.25),0_4px_14px_rgba(0,0,0,0.35)] dark:ring-dotori-700/40',
    hover: 'transition-all hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.16),0_10px_32px_rgba(176,122,74,0.18)] hover:ring-dotori-400/50 dark:hover:shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.3),0_10px_32px_rgba(0,0,0,0.45)] dark:hover:ring-dotori-600/50',
  },
  /** 프리미엄 카드 — glassmorphism + heavy double shadow */
  premium: {
    base: 'rounded-2xl bg-white/92 backdrop-blur-xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.18),0_16px_48px_rgba(176,122,74,0.20)] ring-1 ring-dotori-300/50',
    dark: 'dark:bg-dotori-900/92 dark:shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.4),0_16px_48px_rgba(0,0,0,0.6)] dark:ring-dotori-700/40',
    hover: 'transition-all hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_3px_8px_rgba(0,0,0,0.20),0_24px_60px_rgba(176,122,74,0.24)]',
  },
  /** 좌측 상태 바 카드 */
  accentBar: {
    base: 'rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.18),0_6px_20px_rgba(176,122,74,0.16)] ring-1 ring-dotori-300/60 border-l-4',
    dark: 'dark:bg-dotori-900 dark:shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.4),0_6px_20px_rgba(0,0,0,0.45)] dark:ring-dotori-700/60',
  },
  /** Liquid Glass 2.0 — Apple-inspired warm transparency */
  glass: {
    base: 'rounded-2xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_rgba(176,122,74,0.08)] ring-1 ring-white/20',
    dark: 'dark:bg-dotori-950/60 dark:backdrop-blur-2xl dark:border-dotori-800/30 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] dark:ring-dotori-800/20',
    hover: 'transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(176,122,74,0.12)] hover:ring-white/40',
  },
} as const

export type DsCardVariant = keyof typeof DS_CARD
