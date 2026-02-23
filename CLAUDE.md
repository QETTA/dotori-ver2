# CLAUDE.md — Dotori V2 Workspace

## 구조
```
dotori-ver2/
├── dotori-app/   ★ 메인앱 (항상 여기서 작업)
├── brand/        브랜드 에셋 SVG
├── docs/         사양서
└── .claude/      MCP 설정
```

## 에이전트 아키텍처

```
Claude Code (지휘관, Opus 4.6)
├── Serena MCP    → 코드 인텔리전스 + 에이전트 공유 메모리 허브
├── Git Worktrees → 각 Codex 에이전트 격리 실행 공간
└── Codex CLI     → 코드 구현 에이전트 (codex exec, 병렬 최대 11개)
```

### 역할 분담
| 작업 유형 | 담당 |
|-----------|------|
| 코드 생성/리팩토링/버그 수정 | **Codex** (워크트리, gpt-5.3-codex) |
| 코드 분석/심볼 검색/타입 확인 | **Serena** MCP |
| 전체 문제 분석/아키텍처 결정 | **Claude** (Opus 4.6) |
| 1-2줄 직접 수정 | Claude (Edit 도구) |
| 파일 탐색/검색 | Claude (Glob/Grep) |
| git/배포/빌드 검증 | Claude (Bash) |

## MCP 서버
| 서버 | 용도 |
|------|------|
| **serena** | TypeScript LSP + 에이전트 메모리 허브 ★ |
| **codex** | gpt-5.3-codex (Bash CLI 워크트리 병렬) |
| **context7** | 라이브러리 문서 |

## Serena 메모리 = 에이전트 간 공유 컨텍스트
```
.serena/memories/
├── project_overview.md         ← 프로젝트 구조/현재 상태 (최신 유지 필수)
├── code_style_and_conventions.md ← 코딩 컨벤션 (Codex 필독)
├── agent_task_registry.md      ← 에이전트 파일 소유권 맵 (라운드별 갱신)
├── pending_tasks.md            ← 잔여 과제 + 세션 시작 체크리스트
├── opus_analysis_r12.md        ← Opus 분석 결과 (P0~P3 이슈)
└── worktree_pipeline.md        ← 파이프라인 트러블슈팅
```
- Claude Code만 메모리 쓰기 (Codex는 읽기만)
- 중요 분석 결과는 반드시 메모리에 저장 (컨텍스트 유실 방지)

## 축약어
| 입력 | 동작 |
|------|------|
| `ㄱ` | launch.sh 설계 → Codex(최대11) 병렬 → 빌드 검증/머지 → **모바일 QA(check-console/e2e/screenshot/scroll)** → push → 배포 |
| `ㄱㄱ` | 위 사이클 반복 |
| `ㅂ` | 빌드 검증만 (`npm run build && npm test && eslint`) |
| `ㅅ` | 스크린샷 (`npm run screenshot`) |

## ㄱ 파이프라인 흐름
```
1. 분석: 빌드 상태 + Serena/Opus로 개선점 도출
2. 설계: launch.sh의 AGENTS/get_task 업데이트 + agent_task_registry.md 갱신
3. 발사: ./scripts/launch.sh rN (11개 워크트리 → Codex 병렬)
4. 자동: 빌드 검증(4병렬) → squash merge → 최종 빌드
5. 자동 QA: `./scripts/mobile-qa.sh` (포트 3002 기준 콘솔/시나리오/스크린샷 검수)
6. 후처리: git push origin main → doctl 배포
```

### launch.sh 핵심 설정값
```bash
CODEX_MODEL=${CODEX_MODEL:-gpt-5.3-codex}  # spark 한도 시 교체
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees                    # git root에 생성 (NOT app/)
MAX_PARALLEL=4                               # 빌드 검증 동시 실행 수
TIMEOUT=5400                                 # 90분 타임아웃
```

### 충돌 방지 규칙
- **1 파일 = 1 에이전트** (agent_task_registry.md에 소유권 명시)
- **공유 파일** (types/dotori.ts, page.tsx 등) → 한 에이전트만 담당
- **MERGE_ORDER** → 인프라/보안 먼저, UI/테스트 마지막

## 토큰 최적화 규칙

### Claude(상위) 결정문 — 구현 설명 금지, 결정만 남긴다
```
[CONTEXT] 증상/요구 1~2줄
[GOAL] 정확히 1줄
[NON-GOALS] 이번에 안 하는 것 1~3줄
[AC] 테스트 가능한 완료조건 3~7개
[SCOPE FILES] 수정 파일 3~7개 (7개 초과 시 티켓 분할)
[TEST PLAN] 검증 커맨드/케이스 1~3줄
```

### Codex(하위) 산출물 규격 — 고정 포맷 필수
```
1) git diff (unified) — 코드블록 1개
2) 요약 7줄 이내 (bullet)
3) 테스트 커맨드
4) 막히면: BLOCKED: + 3줄 (what/why/what-needed)
```

### 스코프 규칙
- 티켓당 파일 3~7개. 7개 초과 → 2티켓 분할
- 티켓당 목표 1개 (버그fix + 리팩토링 혼합 금지)
- 파일 목록은 상위가 확정 (하위에게 "찾아봐" 금지 → 탐색 토큰 절감)

### 검수 체크리스트 (merge 전)
1. 수정 파일 3~7개인가? (스코프 폭주 차단)
2. SCOPE 밖 변경 없는가?
3. AC 전체 충족 매핑되는가?
4. 테스트 커맨드 제공됐는가?
5. 불필요 리팩토링 포함 안 됐는가?

### 금지 패턴
- 하위에게 프로젝트 전체 설명 붙이기
- 에러 로그 원문 전체 전달 (5줄 요약 후 전달)
- 하위가 설계 토론 시작 → 즉시 회수
- 산출물 포맷 매번 변경 (고정이 토큰 절감)

## 브랜드 색상
- `color="dotori"` → CTA 브라운
- `color="forest"` → 성공/활성 (Badge 전용, Button 금지)
- `color="amber"` → 카카오 전용 (앱 CTA 사용 금지)

## 핵심 명령
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run build      # 빌드 (47 pages)
npm test           # 테스트 (106개, vitest)
npm run dev        # 개발 서버

# 배포
git push origin main
doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
```

## 현재 상태 (2026-02-22, R17 완료)
- **47 pages**, 0 TypeScript errors, **106 tests** (vitest, 15 test files)
- **102 에이전트** 완료 (R1~R3: 36, R5: 11, R8: 11, R9: 11, R11: 6, R12: 5, R13: 11, R17: 11)
- **text-[Npx] 0건** (R17에서 286건 전체 제거)
- **P0~P1 보안 이슈 0건** (R13에서 전체 수정)
- **MongoDB**: 20,027 시설 (17개 시도)
- **DO 배포**: sgp 리전, App ID `29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2`
