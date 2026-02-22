# 도토리 CODEX V3 — Part 2: 컴포넌트 전체 설계

> **⚠️ 아카이브** — 초기 설계. 현재 40+ 커스텀 컴포넌트 (ActionCard/FilterChip/ProgressStepper 미구현)
> **현재 상태:** `docs/ops/MASTER_v1.md` 참조

> Catalyst 27개 = 그대로 복사 (import 경로만 수정).
> 아래 16개 = 도토리 전용, 직접 제작.

---

## Catalyst 27개 파일 용도 매핑

| 파일 | 인앱 용도 | 우선순위 |
|------|----------|---------|
| alert.tsx | 에러/경고 표시 | P0 |
| avatar.tsx | 채팅 AI 아바타, 프로필 | P0 |
| badge.tsx | 시설유형, 상태, TO표시 | P0 |
| button.tsx | 모든 CTA | P0 |
| checkbox.tsx | 서류체크, 액션확인 동의 | P0 |
| combobox.tsx | 시설검색 자동완성, 동읍면 선택 | P1 |
| description-list.tsx | 시설상세, 액션 프리뷰 | P0 |
| dialog.tsx | ActionConfirmSheet 기반 | P0 |
| divider.tsx | 섹션 구분 | P2 |
| dropdown.tsx | 정렬/필터 옵션 | P1 |
| fieldset.tsx | 폼 그룹 래퍼 | P1 |
| heading.tsx | 화면 제목 | P0 |
| input.tsx | 검색바, 채팅입력, 폼 | P0 |
| link.tsx | 내부 네비게이션 | P0 |
| listbox.tsx | 셀렉트 대안 | P2 |
| navbar.tsx | 랜딩에서만 사용 | P2 |
| pagination.tsx | 시설목록 페이지네이션 | P2 |
| radio.tsx | 온보딩 성별선택 | P1 |
| select.tsx | 시도/시군구/시설유형 | P0 |
| sidebar-layout.tsx | ❌ 인앱 사용안함 (데스크톱 전용) | - |
| sidebar.tsx | ❌ 인앱 사용안함 | - |
| stacked-layout.tsx | ❌ 인앱 사용안함 | - |
| switch.tsx | 설정 토글 | P1 |
| table.tsx | 시설비교 테이블 | P1 |
| text.tsx | 본문 텍스트 | P0 |
| textarea.tsx | 글쓰기, 상세입력 | P1 |
| auth-layout.tsx | ❌ 도토리 자체 온보딩 사용 | - |

---

## 도토리 전용 컴포넌트 16개

### C-01. BottomTabBar

```
파일: src/components/dotori/BottomTabBar.tsx
'use client'
의존: @heroicons/react/24/outline + /24/solid, clsx, next/navigation (usePathname)

Props: 없음 (내부에 탭 데이터 하드코딩)

구조:
<nav> fixed bottom-0 inset-x-0 z-50
  bg-white/95 backdrop-blur-sm border-t border-dotori-200
  padding-bottom: env(safe-area-inset-bottom)

5개 탭 배열:
[
  { id: 'home',      label: '홈',    icon: HomeIcon,           href: '/' },
  { id: 'explore',   label: '탐색',   icon: MagnifyingGlassIcon, href: '/explore' },
  { id: 'chat',      label: '토리챗', icon: ChatBubbleLeftIcon,  href: '/chat' },
  { id: 'community', label: '이웃',   icon: UserGroupIcon,       href: '/community' },
  { id: 'my',        label: 'MY',    icon: UserCircleIcon,      href: '/my' },
]

스타일:
- 각 탭: flex flex-col items-center justify-center py-2 px-3 gap-0.5
- 비활성: text-zinc-400, outline 아이콘(24/outline)
- 활성: text-dotori-600 font-medium, solid 아이콘(24/solid)
- usePathname()으로 현재 경로 매칭 → 활성 탭 결정
  '/' → home, '/explore' → explore, '/chat' → chat 등
  startsWith 사용하여 하위 경로도 매칭

토리챗 탭 특별 스타일:
- 다른 탭보다 크게: w-14 h-14 -mt-5
- rounded-full bg-dotori-500 text-white shadow-lg
- 아이콘만 표시 (라벨 아래로 밀림)
- 액티브 시: bg-dotori-600
```

