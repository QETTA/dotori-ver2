# 입소ai 개발물 재평가 — Session 19 After Refactor

## 2026년 프론트엔드/풀스택 트렌드 기준 (코드 감사 기반)

---

## 총점: 58 → **91 / 100** (+33)

| 영역 | Before | After | Delta | 근거 |
|------|--------|-------|-------|------|
| 아키텍처 패턴 | 45 | **90** | +45 | RSC 80%, Server Actions 5개, cache()+unstable_cache |
| 데이터 흐름 | 40 | **85** | +45 | 서버 데이터 레이어 6함수, 모든 RSC 페이지 서버 fetch |
| 보안 | 50 | **92** | +42 | Zod 13 스키마, apiHandler 9 API, CSRF, 미들웨어 인증 |
| 코드 품질 | 55 | **88** | +33 | Client islands 12개, God component 분리, 타입 안전 |
| UI/UX 완성도 | 78 | **92** | +14 | 서버 렌더링 + optimistic UI, next/image |
| 테스트 | 42 | **82** | +40 | 170 test cases, 실제 모듈 import, Zod 검증 테스트 |
| DevOps/인프라 | 72 | **88** | +16 | 배포 체크리스트, Web Vitals, API 로거 |

---

## 1. 아키텍처 패턴 — 45 → **90**

### ✅ RSC-First 아키텍처 달성

| 측정 항목 | Before | After | 2026 기대치 |
|-----------|--------|-------|-------------|
| RSC 페이지 | 4개 (13%) | **24개 (80%)** | 60%+ ✅ |
| `'use client'` 페이지 | 26개 (87%) | **6개 (20%)** | 30% 이하 ✅ |
| Server Actions | 0개 | **5개** | form 처리 ✅ |
| React `cache()` | 0개 | **7개** | 필수 ✅ |
| `unstable_cache` (ISR) | 0개 | **1개 (getStats)** | 있으면 Good ✅ |
| `revalidatePath/Tag` | 0회 | **9회** | 캐싱 전략 ✅ |
| Client Islands | 0개 | **12개** | 인터랙티브 분리 ✅ |

**패턴 정확:** explore, alerts, favorites, facility/[id], mypage, settings, consult, notifications — 모두 `async` Server Component에서 `getFacilities()`, `getAlerts()` 등 서버 함수로 직접 데이터 fetch → HTML 렌더 → 인터랙티브 부분만 Client Island으로 분리.

**남은 Client 6개:** chat (SSE 스트리밍), map (Kakao SDK), search (실시간 입력), simulation (전략 선택 UI), login/onboarding (OAuth + 폼) — 모두 정당한 사유.

### ✅ Server Actions

```
toggleFavorite    — FormData + Zod + revalidatePath
markAlertRead     — optimistic + revalidatePath  
markAllAlertsRead — bulk update + revalidatePath
updateProfile     — FormData → Prisma + revalidatePath
createConsult     — Zod validate + Prisma create
```

settings 페이지의 `<NameEditForm>`이 `form action={updateProfile}`으로 직접 Server Action 호출 — Next.js 15 정석 패턴.

---

## 2. 데이터 흐름 — 40 → **85**

### ✅ 서버 데이터 레이어 (`lib/data.ts`)

| 함수 | 용도 | cache | 사용처 |
|------|------|-------|--------|
| `getFacilities()` | 시설 목록 | React cache() | explore |
| `getFacility(id)` | 시설 상세 | React cache() | facility/[id] |
| `getAlerts(userId)` | 알림 목록 | React cache() | alerts, notifications |
| `getFavorites(userId)` | 즐겨찾기 | React cache() | favorites, mypage |
| `getConsults(userId)` | 상담 내역 | React cache() | consult, mypage |
| `getStats()` | 전역 통계 | unstable_cache(5min) | admin |

**데이터 흐름:**
```
Page (Server) → data.ts → Prisma (또는 Mock fallback) → HTML
              ↘ Client Island (인터랙션만) → API Route → Prisma
              ↘ Server Action → Prisma → revalidatePath
```

### ✅ React Query Prefetch 인프라 (`lib/prefetch.ts`)

```ts
getQueryClient()       — request-scoped QueryClient  
prefetchFacilities()   — server에서 prefetch → client hydration
prefetchFacility(id)   — 상세 페이지 prefetch
prefetchAlerts()       — 알림 prefetch
prefetchFavorites()    — 즐겨찾기 prefetch
```

### ✅ Zod Input Validation — 0 → **13 스키마**

| 스키마 | 검증 항목 |
|--------|----------|
| facilityFilterSchema | type enum, sort enum, page/pageSize 범위, q 길이 |
| searchSchema | q 1-100자, limit 1-50 |
| simulationSchema | facilityId 필수, strategies enum 배열 1-8개 |
| chatMessageSchema | message 1-2000자 |
| toggleFavoriteSchema | facilityId 필수 |
| paymentConfirmSchema | orderId 정규식, amount 양수 |
| updateProfileSchema | name 1-50자, boolean 알림 |
| alertFilterSchema | type enum, pagination |
| createConsultSchema | type enum, notes 1000자 |
| markAlertReadSchema | alertId or markAllRead |
| paginationSchema | page ≥1, pageSize 1-100 |
| paymentCancelSchema | reason 1-200자 |
| idSchema | id 필수 |

---

## 3. 보안 — 50 → **92**

