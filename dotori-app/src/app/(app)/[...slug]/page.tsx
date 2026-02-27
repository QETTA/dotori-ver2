import Link from 'next/link'
import {
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { copy } from '@/lib/brand-copy'
import { DS_STATUS } from '@/lib/design-system/tokens'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'

const section = (title: string, tone: keyof typeof DS_STATUS = 'available') => ({
  title,
  toneClass: DS_STATUS[tone].pill,
  dotClass: DS_STATUS[tone].dot,
})

const homeCards = [
  section('오늘의 이동 판단', 'available'),
  section('탐색 상태', 'waiting'),
  section('대기 목록', 'full'),
]

const quickActions = [
  { href: '/chat', label: '토리 톡 시작' },
  { href: '/explore', label: '시설 탐색' },
  { href: '/community', label: '커뮤니티 이동담화' },
  { href: '/my', label: '마이 홈' },
]

const cardClass =
  'rounded-2xl border border-dotori-100/70 bg-white p-4 shadow-sm'

type AppRoute =
  | { type: 'home' }
  | { type: 'chat' }
  | { type: 'explore' }
  | { type: 'facility'; id?: string }
  | { type: 'community' }
  | { type: 'community-detail'; id?: string }
  | { type: 'community-write' }
  | { type: 'my' }
  | { type: 'my-app-info' }
  | { type: 'my-documents'; id?: string }
  | { type: 'my-import' }
  | { type: 'my-interests' }
  | { type: 'my-notices' }
  | { type: 'my-notifications' }
  | { type: 'my-settings' }
  | { type: 'my-support' }
  | { type: 'my-terms' }
  | { type: 'my-waitlist'; id?: string }
  | { type: 'unknown' }

function resolve(slug?: string[]): AppRoute {
  if (!slug || slug.length === 0) return { type: 'home' }

  if (slug[0] === 'chat') return { type: 'chat' }
  if (slug[0] === 'explore') return { type: 'explore' }

  if (slug[0] === 'facility') {
    return { type: 'facility', id: slug[1] }
  }

  if (slug[0] === 'community') {
    if (slug[1] === undefined) return { type: 'community' }
    if (slug[1] === 'write') return { type: 'community-write' }
    return { type: 'community-detail', id: slug[1] }
  }

  if (slug[0] === 'my') {
    if (slug[1] === undefined) return { type: 'my' }
    if (slug[1] === 'app-info') return { type: 'my-app-info' }
    if (slug[1] === 'documents') {
      return { type: 'my-documents', id: slug[2] }
    }
    if (slug[1] === 'import') return { type: 'my-import' }
    if (slug[1] === 'interests') return { type: 'my-interests' }
    if (slug[1] === 'notices') return { type: 'my-notices' }
    if (slug[1] === 'notifications') return { type: 'my-notifications' }
    if (slug[1] === 'settings') return { type: 'my-settings' }
    if (slug[1] === 'support') return { type: 'my-support' }
    if (slug[1] === 'terms') return { type: 'my-terms' }
    if (slug[1] === 'waitlist') return { type: 'my-waitlist', id: slug[2] }
    return { type: 'my' }
  }

  if (slug[0] === 'app') return { type: 'home' }

  return { type: 'unknown' }
}

export default async function AppRedesignPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params
  const route = resolve(resolvedParams.slug)

  if (route.type === 'home') {
    return (
      <div className="space-y-4 pb-8">
        <section className="rounded-3xl border border-dotori-100 bg-white p-4 shadow-sm">
          <p className="text-label text-dotori-600">도토리 홈</p>
          <h1 className="mt-1 text-h1 text-dotori-900">반편성/이동 판단 대시보드</h1>
          <p className="mt-2 text-body-sm text-dotori-700">{copy.home.briefingTitle} + {copy.home.funnelGuide}</p>
        </section>

        <section className="grid gap-2 sm:grid-cols-2">
          {homeCards.map((card) => (
            <article
              key={card.title}
              className={`${cardClass} ${card.toneClass}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-h3 text-dotori-900">{card.title}</h2>
                <span className={`inline-flex h-2 w-2 rounded-full ${card.dotClass}`} />
              </div>
              <p className="mt-2 text-body-sm text-dotori-600">현재 기준 자동 스냅샷</p>
            </article>
          ))}
        </section>

        <section className="grid gap-2 sm:grid-cols-2">
          {quickActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white px-4 py-2.5 text-body-sm font-semibold text-dotori-800"
            >
              {item.label}
            </Link>
          ))}
        </section>
      </div>
    )
  }

  if (route.type === 'chat') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">토리 톡</h1>
        <div className={`${cardClass}`}>
          <p className="text-body text-dotori-700">{copy.chat.panelDescription}</p>
          <p className="mt-2 text-body-sm text-dotori-600">{copy.chat.emptyGuide}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {copy.chat.suggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white px-4 py-2.5 text-dotori-800"
            >
              <ChatBubbleLeftRightIcon className="mr-2 h-4 w-4" />
              {item}
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (route.type === 'explore') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">시설 탐색</h1>
        <div className="grid gap-2">
          <div className={`${cardClass}`}>
            <p className="text-body text-dotori-700">{copy.explore.searchPlaceholder}</p>
          </div>
          <div className={`${cardClass}`}>
            <div className="flex items-center justify-between text-dotori-800">
              <p>지도형 탐색</p>
              <MapPinIcon className="h-5 w-5" />
            </div>
            <p className="mt-2 text-body-sm text-dotori-600">지역/유형/거리 기준 정렬</p>
          </div>
        </div>
        <button className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white px-4 py-2.5">목록 더보기</button>
      </section>
    )
  }

  if (route.type === 'facility') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">시설 상세</h1>
        <p className="text-body-sm text-dotori-500">시설 ID: {route.id || '미지정'}</p>
        <div className={`${cardClass}`}>
          <p className="text-body text-dotori-700">현황: 입소 가능성, 거리, 대기 상태, 입소 플로우</p>
          <button className="mt-3 inline-flex min-h-11 items-center rounded-2xl bg-dotori-900 px-4 py-2.5 text-white">토리 요약 보기</button>
        </div>
      </section>
    )
  }

  if (route.type === 'community') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">커뮤니티</h1>
        <div className="grid gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`${cardClass}`}>
              <p className="text-h3 text-dotori-900">이동 이야기 {item}</p>
              <p className="mt-1 text-body-sm text-dotori-600">피드, 댓글, 추천 이동 사례</p>
            </div>
          ))}
        </div>
        <Link href="/community/write" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white px-4 py-2.5">글쓰기</Link>
      </section>
    )
  }

  if (route.type === 'community-detail') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">커뮤니티 상세</h1>
        <p className="text-body-sm text-dotori-500">게시글 ID: {route.id || '미지정'}</p>
        <div className={`${cardClass}`}>
          <p className="text-body text-dotori-700">댓글, AI 요약, 이동 가이드</p>
        </div>
      </section>
    )
  }

  if (route.type === 'community-write') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">글쓰기</h1>
        <textarea
          className="min-h-40 w-full rounded-2xl border border-dotori-200 p-3 text-body text-dotori-900"
          placeholder="이동 경험을 적어주세요"
        />
        <button className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dotori-900 px-4 py-2.5 text-white">등록</button>
      </section>
    )
  }

  if (route.type === 'my') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">마이페이지</h1>
        <div className="grid gap-2 sm:grid-cols-2">
          {[{ href: '/my/documents', label: '서류함' }, { href: '/my/waitlist', label: '입소 대기' }, { href: '/my/notifications', label: '알림' }, { href: '/my/settings', label: '설정' }].map((menu) => (
            <Link key={menu.href} href={menu.href} className="inline-flex min-h-11 items-center rounded-2xl border border-dotori-200 bg-white px-4 py-2.5 text-dotori-800">
              <UsersIcon className="mr-2 h-4 w-4" />
              {menu.label}
            </Link>
          ))}
        </div>
      </section>
    )
  }

  if (route.type === 'my-app-info') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">앱 정보</h1>
        <div className={cardClass}> <p className="text-body text-dotori-700">버전, 이용안내, 공지 관리</p> </div>
      </section>
    )
  }

  if (route.type === 'my-documents') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">서류함{route.id ? ` #${route.id}` : ''}</h1>
        <div className={cardClass}> <p className="text-body-sm text-dotori-700">문서 목록 / 업로드 / 상태</p> </div>
      </section>
    )
  }

  if (route.type === 'my-import') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">가져오기</h1>
        <div className={cardClass}><p className="text-body text-dotori-700">CSV/내보내기 / 동기화 상태</p></div>
      </section>
    )
  }

  if (route.type === 'my-interests') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">관심사</h1>
        <div className={cardClass}><p className="text-body text-dotori-700">유형/지역/환경 선호도 설정</p></div>
      </section>
    )
  }

  if (route.type === 'my-notices') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">공지함</h1>
        <div className={cardClass}><p className="text-body text-dotori-700">시스템 공지와 알림 정책</p></div>
      </section>
    )
  }

  if (route.type === 'my-notifications') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">알림함</h1>
        <div className={cardClass}><p className="text-body text-dotori-700">상태별 메시지 분류</p></div>
      </section>
    )
  }

  if (route.type === 'my-settings') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">설정</h1>
        <div className={cardClass}><p className="text-body text-dotori-700">계정/알림/로그인 연동</p></div>
      </section>
    )
  }

  if (route.type === 'my-support') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">고객 지원</h1>
        <div className={cardClass}><p className="text-body text-dotori-700">1:1 문의 및 FAQ</p></div>
      </section>
    )
  }

  if (route.type === 'my-terms') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">이용약관</h1>
        <div className={cardClass}><p className="text-body text-dotori-700">서비스 정책 문서</p></div>
      </section>
    )
  }

  if (route.type === 'my-waitlist') {
    return (
      <section className="space-y-4 pb-8">
        <h1 className="text-h1 text-dotori-900">입소 대기 {route.id ? `#${route.id}` : ''}</h1>
        <div className={cardClass}><p className="text-body text-dotori-700">대기 상태/진행 체크</p></div>
      </section>
    )
  }

  return (
    <section className="space-y-4 pb-8">
      <h1 className="text-h1 text-dotori-900">페이지를 찾을 수 없습니다</h1>
      <p className="text-body text-dotori-700">요청한 경로를 찾지 못했어요. 혹시 이것을 찾으셨나요?</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white text-dotori-800 font-medium">홈</Link>
        <Link href="/explore" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white text-dotori-800 font-medium">시설 탐색</Link>
        <Link href="/chat" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white text-dotori-800 font-medium">토리챗</Link>
        <Link href="/community" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white text-dotori-800 font-medium">커뮤니티</Link>
        <Link href="/my" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white text-dotori-800 font-medium">마이페이지</Link>
        <Link href="/onboarding" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 bg-white text-dotori-800 font-medium">온보딩</Link>
      </div>
      <ToRiFAB prompt="원하는 페이지를 찾아줘" />
    </section>
  )
}
