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

## Claude 지휘 체계 (자율 개선 원칙)

> Claude Code가 세션 시작 시 반드시 이 섹션을 따라 환경을 셋업하고,
> 세션 종료 시 개선 사항을 이 파일에 직접 반영한다.

### Claude의 역할 정의
| 역할 | 책임 |
|------|------|
| **지휘관** | 전체 태스크 분석 → 에이전트 분배 → 결과 검증 → 커밋 |
| **코드 분석** | Serena MCP로 심볼 검색, 참조 추적, 타입 확인 |
| **품질 보증** | 빌드 0에러 확인, TypeScript 에러 직접 수정 |
| **메모리 관리** | `.serena/memories/*.md` 업데이트, CLAUDE.md 개선 |

### 세션 시작 루틴 (자동 실행)
```bash
# 1. 좀비/잔여 정리 (★ 최우선)
rm -f /tmp/claude-1000/-home-sihu2129-dotori-ver2/tasks/*.output
rm -rf /tmp/wt-results /tmp/wt-logs /tmp/*.js /tmp/*.ts
ps aux | grep codex | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null

# 2. git 상태 확인
git log --oneline -3
git status --short

# 3. Serena 메모리 로드 (mcp__serena__list_memories)
# project_overview, agent_task_registry 필수 확인

# 4. 포트 확인
ss -tlnp | grep -E "3000|3001"
```

### Serena 프리분석 → Codex 주입 패턴 (★ 핵심)

> Serena MCP는 Claude Code 전용. Codex는 MCP 못 씀.
> 해결책: Claude가 Serena로 분석 → 결과를 Codex 프롬프트에 직접 포함.

```
[단계 1] Claude → Serena MCP로 대상 파일 심볼 추출
  mcp__serena__find_symbol("TargetFunction", include_body=True)
  mcp__serena__find_referencing_symbols("TargetFunction")
  → 정확한 현재 코드 + 라인 번호 + 타입 획득

[단계 2] Claude → 추출 결과를 Codex 프롬프트에 주입
  "현재 코드 (Serena 추출):
   [라인 45-78 실제 코드]

   참조 파일:
   [참조하는 컴포넌트 목록]

   수정 요청: ..."

[단계 3] Codex → 탐색 없이 즉시 정확한 코드 생성
```

**효과**: Codex 파일탐색 시간 제거, 타입 오류 감소, 빌드 성공률 향상

### Codex 워크트리 파이프라인 (개선판 v2)

#### ★ 핵심 개선사항 (2026-02-22)
1. **chmod -R 777** — 워크트리 생성 직후 git 메타데이터 권한 열기 → Codex가 직접 커밋 가능
2. **검수 에이전트(L)는 마지막** — 나머지 11개 merge 완료 후 단독 실행
3. **DO 환경변수는 `scripts/do-env-update.sh`로만 변경** — EV 시크릿 손상 방지
4. **파일 소유권 맵 선점** — 에이전트 배분 전에 공유 파일 소유권 명시

```bash
APP=/home/sihu2129/dotori-ver2/dotori-app

# 1. 워크트리 생성 + ★ 권한 즉시 열기 (Codex 커밋 가능해짐)
git -C "$APP" worktree add ".worktrees/NAME" -b codex/TASK
chmod -R 777 /home/sihu2129/dotori-ver2/.git/worktrees/NAME/
mkdir -p /tmp/wt-results /tmp/wt-logs

# 2. 에이전트 실행 (Codex가 직접 commit까지 완료)
codex exec -s workspace-write \
  -m gpt-5.3-codex-spark \
  --cd "$APP/.worktrees/NAME" \
  -o /tmp/wt-results/NAME.txt \
  "먼저 읽어라: cat .serena/memories/project_overview.md
   cat .serena/memories/code_style_and_conventions.md
   담당 파일만 수정. npm run build 0에러 확인.
   완료 후 반드시: git add -A && git commit -m 'feat: ...'" \
  > /tmp/wt-logs/NAME.log 2>&1 &

# 3. 완료 대기 → squash merge (11개 먼저, 검수 마지막)
# 11개 병렬 → merge → WT-L(검수) 단독 실행 → merge → 빌드 → push → 배포

# 4. 정리
git -C "$APP" worktree remove --force ".worktrees/NAME"
git -C "$APP" branch -D codex/TASK
```

#### 파일 소유권 맵 (충돌 방지)
```
공유 파일은 반드시 1개 에이전트만 담당:
- community/page.tsx → 단일 에이전트만
- app/(app)/page.tsx → 단일 에이전트만
- types/dotori.ts → 타입 에이전트만
엔진 파일은 기능별 분리:
- nba-engine.ts / intent-classifier.ts → 같은 에이전트
- why-engine.ts / report-engine.ts → 같은 에이전트
```

#### 검수 에이전트 순서 (★ 반드시 마지막)
```bash
# 잘못된 순서 (현행): 11개와 동시 발사 → 다른 에이전트 변경사항 못 검수
# 올바른 순서:
# Step 1: 11개 동시 발사 → 완료 → merge
# Step 2: WT-L(검수) 단독 발사 → merge된 코드 검수 → 빌드 0에러 확인
```

### 도구 사용 원칙
| 작업 | 도구 | 이유 |
|------|------|------|
| 심볼 검색/수정 | **Serena MCP** | LSP 정확도 |
| 대량 코드 생성 | **Codex CLI** (worktree) | 토큰 절약 |
| 파일 읽기/grep | Claude 직접 | 빠름 |
| DB 작업 | mongosh bash | 직접 실행 |
| git/배포 | Bash 직접 | CLI 도구 |

### 세션 종료 루틴
```
1. npm run build → 0 에러 확인
2. git add -A && git commit (변경사항 있을 때)
3. Serena project_overview.md 빌드 상태 업데이트
4. agent_task_registry.md 완료 작업 기록
5. CLAUDE.md Current State 날짜/내용 갱신
6. 좀비 프로세스/임시파일 정리
```

### 자율 개선 원칙
- **빌드 에러 발생 시**: 즉시 직접 수정 (에이전트 재실행보다 빠름)
- **패턴 발견 시**: 이 파일에 즉시 기록
- **새 도구/방법 효과 검증 시**: Current State 섹션에 날짜와 함께 추가
- **사용자 지시 없어도**: 세션 중 발견한 개선점은 자율 반영

---

## Current State (2026-02-22 업데이트)

- **45 pages**: /, /chat, /explore, /community, /community/[id], /community/write, /facility/[id], /my, /my/interests, /my/waitlist, /my/waitlist/[id], /my/notifications, /my/settings, /my/import, /my/notices, /my/terms, /my/support, /my/app-info, /onboarding, /landing, /login, /not-found + 23 API routes
- **30 API routes**: facilities, regions, geocode, alerts, chat, community, waitlist, users, auth, notifications, ocr, og, analytics, cron, health, actions
- **12 Mongoose models**: User, Facility, Waitlist, Alert, ChatHistory, Post, Comment, ActionIntent, ActionExecution, FacilitySnapshot, AlimtalkLog, SystemConfig
- **62 components**: 27 Catalyst + 31 dotori + 3 shared + 1 landing
- **실 데이터**: MongoDB Atlas 20,027 시설 (17개 시도), mock 데이터 없음
- Brand design system v2.2, Pretendard Variable CDN, 21 SVG assets
- **Build**: 45 generated pages, 0 TypeScript errors
- **최근 완료**: 10-agent worktree 라운드 (실시간 스트리밍, 대기 UX, 타입 강화 등)
