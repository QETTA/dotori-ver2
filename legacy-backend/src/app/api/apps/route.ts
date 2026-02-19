import { type NextRequest, NextResponse } from 'next/server'

type Category = '추천' | '부동산' | '금융' | '쇼핑' | '공동구매' | '여행' | '안전'

type AppIcon =
  | 'MapIcon'
  | 'Target'
  | 'Radio'
  | 'Timer'
  | 'Home'
  | 'BarChart3'
  | 'CreditCard'
  | 'Landmark'
  | 'ShoppingCart'
  | 'Gift'
  | 'ClipboardList'
  | 'Handshake'
  | 'Compass'
  | 'MapPinned'
  | 'ShieldCheck'
  | 'FileCheck'

interface ConnectApp {
  id: string
  name: string
  description: string
  category: Category
  badge?: string
  icon: AppIcon
  prompt: string
}

const CONNECT_APPS: ConnectApp[] = [
  {
    id: 'kakao-map',
    name: '지도 연결',
    description: '동네 후보 지도 탐색',
    category: '추천',
    badge: '지도',
    icon: 'MapIcon',
    prompt: '우리 동네 후보를 지도 카드 중심으로 보여줘.',
  },
  {
    id: 'quick-strategy',
    name: '입소 전략',
    description: 'AI 맞춤 전략 3가지',
    category: '추천',
    badge: 'AI',
    icon: 'Target',
    prompt: '내 상황에 맞는 입소 전략 3가지를 추천해줘.',
  },
  {
    id: 'to-monitor',
    name: 'TO 모니터',
    description: '관심 시설 빈자리 현황',
    category: '추천',
    badge: '실시간',
    icon: 'Radio',
    prompt: '관심 시설의 현재 TO 현황을 보여줘.',
  },
  {
    id: 'extension-guard',
    name: '연장 가드',
    description: '7일 카운트다운 액션',
    category: '추천',
    badge: 'D+7',
    icon: 'Timer',
    prompt: '7일 연장 누락 방지 액션 3개를 만들어줘.',
  },
  {
    id: 'zigbang-connect',
    name: '통학 동선',
    description: '거주지 체크리스트',
    category: '부동산',
    badge: '동선',
    icon: 'Home',
    prompt: '통학 동선 기준 거주지 체크리스트를 만들어줘.',
  },
  {
    id: 'neighborhood-compare',
    name: '동네 비교',
    description: '학군·교통·보육 비교',
    category: '부동산',
    badge: '비교',
    icon: 'BarChart3',
    prompt: '이사 후보 동네 3곳을 학군, 교통, 보육 기준으로 비교해줘.',
  },
  {
    id: 'finance-budget',
    name: '예산 플래너',
    description: '월 예산 시뮬레이션',
    category: '금융',
    badge: '예산',
    icon: 'CreditCard',
    prompt: '보육비와 생활비를 포함한 월 예산표를 만들어줘.',
  },
  {
    id: 'subsidy-check',
    name: '보육료 지원',
    description: '지원금 수령 체크',
    category: '금융',
    badge: '지원금',
    icon: 'Landmark',
    prompt: '받을 수 있는 보육료 지원금을 전부 알려줘.',
  },
  {
    id: 'shopping-list',
    name: '준비물 체크',
    description: '입소 준비물 우선순위',
    category: '쇼핑',
    badge: '리스트',
    icon: 'ShoppingCart',
    prompt: '입소 준비물 쇼핑 리스트를 우선순위로 정리해줘.',
  },
  {
    id: 'season-deals',
    name: '시즌 아이템',
    description: '계절별 추천 용품',
    category: '쇼핑',
    badge: '시즌',
    icon: 'Gift',
    prompt: '이번 계절 입소 준비에 필요한 아이템을 추천해줘.',
  },
  {
    id: 'group-buy',
    name: '공동구매 보드',
    description: '동네 수요 템플릿',
    category: '공동구매',
    badge: '로컬',
    icon: 'ClipboardList',
    prompt: '동네 공동구매 모집 글 템플릿을 작성해줘.',
  },
  {
    id: 'bulk-price',
    name: '단체 할인',
    description: '인기 품목 최저가',
    category: '공동구매',
    badge: '할인',
    icon: 'Handshake',
    prompt: '육아 인기 품목 공동구매 최저가를 알려줘.',
  },
  {
    id: 'family-trip',
    name: '여행 플랜',
    description: '연령대 맞춤 일정',
    category: '여행',
    badge: '주말',
    icon: 'Compass',
    prompt: '아이 연령대 맞춤 1박2일 일정을 짜줘.',
  },
  {
    id: 'nearby-play',
    name: '주변 놀이시설',
    description: '30분 이내 추천',
    category: '여행',
    badge: '근처',
    icon: 'MapPinned',
    prompt: '집에서 30분 이내 아이와 갈 수 있는 놀이시설을 추천해줘.',
  },
  {
    id: 'extension-guard-safe',
    name: '연장 가드',
    description: '7일 카운트다운 액션',
    category: '안전',
    badge: 'D+7',
    icon: 'ShieldCheck',
    prompt: '7일 연장 누락 방지 액션 3개를 만들어줘.',
  },
  {
    id: 'document-check',
    name: '서류 체크',
    description: '입소 신청 준비물',
    category: '안전',
    badge: '서류',
    icon: 'FileCheck',
    prompt: '입소 신청에 필요한 서류를 빠짐없이 정리해줘.',
  },
]

export const GET = (request: NextRequest) => {
  const params = new URL(request.url).searchParams
  const category = params.get('category')?.trim() || '추천'
  const q = params.get('q')?.trim().toLowerCase() || ''

  const categories = Array.from(new Set(CONNECT_APPS.map((app) => app.category)))

  const data = CONNECT_APPS.filter((app) => {
    if (app.category !== category) return false
    if (!q) return true

    const terms = [app.name, app.description]
    if (app.badge) terms.push(app.badge)
    return terms.some((value) => value.toLowerCase().includes(q))
  })

  return NextResponse.json({
    success: true,
    data,
    categories,
  })
}
