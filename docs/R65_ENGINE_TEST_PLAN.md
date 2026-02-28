# R65 Backend Engine Test Plan

> Scope: R65 "Backend Engine Completeness" — 5 신규 엔진
> Format: ENGINE_TEST_CATALOG.md §5 준수 (ENG-{CATEGORY}-{NNN})
> 기준 자료: STRATEGY_v4.0, BUSINESS_PLAN, KAKAO_CHANNEL, ENGINE_TEST_CATALOG, MASTER_v1

---

## 0. 현황 분석 (As-Is)

### 현재 테스트 (R65 구현 시 작성, 58건)

| 엔진 | 파일 | 테스트 수 | 커버리지 수준 |
|------|------|----------|-------------|
| partner-auth | `partner-auth.test.ts` | 11 | **Unit Only** — 순수 함수(generateApiKey, hashApiKey) + 상수(TIER_RATE_LIMITS) |
| billing-engine | `billing-engine.test.ts` | 13 | **Constants Only** — BILLING_PLANS 가격, TRIAL_DAYS, 상태 enum |
| campaign/trigger | `campaign-engine.test.ts` | 12 | **Constants Only** — TRIGGER_DESCRIPTIONS 7종, 상태/이벤트 enum |
| pdf-document | `pdf-document-engine.test.ts` | 7 | **Unit + Integration** — 실제 PDF 생성/번들 검증 (가장 높음) |
| regional-analytics | `regional-analytics-engine.test.ts` | 15 | **Unit Only** — config + 계산 로직 (MongoDB 미접근) |

### 핵심 갭

1. **DB 의존 함수 0% 테스트**: verifyApiKey, checkRateLimit, createPartner 등 Mongoose 호출 함수 미테스트
2. **상태 전이 미검증**: 구독 lifecycle (trialing→active→cancelled→expired), 캠페인 lifecycle (draft→active→paused→completed)
3. **경계값 부족**: rate limit 경계(limit-1, limit, limit+1), 빈 입력, 초과 입력
4. **오류 경로 부족**: PartnerNotFoundError, 잘못된 상태 전이, 존재하지 않는 리소스
5. **generateAuditCertificate 미테스트**: pdf-document-engine의 감사추적인증서

---

## 1. 테스트 전략

### 1.1 Mock 전략

```
Engine Unit (mock 없음):
  - 순수 함수: generateApiKey, hashApiKey, getDocumentTitle, getDocumentFields
  - 상수 검증: TIER_RATE_LIMITS, BILLING_PLANS, TRIGGER_DESCRIPTIONS, DOCUMENT_TYPES

Engine Integration (Mongoose mock):
  - vi.mock("@/models/Partner") → findOne, findByIdAndUpdate, create
  - vi.mock("@/models/ApiUsageLog") → countDocuments, aggregate, create
  - vi.mock("@/models/BillingSubscription") → findById, create, findOne, updateMany
  - vi.mock("@/models/Invoice") → findByIdAndUpdate, create, find, countDocuments
  - vi.mock("@/models/Campaign") → findById, find, create, findByIdAndUpdate, countDocuments
  - vi.mock("@/models/CampaignEvent") → aggregate, create, insertMany
  - vi.mock("@/models/Facility") → countDocuments, aggregate
  - vi.mock("@/models/User") → find
  - vi.mock("@/models/AuditLog") → find

Engine Contract:
  - 반환 타입 검증 (GeneratedApiKey, RateLimitResult, CampaignAnalytics 등)
  - 에러 코드 매핑 (PartnerNotFoundError)
```

### 1.2 Determinism 보장

```
시간 의존:
  - vi.useFakeTimers() → 고정 시간 (2026-02-28T00:00:00Z)
  - checkRateLimit (dayStart/dayEnd), expireTrials (trialEnd), detectTriggers (month)

랜덤 의존:
  - generateApiKey() → crypto.randomBytes, 시드 불필요 (매번 다른 결과 = 정상)
  - uniqueness 테스트는 충분한 반복 (10회) 으로 충돌 확률 검증

MongoDB ObjectId:
  - 고정 ID 사용: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
```

