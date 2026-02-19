import { type NextRequest, NextResponse } from 'next/server'
import type { EvidenceItem, ResearchStep } from '../model'
import { withErrorHandling } from '@/lib/api-errors'
import { auth } from '@/lib/auth/config'
import { broadcastEvent, researchSessions } from '../_session-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STEP_TEMPLATES: Array<Omit<ResearchStep, 'id' | 'ts'>> = [
  {
    type: 'search',
    status: 'running',
    title: '공식 데이터 검색 시작',
    detail: '공공 API와 정책 문서를 우선 조회합니다.',
  },
  {
    type: 'open',
    status: 'done',
    title: '공공 통계 페이지 열람',
    detail: '최근 2개월 TO 발생 통계를 확인했습니다.',
  },
  {
    type: 'extract',
    status: 'done',
    title: '핵심 수치 추출',
    detail: '연령별 충원 속도와 경쟁 구간을 추출했습니다.',
  },
  {
    type: 'search',
    status: 'done',
    title: '보조 출처 교차 검색',
    detail: '언론/사용자 제보 출처를 교차 검증했습니다.',
  },
  {
    type: 'compare',
    status: 'done',
    title: '동일 권역 후보 비교',
    detail: '거리/TO 빈도/대기 변동성을 비교했습니다.',
  },
  {
    type: 'restricted',
    status: 'restricted',
    title: '제한된 출처 접근',
    detail: '권한 제한으로 일부 문서는 메타 정보만 사용했습니다.',
  },
  {
    type: 'decide',
    status: 'done',
    title: '근거 우선순위 결정',
    detail: '공식 데이터 가중치를 최우선으로 설정했습니다.',
  },
  {
    type: 'decide',
    status: 'done',
    title: '리서치 세션 마무리',
    detail: '요약 결과를 전송하고 세션을 종료합니다.',
  },
]

const EVIDENCE_TEMPLATES: Array<Omit<EvidenceItem, 'id' | 'ts'>> = [
  {
    sourceType: 'official',
    trustLabel: '신뢰도 높음',
    url: 'https://www.childcare.go.kr/',
    title: '보육통합정보 공개지표',
    snippet: '최근 8주 기준 정원 대비 TO 변동 패턴이 완만하게 개선 중입니다.',
  },
  {
    sourceType: 'media',
    trustLabel: '신뢰도 중간',
    url: 'https://www.seoul.go.kr/',
    title: '지자체 보육 지원 소식',
    snippet: '권역별 대기 완화를 위한 임시 증설 계획이 발표되었습니다.',
  },
  {
    sourceType: 'user_provided',
    trustLabel: '신뢰도 낮음',
    title: '사용자 제보',
    snippet: '최근 신청자 급증 제보가 있으나 공식 데이터 확인이 필요합니다.',
  },
  {
    sourceType: 'blog',
    trustLabel: '신뢰도 중간',
    url: 'https://blog.naver.com/',
    title: '지역 커뮤니티 후기',
    snippet: '체감 대기순번 변동과 실제 충원 간 시차가 있다는 후기가 반복됩니다.',
  },
]

const STEP_SCHEDULE_MS = [1_000, 2_500, 4_000, 5_500, 7_000, 8_500, 10_000, 12_000] as const

function json(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  await auth()

  let body: { query?: string } | null = null
  try {
    body = (await request.json()) as { query?: string }
  } catch {
    return json({ success: false, error: 'INVALID_JSON' }, 400)
  }

  const query = String(body?.query ?? '').trim()
  if (!query) {
    return json({ success: false, error: 'QUERY_REQUIRED' }, 400)
  }

  const sessionId = crypto.randomUUID()
  researchSessions.set(sessionId, {
    query,
    steps: [],
    evidences: [],
    listeners: new Set(),
    status: 'running',
  })

  STEP_TEMPLATES.forEach((template, index) => {
    const delayMs = STEP_SCHEDULE_MS[index] ?? (index + 1) * 1_500

    setTimeout(() => {
      const target = researchSessions.get(sessionId)
      if (!target || target.status === 'done') return

      const step: ResearchStep = {
        id: `${sessionId}-step-${index + 1}`,
        ts: new Date().toISOString(),
        ...template,
      }
      target.steps.push(step)
      broadcastEvent(target, { type: 'stepAdded', step })

      const evidenceSeed = EVIDENCE_TEMPLATES[index % EVIDENCE_TEMPLATES.length]
      if (index % 2 === 0) {
        const evidence: EvidenceItem = {
          id: `${sessionId}-evidence-${index + 1}`,
          ts: new Date().toISOString(),
          ...evidenceSeed,
          title: `${evidenceSeed.title} · ${query}`,
        }
        target.evidences.push(evidence)
        broadcastEvent(target, { type: 'evidenceAdded', evidence })
      }

      if (index === STEP_TEMPLATES.length - 1) {
        target.status = 'done'
        broadcastEvent(target, { type: 'done' })
        setTimeout(() => {
          researchSessions.delete(sessionId)
        }, 120_000)
      }
    }, delayMs)
  })

  return json({ success: true, sessionId })
})