### C-02. ChatBubble

```
파일: src/components/dotori/ChatBubble.tsx
'use client'
의존: catalyst/avatar, catalyst/text, SourceChip, StreamingIndicator, clsx

Props:
  role: ChatRole                   // 'user' | 'assistant'
  children: ReactNode              // 텍스트 + 인라인 카드(FacilityCard, MapEmbed 등)
  timestamp: string                // ISO 8601
  sources?: SourceInfo[]           // 데이터 출처 칩
  isStreaming?: boolean            // AI 응답 중
  actions?: ActionButton[]         // 인라인 액션 버튼

구조:
user 버블:
  <div> flex justify-end mb-3
    <div> max-w-[85%] bg-dotori-500 text-white rounded-2xl rounded-br-sm
         px-4 py-2.5
      {children}
      <span> text-xs text-dotori-200 text-right block mt-1
        {formatRelativeTime(timestamp)}

assistant 버블:
  <div> flex justify-start gap-2.5 mb-3
    <Avatar> 도토리 로고, w-8 h-8 shrink-0 mt-1
    <div> max-w-[85%] flex flex-col gap-2
      <div> bg-white rounded-2xl rounded-bl-sm shadow-sm px-4 py-2.5
             border border-dotori-100
        {isStreaming ? <StreamingIndicator /> : children}
      {sources && (
        <div> flex flex-wrap gap-1.5 px-1
          {sources.map(s => <SourceChip {...s} />)}
      )}
      {actions && (
        <div> flex flex-wrap gap-2 px-1
          {actions.map(a => <Button size="sm" variant={a.variant}>{a.label}</Button>)}
      )}
      <span> text-xs text-zinc-400 px-1
        {formatRelativeTime(timestamp)}
```

### C-03. StreamingIndicator

```
파일: src/components/dotori/StreamingIndicator.tsx
'use client'
의존: motion/react

Props:
  text?: string    // 기본값: "토리가 분석 중이에요..."

구조:
<div> flex items-center gap-1.5
  {[0,1,2].map(i => (
    <motion.span
      className="w-2 h-2 rounded-full bg-dotori-400"
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: 'easeInOut' }}
    />
  ))}
  {text && <span className="text-sm text-dotori-500 ml-1">{text}</span>}
```

### C-04. FacilityCard

```
파일: src/components/dotori/FacilityCard.tsx
'use client'
의존: catalyst/badge, catalyst/button, SourceChip, clsx, @/lib/utils

Props:
  facility: Facility
  sources?: SourceInfo[]
  onAction?: (action: ActionType, facilityId: string) => void
  compact?: boolean                // true=리스트 아이템, false=전체 카드

compact=false (기본):
<div> bg-white rounded-xl p-4 shadow-sm border border-dotori-100
     {status별 좌측 보더: border-l-4}
     available → border-l-forest-500
     waiting   → border-l-amber-500
     full      → border-l-red-400

  상단: flex items-center justify-between
    <span> font-semibold text-base {facility.name}
    <Badge color={facilityTypeBadgeColor(facility.type)}>{facility.type}</Badge>

  중단: grid grid-cols-3 gap-3 mt-3 text-center
    정원: <span className="text-xl font-bold">{capacity.total}</span>
          <span className="text-xs text-zinc-500">정원</span>
    현원: 같은 패턴, 색상={current >= total ? 'text-red-600' : 'text-dotori-900'}
    대기: 같은 패턴, waiting > 0 → text-amber-600

  하단: flex items-center justify-between mt-3
    <SourceChip source="아이사랑" updatedAt={lastUpdated} freshness="realtime" />
    <div> flex gap-2
      <Button plain onClick={()=>onAction('register_interest', id)}>관심등록</Button>
      {status !== 'full' && (
        <Button color="dotori" onClick={()=>onAction('apply_waiting', id)}>
          {status === 'available' ? '입소신청' : '대기신청'}
        </Button>
      )}

compact=true:
<div> flex items-center gap-3 py-3 border-b border-dotori-100
  <div> w-1 h-10 rounded-full {status별 bg색}
  <div> flex-1 min-w-0
    <span> font-medium truncate {name}
    <span> text-xs text-zinc-500 {distance} · {type}
  <div> text-right
    <span> text-sm font-bold {status별 숫자/라벨}
    <span> text-xs text-zinc-400 {formatRelativeTime(lastUpdated)}
```

