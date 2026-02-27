/**
 * Dotori Design System — Token Registry
 * 배포 기준으로 실제 사용 토큰만 유지합니다.
 */

export type DsButtonVariant = 'primary' | 'secondary' | 'ghost'
export type DsButtonTone = 'dotori' | 'forest' | 'amber'

export const DS_BUTTON_PRIMARY_COLOR = {
  dotori: 'dotori',
  forest: 'green',
  amber: 'amber',
} as const

export const DS_BUTTON_TONE_CLASS: Record<DsButtonVariant, Record<DsButtonTone, string>> = {
  primary: {
    dotori: '',
    forest: '',
    amber: '',
  },
  secondary: {
    dotori: 'border-dotori-300 text-dotori-700 hover:bg-dotori-50',
    forest: 'border-forest-300 text-forest-700 hover:bg-forest-50',
    amber: 'border-amber-300 text-amber-700 hover:bg-amber-50',
  },
  ghost: {
    dotori: 'text-dotori-700 hover:bg-dotori-50',
    forest: 'text-forest-700 hover:bg-forest-50',
    amber: 'text-amber-700 hover:bg-amber-50',
  },
}

export const DS_TYPOGRAPHY = {
  display: 'text-display',
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  body: 'text-body',
  bodySm: 'text-body-sm',
  caption: 'text-caption',
  label: 'text-label',
} as const

export const DS_PROGRESS = {
  base: 'rounded-full overflow-hidden',
  fill: 'h-full rounded-full',
  size: {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  } as const,
  trackTone: {
    dotori: 'bg-dotori-100 dark:bg-dotori-800',
    forest: 'bg-forest-100 dark:bg-forest-900/25',
    amber: 'bg-amber-100 dark:bg-amber-900/25',
    danger: 'bg-dotori-100 dark:bg-dotori-800',
    warning: 'bg-warning/25',
    neutral: 'bg-dotori-100/80 dark:bg-dotori-900',
  } as const,
  fillTone: {
    dotori: 'bg-dotori-500',
    forest: 'bg-forest-500',
    amber: 'bg-amber-500',
    warning: 'bg-warning',
    danger: 'bg-danger',
    neutral: 'bg-dotori-400',
  } as const,
  fillAnimation: 'transition-all duration-300',
} as const

export const DS_TOAST = {
  STACK_WRAP: 'pointer-events-none fixed inset-x-0 z-[60] flex flex-col-reverse items-center',
  CONTAINER_BASE:
    'pointer-events-auto relative mx-4 mb-2 flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md dark:shadow-none',
  HANDLE_BAR:
    'absolute -top-1 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-current',
  ICON_BASE: 'h-5 w-5',
  MESSAGE: 'min-w-0 flex-1 text-body leading-snug',
  ACTION_BUTTON:
    'min-h-11 shrink-0 rounded-lg px-3 text-body font-semibold transition-transform active:scale-[0.97]',
  SUCCESS_CONTAINER:
    'bg-forest-100 text-forest-800 border-forest-200 dark:bg-forest-900/20 dark:text-forest-100 dark:border-forest-700/40',
  SUCCESS_ICON: 'text-forest-700 dark:text-forest-100',
  SUCCESS_ACTION:
    'text-forest-900 hover:text-forest-950 dark:text-forest-100 dark:hover:text-white',
  ERROR_CONTAINER:
    'bg-danger/10 text-danger border-danger/20 dark:bg-danger/20 dark:text-danger/90 dark:border-danger/30',
  ERROR_ICON: 'text-danger dark:text-danger/90',
  ERROR_ACTION:
    'text-danger hover:text-danger/80 dark:text-danger/90 dark:hover:text-white',
  INFO_CONTAINER:
    'bg-dotori-900 text-white border-dotori-900/20 dark:bg-dotori-900/40 dark:text-dotori-50 dark:border-dotori-700/40',
  INFO_ICON: 'text-white',
  INFO_ACTION: 'text-white/90 hover:text-white',
  UNDO_CONTAINER:
    'bg-dotori-900 text-white border-dotori-900/20 dark:bg-dotori-900/40 dark:text-dotori-50 dark:border-dotori-700/40',
  UNDO_ICON: 'text-white',
  UNDO_ACTION: 'text-white/90 hover:text-white',
} as const

export const DS_LAYOUT = {
  SAFE_AREA_BOTTOM: 'safe-area-bottom',
  SAFE_AREA_TABBAR: 'safe-area-tabbar',
  SAFE_AREA_HEADER_TOP: 'safe-area-header-top',
  SAFE_AREA_FLOATING_ACTION: 'safe-area-floating-action',
  SAFE_AREA_TOAST: 'safe-area-toast',
} as const

const DS_STATUS_PILL_SOFT =
  'bg-dotori-100 text-dotori-900 dark:bg-dotori-800 dark:text-dotori-50'
const DS_STATUS_BORDER_LEFT = 'border-l-4'

export const DS_STATUS = {
  available: {
    label: '빈자리 있음',
    dot: 'bg-forest-500 status-dot-pulse',
    pill: 'bg-forest-100 text-forest-900 dark:bg-forest-900/20 dark:text-forest-100',
    border: `${DS_STATUS_BORDER_LEFT} border-l-forest-500/80`,
  },
  waiting: {
    label: '대기',
    dot: 'bg-warning',
    pill: DS_STATUS_PILL_SOFT,
    border: `${DS_STATUS_BORDER_LEFT} border-l-warning/80`,
  },
  full: {
    label: '마감',
    dot: 'bg-danger',
    pill: DS_STATUS_PILL_SOFT,
    border: `${DS_STATUS_BORDER_LEFT} border-l-danger/80`,
  },
} as const

export const DS_FRESHNESS = {
  realtime: {
    base: 'text-forest-600 bg-forest-50',
    dark: 'dark:bg-forest-900/20 dark:text-forest-200',
    dot: 'bg-forest-500 motion-safe:animate-pulse',
  },
  recent: {
    base: 'text-amber-700 bg-amber-50',
    dark: 'dark:bg-amber-900/20 dark:text-amber-200',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  cached: {
    base: 'text-dotori-700 bg-dotori-100',
    dark: 'dark:bg-dotori-800 dark:text-dotori-100',
    dot: 'bg-dotori-300 dark:bg-dotori-600',
  },
} as const

/* ── FAB (Floating Action Button) ── */
export const DS_FAB = {
  base: 'fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-1',
  dotori: 'bg-dotori-500 text-white ring-dotori-400/30 active:bg-dotori-600',
  forest: 'bg-forest-500 text-white ring-forest-400/30 active:bg-forest-600',
} as const

/* ── Sticky Bottom Bar ── */
export const DS_STICKY_BAR = {
  base: 'fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3',
  light: 'border-dotori-100/60 bg-white/90 backdrop-blur-xl backdrop-saturate-150',
  dark: 'dark:border-dotori-800/40 dark:bg-dotori-950/90',
} as const