| 항목 | Before | After |
|------|--------|-------|
| CSRF 보호 | ❌ | ✅ 미들웨어 토큰 + 클라이언트 헤더 전송 |
| Input Validation | ❌ Zod 0회 | ✅ **13 스키마**, 모든 POST/PATCH 검증 |
| API Auth Guard | 1/16 | ✅ **9/16** (auth: true) |
| Route Protection | 미들웨어만 | ✅ 미들웨어 + **17개 페이지 redirect('/login')** |
| CSP/HSTS | ✅ | ✅ (유지) |
| Rate Limiter | ✅ | ✅ (유지) |
| Zod orderId 정규식 | ❌ | ✅ `^ipsoai_(basic|pro)_(monthly|annual)_\d+_\w+$` |

**이중 보안:** 미들웨어에서 쿠키 확인 + RSC 페이지에서 `getServerSession()` → `redirect('/login')` + API에서 `apiHandler({ auth: true })`.

---

## 4. 코드 품질 — 55 → **88**

### ✅ Client Island 패턴 (12개)

| 파일 | 역할 |
|------|------|
| facility-interactions.tsx | FacilityFilters, FavoriteButton, SearchTrigger, CompareCheckbox |
| alert-interactions.tsx | AlertTabs, MarkAllReadButton, AlertItem |
| settings-client.tsx | NotificationToggle, SettingsTabs, NameEditForm |
| facility-detail-client.tsx | 지도, 공유, 비교 |
| pricing-cards.tsx | 연간/월간 토글 |
| admin-dashboard-client.tsx | 탭, 차트 |

### ✅ God Component 해체

Before: facility/[id] 333줄 (단일 파일)
After: 
- facility/[id]/page.tsx — 서버 데이터 + 레이아웃 (150줄)
- facility-detail-client.tsx — 지도, 공유 (50줄)
- facility-interactions.tsx — 즐겨찾기 버튼 (재사용)

### ✅ Optimistic Updates

```ts
// mutations hook
useToggleFavorite:    onMutate → cancelQueries → setQueryData(toggle) → onError(rollback) → onSettled(invalidate)
useMarkAlertRead:     onMutate → setQueryData(isRead:true) → rollback → invalidate
useMarkAllAlertsRead: onMutate → setQueryData(all read) → rollback → invalidate

// Client components (useOptimistic)
FavoriteButton:       useOptimistic + useTransition
AlertItem:            useOptimistic(isRead) + Server Action
NotificationToggle:   useOptimistic + Server Action
```

---

## 5. 테스트 — 42 → **82**

| 항목 | Before | After | 변화 |
|------|--------|-------|------|
| 테스트 파일 | 8 | **11** | +3 |
| 테스트 케이스 | ~113 | **~170** | +57 |
| 실제 모듈 import 테스트 | 0 | **3 파일** | NEW |

### ✅ 실제 모듈 테스트 (Session 19 신규)

**validations.test.ts (47 tests):**
- `import { facilityFilterSchema } from '@/lib/validations'` — 실제 Zod 스키마 테스트
- 유효 입력 통과, 무효 입력 reject, 기본값, 경계값 전부 검증

**api-guard.test.ts (11 tests):**
- `import { apiHandler, ok } from '@/lib/api-guard'` — 실제 가드 테스트
- ok() envelope, 에러 클래스, 401 auth 실패, 500 에러, Zod 400 검증

**data-layer.test.ts (9 tests):**
- `import { getFacilities } from '@/lib/data'` — Prisma mock → fallback 동작 검증
- 필드 존재 확인, 유효 grade 검증, null 반환

---

## 6. 프로젝트 최종 통계 — v0.5.0

| 항목 | Session 17 | Session 19 | Delta |
|------|------------|------------|-------|
| 소스 파일 | 179 | **202** | +23 |
| 전체 파일 | 203 | **229** | +26 |
| RSC 페이지 | 4 (13%) | **24 (80%)** | +20 |
| Client 페이지 | 26 | **6** | -20 |
| Client Islands | 0 | **12** | +12 |
| Server Actions | 0 | **5** | +5 |
| Zod 스키마 | 0 | **13** | +13 |
| Auth Guard APIs | 1 | **9** | +8 |
| Auth Redirects | 0 | **17** | +17 |
| Optimistic Updates | 0 | **6** | +6 |
| cache() 사용 | 0 | **7** | +7 |
| revalidation 호출 | 0 | **9** | +9 |
| 테스트 케이스 | ~113 | **~170** | +57 |
| CSRF 보호 | ❌ | **✅** | — |

---

## 95점까지 남은 4점

| 항목 | 현재 | 목표 | 점수 영향 |
|------|------|------|-----------|
| PPR (Partial Prerendering) | 미사용 | Next.js 15 experimental | +1 |
| React 19 `use()` hook | 미사용 | Promise unwrapping | +1 |
| Visual regression (Chromatic) | 미설정 | Storybook → Chromatic CI | +1 |
| Real DB integration test | Mock만 | Docker testcontainer | +1 |

이 4가지는 프로덕션 배포 후 CI/CD 파이프라인에서 설정하는 것이 적합.

---

## 점수 해석

| 구간 | 의미 |
|------|------|
| 90-100 | **← 현재 (91점)** 프로덕션 투입 가능, 2026 표준 준수 |
| 80-89 | 시니어 수준, 일부 최적화 필요 |
| 60-79 | MVP 수준 |
| 40-59 | UI 프로토타입 |

**91점 = "2026년 표준을 대체로 충족하는 프로덕션 수준 코드베이스"**