### C-05. ActionCard (NBA)

```
파일: src/components/dotori/ActionCard.tsx
'use client'
의존: catalyst/button, @heroicons/react, clsx

Props:
  icon: ReactNode                  // <SomeIcon className="w-5 h-5" />
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  priority?: NBAPriority           // 'high' | 'normal'
  dismissible?: boolean
  onDismiss?: () => void

구조:
<div> bg-white rounded-xl shadow-sm
     {priority==='high' ? 'border-l-4 border-l-dotori-500 bg-dotori-50/50' : 'border border-dotori-100'}
     p-4 flex items-start gap-3

  <div> shrink-0 p-2 rounded-lg
       {priority==='high' ? 'bg-dotori-100' : 'bg-zinc-100'}
    {icon}

  <div> flex-1 min-w-0
    <p> font-semibold text-sm {title}
    <p> text-xs text-zinc-500 mt-0.5 {description}

  <div> shrink-0 flex items-center gap-1
    <Button plain size="sm" onClick={onAction}>{actionLabel} →</Button>
    {dismissible && (
      <button onClick={onDismiss} className="p-1 text-zinc-400 hover:text-zinc-600">
        <XMarkIcon className="w-4 h-4" />
      </button>
    )}
```

### C-06. SourceChip

```
파일: src/components/dotori/SourceChip.tsx
의존: clsx, @/lib/utils (formatRelativeTime, freshnessColor)

Props:
  source: DataSource
  updatedAt: string
  freshness: DataFreshness

구조:
<span> inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
       {freshnessColor(freshness)}
  <span className="w-1.5 h-1.5 rounded-full {freshnessIndicator}" />
  {source} · {formatRelativeTime(updatedAt)}

freshnessIndicator:
  realtime → bg-forest-500 animate-pulse
  recent   → bg-amber-500
  cached   → bg-zinc-400
```

### C-07. FilterChip

```
파일: src/components/dotori/FilterChip.tsx
'use client'
의존: clsx

Props:
  label: string
  selected: boolean
  onToggle: () => void
  icon?: ReactNode
  size?: 'sm' | 'md'

구조:
<button onClick={onToggle}
  className={clsx(
    'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
    size==='sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
    selected
      ? 'bg-dotori-500 text-white border border-transparent'
      : 'bg-white text-dotori-700 border border-dotori-200 hover:bg-dotori-100'
  )}
>
  {icon}
  {label}
```

### C-08. ActionConfirmSheet

```
파일: src/components/dotori/ActionConfirmSheet.tsx
'use client'
의존: catalyst/dialog, catalyst/description-list, catalyst/checkbox, catalyst/button,
     StreamingIndicator, clsx, @heroicons/react (CheckCircleIcon, ExclamationCircleIcon)

Props:
  open: boolean
  onClose: () => void
  title: string                    // "대기 신청 확인"
  description?: string             // "아래 내용을 확인해주세요"
  preview: Record<string, string>  // { 시설명: '해피어린이집', 아이: '서연 (2024.03)' }
  onConfirm: () => void
  status: ActionStatus             // 'idle' | 'confirming' | 'executing' | 'success' | 'error'
  error?: string

⚠️ Catalyst Dialog를 기반으로 하되, 모바일 바텀시트 형태로 변형:
- Dialog 자체가 이미 모바일에서 rounded-t-3xl + translate-y 트랜지션 지원
- className 오버라이드로 바텀시트 위치 조정

내부 상태:
  const [agreed, setAgreed] = useState(false)

렌더링 분기:

status === 'idle' || 'confirming':
  <DialogTitle>{title}</DialogTitle>
  <DialogDescription>{description}</DialogDescription>
  <DescriptionList>
    {Object.entries(preview).map(([k,v]) => (
      <DescriptionTerm>{k}</DescriptionTerm>
      <DescriptionDetails>{v}</DescriptionDetails>
    ))}
  </DescriptionList>
  <Checkbox checked={agreed} onChange={setAgreed}>
    위 내용이 맞습니다
  </Checkbox>
  <div> flex gap-3 mt-4
    <Button plain onClick={onClose}>취소</Button>
    <Button color="dotori" disabled={!agreed} onClick={onConfirm}>확인</Button>

status === 'executing':
  <div> flex flex-col items-center py-8 gap-3
    <StreamingIndicator text="처리 중이에요..." />
    모든 버튼 disabled

status === 'success':
  <div> flex flex-col items-center py-8 gap-3
    <CheckCircleIcon className="w-12 h-12 text-forest-500" />
    <p> text-lg font-semibold "완료되었습니다"
    <Button onClick={onClose}>확인</Button>

status === 'error':
  <div> flex flex-col items-center py-8 gap-3
    <ExclamationCircleIcon className="w-12 h-12 text-red-500" />
    <p> text-sm text-red-600 {error}
    <div> flex gap-3
      <Button plain onClick={onClose}>닫기</Button>
      <Button color="dotori" onClick={onConfirm}>재시도</Button>
```

