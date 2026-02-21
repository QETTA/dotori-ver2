# CLAUDE.md — Dotori V2

## Project Overview

Dotori (도토리) is a Korean childcare facility finder MVP. Parents find, compare, and apply for childcare facilities (어린이집) using AI-powered analysis and real-time vacancy alerts.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router) + React 19 + TypeScript 5.8 strict
- **Styling**: Tailwind CSS 4 with `@tailwindcss/postcss`, HEX color tokens
- **UI**: @headlessui/react 2.2, @heroicons/react 2.2, Catalyst UI Kit (27 components)
- **Animation**: `motion/react` (motion 12) — **NEVER** use `framer-motion`
- **State**: React Context + useReducer (no external state libraries)
- **Backend**: Mongoose 8.14 + MongoDB Atlas (db: `dotori`)
- **Auth**: NextAuth v5 (next-auth@beta), Kakao OAuth, JWT strategy, MongoDBAdapter
- **Font**: Pretendard Variable (CDN) + Plus Jakarta Sans (next/font/google)

## Directory Structure

```
src/
├── app/
│   ├── (app)/              # Main app routes (with BottomTabBar)
│   │   ├── page.tsx             # Home (/)
│   │   ├── chat/page.tsx        # ToRI Chat (/chat)
│   │   ├── explore/page.tsx     # Explore (/explore)
│   │   ├── community/page.tsx   # Community (/community)
│   │   ├── my/page.tsx          # My Profile (/my)
│   │   ├── my/settings/page.tsx # Settings
│   │   └── facility/[id]/page.tsx
│   ├── (onboarding)/       # Onboarding (no BottomTabBar)
│   ├── (landing)/landing/   # Landing page (no BottomTabBar)
│   ├── (auth)/login/        # Login (no BottomTabBar)
│   └── api/                 # API routes
├── components/
│   ├── catalyst/            # 27 Headless UI components (DO NOT modify internals)
│   ├── dotori/              # Custom app components (16+)
│   ├── landing/             # Landing page components
│   └── shared/              # AuthProvider
├── hooks/                   # useAppState (Context + Reducer)
├── lib/
│   ├── brand-assets.ts      # BRAND constant — all SVG asset paths
│   ├── brand-copy.ts        # COPY constant — Korean UI strings
│   ├── db.ts                # Mongoose singleton connection
│   ├── mongodb.ts           # MongoClient for NextAuth adapter
│   ├── api.ts               # API fetcher utility
│   ├── utils.ts             # cn(), formatRelativeTime(), etc.
│   └── facility-images.ts   # Facility image utilities + placeholder generation
├── models/                  # Mongoose models (User, Facility, Waitlist, Alert, ChatHistory, Post)
├── styles/
│   ├── splash.css           # Brand splash animation
│   └── loading.css          # Brand loader (breathe/bounce/spin)
└── types/                   # dotori.ts, next-auth.d.ts
public/brand/                # 21 SVG brand assets
scripts/
├── seed.ts                  # 500 facility seeder
├── check-console.ts         # Playwright console error checker
└── screenshot-check.ts      # Mobile screenshot capture (375x812 @2x)
```

## Brand Design System (v2.2)

### Color Tokens (HEX, in globals.css @theme)
- **dotori-400**: `#c8956a` — brand main (buttons, accents)
- **dotori-500**: `#b07a4a` — WCAG AA safe for white text (4.1:1)
- **dotori-900**: `#2d2418` — dark text
- **forest-500**: `#4a7a42` — success, available, verified
- **Shadows**: Brown-tinted `rgba(45, 36, 24, ...)`

### Typography
- **Body**: `'Pretendard Variable'` via CDN (font-family name must match exactly)
- **Wordmark**: `'Plus Jakarta Sans'` via next/font/google
- **Korean text in SVGs**: Uses `<text>` elements — cannot access web fonts when loaded via `<img>`

### Brand Assets
- All SVGs in `public/brand/` — use `BRAND.*` constants from `@/lib/brand-assets`
- SVGs in `<img>` tags (NOT `next/image`) — Next.js Image doesn't handle SVGs well
- Add `// eslint-disable-next-line @next/next/no-img-element` above each `<img>`

## Key Conventions

