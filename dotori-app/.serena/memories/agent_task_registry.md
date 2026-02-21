# 에이전트 파일 소유권 맵 (R9 설계 — 2026-02-22)

## R9 목표: 테스트 완전성 + B2B 프리미엄 기반 완성

**학습 출처:** docs/PREMIUM_SPEC.md, docs/ops/BUSINESS_PLAN.md, docs/CODEX_DOTORI_MASTER_SPEC.md

---

## R9 태스크 배분 (11 Codex 에이전트)

| 에이전트 | 담당 파일 | 비즈니스 목표 | 우선순위 |
|---------|---------|------------|---------| 
| **r9-eslint-fix** | `src/middleware.ts`, `src/components/dotori/PageTransition.tsx`, `src/hooks/use-facilities.ts` | ESLint 6개 오류 완전 제거 | 🔴 P0 인프라 |
| **r9-premium-model** | `src/models/Facility.ts`, `src/types/dotori.ts`, `src/lib/dto.ts` | PREMIUM_SPEC Task 1-3: premium 서브스키마 + FacilityPremium 타입 + DTO 매핑 | 🔴 P0 B2B |
| **r9-admin-api** | `src/app/api/admin/facility/[id]/premium/route.ts`(신규), `src/app/api/facilities/route.ts` | PREMIUM_SPEC Task 4+6: sortBoost 정렬 + Admin PUT endpoint (Bearer CRON_SECRET) | 🔴 P0 B2B |
| **r9-unit-tests** | `src/__tests__/engine/intent-classifier.test.ts`(신규), `src/__tests__/engine/nba-engine.test.ts`(신규), `src/__tests__/lib/dto.test.ts`(신규) | 토리챗 엔진 유닛 테스트 — 이동/반편성/교사교체 분류 정확도 | 🔴 P0 엔진 |
| **r9-e2e-chat** | `src/__tests__/e2e/chat.spec.ts`(신규) | Playwright: 채팅 메시지 전송 → 스트리밍 응답 → 쿼터 카운트 | 🟠 P1 테스트 |
| **r9-e2e-explore** | `src/__tests__/e2e/explore.spec.ts`(신규) | Playwright: 탐색 → 시설상세 → 관심/대기신청 플로우 | 🟠 P1 테스트 |
| **r9-e2e-onboarding** | `src/__tests__/e2e/onboarding.spec.ts`(신규) | Playwright: 온보딩 완주 (지역/시설유형 선택) → 홈 도달 | 🟠 P1 테스트 |
| **r9-explore-ux** | `src/app/(app)/explore/page.tsx` | 탐색 페이지 이동 수요 포지셔닝: 헤더 "이동할 시설 찾기", 이동 고민 프롬프트 칩 | 🟠 P1 UX |
| **r9-landing-upgrade** | `src/app/(landing)/landing/page.tsx` | FAQ 아코디언 + 후기 섹션 + 통계 카드 (reference/template-components Oatmeal 패턴) | 🟡 P2 UX |
| **r9-home-dashboard** | `src/app/(app)/page.tsx` | 홈 관심시설 변동 섹션 실제 데이터 연동 + AI 브리핑 카드 | 🟡 P2 UX |
| **r9-chat-engine** | `src/lib/engine/intent-classifier.ts`, `src/lib/engine/response-builder.ts` | 이동 수요 인텐트 강화: 반편성/교사교체/설명회실망/국공립당첨 시나리오 응답 개선 | 🟡 P2 엔진 |

---

## 머지 순서 (의존성 순)

```
1. r9-eslint-fix          (독립 — 인프라 먼저)
2. r9-premium-model       (독립 — 모델/타입 먼저)
3. r9-admin-api           (premium-model 의존: Facility.premium 타입 필요)
4. r9-unit-tests          (독립 — 엔진 파일만 읽음)
5. r9-explore-ux          (독립 — UI만)
6. r9-home-dashboard      (독립 — UI만)
7. r9-chat-engine         (독립 — 엔진 파일만)
8. r9-landing-upgrade     (독립 — 랜딩만)
9. r9-e2e-chat            (chat-engine, chat quota 완료 후)
10. r9-e2e-explore        (explore-ux 완료 후)
11. r9-e2e-onboarding     (독립)
```

---

## 파일 충돌 방지

