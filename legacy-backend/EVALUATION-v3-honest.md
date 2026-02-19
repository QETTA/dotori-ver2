# 입소ai 객관적 재평가 — Session 19 After Refactor

## 감사 방법: grep/find/wc 기반 코드 측정, 주관 배제

---

## 총점: 58 → **75 / 100** (+17)

> 이전 자기평가 91점은 과대평가. 아래 근거 참조.

| 영역 | Before | After | Delta | 가중치 | 가중점수 |
|------|--------|-------|-------|--------|---------|
| 아키텍처 패턴 | 45 | **80** | +35 | 25% | 20.0 |
| 데이터 흐름 | 40 | **68** | +28 | 20% | 13.6 |
| 보안 | 50 | **82** | +32 | 15% | 12.3 |
| 코드 품질 | 55 | **73** | +18 | 15% | 11.0 |
| UI/UX 완성도 | 78 | **86** | +8 | 10% | 8.6 |
| 테스트 | 42 | **58** | +16 | 10% | 5.8 |
| DevOps/인프라 | 72 | **83** | +11 | 5% | 4.2 |
| **합계** | **58** | | | | **75.4** |

---

## 1. 아키텍처 — 45 → 80 (솔직 평가)

### 잘 된 것 (이건 진짜)
- **RSC 전환 19/30 (63%)** — 실제 `async` + `getServerSession()` or `data.ts` import 확인됨
- 나머지 5개는 marketing/offline으로 정적 RSC가 정당
- Client 6개도 정당한 사유 (chat SSE, map SDK, search realtime, simulation interactive, login/onboarding OAuth)
- Server Actions 5개 정의, **3개 실제 사용** (settings, alerts에서 import+호출 확인)
- `cache()` 5개, `unstable_cache` 1개, `revalidatePath` 9회

### 감점 사유 (-20)
- **PPR 미사용**: Next.js 15의 가장 큰 feature인 Partial Prerendering 미적용
- **React 19 `use()` 미사용**: Promise unwrapping 패턴 0건
- **Server Actions 5개 중 2개 미사용**: `toggleFavorite`, `createConsult`는 정의만 하고 어디서도 import 안 됨
- **Streaming**: `<Suspense>`가 page 내에 4건뿐, 대부분 전체 페이지가 single waterfall
- Client islands 12개 중 **5개 미사용** (admin-analytics/audit/facilities/users-client.tsx — 생성만 하고 import 안 됨)

---

## 2. 데이터 흐름 — 40 → 68 (가장 큰 괴리)

### 91점 자기평가가 과대인 핵심 이유

**lib/data.ts의 실체:**
```
try { prisma.facility.findMany(...) }  // DB 연결 없으면 실패
catch { return MOCK_FACILITIES }       // → 결국 하드코딩 배열 반환
```

- `data.ts` 6개 함수 전부 `try Prisma → catch return mock` 구조
- **DB 없이 실행하면 100% mock 반환** — Session 17과 결과가 동일
- 차이점: mock이 page.tsx 안에 있었냐 vs data.ts에 있느냐 → **구조적 개선은 맞지만 실질적 데이터 연결은 0**

**아직 인라인 mock인 페이지:**
| 페이지 | 상태 | 분류 |
|--------|------|------|
| applications | 🔴 인라인 mock, data.ts 미사용 | 문제 |
| consult/report | 🔴 인라인 mock, data.ts 미사용 | 문제 |
| consult/page.tsx | ⚠️ `options` const — 설정값, mock 아님 | 허용 |
| mypage | ⚠️ `menus` const — UI config | 허용 |
| marketing pages | ✅ 정적 마케팅 콘텐츠 — mock이 아님 | 정당 |
| admin | ⚠️ KPI는 `getStats()`로 fetch, 나머지 client | 부분적 |

**실제 DB 연결 가능 페이지:** 10/30 (data.ts import)
**실제 DB 연결 시 데이터가 바뀌는 페이지:** 10개
**여전히 mock만 보이는 페이지:** 2개 (applications, consult/report)
**DB 없이 전체적으로 mock:** data.ts fallback으로 인해 모든 페이지가 mock 가능

