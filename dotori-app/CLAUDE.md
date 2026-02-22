# CLAUDE.md — Dotori V2

## Project Overview

Dotori (도토리) is a Korean childcare facility finder MVP. Parents find, compare, and apply for childcare facilities (어린이집) using AI-powered analysis and real-time vacancy alerts.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router) + React 19 + TypeScript 5.8 strict
- **Styling**: Tailwind CSS 4 with `@tailwindcss/postcss`, HEX color tokens
- **UI**: @headlessui/react 2.2, @heroicons/react 2.2, Catalyst UI Kit (27 components)
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
│   └── api/                 # 35 API routes
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
│   ├── dotori/              # 44 custom app components
│   │   ├── (root)           #   20 core (FacilityCard, ChatBubble, Toast, etc.)
│   │   ├── blocks/          #   7 structured chat blocks
│   │   ├── explore/         #   4 explore helpers/panels
│   │   └── facility/        #   13 facility detail sub-components
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
├── models/                  # 14 Mongoose models
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
├── launch.sh                # Codex worktree parallel pipeline
├── do-env-update.sh         # DO env var safe update
├── seed.ts                  # Facility seeder
└── screenshot-check.ts      # Mobile screenshot capture (375x812 @2x)
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

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build (47 pages)
npm test                 # Tests (91, vitest)
npm run screenshot       # Mobile screenshots
```

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

## Current State (2026-02-22, R13 완료)

- **47 pages**, 0 TypeScript errors, **91 tests** (vitest)
- **14 models**, **35 API routes**, **72 components** (27 catalyst + 44 dotori + 1 landing)
- **MongoDB**: 20,027 시설 (17개 시도), Atlas `dotori` DB
- **91 에이전트** 완료 (R1~R3: 36, R5: 11, R8: 11, R9: 11, R11: 6, R12: 5, R13: 11)
- **P0~P1 보안 이슈 0건** (R13에서 전체 수정)