- `models/Facility.ts` — r9-premium-model만
- `types/dotori.ts` — r9-premium-model만
- `lib/dto.ts` — r9-premium-model만
- `app/api/facilities/route.ts` — r9-admin-api만 (sortBoost 정렬)
- `app/(app)/explore/page.tsx` — r9-explore-ux만
- `app/(app)/page.tsx` — r9-home-dashboard만
- `app/(landing)/landing/page.tsx` — r9-landing-upgrade만
- `lib/engine/intent-classifier.ts` — r9-chat-engine만
- `lib/engine/response-builder.ts` — r9-chat-engine만

---

## R9 PREMIUM_SPEC 구현 상세

### r9-premium-model 태스크 (PREMIUM_SPEC Task 1-3)

**Task 1 — Facility.ts premium 서브스키마:**
```typescript
premium?: {
  isActive: boolean;
  plan: "basic" | "pro";
  startDate: Date;
  endDate: Date;
  features: string[];
  sortBoost: number;       // default: 0
  verifiedAt?: Date;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
};
```

**Task 2 — types/dotori.ts FacilityPremium:**
```typescript
export interface FacilityPremium {
  isActive: boolean;
  plan: "basic" | "pro";
  features: string[];
  sortBoost: number;
  verifiedAt?: string;
}
// Facility 인터페이스에 추가: premium?: FacilityPremium;
```

**Task 3 — dto.ts toFacilityDTO:**
premium.isActive가 true인 경우에만 프론트에 전달.
false이거나 없으면 DTO에 premium 미포함.

### r9-admin-api 태스크 (PREMIUM_SPEC Task 4+6)

**Task 4 — facilities/route.ts sortBoost:**
검색 결과 정렬 시 premium.isActive && premium.sortBoost 반영.
프리미엄 시설이 동일 조건에서 상단 노출.

**Task 6 — admin API (신규 파일):**
`PUT /api/admin/facility/[id]/premium`
Authorization: Bearer ${CRON_SECRET} 검증
Body: `{ isActive, plan, sortBoost, features? }`

---

## R9 테스트 설계 상세

### r9-unit-tests 대상

| 파일 | 테스트 케이스 |
|------|-------------|
| intent-classifier.ts | "이동하고 싶어" → intent: "이동" |
| intent-classifier.ts | "반편성 결과가 맘에 안들어" → intent: "반편성" |
| intent-classifier.ts | "선생님이 바뀌었어" → intent: "교사교체" |
| intent-classifier.ts | "국공립 당첨됐는데" → intent: "국공립당첨" |
| nba-engine.ts | 미등록 사용자 → "아이 등록" NBA 반환 |
| nba-engine.ts | 이동 의향 사용자 → "빈자리 알림" NBA 반환 |
| dto.ts | premium.isActive=false → DTO에 premium 없음 |
| dto.ts | premium.isActive=true → DTO에 premium 포함 |

### r9-e2e-chat 시나리오

1. 게스트 사용자 채팅 3회 → 쿼터 소진 → PremiumGate 노출
2. 로그인 사용자 채팅 → 스트리밍 응답 수신 → UsageCounter 업데이트
3. "강남구 국공립 빈자리" 질문 → AI 응답에 시설 목록 포함

### r9-e2e-explore 시나리오

1. 탐색 진입 → 검색창에 "강남" 입력 → 시설 목록 렌더링
2. 시설 카드 클릭 → 시설 상세 → "관심 등록" → Toast 확인
3. GPS 버튼 → 위치 권한 → 지역 자동 설정

### r9-e2e-onboarding 시나리오

1. /onboarding 접속 → 슬라이더 3단계 완주
2. 지역 선택 (서울/강남구) → 시설유형 선택 (국공립) → 시작 버튼
3. 홈으로 리다이렉트 확인

---

## R9 explore-ux 상세 (이동 수요 포지셔닝)

현재: "이동할 시설 검색 (이름, 지역)" — 일반적
변경: 
- 헤더: "이동 고민이라면, 빈자리 먼저 확인해요"
- 이동 수요 프롬프트 칩 추가: [반편성 불만] [교사 교체] [국공립 당첨] [이사 예정]
- "이동 가능 시설" 필터 뱃지 강조 (현재 있음, visibility 강화)

---

## 완료된 라운드 기록

| 라운드 | 에이전트 수 | 주요 내용 |
|--------|----------|---------|
| R1-R3 | 36개 | 기초 구조, 채팅, 시설탐색 |
| R5 | 11개 | GPS/지도, 커뮤니티, 온보딩 |
| R8 | 11개 | 수익화 퍼널 (채팅쿼터, 구독API, PremiumGate, 랜딩 B2C/B2B) |
| R8-design | 3파일 | Catalyst Heading/Text 컴포넌트 고도화 |
