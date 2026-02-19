/**
 * 도토리 i18n — 최소 구현
 * 기본 언어: ko (한국어), 부가: en (영어)
 *
 * Usage:
 *   import { t, setLocale } from '@/lib/i18n'
 *   t('nav.explore') → '탐색' | 'Explore'
 */

export type Locale = 'ko' | 'en'

const dictionaries: Record<Locale, Record<string, string>> = {
  ko: {
    // Nav
    'nav.home': '홈',
    'nav.explore': '탐색',
    'nav.chat': '상담',
    'nav.alerts': '알림',
    'nav.mypage': '마이',
    // Common
    'common.search': '검색',
    'common.filter': '필터',
    'common.sort': '정렬',
    'common.save': '저장',
    'common.cancel': '취소',
    'common.confirm': '확인',
    'common.delete': '삭제',
    'common.edit': '수정',
    'common.back': '뒤로',
    'common.next': '다음',
    'common.prev': '이전',
    'common.close': '닫기',
    'common.loading': '로딩 중...',
    'common.retry': '다시 시도',
    'common.seeMore': '더 보기',
    'common.noData': '데이터가 없습니다',
    // Grade
    'grade.A': '매우 높음',
    'grade.B': '높음',
    'grade.C': '보통',
    'grade.D': '낮음',
    'grade.E': '매우 낮음',
    'grade.F': '극히 낮음',
    // Facility
    'facility.type.national': '국공립',
    'facility.type.private': '민간',
    'facility.type.home': '가정',
    'facility.type.workplace': '직장',
    'facility.capacity': '정원',
    'facility.enrolled': '재원',
    'facility.waitlist': '대기',
    'facility.cost': '월 비용',
    // Alert
    'alert.to': 'TO 발생',
    'alert.probability': '확률 변동',
    'alert.system': '시스템',
    'alert.markAllRead': '모두 읽음',
    // Simulation
    'sim.baseProbability': '기본 확률',
    'sim.newProbability': '적용 후 확률',
    'sim.strategy': '전략',
    'sim.apply': '적용하기',
    // Plan
    'plan.free': '무료',
    'plan.basic': '베이직',
    'plan.pro': '프로',
    'plan.upgrade': '업그레이드',
    // Auth
    'auth.login': '로그인',
    'auth.logout': '로그아웃',
    'auth.kakao': '카카오로 시작하기',
    'auth.naver': '네이버로 시작하기',
    // Error
    'error.notFound': '페이지를 찾을 수 없습니다',
    'error.generic': '오류가 발생했습니다',
    'error.network': '네트워크 연결을 확인해주세요',
  },

  en: {
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.chat': 'Chat',
    'nav.alerts': 'Alerts',
    'nav.mypage': 'My',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.prev': 'Previous',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.seeMore': 'See more',
    'common.noData': 'No data',
    'grade.A': 'Very High',
    'grade.B': 'High',
    'grade.C': 'Medium',
    'grade.D': 'Low',
    'grade.E': 'Very Low',
    'grade.F': 'Extremely Low',
    'facility.type.national': 'Public',
    'facility.type.private': 'Private',
    'facility.type.home': 'Home-based',
    'facility.type.workplace': 'Workplace',
    'facility.capacity': 'Capacity',
    'facility.enrolled': 'Enrolled',
    'facility.waitlist': 'Waitlist',
    'facility.cost': 'Monthly Cost',
    'alert.to': 'Vacancy Alert',
    'alert.probability': 'Probability Change',
    'alert.system': 'System',
    'alert.markAllRead': 'Mark all read',
    'sim.baseProbability': 'Base Probability',
    'sim.newProbability': 'New Probability',
    'sim.strategy': 'Strategy',
    'sim.apply': 'Apply',
    'plan.free': 'Free',
    'plan.basic': 'Basic',
    'plan.pro': 'Pro',
    'plan.upgrade': 'Upgrade',
    'auth.login': 'Log in',
    'auth.logout': 'Log out',
    'auth.kakao': 'Continue with Kakao',
    'auth.naver': 'Continue with Naver',
    'error.notFound': 'Page not found',
    'error.generic': 'Something went wrong',
    'error.network': 'Please check your connection',
  },
}

let currentLocale: Locale = 'ko'

export function setLocale(locale: Locale) {
  currentLocale = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    localStorage.setItem('dotori-locale', locale)
  }
}

export function getLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('dotori-locale') as Locale | null
    if (stored && dictionaries[stored]) {
      currentLocale = stored
    }
  }
  return currentLocale
}

export function t(key: string, fallback?: string): string {
  return dictionaries[currentLocale]?.[key] ?? dictionaries.ko[key] ?? fallback ?? key
}

export type TranslationKey = keyof typeof dictionaries.ko