### 1.3 격리

```
- 테스트 간 vi.clearAllMocks() (beforeEach)
- MongoDB 실제 연결 없음 (모든 모델 mock)
- 전역 상태 없음 (엔진은 stateless 함수 집합)
```

---

## 2. Engine 1: Partner Auth — 케이스 카탈로그

### Usecase: `generateApiKey`
- 위치: `src/lib/engines/partner-auth.ts:31-38`
- 설명: crypto.randomBytes(32)로 API 키 생성, SHA-256 해시 + 프리픽스 반환
- 입력: 없음
- 출력: { rawKey: string(64 hex), hash: string(64 hex), prefix: string(8) }
- 부작용: 없음

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PA-OK-001 | P0 | ✅ 기본 키 생성 | 없음 | rawKey 64자 hex, hash 64자 hex, prefix 8자 | 이미 테스트됨 |
| ENG-PA-OK-002 | P1 | ✅ 고유성 보장 | 2회 호출 | 서로 다른 rawKey/hash | 이미 테스트됨 |
| ENG-PA-OK-003 | P1 | ✅ prefix = rawKey 시작 | 없음 | startsWith(prefix) === true | 이미 테스트됨 |
| ENG-PA-VAL-001 | P1 | 10회 호출 충돌 없음 | 10회 반복 | Set size === 10 | **신규** |

### Usecase: `hashApiKey`
- 위치: `src/lib/engines/partner-auth.ts:40-42`
- 설명: 원시 키를 SHA-256 해시로 변환
- 입력: rawKey: string
- 출력: 64자 hex string

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PA-OK-004 | P0 | ✅ 결정적 해시 | "test-key" 2회 | 동일 hash | 이미 테스트됨 |
| ENG-PA-OK-005 | P1 | ✅ generateApiKey 해시 일치 | generateApiKey().rawKey | hashApiKey(raw) === key.hash | 이미 테스트됨 |
| ENG-PA-BND-001 | P1 | 빈 문자열 해시 | "" | 유효 64자 hex (에러 아님) | **신규** |
| ENG-PA-BND-002 | P2 | 매우 긴 키 해시 | 10000자 string | 유효 64자 hex | **신규** |

### Usecase: `verifyApiKey`
- 위치: `src/lib/engines/partner-auth.ts:46-50`
- 설명: 원시 키 → SHA-256 → Partner 조회 (isActive: true)
- 입력: rawKey: string
- 출력: IPartner | null
- 부작용: Partner.findOne (읽기)

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PA-OK-006 | P0 | 유효 키 인증 성공 | 등록된 rawKey | IPartner 객체 반환 | **신규** mock |
| ENG-PA-ERR-001 | P0 | 미등록 키 | 잘못된 rawKey | null | **신규** mock |
| ENG-PA-ERR-002 | P0 | 비활성 파트너 | isActive=false 파트너 키 | null | **신규** mock |

### Usecase: `checkRateLimit`
- 위치: `src/lib/engines/partner-auth.ts:65-86`
- 설명: 파트너 tier별 일일 API 호출 제한 확인 (MongoDB sliding window)
- 입력: partnerId: string, tier: PartnerTier
- 출력: { allowed: boolean, limit: number, remaining: number, resetAt: Date }

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PA-OK-007 | P0 | 호출 미달 → 허용 | free tier, 50/100 사용 | allowed=true, remaining=50 | **신규** mock |
| ENG-PA-BND-003 | P0 | 호출 한도 도달 | free tier, 100/100 | allowed=false, remaining=0 | **신규** mock |
| ENG-PA-BND-004 | P1 | 한도 직전 | free tier, 99/100 | allowed=true, remaining=1 | **신규** mock |
| ENG-PA-OK-008 | P1 | enterprise 대용량 | enterprise, 999999/1M | allowed=true, remaining=1 | **신규** mock |
| ENG-PA-ST-001 | P1 | resetAt = 다음 자정 | 어떤 시간 | resetAt = 당일 24:00 KST | **신규** fakeTimers |

