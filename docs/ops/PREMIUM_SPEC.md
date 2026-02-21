# 프리미엄 시설 기능 스펙 — Claude Code 지시서
> 최종 업데이트: 2026-02-22
> 용도: Claude Code에 입력하여 6개 태스크 실행

---

## 개요

프리미엄은 B2B(시설 대상) 유료 서비스. 부모에겐 "프리미엄" 노출 금지 → "인증 시설", "상세 정보 제공 시설"로 표현.

**가격:** 월 33,000원(VAT포함) / 6개월 27,500원 / 12개월 22,000원
**타겟:** 수도권 민간/가정 중 status:"available" 시설
**전략:** 5곳 무료 체험 → 유료 전환

---

## 태스크 1: Facility 모델 premium 필드 추가

**파일:** dotori-app/src/models/Facility.ts

IFacility 인터페이스에 추가:
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

FacilitySchema에 premium 서브스키마 추가. 기존 필드 변경 금지. optional 필드.

---

## 태스크 2: 프론트엔드 타입 확장

**파일:** dotori-app/src/types/dotori.ts

```typescript
export interface FacilityPremium {
  isActive: boolean;
  plan: "basic" | "pro";
  features: string[];
  sortBoost: number;
  verifiedAt?: string;
}
```

Facility 인터페이스에 추가: premium?: FacilityPremium;

---

## 태스크 3: DTO 변환 함수 수정

**파일:** dotori-app/src/lib/dto.ts

toFacilityDTO 함수에서 premium 필드 매핑 추가.
premium.isActive가 true인 경우에만 프론트에 전달.
false이거나 없으면 DTO에 premium 포함하지 않음.

---

## 태스크 4: 시설 목록 API 정렬 수정

**파일:** dotori-app/src/lib/services/facility.service.ts (또는 api/facilities/route.ts)

검색 결과 정렬 시 premium.isActive && premium.sortBoost 반영.
프리미엄 시설이 동일 조건에서 상단 노출되도록 정렬 로직 수정.

---

## 태스크 5: 시설 상세 페이지 UI

**파일:** dotori-app/src/app/(app)/facility/[id]/ 내 클라이언트 컴포넌트

premium.isActive인 시설에 "인증 시설" 배지 표시.
도토리 브랜드 색상(forest) 사용.
"프리미엄" 단어 사용 절대 금지.

---

## 태스크 6: Admin API 신규 생성

**파일:** dotori-app/src/app/api/admin/facility/[id]/premium/route.ts (신규)

PUT 엔드포인트 — facilityId로 premium 필드 업데이트.
인증: Authorization 헤더에 Bearer $CRON_SECRET 검증.

사용 예시:
```bash
curl -X PUT https://dotori.app/api/admin/facility/{id}/premium \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"isActive":true,"plan":"basic","sortBoost":10}'
```

---

## 실행 전 체크리스트

- [ ] npm run build 에러 0건
- [ ] 기존 테스트 통과
- [ ] 기존 20,027개 시설과 호환 (optional 필드)
- [ ] "프리미엄" 문자열이 프론트 코드에 없는지 확인

---

## Phase 0 수동 운영 플로우

1. 수도권 민간/가정 시설 중 status:"available" 필터링
2. 시설에 직접 연락 → 무료 체험 제안
3. curl로 Admin API 호출 → premium 활성화
4. 1개월 후 효과 리포트 → 유료 전환 제안