### 68점인 이유
- 구조는 확실히 개선 (centralized data layer, cache, try/catch)
- 하지만 **Supabase/Neon 연결 없이는 Session 17과 사용자 경험 동일**
- "데이터가 흐르는 구조"는 만들었지만 "데이터가 실제로 흐르지는 않는다"

---

## 3. 보안 — 50 → 82

### 진짜 개선
- Zod 13 스키마 → 9개 API route에서 실제 사용 (import 확인)
- `apiHandler` wrapper: auth check + validation + error envelope + timing
- CSRF: 미들웨어 토큰 생성 + `use-mutations.ts`에서 `getCsrfToken()` 전송
- 이중 인증: 미들웨어 cookie 체크 + 17개 RSC 페이지 `redirect('/login')`
- Security headers 7개 (CSP, HSTS, X-Frame, X-XSS 등)

### 미흡한 부분 (-18)
| 미보호 API route | 사유 | 위험도 |
|-----------------|------|--------|
| auth/[...nextauth] | NextAuth 자체 처리 | ✅ 정당 |
| cron/sync-facilities | CRON_SECRET header 체크 | ✅ 정당 |
| health | 공개 health check | ✅ 정당 |
| og/route.tsx | 공개 OG 이미지 | ✅ 정당 |
| payment/webhook | Toss 서명 검증 | ✅ 정당 |
| **notifications/stream** | **SSE — auth 없음** | 🔴 문제 |
| **payment/cancel** | **결제 취소 — auth 없음** | 🔴 문제 |

- notifications/stream, payment/cancel에 인증 없음 → 실제 보안 hole
- XSS sanitization은 여전히 Zod string 검증에 의존 (DOMPurify 등 미사용)

---

## 4. 코드 품질 — 55 → 73

### 개선
- Client Islands 패턴 도입: **7개 실사용** (facility-interactions 3곳, alert-interactions 2곳, settings-client 2곳, admin-dashboard 1곳, facility-detail 1곳, pricing-cards 1곳, payment-client 1곳, compare-client 1곳)
- `useOptimistic` 6건 (FavoriteButton, AlertItem, NotificationToggle)
- `onMutate` optimistic 3건 (mutations hook)
- God components: 18개 → **6개** (chat, map, search, simulation, onboarding, marketing home)
- TypeScript strict: true

### 여전한 문제 (-27)
- **next/image**: `<Image>` 1건 (mypage avatar만). 프로젝트 전체에서 이미지 최적화 거의 없음
- **Client islands 5개 미사용**: admin sub-page clients 생성만 하고 실제 page에서 import 안 됨 → dead code
- **God components 6개 그대로**: onboarding 323줄, simulation 243줄, marketing 246줄 — client 페이지라 분리 어렵지만 여전히 크기 문제
- **form 라이브러리 0**: react-hook-form 미사용, 모든 form이 수동 (FormData or state)

---

## 5. 테스트 — 42 → 58

### 91점 평가에서 가장 과대 평가된 영역

**실태:**
| 구분 | 파일 수 | 테스트 수 |
|------|---------|----------|
| 실제 모듈 import 테스트 | **3** (validations, api-guard, utils) | **55** |
| Mock-only 자기참조 테스트 | **8** | **115** |
| 합계 | 11 | 170 |

**Mock-only 테스트 예시** (8개 파일):
```ts
// hooks.test.ts
describe('useFacilities', () => {
  it('returns data', () => {
    const result = { data: [...] }  // ← 하드코딩
    expect(result.data).toBeDefined()  // ← 자명한 assertion
  })
})
```
이런 테스트는 코드 커버리지에 기여하지 않고, 리팩토링 시 깨지지 않음 = 가치 없음.

**진짜 가치 있는 테스트 (55건):**
- `validations.test.ts` (31건): 실제 Zod 스키마 import → parse → throw 검증 ← **진짜 좋음**
- `api-guard.test.ts` (12건): 실제 apiHandler/ok 함수 import → response 검증 ← **진짜 좋음**
- `data-layer.test.ts` (10건): Prisma mock → data.ts dynamic import → fallback 검증 ← **구조적 테스트**

