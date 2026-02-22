# 도토리 CODEX V3 — Part 1: 셋업·테마·타입·설정

> **⚠️ 아카이브** — 초기 설계 문서. 현재 코드: Next.js 16.1, React 19, TS 5.8, motion/react 12.34
> **현재 상태:** `docs/ops/MASTER_v1.md` 참조

> Claude Code CLI(Ubuntu)용. 이 문서 + Part 2(컴포넌트) + Part 3(화면·패턴)을 순서대로 실행한다.

---

## 0. 의존성 정합표

4개 ZIP의 의존성이 전부 다르다. 아래로 **강제 통일**한다.

```
충돌 현황:
Catalyst  → Next 15,   TW 4.1.15, motion 12,        HUI 2.2.6
Pocket    → Next 15.5, TW 4.1.15, framer-motion 12,  HUI 2.2.6
Salient   → Next 15.5, TW 4.1.15, (애니메이션 없음),   HUI 2.2.6
Oatmeal   → Next 16,   TW 4.1.18, @tailwindplus/elements(비공개)
```

**통일 버전 (Catalyst 기준):**

| 패키지 | 버전 | 비고 |
|--------|------|------|
| next | ^15.5.10 | Pocket/Salient 기준, 안정적 |
| react / react-dom | ^19.2.4 | |
| tailwindcss | ^4.1.15 | devDependencies |
| @tailwindcss/postcss | ^4.1.15 | devDependencies |
| @headlessui/react | ^2.2.6 | |
| @heroicons/react | ^2.2.0 | |
| motion | ^12.23.11 | Catalyst 기준. Pocket의 framer-motion과 동일 라이브러리 |
| clsx | ^2.1.1 | |
| typescript | ^5.8.3 | devDependencies |

**⛔ 절대 설치 금지:**
- `framer-motion` → `motion` 사용 (동일 라이브러리, 새 패키지명)
- `@tailwindplus/elements` → npm 비공개. Oatmeal 코드 직접 import 불가

---

## 1. CLI 초기 셋업 (복붙 실행)

```bash
# ── 프로젝트 생성 ──
npx create-next-app@latest dotori-app \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack

cd dotori-app

# ── 의존성 설치 ──
npm install @headlessui/react@^2.2.6 @heroicons/react@^2.2.0 \
  motion@^12.23.11 clsx@^2.1.1

# ── 개발 의존성 ──
npm install -D sharp@0.34.3 \
  prettier prettier-plugin-tailwindcss prettier-plugin-organize-imports

# ── 보일러플레이트 삭제 ──
rm -f src/app/page.tsx src/app/globals.css src/app/page.module.css
rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg

# ── 디렉토리 구조 생성 ──
mkdir -p src/components/{catalyst,dotori,landing,shared}
mkdir -p src/app/\(app\)/{explore,chat,community,my/settings}
mkdir -p src/app/\(app\)/facility/\[id\]
mkdir -p src/app/\(onboarding\)
mkdir -p src/app/\(landing\)
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/hooks
mkdir -p public/images
mkdir -p public/fonts
```

---

## 2. ZIP 추출 명령 (정확한 경로)

