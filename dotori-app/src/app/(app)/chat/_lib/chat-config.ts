import { BRAND } from '@/lib/brand-assets'
import type { Variants } from 'motion/react'

export const FREE_PLAN_CHAT_LIMIT = 5
export const GUEST_CHAT_LIMIT = 3
export const MONTHLY_USAGE_API_URL = '/api/analytics/usage'
export const PREMIUM_GATE_HINT = '업그레이드하면 무제한으로 대화해요'
export const TORI_ICON =
  (BRAND as { TORI_ICON?: string }).TORI_ICON ?? BRAND.appIconSimple

export const suggestedPrompts = [
  {
    label: '이동 고민',
    prompt:
      '지금 다니는 시설에서 이동하고 싶어요. 무엇부터 시작해야 할까요?',
    icon: '🔄',
  },
  {
    label: '반편성 불만',
    prompt: '3월 반편성 결과가 마음에 안 들어요. 이동할 만한 시설이 있을까요?',
    icon: '📋',
  },
  {
    label: '빈자리 탐색',
    prompt: '우리 동네 시설 중 지금 바로 입소 가능한 곳을 찾고 싶어요',
    icon: '🔍',
  },
] as const

export const promptListVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

export const promptItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      ease: 'easeOut',
      duration: 0.24,
    },
  },
}

export const RETRY_ACTION_ID = 'chat:retry-last-message'
const QUICK_REPLIES_BY_INTENT: Record<string, string[]> = {
  transfer: ['근처 대안 시설 찾기', '전원 절차 안내', '서류 체크리스트'],
  recommend: ['더 보기', '지도에서 보기', '비교하기'],
  general: ['이동 고민', '빈자리 탐색', '입소 체크리스트'],
}

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getGuestUsageStorageKey(monthKey: string): string {
  return `chat:guest-monthly-usage:${monthKey}`
}

export function getGuestUsageCount(monthKey: string): number {
  if (typeof window === 'undefined') return 0
  const raw = window.sessionStorage.getItem(getGuestUsageStorageKey(monthKey))
  if (!raw) return 0

  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

export function setGuestUsageCount(monthKey: string, count: number): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(
    getGuestUsageStorageKey(monthKey),
    String(Math.max(0, Math.floor(count))),
  )
}

function parseToNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value))
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed))
    }
  }
  return fallback
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  return value as Record<string, unknown>
}

export function parseUsageResponse(
  payload: unknown,
  fallbackLimit: number,
): { count: number; limit: number } {
  if (!payload || typeof payload !== 'object') {
    return { count: 0, limit: fallbackLimit }
  }

  const record = payload as Record<string, unknown>
  const nested = asRecord(record.data) ?? record
  const limits = asRecord(nested.limits) ?? asRecord(record.limits)
  const freeLimits = asRecord(limits?.free)

  return {
    count: parseToNumber(
      nested.chat ?? nested.count ?? nested.used ?? record.chat ?? record.count ?? record.used,
      0,
    ),
    limit: parseToNumber(
      freeLimits?.chat ?? limits?.chat ?? nested.limit ?? record.limit,
      fallbackLimit,
    ),
  }
}

export function parseQuickReplies(intent?: string): string[] {
  if (!intent || !QUICK_REPLIES_BY_INTENT[intent]) return []
  return QUICK_REPLIES_BY_INTENT[intent]
}
