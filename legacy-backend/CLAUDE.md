# CLAUDE.md — 도토리 (Dotori) 프로젝트 지침

## 워크플로우 규칙 (최우선)

1. **모바일 온리**: 항상 375×812 뷰포트 기준. 데스크탑 고려 안 함
2. **프로덕션 빌드 검수**: WSL2 + Turbopack은 캐시 문제 있음. 시각 검수는 `next build && next start` 사용
3. **코덱스 위임**: "코덱스한테 시켜" = `.specs/`에 스펙 작성 후 Codex CLI 실행
4. **토큰 절약**: 파일 전체 반복 읽기 금지, offset/limit 또는 심볼릭 도구 사용
5. **스크린샷 정리**: 검수용 PNG는 프로젝트 루트에 남기지 않음 (.gitignore 처리됨)

## 프로젝트 개요

**도토리** — AI 기반 어린이집 입소 지원 서비스.
로그인 없이 전체 무료 접근, 쓰기만 인증. 2026 AI-Ambient UX 지향.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router, Turbopack) · TypeScript 5.6 strict
- **스타일**: Tailwind CSS 4 (OKLCH 색상 체계, warm amber hue 55-65)
- **상태**: Zustand 5 + React Query 5
- **DB**: MongoDB + Prisma (27 models, port 27018)
- **인증**: NextAuth v5 (Kakao/Naver)
- **결제**: Toss Payments
- **외부 SDK**: Kakao Maps/Share/Channel
- **AI**: Anthropic Claude Opus 4.6 (SSE, tool use 5종)
- **테스트**: Playwright (Mobile Safari 375×812)
- **린트**: Biome (pre-commit hook: typecheck + lint-changed)

## 디렉토리 구조

```
src/
├── app/
│   ├── (marketing)/     # 랜딩, about, pricing (3 pages)
│   ├── (auth)/          # login, phone, onboarding (3 pages)
│   ├── (app)/           # home, chat, in-fox, community, me, alerts, settings, facility (12 pages)
│   └── api/             # 22 API route groups
├── components/
│   ├── catalyst/        # 디자인 시스템 (29 components) — Badge, Card, Dialog, Button...
│   ├── ipsoai/          # 도메인 컴포넌트 (14) — BentoWidget, FacilityCard, ProbabilityGauge...
│   ├── kakao/           # 카카오 SDK 래퍼
│   └── shared/          # StaggerList, 공용 컴포넌트
├── features/
│   ├── home/            # useHomeData, PriorityHeroCard, FeedCard
│   ├── chat/            # 채팅 관련 기능
│   ├── explore/         # 탐색 기능
│   └── marketing/       # 마케팅 기능
├── hooks/               # 9 custom hooks (use-queries, use-streaming-chat, use-auth...)
├── stores/              # 3 stores (auth, alert, facility) + index
├── shared/ui/           # chat-bubble, chat-input, context-panel, facility-card
├── lib/                 # 유틸리티, SDK 초기화
└── types/               # 타입 정의
```

## 핵심 아키텍처

- **인증**: middleware AUTH_REQUIRED=[] (퍼블릭), admin만 인증. CSRF 쿠키+헤더
- **AI 채팅**: `/api/chat` Opus 4.6 SSE + 5 tools (facility/strategy/gauge/research/map)
- **실시간**: TO SSE `/api/me/alerts/to/stream`, Research `/api/research/stream`
- **카카오**: SDK(`lib/kakao/`), 인앱감지(`inapp.ts`), 공유(`share.ts`), 채널팔로우

## 활성 컴포넌트 현황

### 현재 사용 중 (wired)
| 컴포넌트 | 사용처 |
|----------|--------|
| `BentoGrid` / `BentoWidget` | Home 2x2 스탯, Me 2x2 스탯 |
| `PriorityHeroCard` | Home 히어로 (TO alert / AI insight) |
| `LiveActivityTicker` | Home 피드 위 실시간 티커 |
| `FeedCard` | Home 피드 (featured prop 지원) |
| `Badge` / `BadgeButton` | Home 컨텍스트 칩, Community 필터 |
| `useUnreadCount()` | Home 벤토, Me 벤토 |
| `useFavorites()` | Me 벤토 |
| `useHomeData()` | Home 전체 데이터 조합 |
| `StaggerList` | Home 피드 애니메이션 |