### Usecase: `logApiUsage`
- 위치: `src/lib/engines/partner-auth.ts:90-105`
- 설명: API 호출 기록 저장

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PA-OK-009 | P1 | 정상 로그 기록 | 모든 필드 | ApiUsageLog.create 호출 | **신규** mock |
| ENG-PA-VAL-002 | P2 | 필수 필드 확인 | partnerId, endpoint, method, statusCode, responseMs | create 인자 검증 | **신규** |

### Usecase: `getUsageStats`
- 위치: `src/lib/engines/partner-auth.ts:116-172`
- 설명: 일/월별 사용량 통계 (MongoDB aggregation)

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PA-OK-010 | P1 | 30일 통계 조회 | partnerId, days=30 | daily[], monthly[], totalRequests, avgResponseMs | **신규** mock |
| ENG-PA-BND-005 | P2 | 데이터 없음 | 호출 없는 파트너 | totalRequests=0, avgResponseMs=0 | **신규** mock |
| ENG-PA-ERR-003 | P1 | ObjectId 캐스팅 | string partnerId | new ObjectId() 사용 확인 | **신규** R65 교차검수 회귀 |

### Usecase: `createPartner`
- 위치: `src/lib/engines/partner-auth.ts:176-196`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PA-OK-011 | P0 | 파트너 생성 (기본 free) | name, email | partner + rawApiKey | **신규** mock |
| ENG-PA-OK-012 | P1 | 지정 tier 생성 | tier="pro" | rateLimit=10000 | **신규** mock |
| ENG-PA-BND-006 | P2 | 선택 필드 없음 | contactPhone 미제공 | 정상 생성 | **신규** |

### Usecase: `regenerateApiKey`
- 위치: `src/lib/engines/partner-auth.ts:198-214`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PA-OK-013 | P0 | 키 재발급 | 유효 partnerId | 새 rawApiKey + prefix | **신규** mock |
| ENG-PA-ERR-004 | P0 | 없는 파트너 | 잘못된 ID | PartnerNotFoundError throw | **신규** mock |

**Partner Auth 합계: 기존 11 + 신규 22 = 33건**
- 오류 경로: 4/22 = 18% → 추가 경계값으로 보완 (30% 목표 충족)

---

## 3. Engine 2: Billing — 케이스 카탈로그

### Usecase: `createSubscription`
- 위치: `src/lib/engines/billing-engine.ts:19-59`
- 설명: B2B SaaS 구독 생성 (trial 14일 or 즉시 활성)
- 입력: partnerId, planId, billingCycle, withTrial?
- 출력: { subscription, invoice? }
- 부작용: BillingSubscription.create, Invoice.create (trial 아닐 때)

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-BL-OK-001 | P0 | Trial 구독 생성 | starter, monthly, withTrial=true | status="trialing", trialEnd=+14d, invoice=undefined | **신규** |
| ENG-BL-OK-002 | P0 | 즉시 활성 구독 | growth, yearly, withTrial=false | status="active", invoice 생성 | **신규** |
| ENG-BL-OK-003 | P1 | 연간 구독 기간 | yearly | periodEnd = +1년 | **신규** |
| ENG-BL-OK-004 | P1 | 월간 구독 기간 | monthly | periodEnd = +1개월 | **신규** |
| ENG-BL-VAL-001 | P0 | ✅ 플랜 가격 검증 | starter/growth/enterprise | 44K/88K/132K 월, 12배 연 | 이미 테스트됨 |

### Usecase: `activateSubscription`
- 위치: `src/lib/engines/billing-engine.ts:61-75`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-BL-ST-001 | P0 | trialing → active | trialing 구독 ID | status="active", trialEnd=undefined, invoice 생성 | **신규** |
| ENG-BL-ERR-001 | P0 | active 상태에서 activate | active 구독 ID | null 반환 (변경 없음) | **신규** |
| ENG-BL-ERR-002 | P1 | 없는 구독 activate | 잘못된 ID | null 반환 | **신규** |