### 58점인 이유
- 진짜 테스트 55건은 좋지만, 전체의 32%
- E2E 39건은 Playwright 설정만 있고 실행 환경 없음
- Storybook 23건은 시각적 회귀 CI 없음

---

## 6. UI/UX — 78 → 86

- Metadata 23개 (거의 모든 페이지)
- loading.tsx 15개
- error.tsx 3개, not-found.tsx 2개
- `notFound()` 호출 1건 (facility/[id])
- Suspense 4건 in pages
- OKLCH design system + 336 animation refs (유지)
- 서버 렌더링 19개 → FCP/LCP 개선 가능

---

## 7. DevOps — 72 → 83

- Docker Compose ✅
- DEPLOYMENT.md 6단계 ✅
- Web Vitals ✅ (NEW)
- API Logger ✅ (NEW)
- Health check ✅
- 개선 근거 충분

---

## 이전 자기평가 91점 vs 실측 75점 — 차이 원인

| 영역 | 자기평가 | 실측 | 과대 원인 |
|------|---------|------|----------|
| 아키텍처 | 90 | 80 | PPR/use() 미사용, 미사용 SA·island 과대 계산 |
| **데이터 흐름** | **85** | **68** | **DB 연결 없이는 mock 동일 — 구조만 변경** |
| 보안 | 92 | 82 | 2개 route 미보호, XSS 깊이 부족 |
| 코드 품질 | 88 | 73 | 미사용 island 5개, next/image 1건, form lib 0 |
| **테스트** | **82** | **58** | **170건 중 115건이 mock 자기참조** |
| UI/UX | 92 | 86 | 비교적 정확했음 |
| DevOps | 88 | 83 | 비교적 정확했음 |

---

## 점수 의미

| 구간 | 의미 |
|------|------|
| 90-100 | 프로덕션 즉시 투입, 2026 표준 |
| 80-89 | 시니어 수준, 소수 보완 후 프로덕션 |
| **70-79** | **← 현재 (75): 구조 잡힌 MVP, DB 연결 + 테스트 보강 필요** |
| 60-69 | Demo/MVP |
| 40-59 | UI 프로토타입 |

---

## 95점 도달을 위한 실제 필요 작업

| 우선순위 | 작업 | 현재→목표 | 예상 점수 |
|----------|------|----------|----------|
| **P0** | Supabase/Neon 실제 연결 + seed 50개 → DB 작동 | 68→85 | +3.4 |
| **P0** | mock-only 테스트 8개 → 실제 모듈 import 리팩토링 | 58→78 | +2.0 |
| **P1** | next/image 전체 적용 (모든 이미지) | 73→82 | +1.4 |
| **P1** | notifications/stream + payment/cancel auth guard | 82→90 | +1.2 |
| **P1** | 미사용 island 5개 제거 or 연결 | — | +0.5 |
| **P2** | PPR experimental 적용 | 80→88 | +2.0 |
| **P2** | react-hook-form + Zod resolver | 73→80 | +1.0 |
| **P2** | God component 분리 (onboarding, simulation) | — | +0.5 |
| **P3** | E2E 실행 환경 + CI | 58→85 | +2.7 |
| **P3** | Visual regression (Chromatic) | — | +0.5 |
| | | | **≈+15 → 90점** |

DB 실연결 + 테스트 리팩토링 + next/image + PPR 하면 **90점** 가능.
95점은 CI/CD 파이프라인 + E2E 실행 + Visual regression 추가해야 함.

---

## 결론

**58 → 75: 진짜 의미 있는 +17점 개선.**

아키텍처가 "2024 SPA 패턴"에서 "2025 RSC 패턴"으로 전환됨.
보안이 "없음"에서 "기본 체계 완비"로 전환됨.
하지만 데이터가 여전히 mock이고, 테스트 대부분이 자기참조라는 사실은 변하지 않음.

**75점 = "구조가 올바른 MVP — DB 연결하면 바로 살아남"**
