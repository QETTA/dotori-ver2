export type EvidenceSourceType =
  | 'public'
  | 'institution'
  | 'map'
  | 'youtube'
  | 'instagram'
  | 'user_report'
  | 'community'

export interface EvidenceItem {
  id: string
  sourceType: EvidenceSourceType
  sourceName: string
  sourceUrl: string
  capturedAt: string
  updatedAt: string
  claim: string
  impact: string
  confidence: number // 0-1
}

export type ConfidenceLabel = 'confirmed' | 'estimated' | 'insufficient'

const AUTHORITY_WEIGHTS: Record<EvidenceSourceType, number> = {
  public: 1.0,
  institution: 0.9,
  map: 0.7,
  youtube: 0.5,
  instagram: 0.4,
  user_report: 0.3,
  community: 0.2,
}

/**
 * 증거 목록 기반 신뢰도 라벨을 계산합니다.
 */
export function getConfidenceLabel(items: EvidenceItem[]): ConfidenceLabel {
  if (items.length === 0) return 'insufficient'
  const maxConfidence = Math.max(...items.map((i) => i.confidence))
  const hasPublicSource = items.some((i) => i.sourceType === 'public' || i.sourceType === 'institution')
  if (maxConfidence >= 0.7 && hasPublicSource) return 'confirmed'
  if (maxConfidence >= 0.4) return 'estimated'
  return 'insufficient'
}

/**
 * 라벨을 한국어 텍스트로 변환합니다.
 */
export function getConfidenceLabelKo(label: ConfidenceLabel): string {
  switch (label) {
    case 'confirmed':
      return '확인됨'
    case 'estimated':
      return '추정'
    case 'insufficient':
      return '근거 부족'
  }
}

/**
 * 최신성/출처 신뢰도를 반영한 가중치 점수를 계산합니다.
 */
export function calculateWeightedScore(items: EvidenceItem[]): number {
  if (items.length === 0) return 0
  let totalWeight = 0
  let weightedSum = 0

  for (const item of items) {
    const authorityWeight = AUTHORITY_WEIGHTS[item.sourceType] ?? 0.2
    const recencyWeight = getRecencyWeight(item.updatedAt)
    const weight = authorityWeight * recencyWeight * item.confidence
    weightedSum += weight
    totalWeight += authorityWeight * recencyWeight
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

/**
 * 최신성 가중치(단위: 일)를 계산합니다.
 * 잘못된 날짜 문자열은 기본값 0.2를 사용합니다.
 */
export function getRecencyWeight(dateStr: string): number {
  const timestamp = Date.parse(dateStr)
  if (!Number.isFinite(timestamp)) return 0.2

  const daysSince = (Date.now() - timestamp) / 86400000
  if (daysSince <= 7) return 1.0
  if (daysSince <= 30) return 0.8
  if (daysSince <= 90) return 0.6
  if (daysSince <= 365) return 0.4
  return 0.2
}

/**
 * 증거의 충돌(긍정/부정 혼재) 여부를 검사합니다.
 */
export function detectConflicts(items: EvidenceItem[]): boolean {
  const claims = items.map((i) => i.impact)
  const hasPositive = claims.some((c) => c.includes('긍정') || c.includes('상승') || c.includes('증가'))
  const hasNegative = claims.some((c) => c.includes('부정') || c.includes('하락') || c.includes('감소'))
  return hasPositive && hasNegative
}
