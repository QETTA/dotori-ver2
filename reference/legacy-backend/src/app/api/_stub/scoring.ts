import type { StubDaycare } from './daycares'

export type Confidence = 'high' | 'medium' | 'low'
export type EvidenceChip = { label: string; polarity: 'pos' | 'neg' | 'uncertain' }

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

export function hash01(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 2 ** 32
}

export function makeAsOf(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString()
}

export function confidenceFrom(u: number): Confidence {
  if (u >= 0.72) return 'high'
  if (u >= 0.38) return 'medium'
  return 'low'
}

export function rangeFrom(score: number, conf: Confidence): [number, number] {
  const w = conf === 'high' ? 0.04 : conf === 'medium' ? 0.06 : 0.09
  return [clamp01(score - w), clamp01(score + w)]
}

export function gradeFrom(score: number): string {
  if (score >= 0.82) return 'A'
  if (score >= 0.68) return 'B'
  if (score >= 0.52) return 'C'
  if (score >= 0.36) return 'D'
  return 'E'
}

export function timeHintFrom(score: number): string {
  if (score >= 0.75) return '대기 해소 예상 1~2주(범위)'
  if (score >= 0.6) return '대기 해소 예상 2~4주(범위)'
  if (score >= 0.45) return '대기 해소 예상 4~8주(범위)'
  return '대기 해소 예상 8주 이상(범위)'
}

const POS = [
  '최근 60일 TO 3회',
  '충원 평균 6~9일',
  '최근 4주 대기 감소',
  '변동성 낮은 편(최근 12개월)',
  '비수기 TO 빈도↑(경향)',
]
const NEG = ['최근 2주 대기 +4', '최근 30일 TO 0회', '경쟁 높은 구간(신청↑)', '변동성↑(학기 시작)', '데이터 공백 1개월']

function pick<T>(arr: T[], u: number) {
  const idx = Math.floor(u * arr.length) % arr.length
  return arr[idx]
}

export function evidenceTop(seed: string): EvidenceChip[] {
  const u1 = hash01(`${seed}|pos`)
  const u2 = hash01(`${seed}|neg`)
  const u3 = hash01(`${seed}|unc`)

  const pos1 = pick(POS, u1)
  const pos2 = pick(POS, u2)
  const neg1 = pick(NEG, u3)

  return [
    { label: pos1, polarity: 'pos' },
    { label: pos2 === pos1 ? pick(POS, u3) : pos2, polarity: 'pos' },
    { label: neg1, polarity: 'neg' },
  ]
}

export function makeScore(params: { daycareId: string; age: number; district?: string; dong?: string; mode?: string }) {
  const baseU = hash01(
    `${params.daycareId}|age=${params.age}|${params.district ?? ''}|${params.dong ?? ''}|${params.mode ?? ''}`,
  )
  let score = 0.35 + baseU * 0.5

  if (params.age === 0) score -= 0.03
  if (params.mode === 'high_to') score += (hash01(`${params.daycareId}|boost`) - 0.5) * 0.06

  return clamp01(score)
}

export function makeRecoItem(d: StubDaycare, age: number, mode?: string) {
  const score = makeScore({ daycareId: d.id, age, district: d.district, dong: d.dong, mode })
  const conf = confidenceFrom(hash01(`${d.id}|conf|${age}`))
  const range = rangeFrom(score, conf)
  const grade = gradeFrom(score)
  return {
    daycareId: d.id,
    name: d.name,
    district: d.district,
    dong: d.dong,
    geo: d.geo ? { lat: d.geo.lat, lng: d.geo.lng } : undefined,
    score,
    range,
    grade,
    confidence: conf,
    asOf: makeAsOf(120),
    evidenceTop: evidenceTop(`${d.id}|age=${age}|mode=${mode ?? 'balance'}`),
  }
}

export function makeAnalysis(d: StubDaycare, age: number) {
  const score = makeScore({ daycareId: d.id, age, district: d.district, dong: d.dong, mode: 'balance' })
  const conf = confidenceFrom(hash01(`${d.id}|conf|${age}`))
  const range = rangeFrom(score, conf)
  const grade = gradeFrom(score)
  const timeHint = timeHintFrom(score)

  return {
    daycareId: d.id,
    name: d.name,
    district: d.district,
    dong: d.dong,
    age,
    score,
    range,
    confidence: conf,
    asOf: makeAsOf(120),
    summary: { grade, timeHint },
    evidence: {
      topFactors: [
        {
          key: 'to_frequency',
          title: 'TO 발생 패턴',
          impact: 'pos',
          detail: pick(POS, hash01(`${d.id}|f1`)),
        },
        {
          key: 'waitlist_trend',
          title: '대기 변화',
          impact: 'neg',
          detail: pick(NEG, hash01(`${d.id}|f2`)),
        },
        {
          key: 'fill_speed',
          title: '충원 속도',
          impact: 'pos',
          detail: '평균 충원 6~9일(추정)',
        },
        {
          key: 'seasonality',
          title: '시즌/학기 영향',
          impact: 'uncertain',
          detail: '학기 시작/방학 전후 변동성 증가 구간(경향)',
        },
      ],
      dataFreshness: [
        { source: 'official', asOf: makeAsOf(180) },
        { source: 'user_reports', asOf: makeAsOf(10) },
      ],
      notes: [
        conf === 'low' ? '데이터 표본이 적어 신뢰도: 낮음으로 표시됩니다.' : '최근 데이터 가중치를 반영했습니다.',
        '예측은 참고용이며 실제 TO/입소는 외부 요인으로 변동될 수 있습니다.',
      ],
    },
  }
}
