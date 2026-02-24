# 프리미엄 시설 기능 스펙 — Claude Code 지시서
> 최종 업데이트: 2026-02-24
> **Status: ✅ 전체 구현 완료 (R9에서 구현, R13에서 보안 강화)**

---

## Overview

- Premium은 B2B 유료 서비스 (시설 대상, 부모 아님)
- 부모에게는 "인증 시설" / "상세 정보 시설"로 표시 — "프리미엄" 노출 금지
- 가격: 33,000원/월(VAT 포함) / 6개월 27,500원 / 12개월 22,000원
- 타겟: 수도권 민간/가정 시설 중 status: "available"
- 전략: 5곳 무료 체험 → 유료 전환

---

## 6 Tasks — 구현 상태

### Task 1 ✅ — Facility 모델 premium 서브스키마
**파일:** `src/models/Facility.ts`
- `IFacilityPremium` 인터페이스 + `PremiumSchema` 서브도큐먼트
- 필드: isActive, plan("basic"|"pro"), startDate, endDate, features[], sortBoost, contactPerson/Phone/Email, verifiedAt
- 추가 필드: `isPremium: boolean`, `premiumExpiresAt?: Date`, `premiumProfile` (directorMessage, photos, programs, highlights, contactNote)

### Task 2 ✅ — 프론트엔드 타입 확장
**파일:** `src/types/dotori.ts`
- `FacilityPremium` 인터페이스
- `FacilityPremiumProfile` 인터페이스
- `Facility` 인터페이스에 `premium?`, `premiumProfile?` 추가

### Task 3 ✅ — DTO 변환
**파일:** `src/lib/dto.ts`
- premium.isActive === true일 때만 프론트에 전달

### Task 4 ✅ — 시설 목록 정렬 (sortBoost)
**파일:** `src/app/api/facilities/route.ts`
- `getFacilityPremiumSortScore()` 프리미엄 시설 상단 노출

### Task 5 ✅ — 시설 상세 UI ("인증 시설" 배지)
**파일:** `src/app/(app)/facility/[id]/FacilityDetailClient.tsx`
- `Badge color="forest"` "인증 시설" 표시
- premiumProfile 렌더링

### Task 6 ✅ — Admin API
**파일:** `src/app/api/admin/facility/[id]/premium/route.ts`
- PUT 엔드포인트
- R13: 세션 인증(admin role) OR Bearer CRON_SECRET 복합 인증

---

## Checklist ✅

- [x] `npm run build` 0 errors
- [x] 기존 테스트 통과 (111/111, Vitest)
- [x] 20,027개 시설 하위 호환
- [x] 프론트엔드에 "premium" 문자열 미노출
- [x] Admin API 보안 강화 (R13)

---

## Phase 0 운영 플로우

```bash
curl -X PUT "https://app-url/api/admin/facility/{facilityId}/premium" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"isActive":true,"plan":"basic","sortBoost":10,"features":["verified_badge","extended_profile"]}'
```
