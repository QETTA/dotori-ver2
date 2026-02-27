/**
 * DS Page Tokens — 페이지 레벨 구조 토큰
 *
 * 페이지 헤더, 서피스, 빈 상태 등 페이지 단위 반복 패턴:
 * import { DS_PAGE_HEADER, DS_SURFACE, DS_EMPTY_STATE } from '@/lib/design-system/page-tokens'
 */

/** 페이지 / 섹션 헤더 스타일 */
export const DS_PAGE_HEADER = {
  /** 아이브로 (SMART CHILDCARE, 이동 진행 상황 등) */
  eyebrow: 'font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-500',
  /** 페이지 제목 */
  title: 'font-extrabold tracking-tight text-dotori-900 dark:text-dotori-50',
  /** 보조 설명 */
  subtitle: 'text-balance text-dotori-700 dark:text-dotori-300',
  /** 헤더 내부 간격 */
  spacing: 'space-y-1',
} as const

/** 서피스 배경 레벨 */
export const DS_SURFACE = {
  /** 기본 배경 (페이지 루트) */
  primary: 'bg-white dark:bg-dotori-900',
  /** 떠있는 카드 서피스 */
  elevated: 'bg-white shadow-sm rounded-2xl ring-1 ring-dotori-100/70 dark:bg-dotori-900 dark:shadow-dotori-950/15 dark:ring-dotori-800/60',
  /** 안쪽으로 들어간 서피스 (통계 그리드, 인풋 그룹 등) */
  sunken: 'bg-dotori-950/[0.025] dark:bg-white/5',
} as const

/** 섹션 리듬 (vertical spacing between sections) */
export const DS_SECTION_RHYTHM = {
  /** Compact: 짧은 섹션 간격 */
  compact: 'space-y-4',
  /** Normal: 기본 섹션 간격 */
  normal: 'space-y-6',
  /** Generous: 넓은 섹션 간격 (랜딩, 홈) */
  generous: 'space-y-8',
} as const

/** Hero 영역 토큰 */
export const DS_HERO = {
  /** 컨테이너: gradient-mesh + 패딩 */
  container: 'relative overflow-hidden gradient-mesh-warm px-4 pb-8 pt-12',
  /** 타이틀: fluid-xl + gradient text */
  title: 'text-fluid-xl font-extrabold tracking-tight bg-gradient-to-r from-dotori-800 via-dotori-500 to-amber-400 bg-clip-text text-transparent',
  /** 서브타이틀 */
  subtitle: 'text-fluid-base text-dotori-700 dark:text-dotori-300',
  /** Dark mode 컨테이너 */
  dark: 'dark:bg-dotori-950',
} as const

/** 빈 상태 / 비어있는 목록 스타일 */
export const DS_EMPTY_STATE = {
  container: 'flex flex-col items-center justify-center py-16 text-center',
  illustration: 'mb-6',
  title: 'text-h3 font-bold text-dotori-900 dark:text-dotori-50',
  description: 'mt-2 text-body-sm text-dotori-600 dark:text-dotori-400',
  action: 'mt-6',
} as const
