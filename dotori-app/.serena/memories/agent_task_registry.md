# 에이전트 파일 소유권 맵 (R6 비즈니스 플랜 중심, 2026-02-22)

## R6 태스크 배분 (11 Codex 에이전트) — 수익화 퍼널 우선

| 에이전트 | 담당 파일 | 비즈니스 목표 | 우선순위 |
|---------|---------|------------|---------|
| **r6-eslint-infra** | `src/components/dotori/PageTransition.tsx`, `.dockerignore`, `src/middleware.ts` | ESLint P0 수정 + Rate limiting | 인프라 |
| **r6-subscription-api** | `src/app/api/subscriptions/route.ts`(신규), `src/models/Subscription.ts`(신규), `src/app/api/users/me/route.ts` | 구독 API 기반 (결제 연동 준비) | 🔴 P0 |
| **r6-analytics-track** | `src/models/UsageLog.ts`(신규), `src/app/api/analytics/usage/route.ts`(신규) | 사용량 추적 (채팅 카운트 → 쿼터 기반) | 🔴 P0 |
| **r6-premium-gate** | `src/components/dotori/PremiumGate.tsx`(신규), `src/components/dotori/UpgradeModal.tsx`(신규) | 프리미엄 게이트 공통 컴포넌트 | 🔴 P0 |
| **r6-chat-quota** | `src/app/(app)/chat/page.tsx`, `src/app/api/chat/stream/route.ts` | 채팅 무료 5회/월 제한 + 업그레이드 CTA | 🔴 P0 |
| **r6-facility-premium** | `src/app/(app)/facility/[id]/FacilityDetailClient.tsx` | 인증 파트너 배지 + 프리미엄 프로필 렌더링 | 🟠 P1 |
| **r6-alert-premium** | `src/app/(app)/my/waitlist/page.tsx`, `src/app/api/alerts/route.ts` | 빈자리 알림 프리미엄 전용 게이트 | 🟠 P1 |
| **r6-home-upsell** | `src/app/(app)/page.tsx` | 홈 프리미엄 배너 + 빈자리 알림 업셀 | 🟠 P1 |
| **r6-my-upgrade** | `src/app/(app)/my/page.tsx`, `src/app/(app)/my/settings/page.tsx` | 플랜 업그레이드 UI + settings 구현 | 🟠 P1 |
| **r6-landing-b2c** | `src/app/(landing)/landing/page.tsx` | B2C 월 1,900원 플랜 추가 + CTA 강화 | 🟡 P2 |
| **r6-onboarding-value** | `src/app/(onboarding)/onboarding/page.tsx` | 온보딩 프리미엄 가치 제안 슬라이드 | 🟡 P2 |

## 머지 순서 (의존성 순)
```
1. r6-eslint-infra       (독립)
2. r6-analytics-track    (독립 — 사용량 모델)
3. r6-subscription-api   (analytics 의존)
4. r6-premium-gate       (독립 컴포넌트)
5. r6-chat-quota         (premium-gate 컴포넌트 사용)
6. r6-alert-premium      (premium-gate 컴포넌트 사용)
7. r6-facility-premium   (독립)
8. r6-home-upsell        (독립)
9. r6-my-upgrade         (subscription-api 의존)
10. r6-landing-b2c       (독립 UI)
11. r6-onboarding-value  (독립 UI)
```

## 파일 충돌 금지
- `types/dotori.ts` — analytics-track 에이전트만 타입 추가
- `(app)/page.tsx` — r6-home-upsell만
- `chat/page.tsx` — r6-chat-quota만
- `chat/stream/route.ts` — r6-chat-quota만
- `facility/[id]/FacilityDetailClient.tsx` — r6-facility-premium만
- `my/page.tsx` — r6-my-upgrade만

## 비즈니스 목표 연결 (이 라운드 완료 후 달성)
- ✅ 채팅 5회/월 제한 → 프리미엄 업그레이드 유인
- ✅ 빈자리 알림 프리미엄 전용 → B2C 1,900원 핵심 가치
- ✅ 인증 파트너 배지 → B2B 3~5만원 가치 증명
- ✅ 구독 API 기반 → 결제 시스템 연동 준비 완료
- ✅ 사용량 추적 → 데이터 기반 의사결정 기반

## 완료된 작업 (R5, 2026-02-22)
| 에이전트 | 내용 |
|---------|------|
| r5-a | GPS 내 위치 버튼 + 이동 가능 시설 필터 |
| r5-b | 사용자 위치 마커 + 에러 UI |
| r5-c | 로그인 에러처리 + 카카오 버튼 |
| r5-d | 입소설명회 안내 + 정원 progress bar |
| r5-e | 대기 신청 UX + API 에러처리 |
| r5-f | 커뮤니티 게시판 UX + FAB |
| r5-g | 홈 UX 현대화 + 퀵액세스 |
| r5-h | MY 페이지 + 비로그인 CTA |
| r5-i | 온보딩 슬라이더 |
| r5-j | 채팅 빠른응답 칩 + 초기화 |