### 미사용 (다음 고도화 대상)
| 컴포넌트 | 위치 | 잠재 사용처 |
|----------|------|------------|
| `InlineFacilityCard` | `ipsoai/inline-cards.tsx` | Chat 인라인 렌더링 |
| `InlineProbabilityGauge` | `ipsoai/inline-cards.tsx` | Chat 인라인 렌더링 |
| `ProbabilityGauge size="sm"` | `ipsoai/probability-gauge.tsx` | Me 아이 카드 |
| `TOAlertCard` | `ipsoai/cards.tsx` | Home 히어로 내부 |
| `AIInsightCard` | `ipsoai/cards.tsx` | Home 히어로 내부 |
| `Dialog` | `catalyst/dialog.tsx` | Community 바텀시트 대체 |

## 코딩 컨벤션

- `@/` → `./src/` · Biome 2칸 들여쓰기 · RSC 기본, `"use client"` 명시
- **Tailwind**: `var(--radius-*)` 금지 → `rounded-2xl` 등 고정 클래스. OKLCH 변수 사용
- **Press feedback**: 모든 터치 요소에 `active:scale-[0.97] transition-transform`
- **모바일**: iPhone SE~Pro Max, 터치 44px+, `pb-[env(safe-area-inset-bottom)]`
- **레이아웃**: (app) 페이지 wrapper `px-4` 통일, `max-w-lg mx-auto`
- **색상 시스템**: primary(amber), accent(emerald), grade-a~d, state-danger/success
- **아이콘**: Lucide React, 시맨틱 컬러 (amber=알림, red=관심, blue=데이터, primary=AI)
- **다크모드**: `dark:from-primary-950/30` 등 그라디언트 대응
- 한국어 UI, 영어 코드

## 주요 명령어

```bash
npm run dev              # Turbopack dev server (port 3000)
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버
npm run typecheck        # tsc --noEmit
npm run quality:gate     # typecheck + lint + e2e:console + screenshots
npm run test:e2e         # Playwright 전체
npm run db:push          # Prisma → MongoDB
npx biome check --write ./src  # 포맷팅 + 린트 자동수정
```

## 보안

`.env.local` 커밋 금지 · `apiGuard()` 쓰기 인증 · CSRF · CSP (Kakao/Toss/GTM)

## 도메인 용어

TO=여석 · 입소확률=대기35%+여유25%+시즌15%+가점15%+연령10% · 가점=다자녀/맞벌이 · 연령반=만0~4세

## 프로젝트 이력

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | Next.js+Prisma+Auth+40 API+미들웨어+E2E | 완료 |
| 2 | Opus 4.6 SSE+캐싱+Tool Use+토큰로깅 | 완료 |
| 3 | 커뮤니티 8모델+7 API+피드+글작성 | 완료 |
| 4 | 무료접근+미니멀리팩+하이드레이션수정+BottomNav+Research | 완료 |
| 5 | 카카오 마스터패키지 (SDK/인앱/공유/채널) + CSS 리팩토링 | 완료 |
| 6 | 도토리 브랜딩 + 2026 AI-Ambient UX 전면 리팩토링 | 완료 |
| 7 | 고도화 2차 — 인라인카드, 스켈레톤, 탐색지도, 알림, 확률엔진 | 완료 |
| 7+ | Codex 워크플로우 개선 — safe-exec, monitor, spec-validate | 완료 |

### P0 잔여 (Phase 8 후보)
- AI chat E2E 안정화 + 통합 테스트
- 카카오맵 실제 마커 렌더링 (탐색 페이지 지도 뷰)
- 결제 (Toss Payments) 연동
- 푸시 알림 (FCM/APNs) 실제 구현

## 듀얼 에이전트 워크플로우 (Claude ↔ Codex)

### 역할 분담
| 역할 | 도구 | 모델 | 적합 작업 |
|------|------|------|----------|
| **Claude (설계/검수)** | Claude Code CLI | Opus 4.6 | 아키텍처, API, 로직, 스펙 작성, 코드 리뷰 |
| **Codex (구현)** | Codex CLI (WSL) | gpt-5.3-codex-spark | 벌크 UI, 반복 패턴, 컴포넌트 생성 |

### Codex 적합도 기준
| 작업 유형 | Codex 적합 | 비고 |
|----------|-----------|------|
| UI 컴포넌트 생성 (2-3개) | ✅ 매우 적합 | S1+S2 수준 |
| API 라우트 + 스토어 | ⚠️ 보통 | 타입 복잡도 높으면 Claude 직접 |
| 5+ 파일 복합 기능 | ❌ 부적합 | 스펙 분할 필수 |
| 아키텍처/로직 변경 | ❌ 부적합 | Claude 직접 |

### 스펙 작성 규칙
- **`.specs/TEMPLATE.md`** 사용 필수
- 최대 **3 parts, 120줄** (하드 리밋 150줄)
- **"Codex 전용 파일"** 섹션 명시 → Claude 동시 수정 방지
- 검증: `node scripts/codex-spec-validate.cjs`
- 큰 작업은 `current-task-a.md`, `current-task-b.md`로 분할 → 순차 실행