### Usecase: `cancelSubscription`
- 위치: `src/lib/engines/billing-engine.ts:77-88`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-BL-ST-002 | P0 | active → cancelled | active 구독 | status="cancelled", cancelledAt 설정 | **신규** |
| ENG-BL-ST-003 | P1 | trialing → cancelled | trialing 구독 | status="cancelled" | **신규** |
| ENG-BL-ERR-003 | P0 | 이미 cancelled | cancelled 구독 | null 반환 | **신규** |
| ENG-BL-ERR-004 | P1 | expired 상태 취소 | expired 구독 | null 반환 | **신규** |

### Usecase: `changePlan`
- 위치: `src/lib/engines/billing-engine.ts:90-108`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-BL-OK-005 | P0 | 업그레이드 | starter → growth | planId="growth", amount=88K | **신규** |
| ENG-BL-OK-006 | P1 | 다운그레이드 | enterprise → starter | planId="starter", amount=44K | **신규** |
| ENG-BL-OK-007 | P1 | 사이클 변경 | monthly → yearly | billingCycle="yearly", amount=연간가 | **신규** |
| ENG-BL-ERR-005 | P0 | cancelled 상태 변경 불가 | cancelled 구독 | null | **신규** |

### Usecase: `renewSubscription`
- 위치: `src/lib/engines/billing-engine.ts:110-130`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-BL-OK-008 | P1 | 월간 갱신 | active monthly | periodStart 갱신, invoice 생성 | **신규** |
| ENG-BL-ERR-006 | P1 | trialing 상태 갱신 불가 | trialing 구독 | null | **신규** |

### Usecase: `markInvoicePaid` / `voidInvoice`
- 위치: `src/lib/engines/billing-engine.ts:159-177`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-BL-ST-004 | P0 | issued → paid | issued 청구서 | status="paid", paidAt 설정 | **신규** |
| ENG-BL-ST-005 | P1 | issued → void | issued 청구서 | status="void" | **신규** |
| ENG-BL-ERR-007 | P2 | 없는 청구서 | 잘못된 ID | null | **신규** |

### Usecase: `expireTrials`
- 위치: `src/lib/engines/billing-engine.ts:201-208`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-BL-ST-006 | P0 | 만료된 trial 일괄 처리 | trialEnd < now | modifiedCount ≥ 1 | **신규** fakeTimers |
| ENG-BL-BND-001 | P1 | 만료 trial 없음 | 모든 trial 유효 | modifiedCount = 0 | **신규** |

### Usecase: `getActiveSubscription`
- 위치: `src/lib/engines/billing-engine.ts:212-221`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-BL-OK-009 | P1 | 활성 구독 조회 | trialing 또는 active | 구독 객체 반환 | **신규** |
| ENG-BL-ERR-008 | P1 | 구독 없음 | 새 파트너 | null | **신규** |

**Billing 합계: 기존 13 + 신규 24 = 37건**
- 오류 경로: 8/24 = 33% ✅
- 상태 전이: 6건 (trialing→active, active→cancelled, issued→paid, issued→void, trialing→expired)

---

## 4. Engine 3: Campaign/Trigger — 케이스 카탈로그

### Usecase: `detectTriggers` (trigger-engine)
- 위치: `src/lib/engines/trigger-engine.ts:31-71`
- 설명: 현재 날짜/데이터 기반 활성 트리거 감지

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-CT-OK-001 | P0 | 2~3월 졸업 트리거 | month=2 | graduation trigger 포함 | **신규** fakeTimers |
| ENG-CT-OK-002 | P0 | 3월 복합 트리거 | month=3 | graduation + seasonal_admission | **신규** |
| ENG-CT-OK-003 | P1 | 9월 계절 입소 | month=9 | seasonal_admission 포함 | **신규** |
| ENG-CT-BND-001 | P1 | 트리거 없는 달 | month=7, vacancy=0 | 빈 배열 | **신규** |
| ENG-CT-OK-004 | P1 | 빈자리 트리거 | vacancyCount > 0 | vacancy trigger 포함 | **신규** mock Facility |

