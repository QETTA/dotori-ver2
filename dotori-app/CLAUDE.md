# CLAUDE.md — Dotori V2

## Project Overview

Dotori (도토리) is a Korean childcare/education facility finder MVP. Parents find, compare, and apply for childcare and education facilities (보육·교육시설: 어린이집·유치원) using AI-powered analysis and real-time vacancy alerts.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router) + React 19 + TypeScript 5.8 strict
- **Styling**: Tailwind CSS 4 with `@tailwindcss/postcss`, HEX color tokens
- **UI**: @headlessui/react 2.2, lucide-react 0.475, Catalyst UI Kit (27 components)
- **Animation**: `motion/react` (motion 12) — **NEVER** use `framer-motion`
- **State**: React Context + useReducer (no external state libraries)
- **Backend**: Mongoose 8.23 + MongoDB Atlas (db: `dotori`, 20,027 facilities)
- **Auth**: NextAuth v5 (next-auth@beta), Kakao OAuth, JWT strategy, MongoDBAdapter
- **AI**: Anthropic Claude API (토리챗 SSE 스트리밍, Sonnet 4.6)
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
│   │   ├── my/waitlist/page.tsx # My Waitlist
│   │   ├── my/notifications/page.tsx # Notifications
│   │   └── facility/[id]/page.tsx
│   ├── (onboarding)/       # Onboarding (no BottomTabBar)
│   ├── (landing)/landing/   # Landing page (no BottomTabBar)
│   ├── (auth)/login/        # Login (no BottomTabBar)
│   └── api/                 # 54 API routes
│       ├── auth/[...nextauth]/     NextAuth handler
│       ├── facilities/             GET list, GET [id] detail
│       ├── waitlist/               GET/POST, DELETE [id], checklist, import, ocr
│       ├── chat/                   POST, stream (SSE), history
│       ├── community/posts/        CRUD, comments, like
│       ├── alerts/                 GET/POST, channels
│       ├── users/me/               GET/PATCH profile, interests
│       ├── subscriptions/          GET/POST
│       ├── admin/facility/[id]/premium/  PUT (Bearer CRON_SECRET)
│       ├── analytics/              usage, errors, vitals
│       ├── cron/                   sync-isalang, to-monitor
│       ├── actions/                intent, execute
│       ├── home/                   Dashboard aggregation
│       ├── geocode/reverse/        GPS → region (no auth)
│       ├── regions/                sido, sigungu
│       ├── notifications/          GET
│       ├── og/                     Open Graph
│       └── health/                 liveness, deep (DB ping)
├── components/
│   ├── catalyst/            # 27 Headless UI components (DO NOT modify internals)
│   ├── dotori/              # 107 custom app components
│   │   ├── (root)           #   46 core (FacilityCard, ChatBubble, Toast, etc.)
│   │   ├── blocks/          #   7 structured chat blocks
│   │   ├── charts/          #   3 chart components
│   │   ├── chat/            #   6 chat components
│   │   ├── esignature/      #   7 e-signature components
│   │   ├── explore/         #   9 explore helpers/panels
│   │   └── facility/        #   9 facility detail sub-components
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
│   ├── facility-images.ts   # Facility image utilities
│   ├── dto.ts               # Data transfer objects (toFacilityDTO, etc.)
│   ├── rate-limit.ts        # Rate limiting middleware
│   └── engine/              # ToRI Chat AI engine
│       ├── intent-classifier.ts  # Intent classification
│       ├── response-builder.ts   # Response builder
│       └── nba-engine.ts         # Next Best Action engine
├── models/                  # 21 Mongoose models
│   ├── User.ts, Facility.ts, Waitlist.ts, Alert.ts
│   ├── ChatHistory.ts, Post.ts, Comment.ts
│   ├── Subscription.ts, UsageLog.ts
│   ├── ActionIntent.ts, ActionExecution.ts
│   ├── AlimtalkLog.ts, FacilitySnapshot.ts, SystemConfig.ts
│   └── (see models/ for full list)
├── styles/
│   ├── splash.css           # Brand splash animation
│   └── loading.css          # Brand loader
└── types/                   # dotori.ts, next-auth.d.ts
public/brand/                # 21 SVG brand assets
scripts/
├── launch.sh                # v7 wave 빌드 파이프라인 (워크트리 격리)
├── codex-wave.sh            # CLI 병렬 배치 (MCP 직렬 우회, wave 단위) ★
├── screenshot-check.ts      # 스크린샷 + 콘솔에러 통합 QA
├── check-console.ts         # 콘솔 에러 전용 검사
├── do-env-update.sh         # DO env var safe update
├── seed.ts                  # Facility seeder
└── dev/                     # 개발 유틸리티
```

## Brand Design System (v2.2)

### Color Tokens
- **dotori-400**: `#c8956a` — brand main (buttons, accents)
- **dotori-500**: `#b07a4a` — WCAG AA safe for white text (4.1:1)
- **forest-500**: `#4a7a42` — success, available, verified
- Catalyst Button: `color="dotori"` for primary CTA. `color="amber"` = Kakao only.
- `color="forest"` → Badge only (never Button)

### Key Conventions