```bash
# ── 작업 디렉토리 ──
EXTRACT=/tmp/dotori-extract
rm -rf $EXTRACT && mkdir -p $EXTRACT

# ── 2-1. Catalyst 컴포넌트 (27개 파일) ──
unzip -j catalyst-ui-kit.zip "catalyst-ui-kit/typescript/*.tsx" -d $EXTRACT/catalyst
cp $EXTRACT/catalyst/*.tsx src/components/catalyst/

# ── 2-2. Catalyst 내부 상호참조 수정 ──
# 원본: import { Link } from './link'
# 변경: import { Link } from '@/components/catalyst/link'
cd src/components/catalyst
for f in *.tsx; do
  sed -i "s|from '\./|from '@/components/catalyst/|g" "$f"
done
cd -

# ── 2-3. Pocket 랜딩 컴포넌트 ──
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/Hero.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/PhoneFrame.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/AppScreen.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/PrimaryFeatures.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/SecondaryFeatures.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/Reviews.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/CallToAction.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/AppStoreLink.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/Header.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/Footer.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/Container.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/Button.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/NavLinks.tsx" -d $EXTRACT/pocket
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/components/Logo.tsx" -d $EXTRACT/pocket
cp $EXTRACT/pocket/*.tsx src/components/landing/

# Pocket 이미지
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/images/phone-frame.svg" -d public/images/
unzip -j pocket.zip "tailwind-plus-pocket/pocket-ts/src/images/qr-code.svg" -d public/images/

# ── 2-4. Pocket 랜딩 수정 ──
cd src/components/landing
# framer-motion → motion
for f in *.tsx; do
  sed -i "s|from 'framer-motion'|from 'motion/react'|g" "$f"
done
# 내부 import 경로 수정
for f in *.tsx; do
  sed -i "s|from '@/components/Container'|from '@/components/landing/Container'|g" "$f"
  sed -i "s|from '@/components/Button'|from '@/components/landing/Button'|g" "$f"
  sed -i "s|from '@/components/Logo'|from '@/components/landing/Logo'|g" "$f"
  sed -i "s|from '@/components/NavLinks'|from '@/components/landing/NavLinks'|g" "$f"
  sed -i "s|from '@/components/PhoneFrame'|from '@/components/landing/PhoneFrame'|g" "$f"
  sed -i "s|from '@/components/AppScreen'|from '@/components/landing/AppScreen'|g" "$f"
  sed -i "s|from '@/components/CircleBackground'|from '@/components/landing/CircleBackground'|g" "$f"
  sed -i "s|from '@/components/CirclesBackground'|from '@/components/landing/CirclesBackground'|g" "$f"
  sed -i "s|from '@/images/|from '/images/|g" "$f"
done
cd -

# ── 2-5. Salient Pricing + Testimonials ──
unzip -j salient.zip "tailwind-plus-salient/salient-ts/src/components/Pricing.tsx" -d $EXTRACT/salient
unzip -j salient.zip "tailwind-plus-salient/salient-ts/src/components/Testimonials.tsx" -d $EXTRACT/salient
unzip -j salient.zip "tailwind-plus-salient/salient-ts/src/components/Container.tsx" -d $EXTRACT/salient
cp $EXTRACT/salient/Pricing.tsx src/components/landing/SalientPricing.tsx
cp $EXTRACT/salient/Testimonials.tsx src/components/landing/SalientTestimonials.tsx
# Salient Container → 별도 이름 충돌 방지
# SalientPricing, SalientTestimonials 내부의 Container import를 @/components/landing/Container로 변경

# ── 2-6. Oatmeal — 참고용만 추출 (직접 import 불가) ──
mkdir -p $EXTRACT/oatmeal-ref
unzip -j oatmeal-olive-instrument.zip "tailwind.css" -d $EXTRACT/oatmeal-ref
unzip -j oatmeal-olive-instrument.zip "components/elements/wallpaper.tsx" -d $EXTRACT/oatmeal-ref
unzip -j oatmeal-olive-instrument.zip "components/sections/stats-four-columns.tsx" -d $EXTRACT/oatmeal-ref
unzip -j oatmeal-olive-instrument.zip "components/sections/faqs-accordion.tsx" -d $EXTRACT/oatmeal-ref
unzip -j oatmeal-olive-instrument.zip "components/sections/plan-comparison-table.tsx" -d $EXTRACT/oatmeal-ref
# → $EXTRACT/oatmeal-ref/ 파일들을 참고하여 도토리 코드로 재작성
# → @tailwindplus/elements import는 Headless UI 또는 직접 구현으로 교체
# → ElDisclosure → Headless UI Disclosure
# → clsx/lite → clsx
```

---

## 3. 설정 파일들 (실제 코드)

### 3-1. postcss.config.mjs

```javascript
// 파일: postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### 3-2. next.config.ts

```typescript
// 파일: next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Pretendard CDN 허용
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

export default nextConfig
```

### 3-3. prettier.config.js

```javascript
// 파일: prettier.config.js
module.exports = {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  plugins: [
    'prettier-plugin-organize-imports',
    'prettier-plugin-tailwindcss',
  ],
  tailwindStylesheet: './src/app/globals.css',
  tailwindFunctions: ['clsx'],
}
```

### 3-4. tsconfig.json paths 확인

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 4. 테마 시스템 (globals.css)

파일: `src/app/globals.css`

```css
@import 'tailwindcss';

/* ──────────────────────────────────────
   도토리 디자인 토큰
   Oatmeal @theme 구조 참고, @tailwindplus/elements 의존 없음
   ────────────────────────────────────── */