### C-09. Toast + ToastProvider

```
파일: src/components/dotori/ToastProvider.tsx
'use client'
의존: React.createContext, motion/react

ToastProvider:
  const [toasts, setToasts] = useState<ToastData[]>([])
  addToast(toast): setToasts(prev => [...prev.slice(-2), toast])
  removeToast(id): setToasts(prev => prev.filter(t => t.id !== id))
  useEffect: 각 toast마다 setTimeout(removeToast, duration || 4000)
  <ToastContext.Provider value={{ addToast }}>
    {children}
    <ToastContainer toasts={toasts} onRemove={removeToast} />
  </ToastContext.Provider>

파일: src/components/dotori/Toast.tsx
'use client'
의존: motion/react, @heroicons/react, clsx

Toast 단일 컴포넌트:
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 20, opacity: 0 }}
    className="bg-dotori-900 text-white rounded-xl px-4 py-3 shadow-2xl
               flex items-center gap-3 mx-4 mb-2"
  >
    {type별 아이콘:
      success → CheckCircleIcon text-forest-400
      error   → XCircleIcon text-red-400
      info    → InformationCircleIcon text-blue-400
      undo    → ArrowUturnLeftIcon text-dotori-300
    }
    <span className="flex-1 text-sm">{message}</span>
    {action && (
      <button onClick={action.onClick}
        className="text-sm font-semibold text-dotori-300 hover:text-white">
        {action.label}
      </button>
    )}
  </motion.div>

ToastContainer:
  <div className="fixed bottom-20 inset-x-0 z-[60] flex flex-col-reverse items-center pointer-events-none">
    <AnimatePresence>
      {toasts.map(t => <Toast key={t.id} {...t} />)}
    </AnimatePresence>
  </div>
  bottom-20 = BottomTabBar 위
```

### C-10. ProgressStepper

```
파일: src/components/dotori/ProgressStepper.tsx
의존: @heroicons/react (CheckIcon), clsx

Props:
  steps: { label: string }[]
  currentStep: number              // 0-indexed

구조:
<div className="flex items-center w-full">
  {steps.map((step, i) => (
    <Fragment key={i}>
      {/* 스텝 원형 */}
      <div className={clsx(
        'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0',
        i < currentStep && 'bg-forest-500 text-white',
        i === currentStep && 'bg-dotori-500 text-white ring-4 ring-dotori-100',
        i > currentStep && 'bg-zinc-200 text-zinc-400'
      )}>
        {i < currentStep ? <CheckIcon className="w-4 h-4" /> : i + 1}
      </div>
      {/* 연결선 */}
      {i < steps.length - 1 && (
        <div className={clsx(
          'flex-1 h-0.5 mx-2',
          i < currentStep ? 'bg-forest-500' : 'bg-zinc-200'
        )} />
      )}
    </Fragment>
  ))}
</div>
<div className="flex justify-between mt-1.5">
  {steps.map((step, i) => (
    <span key={i} className={clsx(
      'text-xs text-center',
      i <= currentStep ? 'text-dotori-700 font-medium' : 'text-zinc-400'
    )} style={{ width: `${100/steps.length}%` }}>
      {step.label}
    </span>
  ))}
</div>
```

### C-11. MapEmbed (V2에서 누락)

