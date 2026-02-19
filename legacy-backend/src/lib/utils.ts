/* ═══════════════════════════════════════
 * 도토리 — Utility Library
 * ═══════════════════════════════════════ */

import { GRADE_THRESHOLDS, type Grade } from '@/lib/types'

/* ─── Grade System ─── */
export function getGrade(probability: number): Grade {
  if (probability >= GRADE_THRESHOLDS.A) return 'A'
  if (probability >= GRADE_THRESHOLDS.B) return 'B'
  if (probability >= GRADE_THRESHOLDS.C) return 'C'
  if (probability >= GRADE_THRESHOLDS.D) return 'D'
  if (probability >= GRADE_THRESHOLDS.E) return 'E'
  return 'F'
}

export const GRADE_LABELS: Record<Grade, string> = {
  A: '매우 높음',
  B: '높음',
  C: '보통',
  D: '낮음',
  E: '매우 낮음',
  F: '극히 낮음',
}

export const GRADE_COLORS: Record<Grade, { text: string; bg: string; border: string }> = {
  A: { text: 'text-grade-a', bg: 'bg-grade-a/12', border: 'border-grade-a/30' },
  B: { text: 'text-grade-b', bg: 'bg-grade-b/12', border: 'border-grade-b/30' },
  C: { text: 'text-grade-c', bg: 'bg-grade-c/12', border: 'border-grade-c/30' },
  D: { text: 'text-grade-d', bg: 'bg-grade-d/12', border: 'border-grade-d/30' },
  E: { text: 'text-grade-e', bg: 'bg-grade-e/12', border: 'border-grade-e/30' },
  F: { text: 'text-grade-f', bg: 'bg-grade-f/12', border: 'border-grade-f/30' },
}

/* ─── Number Formatters ─── */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n)
}

export function formatPercent(n: number, decimals = 0): string {
  return `${n.toFixed(decimals)}%`
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(n)
}

export function formatCompact(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`
  return String(n)
}

/* ─── Date/Time ─── */
export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const d = new Date(date).getTime()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  return formatDate(date)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function isToday(date: string | Date): boolean {
  const d = new Date(date)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export function isThisWeek(date: string | Date): boolean {
  const d = new Date(date)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return d >= weekStart && d <= now
}

/* ─── Age Calculation ─── */
export function calculateKoreanAge(birthYear: number, birthMonth: number): string {
  const now = new Date()
  const years = now.getFullYear() - birthYear
  const months = now.getMonth() + 1 - birthMonth + years * 12
  if (months < 12) return `${months}개월`
  return `만 ${Math.floor(months / 12)}세`
}

export function getAgeGroupClass(birthYear: number, birthMonth: number): string {
  const now = new Date()
  const months = (now.getFullYear() - birthYear) * 12 + (now.getMonth() + 1 - birthMonth)
  if (months < 12) return '0세반'
  if (months < 24) return '1세반'
  if (months < 36) return '2세반'
  if (months < 48) return '3세반'
  return '4세반 이상'
}

/* ─── String Utils ─── */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}

export function getInitials(name: string): string {
  return name.charAt(0)
}

/* ─── Array Utils ─── */
export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const k = key(item)
      if (groups[k] === undefined) {
        groups[k] = []
      }
      groups[k].push(item)
      return groups
    },
    {} as Record<string, T[]>,
  )
}

export function sortBy<T>(arr: T[], key: (item: T) => number, desc = false): T[] {
  return [...arr].sort((a, b) => (desc ? key(b) - key(a) : key(a) - key(b)))
}

/* ─── Validation ─── */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  return /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone)
}

/* ─── Array Helpers ─── */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set()
  return arr.filter((item) => {
    const k = item[key]
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/* ─── Probability ─── */
export function clampProbability(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/* ─── Age ─── */
export function calculateAge(birthDate: Date): { months: number; years: number } {
  const now = new Date()
  const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth())
  return { months, years: Math.floor(months / 12) }
}

/* ─── Grade Label ─── */
export function getGradeLabel(grade: string): string {
  return GRADE_LABELS[grade as Grade] ?? grade
}

/* ─── Misc ─── */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