### Usecase: `matchUsersForTrigger` (trigger-engine)
- 위치: `src/lib/engines/trigger-engine.ts:76-125`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-CT-OK-005 | P0 | 전국 대상 매칭 | regions=["전국"] | 필터 없이 조회 | **신규** mock User |
| ENG-CT-OK-006 | P1 | 지역 필터 매칭 | regions=["서울특별시"] | sido 필터 적용 | **신규** |
| ENG-CT-OK-007 | P1 | 연령 범위 매칭 | childAgeRange={min:3, max:5} | birthDate 필터 | **신규** |
| ENG-CT-BND-002 | P1 | 매칭 사용자 없음 | regions=["세종특별자치시"] | 빈 배열 | **신규** |
| ENG-CT-BND-003 | P2 | limit 제한 | limit=5 | 최대 5명 | **신규** |

### Usecase: `createCampaign` (campaign-engine)
- 위치: `src/lib/engines/campaign-engine.ts:13-32`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-CT-OK-008 | P0 | 캠페인 생성 | name, triggerId, audience, schedule | status="draft" | **신규** mock |
| ENG-CT-VAL-001 | P1 | schedule 날짜 파싱 | ISO string | Date 객체 변환 | **신규** |

### Usecase: `updateCampaignStatus`
- 위치: `src/lib/engines/campaign-engine.ts:34-43`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-CT-ST-001 | P0 | draft → active | draft 캠페인 | status="active" | **신규** |
| ENG-CT-ST-002 | P1 | active → paused | active 캠페인 | status="paused" | **신규** |
| ENG-CT-ST-003 | P1 | active → completed | active 캠페인 | status="completed" | **신규** |
| ENG-CT-ERR-001 | P1 | 없는 캠페인 | 잘못된 ID | null | **신규** |

### Usecase: `executeCampaign`
- 위치: `src/lib/engines/campaign-engine.ts:49-80`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-CT-OK-009 | P0 | 캠페인 실행 | active 캠페인, 10 matched users | matched=10, sent=10, events 생성 | **신규** mock |
| ENG-CT-ERR-002 | P0 | draft 상태 실행 불가 | draft 캠페인 | matched=0, sent=0 | **신규** |
| ENG-CT-BND-004 | P1 | 매칭 사용자 0명 | 빈 audience | matched=0, sent=0, insertMany 미호출 | **신규** |

### Usecase: `getCampaignAnalytics`
- 위치: `src/lib/engines/campaign-engine.ts:98-133`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-CT-OK-010 | P0 | KPI 조회 | 이벤트 있는 캠페인 | reach, delivered, clicked, converted, rates 계산 | **신규** mock |
| ENG-CT-BND-005 | P1 | 이벤트 없는 캠페인 | 새 캠페인 | 모든 카운트 0, rates 0 | **신규** |
| ENG-CT-ERR-003 | P1 | 없는 캠페인 | 잘못된 ID | null | **신규** |

### Usecase: `recordCampaignEvent`
- 위치: `src/lib/engines/campaign-engine.ts:156-180`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-CT-OK-011 | P1 | clicked 이벤트 | action="clicked" | CampaignEvent.create + kpi.clicks $inc | **신규** |
| ENG-CT-OK-012 | P1 | converted 이벤트 | action="converted" | kpi.conversions $inc | **신규** |
| ENG-CT-OK-013 | P2 | sent 이벤트 (KPI 미반영) | action="sent" | create만, $inc 없음 | **신규** |

### Usecase: `listCampaigns`
- 위치: `src/lib/engines/campaign-engine.ts:137-154`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-CT-OK-014 | P1 | 상태 필터 조회 | status="active" | 필터된 목록 | **신규** mock |
| ENG-CT-BND-006 | P2 | 페이징 | page=2, limit=5 | skip=5, limit=5 | **신규** |

**Campaign/Trigger 합계: 기존 12 + 신규 28 = 40건**
- 오류 경로: 4/28 = 14% → 경계값 포함 시 충족
- 상태 전이: 3건 (draft→active, active→paused, active→completed)

---

## 5. Engine 4: PDF Document — 케이스 카탈로그

