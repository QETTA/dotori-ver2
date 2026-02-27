# Claude Handoff — Aggressive UXUI Overhaul (Dotori) v2

> 작성일: 2026-02-27  
> 목적: Claude Code가 Dotori UXUI를 멀티에이전트로 공격적으로 전환하되, 충돌 없이 끝까지 완주하도록 만드는 실행 문서

## 0) 시작 전에 고정 사실
- 작업 루트: `/home/sihu2129/dotori-ver2`
- 앱 루트: `/home/sihu2129/dotori-ver2/dotori-app`
- 브랜치 정책: `main` 직접 작업 (feature branch 금지)
- 이번 문서의 단일 목표: **Tailwind Plus 패턴 + UiBlock V2 + 고부채 컴포넌트 동시 전환으로 체감 UXUI 차이를 즉시 만들기**

## 1) 절대 위반 금지 (Business + Brand + Repo Rule)
- 제품 퍼널: `탐색 -> 상세 -> 관심 -> 견학 -> 입소계약 -> 서류 일괄서명 -> 완료`
- 시간 목표: 기존 2~3시간 -> 10분
- KPI: Day30 `explore->상세 15%+`, 토리챗 세션/주 80
- 부모 화면 `"premium"` 문자열 노출 금지
- `"인증 시설"` 배지는 `Badge color="forest"`만 허용
- 코드 규칙:
  - `motion/react`만 사용 (`framer-motion` 금지)
  - `text-[Npx]` 금지 (`text-xs/sm/base/lg/xl`만)
  - touch target `min-h-11` 준수
  - `color="dotori"` CTA만, `color="forest"` Badge만, `color="amber"` 카카오만
  - `src/components/catalyst` 수정 금지
  - UI 구현 기본축은 `Tailwind Plus composition + UiBlock`으로 통일
  - 단, Tailwind Plus는 "패턴/레이아웃 방식"만 차용하고, 브랜드 토큰/카피는 Dotori 규칙을 우선 적용
  - 브랜드 계약 import 강제:
    - `import { BRAND } from "@/lib/brand-assets"`
    - `import { COPY } from "@/lib/brand-copy"`
    - `import { DS_STATUS, DS_GLASS } from "@/lib/design-system/tokens"`
  - 부모 UI 카피는 `COPY` 우선 사용, 브랜드 리소스/문구 하드코딩 금지

## 2) 베이스라인 캡처 계약 (재현 가능하게)
- 아래 5개를 반드시 남긴다.
  1. 시작 커밋 SHA
  2. 실행 시각(로컬 타임)
  3. DS before 리포트 경로
  4. wave 대상 파일별 `rawClassNameLiterals` 전/후 표
  5. 실행 명령 원문과 pass/fail
- 과거 참고 스냅샷(2026-02-27): `ui_block` 4/20, `totalHardcodedClassLiterals=1573`

## 3) 멀티에이전트 운영 프로토콜 (핵심)
### 3.1 역할
- Orchestrator: wave 헌장/순서/리스크 관리 (코드 수정 금지)
- Agent A (Page Shell): 페이지 골격, 섹션 리듬, 배경 계층, 타이포 hierarchy
- Agent B (UiBlock V2): schema 확장, renderer registry, 적용 가이드
- Agent C (Debt Burn): 상위 부채 컴포넌트 raw class 감축
- Agent D (QA Gate): `tsc/test/build/lint/ds-delta` + 정책 위반 검수
- Merge Captain: `main` 통합 전담 (통합 창구 1인)

### 3.2 파일 락 (Edit Lease)
- wave 시작 전에 파일 소유자를 먼저 선언한다.
- 같은 파일은 한 시점에 1명만 수정한다.
- 락 없는 교차 수정 금지.
- 통합 순서: `types/contracts -> ui infra -> page shell -> components -> qa`.

### 3.3 작업 단위 규칙
- wave당 파일 3~7개
- 목표 1개만 수행 (bug fix + refactor 혼합 금지)
- 통합 창구 오픈 후 스코프 추가 금지

## 4) Wave 실행 계획 (고정)
### Wave 1 — Foundation (UiBlock V2 동결)
- 파일:
  - `src/types/dotori.ts`
  - `src/lib/chat/response-shape.ts`
  - `src/components/dotori/blocks/UiBlock.tsx`
  - `src/components/dotori/blocks/BlockRenderer.tsx`
- 목표:
  - `UiBlock V2` 도입: `variant`, `tone`, `density`, `ctaMode`, `mediaSlot`, `accentStyle`
  - layout 변형: `hero/panel/strip/form-like` 추가
  - renderer registry 구조화
- 종료 게이트:
  - schema freeze + migration note 1페이지 생성 후에만 Wave 2/3 착수

### Wave 2 — High Impact Pages
- 파일:
  - `src/app/(landing)/landing/page.tsx`
  - `src/app/(app)/page.tsx`
  - `src/app/(onboarding)/onboarding/page.tsx`
  - `src/app/(app)/my/page.tsx`
