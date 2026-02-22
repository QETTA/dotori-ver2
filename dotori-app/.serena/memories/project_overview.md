# 도토리 (Dotori) 프로젝트 개요

## 현재 상태 (2026-02-22, R20 완료)

- **47 pages**, 0 TypeScript errors, **106 tests** (vitest, 15 test files), 빌드 성공
- **14 models**, **35 API routes**, **72 components** (27 catalyst + 44 dotori + 1 landing)
- **MongoDB**: 20,027 시설 (17개 시도), Atlas `dotori` DB
- **DO 배포**: DigitalOcean App Platform (sgp 리전)
  - URL: https://dotori-app-pwyc9.ondigitalocean.app
  - App ID: 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
- **완료 라운드**: R1(12)+R2(12)+R3(12)+R5(11)+R8(11)+R9(11)+R11(6)+R12(5)+R13(11)+R17(11)+R18(11)+R19(11)+R20(4) = **128 에이전트**
- **보안**: P0~P1 이슈 0건 (R13에서 Opus 분석 기반 전체 수정)
- **UX 기반 완성 (R18~R20)**: dark mode, glass morphism, motion/react, layout polish, interaction feedback 전 페이지 적용
- **R20 성과**: 나노단위 UI 검수 — 폰트/워딩/카드/배치/컬러 전면 폴리싱, auth layout pt-[22vh] 제거(로그인 중앙정렬), 카카오 K 아이콘, 채팅 헤딩 1줄(text-xl)
- **auth 픽스**: NextAuth v5 trustHost=true (UntrustedHost 에러 해결)
- **E2E 스펙**: e2e/smoke.spec.ts + e2e/console-errors.spec.ts (크리티컬 에러 자동 감지)
- **106 tests** (vitest), **E2E 15/15** (Playwright)

## R14 문서 동기화 상태 (2026-02-22)

- **목적**: R14 실행 전 문서 기준선(목적/범위/소유권/머지 순서/완료 조건) 통일
- **범위**: `../docs/CHANGELOG.md`, `.serena/memories/agent_task_registry.md`, `.serena/memories/project_overview.md`
- **진행상태**: `docs-sync-r14` 반영 완료, 11개 에이전트 소유권/머지 순서(1→11) 확정
- **소유권/머지 기준 문서**: `.serena/memories/agent_task_registry.md`
- **R14 완료 조건**: 콘솔 오류 0 (`BASE_URL=http://localhost:3000 npm run check-console`), `npm run lint` 통과, `npm run build` 통과, `npx tsc --noEmit` 에러 0

## 앱 포지셔닝 (2026 핵심 전략)

**초기 타겟: "이동 수요"** — 신규 입소자가 아닌 현재 어린이집에서 이동 고민 중인 부모
- 연중 상시 수요 (비수기 없음), 결정 의향 높음
- 이동 트리거: 반편성 불만(3월), 교사 교체(연중), 설명회 실망(2월), 국공립 당첨(연중)
- 포지셔닝 메시지: "지금 다니는 어린이집, 정말 괜찮으신가요?"

## 수익화 구조

### B2C (부모 대상)
- 무료: 채팅 월 5회, 게스트 3회
- 프리미엄 월 1,900원: 빈자리 즉시 알림, 토리챗 무제한, 이동 우선 매칭
- "프리미엄" 단어 부모에게 노출 금지 → "인증 시설", "상세 정보" 표현

### B2B (시설 대상) — PREMIUM_SPEC.md 기준
- 월 33,000원(VAT포함) / 6개월 27,500원 / 12개월 22,000원
- 혜택: 검색 상단 노출(sortBoost), 확장 프로필, "인증 시설" 배지
- **6개 태스크 전체 완료** (R5~R9)
- **Admin API**: `/api/admin/facility/[id]/premium` PUT — Bearer CRON_SECRET 인증 (R13 보안 강화)

## 기술 스택

- Next.js 16.1 (App Router) + React 19 + TypeScript 5.8 strict
- Tailwind CSS 4, motion/react (NEVER framer-motion)
- Mongoose 8.23 + MongoDB Atlas (db: dotori)
- NextAuth v5, Kakao OAuth, JWT strategy
- Anthropic Claude API (토리챗 SSE 스트리밍, Sonnet 4.6)
- Kakao Map SDK (NEXT_PUBLIC_KAKAO_MAP_KEY)

## 주요 API (35개 route.ts)