@theme {
  /* ── 폰트 ── */
  --font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont,
    system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo',
    'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
  --font-display: 'Pretendard Variable', 'Pretendard', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* ── 한글 최적화 타이포 스케일 ──
     한글은 영문보다 높이가 높아 line-height를 더 넉넉하게 잡는다 */
  --text-*: initial;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.125rem;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.375rem;
  --text-base: 1rem;
  --text-base--line-height: 1.625rem;
  --text-lg: 1.125rem;
  --text-lg--line-height: 1.875rem;
  --text-xl: 1.25rem;
  --text-xl--line-height: 2rem;
  --text-2xl: 1.5rem;
  --text-2xl--line-height: 2.25rem;
  --text-3xl: 1.875rem;
  --text-3xl--line-height: 2.5rem;

  /* ── Primary: Dotori Warm Brown ──
     앱의 따뜻한 베이지~골드~브라운 톤
     Hue 65~75 (warm amber-brown), oklch */
  --color-dotori-50:  oklch(97.5% 0.008 72);
  --color-dotori-100: oklch(94.0% 0.018 72);
  --color-dotori-200: oklch(88.0% 0.035 70);
  --color-dotori-300: oklch(80.0% 0.060 68);
  --color-dotori-400: oklch(70.0% 0.090 65);
  --color-dotori-500: oklch(58.0% 0.100 62);
  --color-dotori-600: oklch(48.0% 0.088 60);
  --color-dotori-700: oklch(40.0% 0.072 58);
  --color-dotori-800: oklch(32.0% 0.052 56);
  --color-dotori-900: oklch(24.0% 0.032 54);
  --color-dotori-950: oklch(16.0% 0.016 52);

  /* ── Secondary: Forest Green ──
     성공, TO 있음, 자연, 안전 */
  --color-forest-50:  oklch(97.0% 0.008 148);
  --color-forest-100: oklch(93.0% 0.018 148);
  --color-forest-200: oklch(87.0% 0.035 148);
  --color-forest-300: oklch(78.0% 0.060 148);
  --color-forest-400: oklch(65.0% 0.085 148);
  --color-forest-500: oklch(52.0% 0.095 148);
  --color-forest-600: oklch(43.0% 0.080 148);
  --color-forest-700: oklch(36.0% 0.065 148);
  --color-forest-800: oklch(28.0% 0.045 148);
  --color-forest-900: oklch(20.0% 0.028 148);
  --color-forest-950: oklch(14.0% 0.014 148);

  /* ── Semantic ── */
  --color-warning:  oklch(78.0% 0.130 80);
  --color-danger:   oklch(58.0% 0.200 25);
  --color-info:     oklch(62.0% 0.110 245);

  /* ── Radius (모바일 둥근 UI) ── */
  --radius-sm:   0.375rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.25rem;
  --radius-3xl:  1.5rem;
  --radius-4xl:  2rem;
  --radius-full: 9999px;

  /* ── 애니메이션 (Pocket 키프레임 참고) ── */
  --animate-fade-in: fade-in 0.5s linear forwards;

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
}