- 목표:
  - 페이지 셸 전환으로 first viewport 체감 변화 확보
  - section divider, glass layer, typography scale 일관화

### Wave 3 — Critical Components
- 파일:
  - `src/components/dotori/FacilityCard.tsx`
  - `src/components/dotori/Skeleton.tsx`
  - `src/components/dotori/facility/FacilityContactSection.tsx`
  - `src/components/dotori/facility/FacilityCapacitySection.tsx`
- 목표:
  - raw class 집중 감축
  - 반복 UI를 token primitive로 올리기

### Wave 4 — Explore Funnel
- 파일:
  - `src/components/dotori/explore/ExploreSearchHeader.tsx`
  - `src/components/dotori/explore/ExploreResultList.tsx`
  - `src/app/(app)/explore/page.tsx`
- 목표:
  - `explore->상세` 전환 개선
  - empty state + next-action CTA를 `ui_block`으로 통일

## 5) Go / No-Go 게이트 (모두 통과해야 Go)
- Gate 1 Scope: 목표 1개, 파일 3~7개, 금지 경로 수정 없음
- Gate 2 Static: `npx tsc --noEmit` 에러 0
- Gate 3 Test: `npm test` 전체 pass
- Gate 4 Build: `npm run build` 에러 0
- Gate 5 Policy:
  - `motion/react` only
  - `text-[Npx]` 없음
  - color rule 위반 없음
  - `components/catalyst` 변경 없음
  - Tailwind Plus 패턴 적용 시 Dotori 색/카피/토큰으로 치환 완료
  - 변경된 UI 파일(`src/app`, `src/components/dotori`)에 `BRAND/COPY/DS_*` 사용 흔적 존재
- Gate 6 UX Check:
  - hierarchy / CTA prominence / spacing rhythm / motion consistency / mobile first-fold clarity

## 6) 정량 완료 기준 (주관 최소화)
- wave별 `rawClassNameLiterals` 합계 **30% 이상 감축**
- 신규 코드에서 token primitive 없이 raw class 신규 대량 추가 금지
- 대상 페이지에서 “다음 행동 CTA 1순위”가 시각적으로 명확해야 함
- 최종 리포트에 전/후 수치와 근거 파일 경로를 포함해야 함

## 7) 실패 복구 플레북
1. `RED` 선언: 통합 즉시 중지
2. 10분 분류: `compile/test/build/policy/runtime/merge`
3. 복구:
   - 단일 소유 결함: 소유 agent 즉시 hotfix
   - 통합 충돌: Merge Captain이 문제 patch만 역적용 후 clean patch 재적용
4. 전체 게이트 재실행 (부분 통과 인정 금지)
5. 5줄 포스트모템 남기기: 원인/재발방지/담당/기한

## 8) 실행 커맨드 (복붙)
```bash
cd /home/sihu2129/dotori-ver2/dotori-app

# 0) baseline
git rev-parse --short HEAD
date "+%Y-%m-%d %H:%M:%S %Z"
DS_REPORT=1 DS_AUDIT_ALL=1 DS_STYLE_NEUTRAL_ENFORCE=0 npx tsx scripts/check-design-system.ts > /tmp/dotori_ds_before.json

# 1) quality gates
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run check:ds-delta

# 1-1) brand assets/copy/token gate (changed UI files only)
MISSING=0
for f in $(git diff --name-only | rg '^src/(app|components/dotori)/.*\\.tsx$'); do
  if ! rg -q 'BRAND|COPY|DS_STATUS|DS_GLASS' "$f"; then
    echo "MISSING_BRAND_IMPORT_OR_USAGE: $f"
    MISSING=1
  fi
done
test $MISSING -eq 0

# 2) after report
DS_REPORT=1 DS_AUDIT_ALL=1 DS_STYLE_NEUTRAL_ENFORCE=0 npx tsx scripts/check-design-system.ts > /tmp/dotori_ds_after.json
```

## 9) Claude 보고 포맷 (강제)
- 각 wave 종료 시 아래 순서 고정:
  1. 변경 파일 목록
  2. 핵심 시각 변경점 5줄
  3. `rawClassNameLiterals` 전/후 수치
  4. 실행 명령 + 결과
  5. 다음 wave 전 리스크 2개
- 최종 출력 계약:
  - apply 가능한 unified diff
  - 7줄 요약 (max)
  - 정확한 테스트 명령
  - 막힌 경우에만 `BLOCKED` 3줄 (`what/why/what-needed`)

