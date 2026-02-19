# 입소ai 개발물 객관적 평가

## 2026년 프론트엔드/풀스택 트렌드 기준

> 코드 감사 기반 팩트 중심 평가. 수치는 실제 `grep`/`find` 결과.

---

## 총점: **58 / 100**

| 영역 | 점수 | 가중치 |
|------|------|--------|
| 아키텍처 패턴 | 45/100 | 25% |
| 데이터 흐름 | 40/100 | 20% |
| 보안 | 50/100 | 15% |
| 코드 품질 | 55/100 | 15% |
| UI/UX 완성도 | 78/100 | 10% |
| 테스트 | 42/100 | 10% |
| DevOps/인프라 | 72/100 | 5% |

---

## 1. 아키텍처 패턴 — 45/100

### ❌ RSC (React Server Components) 미활용 — 가장 큰 문제

| 측정 항목 | 실측값 | 2026 기대치 |
|-----------|--------|-------------|
| `'use client'` 페이지 | **30개 중 26개** (87%) | 30% 이하 |
| async Server Component 페이지 | **0개** | 60% 이상 |
| Server Actions (`'use server'`) | **0개** | form 처리 전부 |
| `revalidatePath` / `revalidateTag` | **0회** | 캐싱 전략 필수 |

**진단:** Next.js 15 App Router를 사용하면서 **SPA처럼 개발**함. 거의 모든 페이지가 `'use client'`로 클라이언트 컴포넌트. 서버에서 데이터를 가져와 HTML로 보내는 RSC의 핵심 이점을 전혀 활용하지 않음.

**2026 표준:** 페이지 레벨은 Server Component → 데이터 fetch → 인터랙티브 부분만 Client Component island로 분리. Server Actions로 form mutation. 이게 Next.js 13 때부터의 철학인데 3년이 지난 지금 필수임.

**예시 — 현재 explore/page.tsx:**
```tsx
'use client' // ← 전체가 클라이언트
const { data } = useFacilities({...}) // ← 브라우저에서 API 호출
// 결과: waterfall (HTML → JS → hydrate → API call → render)
```

**2026 방식:**
```tsx
// page.tsx (서버 컴포넌트, 'use client' 없음)
export default async function ExplorePage({ searchParams }) {
  const facilities = await prisma.facility.findMany({...})
  return <FacilityList data={facilities} /> // ← HTML에 데이터 포함
}
// FacilityList.tsx만 'use client' (인터랙션 필요한 부분)
```

### ❌ Server Actions 부재

Form 처리, mutation이 전부 클라이언트 `useMutation` → API Route → Prisma 3단계. Server Actions를 쓰면 1단계로 줄어듦.

---

## 2. 데이터 흐름 — 40/100

### ❌ 대부분 페이지가 Mock 데이터에 의존

| 페이지 | React Query 연결 | Mock/Static 데이터 |
|--------|-------------------|---------------------|
| explore | ✅ (2 hooks) | ⚠️ fallback mock 4건 |
| alerts | ✅ (2 hooks) | ⚠️ fallback mock 3건 |
| chat | ❌ | 하드코딩 |
| simulation | ❌ | 하드코딩 |
| map | ❌ | 하드코딩 |
| favorites | ❌ | 하드코딩 |
| compare | ❌ | 하드코딩 7건 |
| mypage | ❌ | 하드코딩 |
| settings | ❌ | 하드코딩 |
| notifications | ❌ | 하드코딩 5건 |

**30개 페이지 중 실제 API 연결: 2개 (7%)**

React Query hooks는 `use-queries.ts`에 잘 정의되어 있지만, 실제 페이지에서 import하여 사용하는 것은 explore와 alerts 뿐. 나머지는 `const mockData = [...]`로 하드코딩.

### ❌ Input Validation 부재

```
Zod 사용: 0회
react-hook-form 사용: 0회
form handleSubmit: 0회
```

API에 들어오는 데이터를 검증하지 않음. 2026년에는 Zod + Server Actions 조합이 표준.

### ⚠️ API Route 인증 확인

```
facilities API: auth 체크 0
alerts API: auth 체크 0
consult API: auth 체크 0
favorites API: auth 체크 0
search API: auth 체크 0
simulation API: auth 체크 0
```

