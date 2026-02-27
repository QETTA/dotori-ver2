/**
 * Chat keyword registry — Seasonal prompt rotation for ToRI Chat.
 *
 * Provides contextual quick-reply prompts based on the current month.
 * Works with the SeasonalBriefing system for cohesive seasonal UX.
 */

import { getSeasonalBriefing } from '@/lib/seasonal-config'

export interface ContextualPrompt {
  label: string
  prompt: string
  intent: string
}

/** Core prompts always available regardless of season */
const CORE_PROMPTS: ContextualPrompt[] = [
  { label: '유보통합이 뭐야?', prompt: '유보통합이 뭐야?', intent: 'knowledge' },
  { label: '우리 동네 추천해줘', prompt: '우리 동네 추천해줘', intent: 'recommend' },
  { label: '시설 비교해줘', prompt: '시설 비교해줘', intent: 'compare' },
]

/** Seasonal prompts keyed by season ID */
const SEASONAL_PROMPTS: Record<string, ContextualPrompt[]> = {
  waiting_season: [
    { label: '입소 결과 확인', prompt: '입소 결과 발표 일정 알려줘', intent: 'knowledge' },
    { label: '대기 순번 전략', prompt: '대기 순번 올리는 방법 알려줘', intent: 'strategy' },
    { label: '보충 모집 대비', prompt: '보충 모집 신청 방법 알려줘', intent: 'checklist' },
  ],
  class_assignment: [
    { label: '반편성 대응', prompt: '반편성 바뀌었는데 옮기는 게 좋을까?', intent: 'transfer' },
    { label: '이동 골든타임', prompt: '지금 이동하기 좋은 시설 추천해줘', intent: 'recommend' },
    { label: '전입 절차', prompt: '어린이집 전입 절차 알려줘', intent: 'checklist' },
  ],
  second_half: [
    { label: '하반기 빈자리', prompt: '하반기 빈자리 많은 시설 찾아줘', intent: 'recommend' },
    { label: '유치원 전환', prompt: '어린이집에서 유치원으로 옮기는 방법', intent: 'transfer' },
    { label: '이동 후기', prompt: '다른 부모님 이동 후기 알려줘', intent: 'knowledge' },
  ],
  enrollment_season: [
    { label: '입소 신청 준비', prompt: '입소 신청 준비 체크리스트 알려줘', intent: 'checklist' },
    { label: '가산점 전략', prompt: '맞벌이 가산점 어떻게 받아?', intent: 'strategy' },
    { label: '입소 일정', prompt: '내년도 입소 신청 일정 알려줘', intent: 'knowledge' },
  ],
  default: [
    { label: '유치원도 찾아줘', prompt: '유치원도 찾아줘', intent: 'recommend' },
    { label: '입소 전략 짜줘', prompt: '입소 전략 짜줘', intent: 'strategy' },
    { label: '입소 체크리스트', prompt: '입소 체크리스트 정리해줘', intent: 'checklist' },
  ],
}

/**
 * Get contextual quick-reply prompts based on the current season.
 * Returns 4-6 prompts: core + seasonal, no duplicates.
 */
export function getContextualPrompts(month?: number): ContextualPrompt[] {
  const briefing = getSeasonalBriefing(month)
  const seasonal = SEASONAL_PROMPTS[briefing.id] ?? SEASONAL_PROMPTS.default!

  // Merge seasonal first (higher relevance), then core, dedup by prompt
  const seen = new Set<string>()
  const result: ContextualPrompt[] = []

  for (const p of [...seasonal, ...CORE_PROMPTS]) {
    if (!seen.has(p.prompt)) {
      seen.add(p.prompt)
      result.push(p)
    }
  }

  return result.slice(0, 6)
}

/**
 * Get just the prompt strings for QuickActionChips.
 */
export function getQuickReplyLabels(month?: number): string[] {
  return getContextualPrompts(month).map((p) => p.label)
}