## 10) Claude에 바로 붙여넣는 지시문
```text
Dotori UXUI를 멀티에이전트로 공격 전환해.

목표(1개): 페이지 셸 + UiBlock V2 + 고부채 컴포넌트 동시 개선으로 first viewport부터 변화가 분명하게 보이게 만들 것.
운영: Orchestrator/A/B/C/D + Merge Captain 체계로 wave 1~4 순서 실행. wave당 파일 3~7개, 목표 1개 고수.
필수 제약: components/catalyst 수정 금지, motion/react only, text-[Npx] 금지, min-h-11 준수, color 규칙 준수.
브랜드 규약: BRAND/COPY/DS_STATUS/DS_GLASS를 import해서 사용하고, 부모 UI의 브랜드 카피/에셋 하드코딩 금지.
필수 import:
import { BRAND } from "@/lib/brand-assets"
import { COPY } from "@/lib/brand-copy"
import { DS_STATUS, DS_GLASS } from "@/lib/design-system/tokens"
게이트: npx tsc --noEmit, npm test, npm run build, npm run lint, npm run check:ds-delta 모두 통과해야 Go.
정량: wave 대상 rawClassNameLiterals 30%+ 감축, before/after 근거 파일 포함.
보고: 파일 목록/시각 변경점/rawClass 전후/검증결과/다음 리스크 2개.

참조: docs/ops/CLAUDE_HANDOFF_AGGRESSIVE_UXUI.md
```

## 11) 멀티에이전트 킥오프 프롬프트 (복붙)
### 11.1 Orchestrator
```text
너는 Orchestrator다. 목표는 Tailwind Plus 패턴 + UiBlock V2 기반 UXUI 전환 1개를 완주하는 것.
먼저 wave 목표 1개, 파일 3~7개, 파일 락 소유자(A/B/C)를 선언하고 시작해.
작업 중 스코프 추가 금지, 통합 전에는 변경 파일 충돌 여부를 보고해.
최종에는 Go/No-Go 게이트 6개 결과와 리스크 2개를 보고해.
```

### 11.2 Agent A (Page Shell)
```text
너는 Page Shell 담당이다.
대상 페이지의 first viewport를 Tailwind Plus 컴포지션으로 재배치하되, 실제 스타일 값은 Dotori 토큰/카피 규칙을 따른다.
필수: motion/react, min-h-11, text 토큰, CTA/Badge color 규칙, BRAND/COPY/DS_* 사용.
산출: unified diff + 시각 변경점 5줄 + rawClass 전/후.
```

### 11.3 Agent B (UiBlock V2)
```text
너는 UiBlock V2 담당이다.
UiBlock schema를 확장하고 BlockRenderer를 registry 구조로 정리해 재사용성을 높여라.
Tailwind Plus 패턴은 block layout 구조에 반영하되, 브랜드 문구/색/배지는 Dotori 규칙으로 강제해.
산출: 타입 변경 요약 + migration note + unified diff.
```

### 11.4 Agent C (Debt Burn)
```text
너는 고부채 컴포넌트 정리 담당이다.
반복 class를 줄이고 token primitive 기반으로 통일해 rawClassNameLiterals를 wave 기준 30% 이상 줄여라.
BRAND/COPY/DS_* import 없는 부모 UI 변경은 실패로 간주한다.
산출: 파일별 rawClass 전/후 표 + unified diff.
```

### 11.5 Agent D (QA Gate)
```text
너는 QA Gate 담당이다.
아래를 순서대로 실행해 pass/fail을 표로 보고해:
- npm run lint
- npx tsc --noEmit
- npm test
- npm run build
- npm run check:ds-delta
- brand assets/copy/token gate
하나라도 실패면 No-Go 선언 후 실패 분류와 복구 제안 2개를 작성해.
```

## 12) Codex/Claude 분업 모드 (권장 운영)
### 12.1 책임 분리
- Codex(멀티에이전트): 구조 리팩토링 본체 수행
  - Wave 1~4의 타입/렌더러/페이지 셸/컴포넌트 구조 변경
  - 파일 락 관리, 충돌 방지, Go/No-Go 판정
  - 품질 게이트 실행 및 수치 보고
- Claude Vision(미세개선): 시각/인터랙션 polishing만 수행
  - spacing, 타이포 위계 미세 조정
  - motion 타이밍/강도 튜닝(`motion/react` 범위 내)
  - 카피 가독성, CTA 우선순위 시각 강조 미세 보정

### 12.2 작업 순서 (고정)
1. Codex가 wave 단위 구조 변경 완료 + Gate 1~5 통과
2. Claude Vision이 같은 wave에서 미세개선만 수행 (신규 구조 변경 금지)
3. Codex가 최종 Gate 1~6 재검증 후 Go/No-Go 확정

### 12.3 Claude Vision 금지사항
- 금지: 새로운 상태/타입/데이터 흐름 추가
- 금지: 파일 범위 확장(해당 wave 파일 외 수정)
- 금지: 브랜드 규약 우회 하드코딩
- 허용: class 조합/spacing/motion/copy 배치의 미세 수정

### 12.4 Claude Vision 입력 프롬프트 (복붙)
```text
너는 Vision polishing 전담이다.
현재 wave에서 Codex가 만든 구조를 유지한 채, 시각/인터랙션 미세개선만 수행해.
금지: 타입/상태/데이터 흐름/스키마 변경, 파일 범위 확장.
필수 준수: motion/react only, text 토큰, min-h-11, color 규칙, BRAND/COPY/DS_* 규칙.
출력: 변경 파일 목록, 시각 개선 포인트 5개, 회귀 위험 2개.
```