**16개 API 중 session 확인하는 것: 1개 (user/profile)**. 미들웨어에서 페이지 리다이렉트는 있지만, API 자체는 인증 없이 호출 가능.

---

## 3. 보안 — 50/100

### ✅ 잘한 부분
- CSP 헤더: Kakao, Toss, OpenAI 도메인 명시적 허용
- HSTS: 2년, preload 포함
- Permissions Policy 설정
- Rate limiter (Redis + in-memory fallback)
- X-Frame-Options: DENY

### ❌ 부족한 부분
| 항목 | 상태 |
|------|------|
| CSRF 보호 | ❌ 없음 |
| XSS sanitize | ❌ 없음 (1건만) |
| Input validation | ❌ Zod 0회 |
| API auth guard | ❌ 16개 중 1개만 |
| CORS 설정 | ❌ 없음 |
| SQL injection 방어 | ⚠️ Prisma ORM이 기본 방어하지만 raw query 있음 |

---

## 4. 코드 품질 — 55/100

### ✅ 잘한 부분
- **Tailwind v4 + OKLCH**: 최신 CSS-first 설정, `@theme` 사용 — 진짜 2026 트렌드
- **디자인 토큰 체계**: 시맨틱 변수 (`--surface-base`, `--text-primary`) 일관적
- **TypeScript 사용**: 318줄 타입 정의, 구문 에러 0
- **Prisma 스키마**: 14 모델, 관계 설정 적절
- **비동기 패턴**: SSE 스트리밍, React Query 설정 자체는 양호

### ❌ 부족한 부분

**God Components:** 30개 페이지 중 18개가 150줄 초과 (facility/[id] 333줄). 컴포넌트 분리 부족. 한 파일에 UI + 로직 + 데이터 + 스타일 전부.

**Dynamic import:** 전체에서 8건. 차트 라이브러리 등은 lazy loading하지만 페이지 단위 코드 분할 미흡.

**next/image:** 1회만 사용. 이미지 최적화 안 됨.

**반응형:** breakpoint 52건. 30개 페이지 대비 적음 — 모바일 최적화 중심이라 데스크탑 대응 부족.

---

## 5. UI/UX 완성도 — 78/100 (가장 높은 점수)

### ✅ 강점
- **30개 페이지** 전부 렌더링 가능한 UI 존재
- **15개 loading.tsx** — Suspense 바운더리 완비
- **4개 error.tsx** — 에러 처리 UI
- **디자인 일관성**: 등급 색상 (A-F), 카드, 뱃지 등 통일
- **PWA**: manifest, service worker, 오프라인 페이지
- **애니메이션**: 336건 참조 (motion, animate-*, transition-)
- **접근성**: 72건 ARIA 속성 (sr-only, role, aria-label)

### ⚠️ 제한사항
- Mock 데이터로 "보여주기용" — 실제 데이터 흐름 시 깨질 가능성
- 데스크탑 반응형 미흡
- 실제 사용자 인터랙션 (form submit, error recovery) 미구현

---

## 6. 테스트 — 42/100

### 수치상 괜찮아 보이지만...

| 항목 | 수량 | 문제 |
|------|------|------|
| Unit test 파일 | 8 | ✅ |
| Unit test 케이스 | 113+ | ⚠️ |
| E2E 파일 | 2 | ✅ |
| E2E 케이스 | 39 | ⚠️ |

### ❌ 테스트 품질 이슈

1. **로직 재구현 테스트**: `api.test.ts`에서 `getGrade()` 함수를 테스트 파일 안에서 다시 만들어서 테스트. 실제 모듈을 import해서 테스트하지 않음 → 실제 코드가 변해도 테스트는 통과함.

2. **API 통합 테스트 부재**: Prisma + API Route를 실제로 호출하는 테스트 0건. mock/spy 기반 unit만 있음.

3. **E2E 테스트 대부분 `isVisible` 체크**: 실제 데이터 flow (로그인 → 검색 → 상세 → 즐겨찾기)를 end-to-end로 검증하지 않음.

4. **Storybook**: 23개 스토리 있지만 visual regression 미설정.

**2026 기대치**: Vitest + Testing Library로 실제 컴포넌트 렌더링 테스트, Playwright로 실제 DB 연동 E2E, MSW(Mock Service Worker)로 API mocking.

---

## 7. DevOps/인프라 — 72/100

