# 도토리 (Dotori) 프로젝트 개요

## 현재 상태 (2026-02-24, R23 완료 + CI/CD v2)

- **47 pages**, 0 TypeScript errors, **111 tests** (vitest, 16 test files), 빌드 성공
- **14 models**, **35 API routes**, **72 components** (27 catalyst + 44 dotori + 1 landing)
- **MongoDB**: 20,027 시설 (17개 시도), Atlas `dotori` DB
- **DO 배포**: DigitalOcean App Platform (sgp 리전) + **DOCR** (pre-built 이미지)
  - URL: https://dotori-app-pwyc9.ondigitalocean.app
  - App ID: 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
  - DOCR: `registry.digitalocean.com/dotori/web` (sgp1)
- **완료 라운드**: R1(12)+R2(12)+R3(12)+R5(11)+R8(11)+R9(11)+R11(6)+R12(5)+R13(11)+R17(11)+R22(11)+R23(7) = **120+ 에이전트**
- **보안**: P0~P1 이슈 0건 (R13에서 Opus 분석 기반 전체 수정)
- **UX 기반 완성 (R17~R23)**: dark mode, glass morphism, motion/react, layout polish, interaction feedback 전 페이지 적용
- **auth 픽스**: NextAuth v5 trustHost=true (UntrustedHost 에러 해결)
- **E2E 스펙**: e2e/smoke.spec.ts + e2e/console-errors.spec.ts (크리티컬 에러 자동 감지)

## CI/CD v2 — Pre-built Image Deployment (2026-02-24)

- **구조**: `detect(변경감지) → ci(lint+test) → docker(GHA캐시빌드→DOCR push) → deploy(이미지pull)`
- **핵심 개선**: DO Dockerfile 풀빌드(~15분) → GHA BuildKit 캐시 빌드 + DOCR pre-built 이미지(~3분)
- **변경 감지**: `detect` job이 앱 소스/Dockerfile/설정 변경 시만 배포 트리거 (테스트/문서 변경은 스킵)
- **Docker 레이어**: config(불변) → public(가끔) → src(자주) 3레이어 분리 + ARG로 NEXT_PUBLIC 주입
- **이미지 태그**: `latest` + `sha-<commit>` (DOCR)
- **.dockerignore**: 테스트/스크립트/lint설정 등 불필요 파일 전면 제외

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

## 72 컴포넌트

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

- **CI/CD v2**: GHA → DOCR pre-built 이미지 → DO pull 배포 (~3분)
- **DOCR**: `registry.digitalocean.com/dotori/web` (sgp1 리전)
- health_check: `/api/health` (liveness, DB 미포함)
- 환경변수 변경: `scripts/do-env-update.sh` 사용 필수 (전체 spec 교체 시 EV 손상)