1. **Mobile-first**: 375x812 viewport, `max-w-md mx-auto`
2. **Korean UI**: All user-facing text in Korean, code in English
3. **motion/react ONLY**: Never `framer-motion`, never `@tailwindplus/elements`
4. **Touch targets**: Min 44px, `active:scale-[0.97]`
5. **Safe area**: `pb-[env(safe-area-inset-bottom)]` on fixed bottom elements
6. **Catalyst Button**: Use `color="dotori"` for primary CTA (brand brown #c8956a). `color="amber"` reserved for Kakao only.
7. **Catalyst `plain` prop**: Must be literal `true` — never boolean expression
8. **Hydration safety**: Use `suppressHydrationWarning` on elements with `formatRelativeTime()`
9. **Badge colors**: Use `color="forest"` (not `"green"`) for success states
10. **No zinc colors**: Use `dotori-*` palette instead of `zinc-*` in custom components

## Common Commands

```bash
npm run dev              # Dev server (port 3000, Turbopack)
npm run build            # Production build
npm run start            # Production server (port 3000)
npm run screenshot       # Mobile screenshots → /tmp/dotori-screenshots/
npm run check-console    # Playwright console error check
npx tsx --env-file=.env.local scripts/seed.ts  # Seed 500 facilities
```

## Environment Variables

Required in `.env.local`:
- `MONGODB_URI` — MongoDB Atlas connection string
- `AUTH_SECRET` — NextAuth secret
- `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET` — Kakao OAuth

## API Patterns

All API routes: `auth()` → `dbConnect()` → `NextResponse.json()`

## ㄱ — 반복 개발 루프 (Dev Cycle Protocol)

사용자가 `ㄱ` 입력 시 아래 사이클 **무조건 실행**:

### Phase 1: 현실 파악 (거짓 금지)
```
1. npm run build — 실제 에러 수집 (출력 전문 확인)
2. git diff --stat — 변경 파일 목록
3. grep -rn "TODO\|FIXME\|HACK" src/ — 기술 부채
4. 각 페이지 파일 실제 읽기 — 깨진 import, 미구현 함수 확인
```
**규칙: 에이전트 출력을 믿지 말 것. 직접 파일 읽고 빌드 돌려서 확인.**

### Phase 2: 태스크 도출
```
- 빌드 에러 → 즉시 수정 태스크 (P0)
- 런타임 버그 가능성 → 검증 태스크 (P1)
- 미완성 기능 → 구현 태스크 (P2)
- UX 개선 → 개선 태스크 (P3)
```
TaskCreate로 등록, 의존관계 설정.

### Phase 3: 병렬 실행
```
- 독립 태스크 최대 병렬 (Task 서브에이전트)
- 의존 태스크는 순차
- 각 에이전트에 정확한 파일 경로 + 기존 코드 패턴 전달
```

### Phase 4: 검증 (필수)
```
- 모든 신규/수정 파일: 존재 확인 + 핵심 코드 grep
- npm run build: 0 에러 확인
- 변경사항 요약: 파일명, 라인수, 핵심 변경 내용
```
**검증 실패 시 즉시 수정 후 재검증. 통과할 때까지 반복.**

### Phase 5: 리포트
```
- 완료 태스크: ✅ 파일명 + 변경 요약
- 실패 태스크: ❌ 원인 + 다음 액션
- 빌드 결과: 페이지 수, 에러 수
- 정직하게. 과장 금지.
```

### 축약어
| 입력 | 의미 |
|------|------|
| `ㄱ` | 전체 사이클 1회 실행 |
| `ㄱㄱ` | 사이클 반복 (리포트 후 자동 재시작) |
| `ㅂ` | 빌드만 (Phase 1 + 4만 실행) |
| `ㅅ` | 스크린샷 캡처 (`npm run screenshot`) |

## Current State (2026-02-20 업데이트)

- **22 pages** (21 static + 1 dynamic): /, /chat, /explore, /community, /community/[id], /community/write, /facility/[id], /my, /my/interests, /my/waitlist, /my/waitlist/[id], /my/notifications, /my/settings, /my/import, /my/notices, /my/terms, /my/support, /my/app-info, /onboarding, /landing, /login, /not-found
- **30 API routes**: facilities, regions, geocode, alerts, chat, community, waitlist, users, auth, notifications, ocr, og, analytics, cron, health, actions
- **12 Mongoose models**: User, Facility, Waitlist, Alert, ChatHistory, Post, Comment, ActionIntent, ActionExecution, FacilitySnapshot, AlimtalkLog, SystemConfig
- **62 components**: 27 Catalyst + 31 dotori + 3 shared + 1 landing
- **실 데이터**: MongoDB Atlas 20,027 시설 (17개 시도), mock 데이터 없음
- Brand design system v2.2, Pretendard Variable CDN, 21 SVG assets
- Build: 44 generated pages, 0 TypeScript errors
