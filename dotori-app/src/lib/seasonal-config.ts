/**
 * Seasonal configuration for Dotori Home dashboard.
 *
 * 월별 브리핑:
 *  - 1~2월  = 입소 대기 / 결과 발표
 *  - 3월    = 반편성 / 신학기 시작
 *  - 8월    = 하반기 이동 골든타임
 *  - 10~12월 = 내년도 입소 신청
 *  - 나머지  = 일반 (빈자리 탐색)
 */

export interface SeasonalBriefing {
  id: string
  eyebrow: string
  title: string
  description: string
  action: { label: string; href: string }
  tone: 'dotori' | 'forest' | 'amber'
}

const BRIEFINGS: Record<string, SeasonalBriefing> = {
  waiting: {
    id: 'waiting_season',
    eyebrow: '입소 결과 대기',
    title: '입소 결과 발표 시기예요',
    description: '대기 순번 변동이 있을 수 있어요. 알림을 켜두면 바로 알려드릴게요.',
    action: { label: '알림 설정', href: '/my/settings' },
    tone: 'amber',
  },
  classAssignment: {
    id: 'class_assignment',
    eyebrow: '반편성 시즌',
    title: '반편성 결과가 나왔어요',
    description: '마음에 안 드신다면 지금이 이동 골든타임! 빈자리 있는 시설을 확인해보세요.',
    action: { label: '빈자리 탐색', href: '/explore' },
    tone: 'forest',
  },
  secondHalf: {
    id: 'second_half',
    eyebrow: '하반기 이동',
    title: '하반기 이동 골든타임이에요',
    description: '8월은 연중 이동이 가장 많은 달! 빈자리를 놓치지 마세요.',
    action: { label: '시설 탐색', href: '/explore' },
    tone: 'forest',
  },
  enrollment: {
    id: 'enrollment_season',
    eyebrow: '내년도 입소 신청',
    title: '내년 3월 입소 신청 시즌이에요',
    description: '아이사랑에서 입소 신청을 준비하세요. 도토리가 입소 전략을 도와드릴게요.',
    action: { label: '입소 전략 보기', href: '/chat?prompt=입소전략' },
    tone: 'dotori',
  },
  default: {
    id: 'default',
    eyebrow: '빈자리 탐색',
    title: '우리 아이에게 딱 맞는 시설을 찾아보세요',
    description: '관심 시설에 빈자리가 나면 바로 알려드려요.',
    action: { label: '시설 탐색', href: '/explore' },
    tone: 'dotori',
  },
}

/**
 * Get the current seasonal briefing based on the month.
 * @param month 0-indexed month (0=Jan, 11=Dec). Defaults to current month.
 */
export function getSeasonalBriefing(month?: number): SeasonalBriefing {
  const m = month ?? new Date().getMonth()

  if (m <= 1) return BRIEFINGS.waiting       // 1~2월
  if (m === 2) return BRIEFINGS.classAssignment // 3월
  if (m === 7) return BRIEFINGS.secondHalf    // 8월
  if (m >= 9) return BRIEFINGS.enrollment     // 10~12월
  return BRIEFINGS.default                    // 4~7월, 9월
}

/* ── Landing Hero Seasonal Config ── */
export interface SeasonalHero {
  title: string
  subtitle: string
  cta: string
}

const HERO_CONFIG: Record<string, SeasonalHero> = {
  waiting: {
    title: '입소 결과, 도토리가 먼저 알려드려요',
    subtitle: '대기 순번 변동부터 빈자리 알림까지, 한 곳에서 관리하세요',
    cta: '빈자리 알림 받기',
  },
  classAssignment: {
    title: '반편성 결과 확인하고, 이동 준비하세요',
    subtitle: '빈자리 있는 어린이집·유치원을 실시간으로 찾아보세요',
    cta: '빈자리 탐색하기',
  },
  secondHalf: {
    title: '하반기 이동, 지금이 골든타임이에요',
    subtitle: '8월은 빈자리가 가장 많은 달. 놓치지 마세요',
    cta: '시설 탐색 시작',
  },
  enrollment: {
    title: '내년 입소, 도토리와 미리 준비하세요',
    subtitle: '입소 신청부터 서류 준비까지, 10분이면 끝나요',
    cta: '입소 전략 보기',
  },
  default: {
    title: '아이에게 딱 맞는 시설, 도토리가 찾아드려요',
    subtitle: '어린이집·유치원 탐색부터 입소까지, 한번에',
    cta: '무료로 시작하기',
  },
}

export function getSeasonalHero(month?: number): SeasonalHero {
  const m = month ?? new Date().getMonth()
  if (m <= 1) return HERO_CONFIG.waiting
  if (m === 2) return HERO_CONFIG.classAssignment
  if (m === 7) return HERO_CONFIG.secondHalf
  if (m >= 9) return HERO_CONFIG.enrollment
  return HERO_CONFIG.default
}
