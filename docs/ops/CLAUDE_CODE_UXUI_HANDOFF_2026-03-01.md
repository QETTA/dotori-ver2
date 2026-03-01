# Claude Code Handoff: UX/UI 개선 정체 원인과 복구 계획

작성일: 2026-03-01  
대상: Claude Code (실행 담당)  
목표: "변경은 많은데 UX/UI가 체감상 개선되지 않는" 원인을 코드/파이프라인 기준으로 제거하고, 재발 방지 가드를 고정한다.

## 1) 현재 상태 요약
- 최근 배포는 성공했지만, UX 체감 개선이 불안정하다.
- 원인은 단일 화면 문제가 아니라, `배포 게이트`, `멀티에이전트 자동화`, `UI 구조 드리프트`가 동시에 얽혀 있다.
- 즉, "디자인 수정량" 대비 "프로덕션 일관성"이 낮은 구조다.

## 2) 확정된 원인 (증거 기반)

### A. 배포/CI 게이트가 UX 품질을 강제하지 못함
1. 배포가 수동 트리거 전용이라, 커밋과 실제 반영 간 시차/누락이 자주 발생.
2. 배포 게이트는 `CI`만 확인하고 `UX/UI Guard` 성공을 요구하지 않음.
3. `CI`는 `ci:preflight` 중심이라, 런타임 UX 검증(실제 동작/렌더 품질)이 약함.
4. Deploy 성공 판정이 사실상 API health 위주라, UI 품질 저하도 통과 가능.
5. UX Guard가 PR 이벤트 중심이라 `main` 직접 반영 흐름에서 우회 가능.

핵심 근거 파일:
- `.github/workflows/deploy.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/ux-ui-guard.yml`
- `dotori-app/package.json` (`ci`, `ci:preflight`, `ux:guard`)

### B. 멀티에이전트 자동화가 "품질보다 속도"로 기울어 있음
1. `launch.sh` direct mode에서 워크트리 격리 없이 같은 트리 동시 수정 가능.
2. 부분 실패가 있어도 최종 exit/non-zero가 보장되지 않는 경로가 존재.
3. preflight에서 lint/test를 warning 취급해 실패를 강제하지 않는 경로가 있음.
4. `git add -A`로 에이전트 스코프 밖 변경까지 묶일 수 있음.
5. 일부 래퍼 스크립트/참조 파일이 취약하거나 누락 의존성이 있음.

핵심 근거 파일:
- `dotori-app/scripts/launch.sh`
- `dotori-app/scripts/codex-wave.sh`
- `dotori-app/scripts/multi-agent-overdrive.sh`
- `dotori-app/scripts/gg-trigger.sh`

### C. UI 구조 자체가 드리프트를 만들고 있음
1. 시설 상세가 "실사용 페이지"와 "분리된 컴포넌트 세트"로 이원화되어 동기화가 깨짐.
2. 동일 사용자 액션(관심/신청)이 explore/detail에서 서로 다른 로직으로 중복.
3. explore map/list 상태가 URL/effect/ref/async 체크로 분산되어 경쟁 조건 위험이 큼.
4. 필터 로딩 상태가 실질적으로 죽어 있어 UX 신뢰도를 떨어뜨림.
5. list/map 정렬 규칙 불일치로 화면 간 일관성 저하.

핵심 근거 파일:
- `dotori-app/src/app/(app)/facility/[id]/page.tsx`
- `dotori-app/src/components/dotori/facility/*`
- `dotori-app/src/components/dotori/explore/*`
- `dotori-app/src/hooks/use-facility-actions.ts`

## 3) Claude Code가 해야 할 일 (우선순위)

### P0 (오늘, 배포 안정화)
1. Deploy 게이트를 `CI + UX/UI Guard` 모두 성공으로 변경.
2. UX Guard를 `next dev` 기준이 아니라 production-like 실행(`build + start`) 검증으로 전환.
3. Deploy 성공 조건에 핵심 UI smoke(핵심 경로 렌더/상호작용) 1세트 추가.
4. `launch.sh`에서 direct mode를 기본 금지(또는 serial safe mode 강제), 부분 실패 시 즉시 non-zero 종료.

### P1 (1~2일, 구조 정리)
1. 시설 상세 렌더 경로를 단일 경로로 통합(사용하지 않는 병행 경로 제거).
2. 관심/신청 액션 도메인 로직을 explore/detail 공통 모듈로 통합.
3. explore map/list 상태를 단일 소스(상태 머신 또는 단일 훅 계약)로 재구성.
4. 필터 로딩 상태(`isLoadingSido`, `isLoadingSigungu`)를 실제 요청 lifecycle과 연결.

### P2 (1주, 재발 방지)
1. DS delta/style guard 우회 경로 축소(allowlist/skip 조건 최소화).
2. visual regression baseline(모바일 + 데스크탑 주요 페이지) 도입.
3. merge 전 체크리스트를 "코드 규칙"에서 "사용자 시나리오" 중심으로 전환.

## 4) 수용 기준 (Definition of Done)
- `main` 직접 push 기준으로도 UX 가드가 반드시 걸린다.
- Deploy 성공 시 최소 1개의 UI smoke job이 통과해야 한다.
- 시설 상세/탐색의 핵심 상태 전환(map/list, 관심, 신청)이 단일 도메인 로직으로 동작한다.
- 동일 데이터에서 list/map 순서/표현 규칙이 일치한다.
- 멀티에이전트 실행은 실패/충돌을 성공처럼 숨기지 않는다(non-zero 보장).

## 5) Claude Code 시작 프롬프트 (붙여넣기용)
아래 문구를 Claude Code 첫 입력으로 사용:

```text
You are taking over Dotori UX/UI stabilization.
Use docs/ops/CLAUDE_CODE_UXUI_HANDOFF_2026-03-01.md as the source of truth.
Do P0 first (deploy/guard/automation hardening), then P1 (facility+explore architecture).
For each change:
1) show unified diff,
2) run exact verification commands,
3) report production impact risk.
Do not widen scope beyond files required for P0/P1.
```

## 6) 즉시 검증 명령 (로컬)
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run ci:preflight
npm run check:ds-delta
npm run build
```

## 7) 참고 실행 이력
- Deploy 실패 사례(게이트 스킵): `22534291209`
- CI 실패 원인 추적 런: `22534290377` (DS delta guard)
- Deploy 성공 런: `22534334136`