| 카테고리 | 엔드포인트 | 설명 |
|----------|-----------|------|
| 시설 | `/api/facilities`, `/api/facilities/[id]` | 목록/상세 |
| 채팅 | `/api/chat`, `/api/chat/stream`, `/api/chat/history` | 토리챗 SSE |
| 대기 | `/api/waitlist`, `/api/waitlist/[id]`, checklist, import | 대기 신청 CRUD |
| 커뮤니티 | `/api/community/posts`, [id], comments, like | 게시판 CRUD |
| 구독 | `/api/subscriptions` | 프리미엄 구독 |
| 알림 | `/api/alerts`, channels | 빈자리 알림 |
| 사용자 | `/api/users/me`, interests | 프로필/관심 |
| 분석 | `/api/analytics/usage`, errors, vitals | 사용량 추적 |
| 관리 | `/api/admin/facility/[id]/premium` | B2B 프리미엄 |
| 크론 | `/api/cron/sync-isalang`, to-monitor | 데이터 동기화 |
| 기타 | home, geocode, regions, notifications, og, health, ocr, actions | 유틸리티 |

## 14 Mongoose 모델

User, Facility, Waitlist, Alert, ChatHistory, Post, Comment, Subscription, UsageLog, ActionIntent, ActionExecution, AlimtalkLog, FacilitySnapshot, SystemConfig

## 48 컴포넌트

### Catalyst (27) — 원자 UI (수정 금지)
Button, Badge, Input, Heading, Text, Strong, Select, Fieldset, Field, Dialog, Avatar, Switch, Radio, Checkbox, Textarea, Table, DescriptionList, Divider, Link, etc.

### Dotori (44) — 도메인 컴포넌트
Core(20): BottomTabBar, FacilityCard, ChatBubble, StreamingIndicator, ActionConfirmSheet, SourceChip, Toast/ToastProvider, Skeleton, EmptyState, ErrorState, MapEmbed, PremiumGate, UsageCounter, AiBriefingCard, PageTransition, CompareTable, MarkdownText, SplashScreen, Wallpaper
blocks/(7): ActionBlock, AlertsBlock, CompareBlock, FacilityBlock, RecommendBlock, SummaryBlock, WaitlistBlock
explore/(4): ExploreSuggestionPanel, explore-constants, explore-storage, explore-utils
facility/(13): FacilityCapacitySection, FacilityContactSection, FacilityDetailClient, FacilityLocationSection, FacilityOperatingSection, FacilityPremiumSection, FacilityProgramSection, FacilityReviewSection, FacilityStatusBadges, FacilityWaitlistCTA, facility-detail-helpers, useFacilityDetailActions, useFacilityDetailData

## 디자인 시스템

### 컬러 토큰
- `dotori-400`: #c8956a (브랜드 메인)
- `dotori-500`: #b07a4a (WCAG AA 안전, 버튼 텍스트)
- `forest-500`: #4a7a42 (성공/입소가능)
- `color="amber"` → 카카오 전용, 앱 CTA 금지
- `color="forest"` → Badge 전용, Button 금지

### 디자인 규칙 (Codex 필수)
- 임의 픽셀값 금지: text-[Npx] → text-xs/sm/base/lg/xl 사용
- 커스텀 CSS 금지 → Tailwind 스케일 토큰만
- Mobile-first: 375x812, `max-w-md mx-auto`
- Touch targets: min 44px, `active:scale-[0.97]`
- `suppressHydrationWarning` on `formatRelativeTime()` elements

## 엔진 구조 (토리챗)

- `lib/engine/intent-classifier.ts` — 이동/반편성/교사교체 등 인텐트 분류
- `lib/engine/response-builder/blocks.ts` — 인텐트별 응답 빌더 (메인 라우터)
- `lib/engine/response-builder/search.ts` — 시설 검색/상세 응답
- `lib/engine/response-builder/status.ts` — 대기 상태/현황 응답
- `lib/engine/response-builder/recommendation.ts` — 추천/비교 응답
- `lib/engine/response-builder/context.ts` — 컨텍스트 유틸 (검색어, 이동 시나리오)
- `lib/engine/response-builder/types.ts` — 타입 정의
- `lib/engine/nba-engine.ts` — NBA(Next Best Action) 조건 평가
- `lib/ai/claude.ts` — Anthropic API 래퍼

## 환경 변수

- `MONGODB_URI` — MongoDB Atlas
- `AUTH_SECRET`, `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET`
- `ANTHROPIC_API_KEY` — Claude API
- `NEXT_PUBLIC_KAKAO_MAP_KEY` — 카카오맵 JS SDK
- `KAKAO_REST_API_KEY` — 카카오 로컬 API (서버사이드)
- `NEXT_PUBLIC_KAKAO_CHANNEL_ID` — `_dotori`
- `CRON_SECRET` — Admin API 인증

## DigitalOcean 배포

- health_check: `/api/health`
- 환경변수 변경: `scripts/do-env-update.sh` 사용 필수 (전체 spec 교체 시 EV 손상)
