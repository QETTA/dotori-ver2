/**
 * Accessibility patterns and utilities
 * WCAG 2.1 AA compliance helpers
 */

/**
 * ARIA Live region announcer for dynamic content
 * Usage: announce('3개의 검색 결과가 있습니다')
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof document === 'undefined') return

  let region = document.getElementById(`aria-${priority}`)
  if (!region) {
    region = document.createElement('div')
    region.id = `aria-${priority}`
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', priority)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    document.body.appendChild(region)
  }

  // Clear then set to trigger screen reader
  region.textContent = ''
  requestAnimationFrame(() => {
    region!.textContent = message
  })
}

/**
 * Focus management: move focus to target element
 */
export function moveFocusTo(selector: string, options?: { preventScroll?: boolean }) {
  if (typeof document === 'undefined') return
  const el = document.querySelector<HTMLElement>(selector)
  if (el) {
    el.setAttribute('tabindex', '-1')
    el.focus(options)
  }
}

/**
 * Trap focus within a container (for modals/dialogs)
 */
export function createFocusTrap(container: HTMLElement) {
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)
  first?.focus()

  return () => container.removeEventListener('keydown', handleKeyDown)
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * ARIA labels for common patterns
 */
export const ariaLabels = {
  // Navigation
  mainNav: '메인 내비게이션',
  bottomNav: '하단 탭 내비게이션',
  breadcrumb: '현재 위치',

  // Content
  facilityList: '어린이집 목록',
  alertList: '알림 목록',
  chatMessages: '채팅 메시지',
  searchResults: '검색 결과',

  // Controls
  favoriteToggle: (name: string, isFav: boolean) => `${name} ${isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}`,
  gradeInfo: (grade: string, prob: number) => `등급 ${grade}, 입소 확률 ${prob}%`,
  pagination: (page: number, total: number) => `${total} 페이지 중 ${page} 페이지`,

  // Status
  loading: '데이터를 불러오고 있습니다',
  error: '오류가 발생했습니다',
  empty: '결과가 없습니다',
  unreadCount: (n: number) => `읽지 않은 알림 ${n}개`,
} as const

/**
 * Keyboard shortcut map
 */
export const shortcuts = {
  search: { key: '/', label: '검색 열기' },
  escape: { key: 'Escape', label: '닫기/취소' },
  home: { key: 'h', ctrl: true, label: '홈으로' },
} as const