### 작업 흐름 (v3 — 프로세스 잠금 + 자동 복구)
```
Claude (스펙 작성)
    ↓
node scripts/codex-spec-validate.cjs  ← 스펙 크기 검증
    ↓ (pass)
node scripts/codex-safe-exec.cjs      ← v2: 프로세스 잠금 + 헬스체크
    ↓                                    (별도 터미널: codex-monitor)
[15초마다 git diff 체크]
    ├─ 초기 45초 grace period (첫 변경 전)
    ├─ stall 감지 → auto-revert → Claude fallback
    └─ 정상 완료 → result.json + history 저장
    ↓
Claude (typecheck + biome 검수)
    ↓
git commit (배치 러너: typecheck 통과 후에만 커밋)
```

### Codex 실행 (v3)
```bash
# 단일 스펙 실행
npm run codex:safe -- --spec .specs/current-task.md

# 배치 실행 (Phase N 전체)
npm run codex:batch                          # 기본: p8-* 패턴
npm run codex:batch -- --pattern p9-         # Phase 9 대상
npm run codex:batch -- --max-timeout 600     # 타임아웃 조정
npm run codex:batch:dry                      # dry-run

# 모니터링 (별도 터미널)
npm run codex:monitor

# 파이프라인 리포트
npm run codex:report       # 마크다운 리포트
npm run codex:report:json  # JSON 분석 데이터

# 티어 전환 (WSL bash 호환)
npm run codex:tier -- max resume
npm run codex:tier -- deep new "fix bug"

# A/B 테스트 (WSL bash 호환)
npm run codex:ab:bash
```

### v3 개선사항 (safe-exec / batch-runner)
| 기능 | v2 | v3 |
|------|----|----|
| stall 감지 | `checkCount > 2` (30초 무시) | 실제 last-change 기반 + 45초 grace |
| 실패 시 정리 | 수동 | auto-revert (`git checkout + clean`) |
| 동시 실행 방지 | 없음 | `.codex-running.lock` 프로세스 잠금 |
| 결과 히스토리 | 덮어쓰기 | `scripts/codex-history/` 타임스탬프 보존 |
| 배치 커밋 순서 | 커밋 → typecheck | typecheck → 커밋 (깨진 커밋 방지) |
| 멱등성 | 중복 실행 가능 | git log 검사로 이미 커밋된 스펙 skip |
| 타임아웃 | 고정 480s | `--max-timeout`, `--stall-timeout` CLI arg |
| Codex 출력 | 잘림 (500자) | 전체 출력 별도 로그 파일 저장 |
| WSL 호환 | PowerShell 전용 | bash 스크립트 포팅 완료 |

### 파일 잠금 규칙
- 스펙의 "Codex 전용 파일"에 명시된 파일은 Codex 실행 중 Claude 수정 금지
- `.codex-running.lock` 존재 시 다른 safe-exec 실행 차단 (15분 후 자동 해제)
- Claude는 **다른 파일**만 병렬 작업 (예: API 라우트, 엔진 로직)
- 공유 파일 (index.ts barrel 등)은 Codex 완료 후 Claude가 통합

### 실패 대응 프로토콜
1. 결과 확인: `scripts/codex-safe-exec.result.json` + `scripts/codex-output-*.log`
2. `success: false` 시:
   - `killed: true` + `killReason: "STALL"` → 스펙 축소 후 재시도
   - `killed: true` + `killReason: "HARD TIMEOUT"` → `--max-timeout` 증가
   - `exitCode: 1` + 출력 0줄 → `codex login` 인증 확인
   - `autoReverted: true` → workspace 자동 정리 완료, 스펙 수정 후 재시도
3. 2회 연속 실패 시 해당 작업은 Claude 직접 구현
4. `npm run codex:report` 로 히스토리 기반 추천 타임아웃 확인

### 슬래시 커맨드
- `/codex-impl [설명]` — 스펙 작성 + 검증 + 안전 실행
- `/review [범위]` — 변경사항 종합 검수
- `/handoff` — 세션 컨텍스트 인계 문서 생성
- `/design-check` — 모바일 UI/UX 글로벌 기준 검수

## WSL2 개발 주의사항

- Turbopack은 WSL2에서 파일 워칭 불안정 → `WATCHPACK_POLLING=true` 사용
- **시각 검수 시 반드시 `next build && next start`** — dev server는 캐시된 SSR HTML 반환 가능
- MongoDB는 WSL2 로컬 (port 27018), `mongosh` 으로 확인
- `fuser -k 3000/tcp` 으로 포트 정리 후 서버 시작
