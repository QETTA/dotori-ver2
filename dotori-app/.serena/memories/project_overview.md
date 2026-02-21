# 도토리 (Dotori) 프로젝트 개요

## 현재 상태 (2026-02-22, R8 완료)

- **47 pages**, 0 TypeScript errors, 빌드 성공
- **MongoDB**: 20,027 시설 (17개 시도), Atlas `dotori` DB
- **DO 배포**: DigitalOcean App Platform (sgp 리전)
  - URL: https://dotori-app-pwyc9.ondigitalocean.app
  - App ID: 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
- **완료 라운드**: R1(12) + R2(12) + R3(12) + R5(11) + R8(11) = 58 에이전트

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
- Phase 0: 5곳 무료 체험 → 유료 전환
- **Admin API**: `/api/admin/facility/[id]/premium` PUT — Bearer CRON_SECRET 인증

## PREMIUM_SPEC 구현 현황 (PREMIUM_SPEC.md 6개 태스크)

| 태스크 | 내용 | 상태 |
|--------|------|------|
| Task 1 | Facility.ts premium 서브스키마 | ❌ 미구현 |
| Task 2 | types/dotori.ts FacilityPremium 타입 | ❌ 미구현 |
| Task 3 | dto.ts toFacilityDTO premium 매핑 | ❌ 미구현 |
| Task 4 | 시설 목록 API sortBoost 정렬 | ❌ 미구현 |
| Task 5 | 시설 상세 "인증 시설" 배지 UI | ✅ R8 완료 (facility-premium) |
| Task 6 | Admin API premium endpoint | ❌ 미구현 |

## Phase 0 체크리스트 (BUSINESS_PLAN.md)

- [x] 도토리 웹앱 배포 (DO App Platform)
- [ ] 카카오 비즈니스 채널 개설 (@dotori_kr) — **수동 작업 필요**
- [ ] 웰컴 메시지 + 스마트채팅 8개 키워드 세팅
- [ ] 소상공인 프로젝트 단골 신청 (30만원 캐시)
- [ ] 카카오 개발자 콘솔 도메인 등록 (dotori-app-pwyc9.ondigitalocean.app)

## 기술 스택

- Next.js 16.1 (App Router) + React 19 + TypeScript 5.8 strict
- Tailwind CSS 4, motion/react (NEVER framer-motion)
- Mongoose 8.14 + MongoDB Atlas
- NextAuth v5, Kakao OAuth, JWT strategy
- Anthropic Claude API (토리챗 SSE 스트리밍)
- Kakao Map SDK (NEXT_PUBLIC_KAKAO_MAP_KEY)

## 주요 API

- `/api/chat/stream` — 토리챗 SSE 스트리밍 (Claude Sonnet 4.6)
- `/api/facilities` — 시설 검색/필터 (Atlas Search)
- `/api/waitlist` — 대기 신청
- `/api/subscriptions` — 구독/업그레이드
- `/api/analytics/usage` — 사용량 추적 (UsageLog)
- `/api/geocode/reverse` — GPS 좌표 → 행정구역 (auth: false)
- `/api/alerts` — 빈자리 알림 (프리미엄 전용)
- `/api/health` — liveness probe (DB 없음)
- `/api/health/deep` — deep check (DB ping)

## 디자인 시스템

### 컬러 토큰
- `dotori-400`: #c8956a (브랜드 메인)
- `dotori-500`: #b07a4a (WCAG AA 안전, 버튼 텍스트)
- `forest-500`: #4a7a42 (성공/입소가능/프리미엄 활성)
- `color="amber"` → 카카오 전용, 앱 CTA 금지

### 컴포넌트 계층
- **Layer 1 (Catalyst)**: Button, Badge, Input, Heading, Text, Strong, Select, Fieldset, Field, Dialog, Avatar, Switch, Radio, Checkbox, Textarea, Table, DescriptionList, Divider, Link
- **Layer 2 (Dotori)**: BottomTabBar, FacilityCard, ChatBubble, StreamingIndicator, ActionCard, SourceChip, FilterChip, ActionConfirmSheet, Toast/ToastProvider, Skeleton, EmptyState, ErrorState, MapEmbed, PremiumGate, UsageCounter, AiBriefingCard, PageTransition

### 디자인 시스템 규칙 (Codex 필수)
- 임의 픽셀값 금지: text-[Npx] → text-xs/sm/base/lg/xl 사용
- 커스텀 CSS 금지 → Tailwind 스케일 토큰만
- `color="dotori"` → CTA, `color="forest"` → 성공

## 템플릿 자산 (reference/ 폴더)

- `reference/catalyst-ui-kit/` — 27개 Headless UI 컴포넌트
- `reference/tailwind-plus-pocket/` — 앱스토어 랜딩 (Hero, PhoneFrame, AppDemo, Pricing)
- `reference/tailwind-plus-salient/` — 가격 비교, 후기 카드 그리드
- `reference/template-components/` — Oatmeal: faqs-accordion, stats-four-columns, plan-comparison-table
- `reference/template-pages/` — home-01~03, pricing-01~03

## 엔진 구조 (토리챗)

- `lib/engine/intent-classifier.ts` — 이동/반편성/교사교체 등 인텐트 분류
- `lib/engine/response-builder.ts` — 인텐트별 응답 빌더
- `lib/engine/nba-engine.ts` — NBA(Next Best Action) 조건 평가
- `lib/ai/claude.ts` — Anthropic API 래퍼

## 디렉토리 구조

```
src/
├── app/(app)/          # 메인 앱 (BottomTabBar 있음)
│   ├── page.tsx        # 홈 대시보드
│   ├── chat/           # 토리챗
│   ├── explore/        # 시설 탐색 (GPS, 지도, 필터)
│   ├── community/      # 이웃 (익명 게시판)
│   ├── facility/[id]/  # 시설 상세
│   └── my/             # MY, settings, waitlist, notifications
├── app/(auth)/login/   # 로그인 (카카오 OAuth)
├── app/(onboarding)/   # 온보딩
├── app/(landing)/      # 랜딩 (B2C + B2B)
├── models/             # Facility, User, Waitlist, Alert, ChatHistory, Post, Subscription, UsageLog
├── lib/engine/         # 토리챗 AI 엔진
└── components/
    ├── catalyst/       # 원자 컴포넌트 27개
    └── dotori/         # 도토리 분자 컴포넌트
```

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
