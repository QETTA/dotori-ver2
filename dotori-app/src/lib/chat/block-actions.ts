/**
 * Chat block action routing — maps AI response action IDs to app routes/prompts
 */

export const CHAT_ACTION_ROUTES: Record<string, string> = {
  explore: '/explore',
  waitlist: '/my/waitlist',
  interests: '/my/interests',
  community: '/community',
  settings: '/my/settings',
  login: '/login',
  import: '/my/import',
}

export const QUICK_ACTION_MAP: Record<string, string> = {
  recommend: '동네 추천해줘',
  compare: '시설 비교해줘',
  strategy: '입소 전략 정리해줘',
  generate_report: '동네 추천해줘',
  generate_checklist: '입소 체크리스트 정리해줘',
  checklist: '입소 체크리스트 정리해줘',
  broaden: '다른 시설을 더 찾아줘',
}

export function isKnownBlockAction(actionId: string): boolean {
  if (actionId.startsWith('facility_')) return true
  return Boolean(CHAT_ACTION_ROUTES[actionId] || QUICK_ACTION_MAP[actionId])
}
