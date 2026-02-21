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
│       ├── health/route.ts      # Liveness probe (DO health_check 전용, DB 없음)
│       └── health/deep/route.ts # Deep check (DB ping 포함, 모니터링용)
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
│   └── facility-images.ts   # Facility image utilities
├── models/                  # Mongoose models (User, Facility, Waitlist, Alert, ChatHistory, Post)
├── styles/
│   ├── splash.css           # Brand splash animation
│   └── loading.css          # Brand loader
└── types/                   # dotori.ts, next-auth.d.ts
public/brand/                # 21 SVG brand assets
scripts/
├── do-env-update.sh         # DO 환경변수 단일 키 안전 업데이트 (EV 손상 방지)
├── seed.ts                  # 500 facility seeder
└── screenshot-check.ts      # Mobile screenshot capture (375x812 @2x)
```

## Brand Design System (v2.2)

### Color Tokens
- **dotori-400**: `#c8956a` — brand main (buttons, accents)
- **dotori-500**: `#b07a4a` — WCAG AA safe for white text (4.1:1)
- **forest-500**: `#4a7a42` — success, available, verified
- Catalyst Button: `color="dotori"` for primary CTA. `color="amber"` = Kakao only.

### Key Conventions

1. Mobile-first: 375x812, `max-w-md mx-auto`
2. Korean UI text, English code
3. `motion/react` ONLY — never `framer-motion`
4. Touch targets: min 44px, `active:scale-[0.97]`
5. `color="forest"` (not `"green"`) for success states
6. `suppressHydrationWarning` on `formatRelativeTime()` elements
7. Catalyst `plain` prop: must be literal `true`

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build
npm run screenshot       # Mobile screenshots
```

## Environment Variables (.env.local)

- `MONGODB_URI` — MongoDB Atlas (`R4R2BRi3L0RcMV2e`)
- `AUTH_SECRET` — `dotori_v2_dev_secret_2026_change_in_production`
- `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET`
- `NEXT_PUBLIC_KAKAO_JS_KEY` / `NEXT_PUBLIC_KAKAO_KEY` / `NEXT_PUBLIC_KAKAO_MAP_KEY`

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

---

## ㄱ — Codex 워크트리 병렬 파이프라인

사용자가 `ㄱ` 입력 시 아래 파이프라인 실행:

### Step 1: 분석 (Serena + 빌드)

```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run build 2>&1 | tail -20   # 에러 수집
git diff --stat                  # 변경 파일
```

Serena MCP로 대상 심볼 미리 추출 → Codex 프롬프트에 주입 (탐색 시간 제거).

### Step 2: 워크트리 생성 + 권한

```bash
APP=/home/sihu2129/dotori-ver2/dotori-app
NAME=r4-a  # 라운드번호-에이전트ID

git -C "$APP" worktree add ".worktrees/$NAME" -b "codex/$NAME"
chmod -R 777 /home/sihu2129/dotori-ver2/.git/worktrees/$NAME/
mkdir -p /tmp/wt-results /tmp/wt-logs
```

> ★ `chmod -R 777`은 워크트리 생성 직후 즉시 실행 — Codex가 직접 커밋 가능

### Step 3: Codex 발사 (Bash run_in_background=true, 최대 11개 병렬)

```bash
codex exec -s workspace-write \
  -m gpt-5.3-codex-spark \
  --cd "$APP/.worktrees/$NAME" \
  -o /tmp/wt-results/$NAME.txt \
  "먼저 읽어라:
   cat .serena/memories/project_overview.md
   cat .serena/memories/code_style_and_conventions.md
   cat .serena/memories/agent_task_registry.md

   담당 파일만 수정. npm run build 0에러 확인.
   완료 후 반드시: git add -A && git commit -m 'feat(xxx): ...'" \
  > /tmp/wt-logs/$NAME.log 2>&1 &
```

### Step 4: 검수 에이전트 (11개 merge 완료 후 단독)

```bash
# 11개 squash merge 후 → WT-L(검수) 단독 발사
# 검수 에이전트: any 타입, console.log, 빌드 에러, 접근성 확인
```

### Step 5: Merge + 빌드 + 배포

```bash
# squash merge (의존 순서대로)
git -C "$APP" merge --squash "codex/$NAME"
git -C "$APP" commit -m "feat: squash merge $NAME"

# 정리
git -C "$APP" worktree remove --force ".worktrees/$NAME"
git -C "$APP" branch -D "codex/$NAME"

# 빌드 검증
npm run build 2>&1 | tail -5

# 배포
git push origin main
doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
```

### 파일 소유권 (충돌 방지)

- 공유 파일(community/page.tsx, app/(app)/page.tsx, types/dotori.ts)은 **에이전트 1개만** 담당
- 엔진 파일: nba-engine + intent-classifier → 같은 에이전트
- 검수 에이전트는 **반드시 마지막**, 나머지 merge 후 실행

### 축약어

| 입력 | 동작 |
|------|------|
| `ㄱ` | 분석→Codex 발사→merge→빌드→배포 |
| `ㄱㄱ` | 위 반복 |
| `ㅂ` | 빌드만 |
| `ㅅ` | 스크린샷 |

---

## Current State (2026-02-22)

- **45 pages**, 0 TypeScript errors
- **MongoDB**: 20,027 시설 (17개 시도), Atlas `dotori` DB
- **DO 배포**: `f9d27c5e` PENDING_BUILD (카카오 키 + Round 3 코드)
- **Health check**: `/api/health` liveness only, `/api/health/deep` DB포함
- **완료 라운드**: R1(12) + R2(12) + R3(12) = 36 에이전트