### Usecase: `generateDocument`
- 위치: `src/lib/engines/pdf-document-engine.ts:41-138`
- 이미 상당 수준 테스트됨 (7종 생성, 추가 정보, 빈 서명)

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PD-OK-001 | P0 | ✅ 7종 각각 PDF 생성 | 7 docTypes | %PDF- 헤더, Uint8Array | 이미 테스트됨 |
| ENG-PD-OK-002 | P1 | ✅ 추가 정보 포함 | additionalInfo 제공 | 더 큰 PDF | 이미 테스트됨 |
| ENG-PD-OK-003 | P1 | ✅ 빈 서명 처리 | signatureDataUrl="" | PDF 정상 생성 | 이미 테스트됨 |
| ENG-PD-BND-001 | P1 | 매우 긴 childName | 500자 이름 | PDF 생성 성공 (잘림 가능) | **신규** |
| ENG-PD-BND-002 | P2 | additionalInfo 50개 필드 | 대용량 info | PDF 생성 (페이지 넘침 가능) | **신규** |
| ENG-PD-OK-004 | P1 | 유효 PNG 서명 | data:image/png;base64,... | 이미지 임베딩 | **신규** (fixture 필요) |
| ENG-PD-ERR-001 | P1 | 잘못된 base64 서명 | "not-a-data-url" | 서명 스킵, PDF 정상 | **신규** |

### Usecase: `bundleDocuments`
- 위치: `src/lib/engines/pdf-document-engine.ts:142-157`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PD-OK-005 | P0 | ✅ 2건 번들 | 2 documents | 번들 > 단일 크기 | 이미 테스트됨 |
| ENG-PD-OK-006 | P1 | ✅ 1건 번들 | 1 document | 유효 PDF | 이미 테스트됨 |
| ENG-PD-BND-003 | P1 | 7건 전체 번들 | 7 documents (모든 타입) | 7페이지 PDF | **신규** |
| ENG-PD-BND-004 | P2 | 빈 배열 번들 | 0 documents | 빈 PDF (0 페이지) | **신규** |

### Usecase: `generateAuditCertificate`
- 위치: `src/lib/engines/pdf-document-engine.ts:161-272`
- **현재 0% 테스트됨**

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PD-OK-007 | P0 | 감사추적 인증서 생성 | documentId + audit 로그 3건 | PDF with events | **신규** mock AuditLog |
| ENG-PD-BND-005 | P1 | 감사 로그 없음 | audit 로그 0건 | "No audit events found." 텍스트 | **신규** mock |
| ENG-PD-BND-006 | P2 | 감사 로그 100건 | 대용량 로그 | 페이지 overflow 처리 (yPos < margin+40) | **신규** mock |

### Usecase: `extractBase64Bytes` (내부 helper)
- 위치: `src/lib/engines/pdf-document-engine.ts:313-326`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-PD-OK-008 | P1 | 유효 data URL | "data:image/png;base64,iVBO..." | Uint8Array | **신규** (간접 테스트) |
| ENG-PD-ERR-002 | P1 | 잘못된 포맷 | "not-data-url" | null (서명 스킵) | **신규** |

**PDF Document 합계: 기존 7 + 신규 12 = 19건**
- 오류 경로: 2/12 = 17% → 경계값 보완
- 핵심 신규: generateAuditCertificate 3건, 서명 이미지 임베딩 2건

---

## 6. Engine 5: Regional Analytics — 케이스 카탈로그

