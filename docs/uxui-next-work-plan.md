# Dotori UX/UI 다음 작업 설계 (Next Plan)

> **Archived** — 이 문서의 DS_SURFACE 토큰 전환 작업은 R34~R45에서 완료되었습니다. DS_CARD/DS_PAGE_HEADER/DS_SURFACE 토큰 100% 채택, text-[Npx] 0건 달성 (R33~R45).

## 1) 목표
- `/my` 페이지에서 시작한 디자인 자산-토큰(특히 `DS_SURFACE`) 완전 수렴을 `app 전역 + 핵심 shared components`로 확장한다.
- 커스텀 하드코딩 클래스를 구조적으로 제거해 컴포넌트 단절(디자인 변경 시 스타일 회귀)을 원천 차단한다.
- 결과를 정량 지표로 관리한다: `literal className` 감소율, `DS_SURFACE`/`DS_LAYOUT`/`DS_GLASS`/`DS_TYPOGRAPHY` 커버리지, 접근성-가독성 리스크.

## 2) 작업 1단계: 단속 기준 고정 (현재 값)
- 현재 라우트/컴포넌트 상태 베이스라인
  - `src/app` `page.tsx` 수: 21개
  - `className="..."` 직접 문자열(토큰 미사용) 개수: 607개(2026-02-24 기준)
- `className` 문자열이 있는 파일 우선순위 Top 리스트를 기준으로 1차 대상 확정
  1. `app/(onboarding)/onboarding/page.tsx`
  2. `app/(landing)/landing/page.tsx`
  3. `app/(auth)/login/page.tsx`
  4. `components/dotori/explore/ExploreSearchHeader.tsx`
  5. `app/(app)/facility/[id]/FacilityDetailClient.tsx`
- 모든 새 토큰은 `tokens.ts`에 키 추가 후 즉시 사용, 임시 하드코딩 불허.

## 3) 작업 2단계: 전환 실행 (파일 단위 배치, 3~7개씩)
- Wave A: `app/(onboarding)`, `app/(landing)`, `app/(auth)` 3개 페이지를 먼저 정리.
- Wave B: `/facility`, `/explore`, `/community` 라우트(페이지 + 헤더/리스트 컴포넌트) 정리.
- Wave C: `components/dotori/*` 핵심 카드/리스트/빈 상태/로딩/배지 컴포넌트 정리.
- 각 Wave에서 `my` 쪽 신규 토큰 오염 방지 기준으로 `menu/panel/overlay/action/state` 패턴까지 동일 템플릿 적용.

## 4) 작업 3단계: 교차 검수(루프)
- 1차 반영 후 lint/타입/테스트 + 수동 UX 점검 → 회귀 지점(간격, 다크 모드, 터치 타깃 `min-h-11`) 보정.
- 동일 클래스 반복이 두 군데 이상이면 토큰 병합/재사용 가능성 재검토.
- 최종 산출물: 60개 단위 기준(라우트+컴포넌트 합산) “토큰 미사용 className 0개” 달성 여부 판단.

## 5) 품질 게이트(반드시 통과)
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- 추가: 라우트-컴포넌트별 `className` 잔량 리포트 CSV(작업 전/후 diff) 보존.