1. Mobile-first: 375x812, `max-w-md mx-auto`
2. Korean UI text, English code
3. `motion/react` ONLY — never `framer-motion`
4. Touch targets: min 44px, `active:scale-[0.97]`
5. `color="forest"` (not `"green"`) for success states
6. `suppressHydrationWarning` on `formatRelativeTime()` elements
7. Catalyst `plain` prop: must be literal `true`
8. No arbitrary pixel values: `text-[Npx]` → `text-xs/sm/base/lg/xl`
9. No custom CSS → Tailwind scale tokens only
10. **UX/UI 작업 시 `/frontend-design` 스킬 필수 선행 호출** — 디자인 씽킹 후 코딩

### Frontend Design 미학 (Dotori 브랜드, 2026 글로벌 기준)
- **Tone**: Warm Editorial — 고급 한국 육아 매거진, Toss/Naver 급 프리미엄
- **Typography**: Pretendard Variable (본문) + Plus Jakarta Sans (숫자/영문), 시맨틱 토큰 필수
- **Color**: dotori-400/500 CTA + forest-500 성공 + amber 카카오, `gradientText` 히어로/CTA 적극 활용
- **Motion**: `motion/react` spring(damping:30 stiffness:100), 진입 stagger(80ms delay), whileTap, 전환 300ms
- **Spatial**: max-w-md 중앙, rounded-2xl/3xl 카드, generous padding, **3-layer hover depth system**
- **Depth**: Glassmorphism 2.0 — `backdrop-blur-xl`(10-20px), `bg-white/10~40`, brand-tinted shadow
- **Shadow**: 프리미엄 카드 `shadow-[0_8px_32px_rgba(176,122,74,0.08)]` (dotori-500 tinted)
- **Background**: glass morphism (DS_GLASS), SVG noise texture 프리미엄 카드, gradient accent bar

### ★ TP5 필수 패턴 (Tailwind Plus + 2026 글로벌 레퍼런스, 상세: memory/design-quality-patterns.md)
1. **3-Layer Hover** — `group/card` + z-10 content + z-20 click zone (평면 hover:bg 금지)
2. **Gradient Text** — `bg-clip-text text-transparent` 히어로/CTA 타이틀 (최소 3곳)
3. **Card.Eyebrow Compound** — accent bar + eyebrow + title + desc 구조화
4. **Snap-Scroll Carousel** — `snap-x snap-mandatory scrollbar-hidden` + spring + fade edges
5. **Border Accent + Noise** — gradient `h-1` top bar + SVG `feTurbulence` overlay

### 2026 디자인 수치 레퍼런스 (글로벌 교차검증)
```
Glassmorphism 2.0:
  backdrop-filter: blur(10-20px)
  background: rgba(255,255,255, 0.1~0.4)   — 배경 선명도에 따라 조절
  box-shadow: 0 8px 32px rgba(176,122,74, 0.08)  — brand-tinted (dotori-500 기반)
  border: 1px solid rgba(255,255,255, 0.2)

Animation Timing:
  전환: 300ms ease-in-out (일관성 필수)
  Spring: damping:30 stiffness:100 (Radiant 기준)
  Stagger: 80ms delay per item
  Micro-interaction: whileTap scale:0.97 (200ms)

Shadow Elevation (3단계):
  Level 1 (flat): shadow-none, border만
  Level 2 (raised): shadow-[0_2px_8px_rgba(176,122,74,0.06)]
  Level 3 (premium): shadow-[0_8px_32px_rgba(176,122,74,0.08)]

Sources:
  - invernessdesignstudio.com/glassmorphism-2026
  - tkdodo.eu/blog/avoiding-hydration-mismatches
  - designstudiouiux.com/fintech-ux-design-trends
  - spdload.com/mobile-app-ui-ux-design-trends
```

## Git 규칙 / Commands
→ 루트 `CLAUDE.md` 참조 (Git 규칙, 핵심 명령 모두 루트에 정의)

## Environment Variables (.env.local)

- `MONGODB_URI` — MongoDB Atlas
- `AUTH_SECRET` — NextAuth secret
- `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET`
- `NEXT_PUBLIC_KAKAO_JS_KEY` / `NEXT_PUBLIC_KAKAO_KEY` / `NEXT_PUBLIC_KAKAO_MAP_KEY`
- `ANTHROPIC_API_KEY` — Claude API (토리챗)
- `KAKAO_REST_API_KEY` — 카카오 로컬 API (서버사이드)
- `NEXT_PUBLIC_KAKAO_CHANNEL_ID` — `_dotori`
- `CRON_SECRET` — Admin API 인증

## DigitalOcean 배포

- App ID: `29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2`
- **환경변수 변경**: 반드시 `scripts/do-env-update.sh` 사용 (전체 spec 교체 시 EV 값 손상)
- **health_check 경로**: `/api/health` (liveness only, DB 없음)
- **deep check**: `/api/health/deep` (DB ping, 모니터링 전용)

```bash
# 단일 키 업데이트
./scripts/do-env-update.sh 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2 KEY VALUE

# 배포 트리거
doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
```

## Current State
→ `pending_tasks.md` SSoT 참조 (`.serena/memories/pending_tasks.md`)