### Usecase: `getRegionalStats`
- 위치: `src/lib/engines/regional-analytics-engine.ts:48-109`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-RA-OK-001 | P0 | 전국 통계 조회 | params={} | RegionalStats[] | **신규** mock Facility.aggregate |
| ENG-RA-OK-002 | P1 | 시도 필터 | sido="서울특별시" | $match 포함 파이프라인 | **신규** |
| ENG-RA-OK-003 | P1 | 시군구 필터 | sido+sigungu | 양 필터 적용 | **신규** |
| ENG-RA-BND-001 | P1 | 결과 없음 | sido="존재안함" | 빈 배열 | **신규** |
| ENG-RA-OK-004 | P1 | ✅ saturationRate 계산 | capacity=100, current=85 | 0.85 | 이미 테스트됨 |
| ENG-RA-BND-002 | P1 | ✅ vacancy 계산 (초과) | current > capacity | vacancy=0 (max 0) | 이미 테스트됨 |
| ENG-RA-BND-003 | P1 | ✅ 제로 정원 | capacity=0 | saturationRate=0 | 이미 테스트됨 |
| ENG-RA-OK-005 | P2 | facilityTypes 집계 | 혼합 타입 | type별 count 정렬 | **신규** |
| ENG-RA-BND-004 | P2 | avgRating null 처리 | rating 없는 시설 | avgRating=0 | **신규** |
| ENG-RA-OK-006 | P2 | region "미분류" 처리 | sido="" | "미분류" 반환 | **신규** |

### Usecase: `getRegionalTrends`
- 위치: `src/lib/engines/regional-analytics-engine.ts:118-167`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-RA-OK-007 | P0 | 6개월 트렌드 | sido="서울", months=6 | 6개 데이터 포인트 | **신규** mock |
| ENG-RA-BND-005 | P1 | ✅ 월 포맷 YYYY-MM | 2026-02 | "2026-02" | 이미 테스트됨 |
| ENG-RA-BND-006 | P1 | ✅ 데이터 포인트 개수 | months=6 | 6개 | 이미 테스트됨 |
| ENG-RA-BND-007 | P1 | 데이터 없는 지역 | 시설 0개 | capacity/current=0, saturationRate=0 | **신규** |
| ENG-RA-OK-008 | P2 | sigungu "전체" 기본값 | sigungu 미지정 | region.sigungu="전체" | **신규** |

### Usecase: `generateMarketReport`
- 위치: `src/lib/engines/regional-analytics-engine.ts:171-223`

| Case ID | Priority | Scenario | Input Variants | Expected | Notes |
|---------|----------|----------|----------------|----------|-------|
| ENG-RA-OK-009 | P0 | 시장 리포트 생성 | 전체 데이터 | summary + topRegions + underserved + saturated | **신규** mock |
| ENG-RA-OK-010 | P1 | saturated 지역 감지 | saturationRate ≥ 0.9 | saturatedRegions에 포함 | **신규** |
| ENG-RA-OK-011 | P1 | underserved 지역 감지 | vacancy ≤ 5 | underservedRegions에 포함 | **신규** |
| ENG-RA-BND-008 | P1 | ✅ saturation threshold | 0.9 | 0 < threshold ≤ 1 | 이미 테스트됨 |
| ENG-RA-BND-009 | P2 | top 10 제한 | 30개 지역 | 각 카테고리 최대 10개 | **신규** |
| ENG-RA-OK-012 | P1 | ✅ 리포트 필드 구조 | - | 5개 필드 존재 | 이미 테스트됨 |
| ENG-RA-BND-010 | P2 | 시설 0건 리포트 | 빈 DB | 모든 값 0 | **신규** |

**Regional Analytics 합계: 기존 15 + 신규 16 = 31건**
- 오류 경로: 경계값으로 대체 (DB 에러는 Mongoose 레벨)

---

## 7. 구현 우선순위

### Wave 1: High-Impact Integration Tests (P0, ~30건)
```
파일 1: partner-auth.test.ts 확장
  - verifyApiKey mock 3건 (ENG-PA-OK-006~ERR-002)
  - checkRateLimit mock 3건 (ENG-PA-OK-007~BND-004)
  - createPartner mock 2건 (ENG-PA-OK-011~012)
  - regenerateApiKey mock 2건 (ENG-PA-OK-013~ERR-004)

파일 2: billing-engine.test.ts 확장
  - createSubscription mock 4건 (ENG-BL-OK-001~004)
  - activateSubscription mock 3건 (ENG-BL-ST-001~ERR-002)
  - cancelSubscription mock 4건 (ENG-BL-ST-002~ERR-004)
  - changePlan mock 4건 (ENG-BL-OK-005~ERR-005)
```