/* ── 베이스 레이어 ── */
@layer base {
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
    background-color: var(--color-dotori-50);
    color: var(--color-dotori-950);
    word-break: keep-all;          /* 한글 단어 단위 줄바꿈 */
    overflow-wrap: break-word;
    scroll-behavior: smooth;
  }

  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    min-height: 100dvh;            /* dynamic viewport height */
  }

  /* 스크롤바 숨기기 (모바일 앱 느낌) */
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
}
```

---

## 5. 루트 레이아웃

파일: `src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '도토리 — AI 어린이집 입소 전략',
  description: '12,000+ 시설 데이터, 실시간 TO 모니터링, 24시간 AI 분석',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '도토리',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f5f0e8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard CDN */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="bg-dotori-50 text-dotori-950 antialiased">
        {children}
      </body>
    </html>
  )
}
```

---

## 6. PWA manifest

파일: `public/manifest.json`

```json
{
  "name": "도토리 — AI 어린이집 입소 전략",
  "short_name": "도토리",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f5f0e8",
  "theme_color": "#f5f0e8",
  "icons": [
    { "src": "/images/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/images/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 7. TypeScript 타입 정의

파일: `src/types/dotori.ts`

```typescript
/* ===== 시설 ===== */
export type FacilityType = '국공립' | '민간' | '가정' | '직장' | '협동' | '사회복지'
export type FacilityStatus = 'available' | 'waiting' | 'full'

export interface Facility {
  id: string
  name: string
  type: FacilityType
  status: FacilityStatus
  address: string
  lat: number
  lng: number
  distance?: string               // "도보 5분", "1.2km"
  phone?: string
  capacity: {
    total: number                  // 정원
    current: number                // 현원
    waiting: number                // 대기
  }
  features: string[]               // ['통학버스', '연장보육', '급식자체조리']
  rating?: number                  // 1~5
  reviewCount?: number
  lastUpdated: string              // ISO 8601
  images?: string[]
}

/* ===== 아이 프로필 ===== */
export interface ChildProfile {
  id: string
  name: string
  birthDate: string                // YYYY-MM
  gender: 'male' | 'female' | 'unspecified'
  specialNeeds?: string[]          // 특이사항
}

/* ===== 사용자 ===== */
export interface UserProfile {
  id: string
  nickname: string
  children: ChildProfile[]
  region: {
    sido: string                   // 시/도
    sigungu: string                // 시/군/구
    dong?: string                  // 동/읍/면
  }
  interests: string[]              // 관심 시설 ID 목록
  gpsVerified: boolean
  plan: 'free' | 'premium'
  onboardingCompleted: boolean
}

/* ===== 데이터 출처 ===== */
export type DataFreshness = 'realtime' | 'recent' | 'cached'
export type DataSource = '아이사랑' | '지도' | '후기' | '정부24' | 'AI분석'

export interface SourceInfo {
  source: DataSource
  updatedAt: string                // ISO 8601
  freshness: DataFreshness
  coverage?: string                // "전국 12,000+ 시설"
}

/* ===== 채팅 ===== */
export type ChatRole = 'user' | 'assistant'
export type EmbeddedCardType = 'facility' | 'map' | 'compare' | 'checklist' | 'chart'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  sources?: SourceInfo[]
  cards?: EmbeddedCard[]
  actions?: ActionButton[]
  isStreaming?: boolean
}

export interface EmbeddedCard {
  type: EmbeddedCardType
  data: unknown                    // 타입별 data shape
}

export interface ActionButton {
  id: string
  label: string
  action: ActionType
  variant: 'solid' | 'outline'
  icon?: string                    // heroicon 이름
}

/* ===== Write Action (핵심 UX 패턴) ===== */
export type ActionType =
  | 'register_interest'            // 관심시설 등록
  | 'apply_waiting'                // 대기 신청
  | 'set_alert'                    // 알림 설정
  | 'compare'                      // 비교하기
  | 'generate_checklist'           // 서류 체크리스트 생성
  | 'generate_report'              // 비교 리포트 생성

export type ActionStatus = 'idle' | 'confirming' | 'executing' | 'success' | 'error'

export interface ActionState {
  status: ActionStatus
  actionType?: ActionType
  preview?: Record<string, string> // 확인 프리뷰 key-value
  error?: string
  undoAvailable?: boolean
  undoDeadline?: string            // ISO 8601, 되돌리기 가능 기한
}

/* ===== 네비게이션 ===== */
export type TabId = 'home' | 'explore' | 'chat' | 'community' | 'my'

/* ===== 토스트 ===== */
export type ToastType = 'success' | 'error' | 'info' | 'undo'

export interface ToastData {
  id: string
  type: ToastType
  message: string
  action?: { label: string; onClick: () => void }
  duration?: number                // ms, 기본 4000
}

/* ===== NBA (Next Best Action) ===== */
export type NBAPriority = 'high' | 'normal'

export interface NBAItem {
  id: string
  icon: string                     // heroicon 이름
  title: string
  description: string
  actionLabel: string
  actionHref: string
  priority: NBAPriority
  dismissible: boolean
  condition: string                // 표시 조건 설명 (개발 참고용)
}

/* ===== 커뮤니티 ===== */
export interface CommunityPost {
  id: string
  author: {
    nickname: string
    avatar?: string
    verified: boolean              // GPS 인증
  }
  content: string
  facilityTags?: string[]          // 관련 시설 이름
  aiSummary?: string               // AI 요약 (접이식)
  likes: number
  comments: number
  createdAt: string
  category: 'question' | 'review' | 'info' | 'feedback'
}
```

---

## 8. 유틸리티 함수

파일: `src/lib/utils.ts`

```typescript
import clsx, { type ClassValue } from 'clsx'

/** Tailwind 클래스 병합 (clsx wrapper) */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** 상대 시간 포맷 (한국어) */
export function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diff = now - date

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '방금'
  if (minutes < 60) return `${minutes}분전`
  if (hours < 24) return `${hours}시간전`
  if (days < 7) return `${days}일전`
  return new Date(dateString).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

/** 시설 상태 → 한국어 라벨 */
export function facilityStatusLabel(status: 'available' | 'waiting' | 'full'): string {
  const map = { available: 'TO 있음', waiting: '대기 중', full: '마감' }
  return map[status]
}

/** 시설 유형 → Badge 색상 */
export function facilityTypeBadgeColor(
  type: string
): 'blue' | 'amber' | 'green' | 'purple' | 'pink' | 'zinc' {
  const map: Record<string, 'blue' | 'amber' | 'green' | 'purple' | 'pink' | 'zinc'> = {
    국공립: 'blue',
    민간: 'amber',
    가정: 'green',
    직장: 'purple',
    협동: 'pink',
    사회복지: 'zinc',
  }
  return map[type] ?? 'zinc'
}

/** 데이터 신선도 → 색상 */
export function freshnessColor(freshness: 'realtime' | 'recent' | 'cached'): string {
  const map = {
    realtime: 'text-forest-600 bg-forest-50',
    recent: 'text-amber-700 bg-amber-50',
    cached: 'text-zinc-500 bg-zinc-100',
  }
  return map[freshness]
}

/** 숫자 포맷 (1000 → 1,000) */
export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR')
}
```

---

## 9. 목업 데이터

파일: `src/lib/mock-data.ts`

```typescript
import type {
  CommunityPost,
  Facility,
  NBAItem,
  SourceInfo,
  UserProfile,
} from '@/types/dotori'

export const mockUser: UserProfile = {
  id: 'u1',
  nickname: '서연맘',
  children: [
    { id: 'c1', name: '서연', birthDate: '2024-03', gender: 'female' },
  ],
  region: { sido: '서울특별시', sigungu: '강남구', dong: '역삼동' },
  interests: ['f1', 'f3'],
  gpsVerified: true,
  plan: 'free',
  onboardingCompleted: true,
}

export const mockUserEmpty: UserProfile = {
  id: 'u2',
  nickname: '사용자',
  children: [],
  region: { sido: '', sigungu: '' },
  interests: [],
  gpsVerified: false,
  plan: 'free',
  onboardingCompleted: false,
}

export const mockFacilities: Facility[] = [
  {
    id: 'f1',
    name: '해피어린이집',
    type: '국공립',
    status: 'available',
    address: '서울 강남구 역삼동 123',
    lat: 37.4967,
    lng: 127.0375,
    distance: '도보 5분',
    phone: '02-555-1234',
    capacity: { total: 80, current: 72, waiting: 0 },
    features: ['통학버스', '연장보육', '급식자체조리'],
    rating: 4.5,
    reviewCount: 23,
    lastUpdated: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    images: [],
  },
  {
    id: 'f2',
    name: '사랑어린이집',
    type: '민간',
    status: 'waiting',
    address: '서울 강남구 역삼동 456',
    lat: 37.4955,
    lng: 127.0390,
    distance: '도보 8분',
    phone: '02-555-5678',
    capacity: { total: 60, current: 60, waiting: 3 },
    features: ['연장보육', '급식자체조리'],
    rating: 4.2,
    reviewCount: 15,
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    images: [],
  },
  {
    id: 'f3',
    name: '별빛어린이집',
    type: '가정',
    status: 'full',
    address: '서울 강남구 역삼동 789',
    lat: 37.4940,
    lng: 127.0410,
    distance: '도보 10분',
    phone: '02-555-9012',
    capacity: { total: 20, current: 20, waiting: 12 },
    features: ['소규모', '가정식급식'],
    rating: 4.8,
    reviewCount: 8,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    images: [],
  },
]

export const mockSources: Record<string, SourceInfo> = {
  isalang: {
    source: '아이사랑',
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    freshness: 'realtime',
    coverage: '전국 12,000+ 시설',
  },
  map: {
    source: '지도',
    updatedAt: new Date().toISOString(),
    freshness: 'realtime',
  },
  review: {
    source: '후기',
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    freshness: 'cached',
  },
  ai: {
    source: 'AI분석',
    updatedAt: new Date().toISOString(),
    freshness: 'realtime',
  },
}

export const mockNBAs: NBAItem[] = [
  {
    id: 'nba1',
    icon: 'UserPlusIcon',
    title: '아이 등록하면 맞춤 전략을 받아요',
    description: '아이 나이와 지역 기반으로 입소 확률을 분석해드려요',
    actionLabel: '등록하기',
    actionHref: '/onboarding',
    priority: 'high',
    dismissible: false,
    condition: 'children.length === 0',
  },
  {
    id: 'nba2',
    icon: 'MapPinIcon',
    title: '동네 어린이집 3곳 추천받기',
    description: '도보 10분 이내 최적 시설을 AI가 찾아드려요',
    actionLabel: '추천받기',
    actionHref: '/chat?prompt=동네추천',
    priority: 'normal',
    dismissible: true,
    condition: 'interests.length === 0',
  },
  {
    id: 'nba3',
    icon: 'BellAlertIcon',
    title: '실시간 빈자리 알림 설정',
    description: '관심 시설에 TO가 생기면 즉시 알려드려요',
    actionLabel: '설정하기',
    actionHref: '/chat?prompt=알림설정',
    priority: 'normal',
    dismissible: true,
    condition: 'interests.length > 0 && !hasAlertSet',
  },
]

export const mockPosts: CommunityPost[] = [
  {
    id: 'p1',
    author: { nickname: '역삼맘', verified: true },
    content: '해피어린이집 혹시 올해 TO 나왔다는 분 계실까요? 3월 입소 대기 중인데 순서가 잘 안 올라가네요.',
    facilityTags: ['해피어린이집'],
    aiSummary: 'AI: 해피어린이집의 올해 평균 TO 발생 주기는 2.3개월이며, 3월 입소 가능성은 약 60%입니다.',
    likes: 5,
    comments: 3,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    category: 'question',
  },
]
```

---

## 10. 상태관리 전략

도토리 MVP는 **React Context + useReducer**로 충분하다. Zustand/Redux 등 외부 라이브러리 불필요.

파일: `src/hooks/use-app-state.tsx`

```typescript
'use client'

import type { ActionState, ChatMessage, ToastData, UserProfile } from '@/types/dotori'
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'

interface AppState {
  user: UserProfile | null
  chatMessages: ChatMessage[]
  actionState: ActionState
  toasts: ToastData[]
  dismissedNBAs: string[]        // 닫은 NBA ID 목록
}

type AppAction =
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: Partial<ChatMessage> }
  | { type: 'SET_ACTION_STATUS'; payload: ActionState }
  | { type: 'ADD_TOAST'; payload: ToastData }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'DISMISS_NBA'; payload: string }

const initialState: AppState = {
  user: null,
  chatMessages: [],
  actionState: { status: 'idle' },
  toasts: [],
  dismissedNBAs: [],
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'ADD_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] }
    case 'UPDATE_LAST_MESSAGE': {
      const msgs = [...state.chatMessages]
      const last = msgs[msgs.length - 1]
      if (last) msgs[msgs.length - 1] = { ...last, ...action.payload }
      return { ...state, chatMessages: msgs }
    }
    case 'SET_ACTION_STATUS':
      return { ...state, actionState: action.payload }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts.slice(-2), action.payload] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) }
    case 'DISMISS_NBA':
      return { ...state, dismissedNBAs: [...state.dismissedNBAs, action.payload] }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: Dispatch<AppAction>
}>({ state: initialState, dispatch: () => null })

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppState() {
  return useContext(AppContext)
}
```

---

## 11. 반응형 브레이크포인트 전략

```
Mobile First. 기본은 375px(iPhone SE) 기준.

- default    : 375px~ (모바일, 핵심 타겟)
- sm: 640px  : 큰 모바일/작은 태블릿
- md: 768px  : 태블릿 (2단 그리드 시작)
- lg: 1024px : 데스크톱 (인앱은 max-w-md 센터링, 랜딩은 풀와이드)

인앱 화면: max-w-md mx-auto (모바일 앱 느낌 유지)
랜딩 페이지: 풀 반응형 (Pocket/Salient 패턴 그대로)
```

---

*Part 1 끝. Part 2 (컴포넌트 전체 설계)로 이어진다.*