```
파일: src/components/dotori/MapEmbed.tsx
'use client'
의존: clsx

Props:
  facilities: { id: string; name: string; lat: number; lng: number; status: FacilityStatus }[]
  center?: { lat: number; lng: number }
  height?: string                  // 기본 'h-48'
  onMarkerClick?: (id: string) => void

구조:
MVP에서는 정적 지도 이미지(Kakao Static Map API)를 사용.
인터랙티브 지도는 Phase 2에서 Kakao Maps SDK로 교체.

<div className={clsx('rounded-xl overflow-hidden border border-dotori-100', height || 'h-48')}>
  {/* MVP: 정적 이미지 */}
  <img
    src={`https://dapi.kakao.com/v2/maps/staticmap?...`}
    alt="시설 위치 지도"
    className="w-full h-full object-cover"
  />
  {/* 오버레이: 시설 수 표시 */}
  <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm">
    📍 {facilities.length}곳
  </div>
</div>

⚠️ Phase 2 업그레이드 시:
- npm install react-kakao-maps-sdk 추가
- useEffect 내부에서 kakao.maps.Map 초기화
- 커스텀 마커: status별 색상 (green=available, amber=waiting, red=full)
- 마커 클릭 → 하단 FacilityCard compact 슬라이드업
```

### C-12. CompareTable (V2에서 누락)

```
파일: src/components/dotori/CompareTable.tsx
'use client'
의존: catalyst/badge, clsx, @/lib/utils

Props:
  facilities: Facility[]           // 2~3개
  highlightBest?: boolean          // 최적값 하이라이트