### Wave 2: Campaign + PDF Completion (P0-P1, ~25건)
```
파일 3: campaign-engine.test.ts 확장
  - detectTriggers mock 5건 (ENG-CT-OK-001~BND-001)
  - executeCampaign mock 3건 (ENG-CT-OK-009~BND-004)
  - getCampaignAnalytics mock 3건 (ENG-CT-OK-010~ERR-003)
  - recordCampaignEvent mock 3건 (ENG-CT-OK-011~013)

파일 4: pdf-document-engine.test.ts 확장
  - generateAuditCertificate mock 3건 (ENG-PD-OK-007~BND-006)
  - 7종 전체 번들 1건 (ENG-PD-BND-003)
  - 서명 이미지 2건 (ENG-PD-OK-004, ERR-001)
```

### Wave 3: Regional + Edge Cases (P1-P2, ~20건)
```
파일 5: regional-analytics-engine.test.ts 확장
  - getRegionalStats mock 6건 (ENG-RA-OK-001~006)
  - getRegionalTrends mock 3건 (ENG-RA-OK-007~008)
  - generateMarketReport mock 5건 (ENG-RA-OK-009~BND-010)

나머지:
  - partner-auth 경계값 4건 (BND-001~002, VAL-001~002)
  - billing 경계/갱신 3건 (BND-001, OK-008~009)
```

---

## 8. 정량 목표

| 항목 | Before (현재) | After (목표) | 증분 |
|------|:------------:|:----------:|:----:|
| 총 테스트 | 865 | **967+** | +102 |
| Engine 테스트 | 58 | **160** | +102 |
| DB Mock 테스트 | 0 | **~70** | +70 |
| 오류 경로 비율 | ~5% | **≥30%** | ↑ |
| 상태 전이 테스트 | 0 | **12** | +12 |

---

## 9. Mock 패턴 예시

```typescript
// partner-auth.test.ts 확장 예시
vi.mock("@/models/Partner", () => ({
  default: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
  },
  TIER_RATE_LIMITS: { free: 100, basic: 1_000, pro: 10_000, enterprise: 1_000_000 },
}));

vi.mock("@/models/ApiUsageLog", () => ({
  default: {
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
  },
}));

describe("verifyApiKey (integration)", () => {
  it("returns partner for valid active key", async () => {
    const mockPartner = { _id: "partner1", name: "Test", isActive: true };
    Partner.findOne.mockResolvedValue(mockPartner);

    const result = await verifyApiKey("valid-raw-key");
    expect(result).toEqual(mockPartner);
    expect(Partner.findOne).toHaveBeenCalledWith({
      apiKeyHash: hashApiKey("valid-raw-key"),
      isActive: true,
    });
  });
});
```

---

## 10. DoD 체크리스트 (구현 완료 시)

- [ ] 모든 P0 테스트 통과 (CI 안정)
- [ ] 오류 경로 ≥ 30% (ENG_TEST_CATALOG §3.3)
- [ ] 시간 의존 테스트 vi.useFakeTimers() 적용
- [ ] MongoDB mock → 실제 DB 접속 없음 (격리)
- [ ] 상태 전이 12건 검증 (구독 5 + 캠페인 3 + 청구서 2 + rate limit 2)
- [ ] 회귀: ObjectId 캐스팅 (ENG-PA-ERR-003) 고정
- [ ] npm test → 967+ pass, 0 fail
- [ ] 실패 시 원인 파악 가능한 assertion 메시지

---

## 11. 리스크

| 리스크 | 영향 | 완화 |
|--------|------|------|
| Mongoose mock 복잡성 | chained methods (.lean, .sort, .skip, .limit) mock 어려움 | vi.fn().mockReturnThis() 체이닝 패턴 사용 |
| pdf-lib 한글 렌더링 | StandardFonts는 한글 미지원 → 실제 PDF 텍스트 검증 불가 | 바이트 크기 + PDF 헤더로 검증 |
| 시간 의존 detectTriggers | 현재 월에 따라 결과 변동 | vi.useFakeTimers() 필수 |
| aggregation pipeline mock | $group/$match 로직 검증 불가 | 호출 인자(pipeline) 스냅샷 검증으로 대체 |
