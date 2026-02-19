import { getGrade } from '@/lib/utils'
import type { Grade } from '@/lib/types'

/* ─── Types ─── */
export interface ProbabilityFactors {
  queuePosition: number
  totalWaiting: number
  classCapacity: number
  currentEnroll: number
  historicalTORate: number // monthly average
  priority: number // 1=1지망, 2=2지망
  bonusPoints: number // 가점 (다자녀, 맞벌이 등)
}

export interface ProbabilityBreakdown {
  positionScore: number
  vacancyScore: number
  toScore: number
  priorityScore: number
  bonusScore: number
}

export interface ProbabilityResult {
  probability: number
  grade: Grade
  breakdown: ProbabilityBreakdown
}

/* ─── Grade Calculation ─── */
export function calculateGrade(probability: number): Grade {
  return getGrade(probability)
}

/* ─── Probability Calculation ─── */
export function calculateProbability(factors: ProbabilityFactors): ProbabilityResult {
  const { queuePosition, totalWaiting, classCapacity, currentEnroll, historicalTORate, priority, bonusPoints } = factors

  // Base: position relative to total waitlist (35%)
  const positionScore = Math.max(0, 1 - queuePosition / Math.max(totalWaiting, 1)) * 35

  // Vacancy: available spots ratio (25%)
  const vacancyRate = Math.max(0, classCapacity - currentEnroll) / Math.max(classCapacity, 1)
  const vacancyScore = vacancyRate * 25

  // TO history: monthly turnover expectation (15%)
  const toScore = Math.min(historicalTORate * 7.5, 15)

  // Priority bonus (15%)
  const priorityScore = priority === 1 ? 15 : priority === 2 ? 8 : 3

  // Bonus points (10%)
  const bonusScore = Math.min(bonusPoints * 2.5, 10)

  const rawTotal = positionScore + vacancyScore + toScore + priorityScore + bonusScore

  // Season adjustment: March intake season boost
  const seasonMultiplier = getSeasonMultiplier()
  const total = rawTotal * seasonMultiplier

  const probability = Math.round(Math.min(Math.max(total, 0), 100) * 10) / 10

  return {
    probability,
    grade: calculateGrade(probability),
    breakdown: { positionScore, vacancyScore, toScore, priorityScore, bonusScore },
  }
}

/* ─── Season Multiplier ─── */
function getSeasonMultiplier(): number {
  const month = new Date().getMonth() + 1 // 1-12
  // March is primary intake season → higher turnover → boost probability
  // September is secondary season → moderate boost
  // Summer (Jul-Aug) and winter (Dec-Jan) are low → slight reduction
  const seasonMap: Record<number, number> = {
    1: 0.95, // 겨울 비수기
    2: 1.05, // 3월 입소 직전 → TO 증가 시작
    3: 1.15, // 3월 입소 시즌 → 최대 TO 발생
    4: 1.08, // 잔여 TO 처리
    5: 1.0, // 안정기
    6: 0.98, // 안정기
    7: 0.92, // 여름 비수기
    8: 0.92, // 여름 비수기
    9: 1.05, // 9월 추가 모집
    10: 1.0, // 안정기
    11: 0.97, // 하반기 마감 접근
    12: 0.93, // 겨울 비수기
  }
  return seasonMap[month] ?? 1.0
}

/* ─── Trend Calculation ─── */
export interface TrendResult {
  delta: number // 확률 변동량 (%p)
  direction: 'up' | 'down' | 'stable'
  period: '30d'
}

export function calculateTrend(currentProbability: number, previousProbability: number): TrendResult {
  const delta = Math.round((currentProbability - previousProbability) * 10) / 10
  const direction = delta > 1 ? 'up' : delta < -1 ? 'down' : 'stable'
  return { delta, direction, period: '30d' }
}