구조:
<div className="overflow-x-auto -mx-4 px-4">
  <div className="inline-flex gap-3 min-w-full pb-4">
    {facilities.map(f => (
      <div key={f.id} className={clsx(
        'flex-shrink-0 w-64 bg-white rounded-xl p-4 border',
        highlightBest && isBest(f) ? 'border-dotori-500 ring-2 ring-dotori-200' : 'border-dotori-100'
      )}>
        {highlightBest && isBest(f) && (
          <Badge color="amber" className="mb-2">AI 추천</Badge>
        )}
        <h3 className="font-semibold">{f.name}</h3>
        <Badge color={facilityTypeBadgeColor(f.type)} className="mt-1">{f.type}</Badge>

        <div className="mt-3 space-y-2 text-sm">
          <Row label="정원" value={f.capacity.total} />
          <Row label="현원" value={f.capacity.current} highlight={f.capacity.current < f.capacity.total} />
          <Row label="대기" value={f.capacity.waiting} highlight={f.capacity.waiting === 0} />
          <Row label="거리" value={f.distance} />
          <Row label="평점" value={f.rating ? `${f.rating}★` : '-'} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {f.features.map(feat => (
            <span className="text-xs px-2 py-0.5 rounded-full bg-dotori-100 text-dotori-700">
              {feat}
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
</div>

isBest 로직:
- 전체 비교 후 available > waiting > full 순서
- 동점이면 대기 수가 적은 쪽
- 동점이면 거리가 가까운 쪽
```

### C-13. EmptyState (V2에서 누락)

```
파일: src/components/dotori/EmptyState.tsx
의존: catalyst/button, clsx

Props:
  icon?: ReactNode                 // 큰 아이콘 (40x40)
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void

구조:
<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
  {icon && (
    <div className="mb-4 p-4 rounded-full bg-dotori-100 text-dotori-400">
      {icon}
    </div>
  )}
  <h3 className="text-lg font-semibold text-dotori-800">{title}</h3>
  {description && (
    <p className="mt-1 text-sm text-zinc-500 max-w-xs">{description}</p>
  )}
  {actionLabel && (
    <Button className="mt-4" color="dotori" href={actionHref} onClick={onAction}>
      {actionLabel}
    </Button>
  )}
</div>
```

### C-14. Skeleton

```
파일: src/components/dotori/Skeleton.tsx
의존: clsx

Props:
  variant: 'card' | 'list' | 'chat' | 'text'
  count?: number                   // list/text 반복 수 (기본 3)

구조:
const pulse = 'animate-pulse bg-dotori-100 rounded-lg'

card:
  <div className={clsx(pulse, 'h-40 rounded-xl')} />

list:
  Array(count).map(_ => (
    <div className="flex items-center gap-3 py-3">
      <div className={clsx(pulse, 'w-10 h-10 rounded-full')} />
      <div className="flex-1 space-y-2">
        <div className={clsx(pulse, 'h-4 w-3/4')} />
        <div className={clsx(pulse, 'h-3 w-1/2')} />
      </div>
    </div>
  ))

chat:
  <div className="flex gap-2.5 mb-3">
    <div className={clsx(pulse, 'w-8 h-8 rounded-full shrink-0')} />
    <div className={clsx(pulse, 'h-20 w-3/4 rounded-2xl rounded-bl-sm')} />
  </div>

text:
  Array(count).map((_, i) => (
    <div className={clsx(pulse, 'h-4 mb-2', i === count-1 && 'w-2/3')} />
  ))
```

### C-15. Wallpaper (Oatmeal 패턴 재작성)

```
파일: src/components/dotori/Wallpaper.tsx
의존: clsx

Oatmeal의 wallpaper.tsx를 도토리용으로 재작성.
@tailwindplus/elements 의존 없음. 순수 React + Tailwind.

Props:
  color?: 'warm' | 'green' | 'neutral'  // 기본 'warm'
  children: ReactNode
  className?: string

구조:
const noisePattern = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 100 100">
    <filter id="n"><feTurbulence type="turbulence" baseFrequency="1.4" numOctaves="1" seed="2" stitchTiles="stitch"/></filter>
    <rect width="100%" height="100%" filter="url(#n)"/>
  </svg>`.replace(/\s+/g, ' ')
)}")`

<div className={clsx(
  'relative overflow-hidden bg-linear-to-b',
  color === 'warm'    && 'from-[#b8956a] to-[#8d6840]',
  color === 'green'   && 'from-[#7a9468] to-[#4a6640]',
  color === 'neutral' && 'from-[#9a9590] to-[#706a65]',
  className
)}>
  <div
    className="absolute inset-0 opacity-25 mix-blend-overlay"
    style={{ backgroundPosition: 'center', backgroundImage: noisePattern }}
  />
  <div className="relative">{children}</div>
</div>
```

### C-16. FAQ (Oatmeal 패턴 재작성)

```
파일: src/components/dotori/FAQ.tsx 또는 src/components/landing/FAQ.tsx
'use client'
의존: @headlessui/react (Disclosure), @heroicons/react (PlusIcon, MinusIcon), clsx

Oatmeal의 faqs-accordion.tsx를 재작성.
ElDisclosure → Headless UI Disclosure로 교체.

Props:
  items: { question: string; answer: string }[]

구조:
<div className="divide-y divide-dotori-200">
  {items.map((item, i) => (
    <Disclosure key={i} as="div">
      {({ open }) => (
        <>
          <DisclosureButton className="flex w-full items-center justify-between py-4 text-left">
            <span className="text-base font-medium text-dotori-950">
              {item.question}
            </span>
            {open ? (
              <MinusIcon className="w-5 h-5 text-dotori-500 shrink-0" />
            ) : (
              <PlusIcon className="w-5 h-5 text-dotori-400 shrink-0" />
            )}
          </DisclosureButton>
          <DisclosurePanel className="pb-4 pr-12 text-sm text-zinc-600 leading-relaxed">
            {item.answer}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  ))}
</div>
```

---

## 컴포넌트 의존성 그래프

```
Catalyst (원자) ───────────────────────────
 ├─ button, badge, avatar, dialog,
 │  input, checkbox, select, etc.
 │
 └─► 도토리 (분자) ────────────────────────
      ├─ BottomTabBar (heroicons, usePathname)
      ├─ ChatBubble (avatar, text, SourceChip, StreamingIndicator)
      ├─ StreamingIndicator (motion)
      ├─ FacilityCard (badge, button, SourceChip)
      ├─ ActionCard (button, heroicons)
      ├─ SourceChip (utils)
      ├─ FilterChip (standalone)
      ├─ ActionConfirmSheet (dialog, description-list, checkbox, button, StreamingIndicator)
      ├─ Toast/ToastProvider (motion, heroicons)
      ├─ ProgressStepper (heroicons)
      ├─ MapEmbed (standalone → Phase2: kakao SDK)
      ├─ CompareTable (badge, utils)
      ├─ EmptyState (button)
      ├─ Skeleton (standalone)
      ├─ Wallpaper (standalone, 랜딩용)
      └─ FAQ (headless-ui Disclosure, 랜딩용)
```

---

*Part 2 끝. Part 3 (화면 조립 + UX 패턴 + 빌드 순서)로 이어진다.*