### ✅ 잘한 부분
- Docker Compose: PostgreSQL + Redis + App + Studio
- Health check API: DB + 외부 서비스 상태
- `.env.example`: 완전한 변수 목록
- `DEPLOYMENT.md`: 상세한 배포 가이드
- Biome linter 설정
- Vercel Cron 시설 동기화

### ⚠️ 부족한 부분
- GitHub Actions CI/CD 없음
- Dockerfile 자체 없음 (compose만 있음)
- 환경별 분리 (staging vs production) 없음
- DB migration 전략 (prisma migrate) 테스트 안 됨

---

## 2026 트렌드 대비 Gap 분석

| 2026 표준 | 현재 상태 | Gap |
|-----------|-----------|-----|
| RSC-first (서버 컴포넌트 기본) | Client-first (87% 'use client') | 🔴 Critical |
| Server Actions for mutations | 0개, 전부 API Route | 🔴 Critical |
| Zod + type-safe validation | 0회 | 🔴 Critical |
| Partial Prerendering (PPR) | 미사용 | 🟡 Medium |
| React 19 `use()` hook | 미사용 | 🟡 Medium |
| Streaming SSR | loading.tsx는 있지만 실제 스트리밍 없음 | 🟡 Medium |
| Edge Runtime API | OG 이미지 1건만 | 🟡 Medium |
| next/image everywhere | 1회 사용 | 🟡 Medium |
| TanStack Query v5 + prefetch | v5 사용하나 서버 prefetch 0 | 🟡 Medium |
| Tailwind v4 + OKLCH | ✅ 잘 적용 | 🟢 Good |
| TypeScript strict | 타입 정의 있으나 strict 미완 | 🟡 Medium |
| Biome/oxlint | ✅ Biome 설정됨 | 🟢 Good |
| Docker + Compose | ✅ 있음 | 🟢 Good |
| PWA + Service Worker | ✅ 있음 | 🟢 Good |
| i18n | 기초 있음, 깊이 부족 | 🟡 Medium |

---

## 솔직한 총평

### 이 프로젝트의 정체성

**"2024년 스타일로 만든 Next.js 15 프로젝트"**

Next.js 15, React 19, Tailwind v4 등 **최신 도구를 쓰지만 패턴은 구세대**. Pages Router + SPA 시절의 `'use client'` + `useEffect` + `useState` 패턴으로 App Router를 사용하고 있음.

### 가치 있는 부분

1. **UI 완성도**: 30개 페이지가 전부 보여줄 수 있는 상태. 데모/피칭용으로 충분
2. **디자인 시스템**: OKLCH + 시맨틱 토큰 + 등급 색상 체계가 일관적이고 현대적
3. **도메인 모델링**: 14개 Prisma 모델, 확률 엔진 로직, 시뮬레이션 전략이 비즈니스 도메인을 잘 반영
4. **인프라 기초**: Docker, health check, rate limiter, env validation

### 프로덕션 투입 시 반드시 해야 할 것

| 우선순위 | 작업 | 이유 |
|----------|------|------|
| P0 | API 인증 guard 추가 | 현재 누구나 API 호출 가능 |
| P0 | Zod input validation | SQL injection/XSS 위험 |
| P0 | Mock → 실 데이터 연결 | 28개 페이지가 가짜 데이터 |
| P1 | RSC 전환 (최소 데이터 페이지) | 성능 + SEO |
| P1 | Server Actions 도입 | form 처리 안전성 |
| P1 | next/image 전환 | 이미지 최적화 |
| P2 | 테스트 실체화 | 실제 모듈 테스트 |
| P2 | 컴포넌트 분리 | God component 해체 |

---

## 점수 해석

| 구간 | 의미 |
|------|------|
| 80-100 | 프로덕션 투입 가능 |
| 60-79 | 데모/MVP 수준, 추가 작업 필요 |
| 40-59 | **← 현재 (58점)** UI 프로토타입 수준 |
| 20-39 | 학습 프로젝트 |
| 0-19 | 미완성 |

**58점 = "잘 만든 UI 프로토타입, 프로덕션까지는 상당한 아키텍처 리팩토링 필요"**

데모/투자 유치/정부 과제 심사용으로는 충분히 인상적. 하지만 실 사용자에게 배포하려면 데이터 흐름, 인증, 유효성 검증을 근본적으로 재설계해야 함.
