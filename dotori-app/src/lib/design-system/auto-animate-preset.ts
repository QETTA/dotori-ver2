/**
 * @formkit/auto-animate 프리셋
 *
 * 리스트/그리드의 진입·퇴장·재정렬 애니메이션을 한 줄로 적용.
 *
 * 사용법:
 *   import { useAutoAnimate } from '@formkit/auto-animate/react'
 *   import { autoAnimatePresets } from '@/lib/design-system/auto-animate-preset'
 *
 *   const [parent] = useAutoAnimate(autoAnimatePresets.list)
 *   <ul ref={parent}>...</ul>
 */

export const autoAnimatePresets = {
  /** 기본 리스트 (250ms ease-out) */
  list: { duration: 250, easing: 'ease-out' },
  /** 그리드/카드 (300ms ease-in-out) */
  grid: { duration: 300, easing: 'ease-in-out' },
  /** 빠른 전환 (150ms ease-out) */
  fast: { duration: 150, easing: 'ease-out' },
  /** 부드러운 전환 (400ms ease-in-out) — 대형 요소용 */
  gentle: { duration: 400, easing: 'ease-in-out' },
} as const
