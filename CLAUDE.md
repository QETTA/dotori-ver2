# CLAUDE.md — Dotori V2 Workspace

## 구조
```
dotori-ver2/
├── dotori-app/   ★ 메인앱 (항상 여기서 작업)
├── brand/        브랜드 디자인 가이드 (SVG는 dotori-app/public/brand/)
├── docs/         사양서
└── .claude/      MCP 설정
```

## 에이전트 아키텍처

```
Claude Code (지휘관, Opus 4.6)
├── /frontend-design  → UX/UI 작업 시 필수 호출 ★★★
├── Serena MCP        → 코드 인텔리전스 + 에이전트 공유 메모리 허브
├── codex-wave.sh     → CLI 병렬 배치 (wave 단위) ★ 권장
├── launch.sh v7      → 워크트리 격리 + wave 빌드 (대규모 라운드용)
└── Task(sonnet)      → 스크린샷 QA + 디자인 채점 위임 (Opus 토큰 절감)
```

### 역할 분담
| 작업 유형 | 담당 |
|-----------|------|
| **UX/UI 디자인 방향 + 코드 생성** | **`/frontend-design` 스킬** ★ 필수 선행 |
| 코드 생성/리팩토링/버그 수정 (≥3파일) | **codex-wave.sh** (CLI 병렬) |
| 코드 생성 (대규모 11+에이전트, 격리 필요) | **launch.sh v7** (워크트리 wave) |
| 코드 분석/심볼 검색/타입 확인 | **Serena** MCP |
| 전체 문제 분석/아키텍처 결정 | **Claude** (Opus 4.6) |
| 스크린샷 분석/시각적 QA + 디자인 채점 | **Task(model=sonnet)** ← Opus 토큰 절감, 10점 척도 |
| 1-2줄 직접 수정 | Claude (Edit 도구) |
| 파일 탐색/검색 | Claude (Glob/Grep) |
| git/배포/빌드 검증 | Claude (Bash) |

## MCP 서버
| 서버 | 용도 |
|------|------|
| **serena** | TypeScript LSP + 에이전트 메모리 허브 ★ |
| **context7** | 라이브러리 문서 |
| **mongodb** | MongoDB Atlas 읽기 전용 |
| **sentry** | 에러 모니터링 |

## Serena 메모리 = 에이전트 간 공유 컨텍스트
```
.serena/memories/
├── project_overview.md         ← 프로젝트 구조/현재 상태 (최신 유지 필수)
├── code_style_and_conventions.md ← 코딩 컨벤션 (Codex 필독)
├── agent_task_registry.md      ← 에이전트 파일 소유권 맵 (라운드별 갱신)
├── pending_tasks.md            ← 잔여 과제 + 세션 시작 체크리스트 ★
├── task_designs/rN.md          ← 라운드별 태스크 설계 (세션 간 유지) ★ NEW
├── opus_analysis_r12.md        ← Opus 분석 결과 (P0~P3 이슈)
└── worktree_pipeline.md        ← 파이프라인 트러블슈팅
```
- Claude Code만 메모리 쓰기 (Codex는 읽기만)
- **분석 결과/태스크 설계는 반드시 메모리에 저장** (세션 compaction 대비)
- 라운드 시작 전 `task_designs/rN.md`에 에이전트별 태스크 기록 → 세션 유실 시 복원 가능

### 메모리 저장 규칙 (세션 간 컨텍스트 유실 방지)
```
반드시 저장:
- 라운드 분석 결과 (어떤 이슈를 발견했는지)
- 에이전트별 태스크 설계 (파일목록 + AC)
- 빌드/테스트 에러 요약 (원문X, 5줄 요약)
- 파이프라인 트러블슈팅 결과

저장 불필요:
- 스크린샷 원본 (경로만 기록)
- git diff 전문 (커밋 해시만 기록)
- 에이전트 실행 로그 전문 (결과 요약만)
```

## 축약어
| 입력 | 동작 |
|------|------|
| `ㄱ` | **일반 라운드**: 분석 → 구현 → 빌드 → commit (QA 선택) |
| `ㄷ` | **디자인 라운드**: 사전QA → /frontend-design → 구현 → 사후QA(7.0+ 게이트) → push |
| `ㄱㄱ` | 연속 (7.0 미만 시 자동 ㄷ 전환) |
| `ㅂ` | 빌드 검증만 (`npm run build && npm test`) |
| `ㅅ` | 스크린샷 + 콘솔 통합 (`npx tsx scripts/screenshot-check.ts`) |
| `ㅈ` | **디자인 품질 감사만** (screenshots → Sonnet 10점 채점 → 점수 리포트) |

## ㄱ 파이프라인 — 일반 라운드

```
STEP 1. 분석
   a) tsc --noEmit + npm run build (빌드 안정성 확인)
   b) 이전 라운드 대비 변경점 확인 (git log)
   c) 잔여 P0~P3 이슈 확인 (pending_tasks.md)

STEP 2. /frontend-design (UX 작업 포함 시만)
   → 디자인 씽킹 + TP5 패턴 적용 계획

STEP 3. 설계 + 메모리 저장
   a) tasks.txt 또는 직접 수정 계획
   b) task_designs/rN.md 저장 (CHECKPOINT 포함)
   c) 파일 소유권 확정 (agent_task_registry.md)

STEP 4. 구현
   4-A. [직접] Claude Edit (1~3파일)
   4-B. [CLI] codex-wave.sh tasks.txt --wave=4
   4-C. [격리] launch.sh v7 (11+ 에이전트)

STEP 5. 빌드 검증
   a) npx tsc --noEmit
   b) npm run build (0 errors, 20 pages)
   c) npm test (804+ pass)

STEP 6. commit + push
   a) git -C /home/sihu2129/dotori-ver2 add -A
   b) git -C /home/sihu2129/dotori-ver2 commit -m "feat(RN): ..."
   c) git -C /home/sihu2129/dotori-ver2 push origin main

STEP 7. 메모리 동기화
   a) Serena: project_overview.md, pending_tasks.md 갱신
   b) Auto Memory: MEMORY.md 갱신
```

## ㄷ 파이프라인 — 디자인 라운드 ★

```
STEP 0. 사전 QA (디자인 품질 베이스라인)
   a) dev 서버(3002) 기동 — PORT=3002 npm run dev -- --webpack
   b) Playwright 스크린샷 6페이지 (home, explore, facility, chat, my, landing)
   c) Task(model=sonnet) → scripts/design-qa-prompt.md 사용, 10점 척도 채점
   d) 점수 기록 → memory 저장
   → 7.0 미만 = 디자인 우선 (기능 작업 전 디자인 개선)

STEP 1~5. (ㄱ과 동일, /frontend-design 필수)
   - STEP 1.d) TP5 패턴 적용 현황 Grep
   - STEP 1.e) 2026 디자인 수치 교차검증 (memory/design-quality-patterns.md)

STEP 6. 사후 QA (7.0 미만 → STEP 2로, 최대 2회)
   a) dev 서버(3002) 기동
   b) Playwright 스크린샷 6페이지 (동일 페이지)
   c) Task(model=sonnet) → scripts/design-qa-prompt.md 사용, 10점 척도 재채점
   d) 점수 비교: STEP 0 대비 개선 확인
   → 개선 안 됨 or 7.0 미만 = 재작업 (최대 2회)

STEP 7. commit + push
STEP 8. 메모리 동기화 + CHECKPOINT 갱신
   → design-quality-patterns.md에 라운드별 점수 추적
```

### TP5 = Tailwind Plus 5대 필수 패턴 (상세: memory/design-quality-patterns.md)
```
1. 3-Layer Hover System  — group/card + z-10 content + z-20 click zone
2. Gradient Text          — bg-clip-text text-transparent (히어로/CTA 필수)
3. Card.Eyebrow Compound  — accent bar + eyebrow + title + desc 구조화
4. Snap-Scroll Carousel   — snap-x snap-mandatory + spring + scrollbar-hidden
5. Border Accent + Noise  — gradient h-1 top bar + SVG feTurbulence overlay

적용 검증 Grep:
  1) grep -r "group/card" src/ --include="*.tsx" | wc -l  (≥3)
  2) grep -r "bg-clip-text" src/ --include="*.tsx" | wc -l  (≥3)
  3) grep -r "snap-mandatory" src/ --include="*.tsx" | wc -l  (≥3)
```

### Sonnet QA 채점 기준
| 점수 | 의미 | ㄱ 파이프라인 조치 |
|------|------|-----------------|
| 9.0+ | VC 데모 레디 | 즉시 배포 가능 |
| 7.0~8.9 | 프로덕션 품질 | 마이너 폴리시 후 배포 |
| 5.0~6.9 | 표면적 수준 | **디자인 라운드 강제** (기능 작업 불가) |
| <5.0 | MVP 미달 | **긴급 오버홀** (최우선 작업) |

### /frontend-design 스킬 호출 규칙
```
필수 호출 조건 (하나라도 해당 시 반드시 호출):
- UX/UI 개선 작업
- 새 컴포넌트/페이지 생성
- 레이아웃/색상/타이포그래피 변경
- 스크린샷 기반 개선

호출 불필요:
- 순수 백엔드 API 작업
- 테스트 추가
- 빌드/인프라 수정

스킬 출력 활용:
- 디자인 방향(Tone, Differentiation)을 Codex SHARED_RULES에 포함
- 타이포/색상/모션 가이드라인을 에이전트별 태스크에 명시
- 금지: 스킬 호출 없이 UX 코드 직접 작성
```

### 실행 모드 선택 기준
| 에이전트 수 | 충돌 위험 | 권장 모드 |
|------------|----------|-----------|
| 1~3개 | 낮음 | Claude 직접 수정 (Edit 도구) |
| 4~11개 | 낮음 | **codex-wave.sh** (CLI 병렬) ★ |
| 4~11개 | 높음 (공유파일 다수) | launch.sh v7 (워크트리 격리) |

### launch.sh / codex-wave.sh 핵심 설정값
```bash
CODEX_MODEL=${CODEX_MODEL:-gpt-5.2}
WAVE_SIZE=${WAVE_SIZE:-4}               # wave 크기 (4개씩 끊어서 중간 검증)
MAX_PARALLEL=${MAX_PARALLEL:-6}          # 빌드 검증 동시 실행 수
TIMEOUT=${CODEX_TIMEOUT:-5400}           # 90분 타임아웃
# 빌드: npm run build (env -u NODE_ENV는 package.json에 내장)
```

### 충돌 방지 규칙
- **1 파일 = 1 에이전트** (agent_task_registry.md에 소유권 명시)
- **공유 파일** (types/dotori.ts, page.tsx 등) → 한 에이전트만 담당
- **MERGE_ORDER** → 인프라/보안 먼저, UI/테스트 마지막

## 토큰 최적화 규칙

### 디버깅 루프 3회 제한 (삽질 토큰 상한)
```
동일 에러 디버깅 시:
  시도 1: 가장 유력한 원인 수정
  시도 2: 다른 접근 (웹 검색, 로그 분석)
  시도 3: 마지막 시도
  → 3회 실패 시 자동 에스컬레이션:
     a) 사용자에게 AskUserQuestion ("3회 시도 실패. 접근 변경 필요")
     b) 현재까지 시도한 내용을 Serena 메모리에 저장
     c) 절대 4회째 같은 접근 반복 금지
```

### 스크린샷 분석 = Sonnet 4.6 위임 ★
```
스크린샷 촬영 후:
  1. Playwright로 6페이지 스크린샷 (375x812, dev 서버 3002)
  2. Task(model=sonnet) 에이전트에 스크린샷 경로 전달
     → Sonnet이 10점 척도 채점 (타이포/색상/모션/레이아웃/깊이감/빈상태)
     → 페이지별 점수 + 전체 평균 + 구체적 개선점 반환
  3. Claude(Opus)는 Sonnet 분석 결과만 소비 (이미지 직접 분석 안 함)
  → 7.0 미만 = 디자인 라운드 강제
  → haiku 사용 금지 (품질 판단 능력 부족)
```

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
- **동일 디버깅 4회 이상 반복** (3회 제한 → 에스컬레이션)
- **Opus로 스크린샷 직접 분석** (Sonnet 위임 필수, haiku 금지)
- **`/frontend-design` 없이 UX/UI 코드 작성** (스킬 선행 호출 필수)
- **TP5 패턴 미적용 디자인 라운드** (5대 패턴 중 최소 2개 적용 계획 필수)
- **Sonnet QA 7.0 미만에서 기능 라운드 진행** (디자인 우선 강제)

## 브랜드 색상
- `color="dotori"` → CTA 브라운
- `color="forest"` → 성공/활성 (Badge 전용, Button 금지)
- `color="amber"` → 카카오 전용 (앱 CTA 사용 금지)

## Git 규칙 (커밋 누락 방지) ★★★

### 근본 원칙: 항상 main 브랜치에서 작업, 항상 커밋+푸시로 마감
```
1. 작업 시작 전: git checkout main && git pull origin main
2. 작업 중: feature branch 사용 금지 (Codex가 만든 branch는 즉시 main merge)
3. 작업 종료 시: 반드시 아래 순서 실행
   a) git add -A (dotori-app 밖의 docs/, brand/, .github/ 포함)
   b) git commit
   c) git push origin main
4. git status 확인 시: 반드시 레포 루트에서 실행 (git -C /home/sihu2129/dotori-ver2 status)
```

### CWD ≠ git root 주의
```
git root:  /home/sihu2129/dotori-ver2           ← 레포 루트
CWD:       /home/sihu2129/dotori-ver2/dotori-app ← Claude Code 작업 디렉토리

⚠️ dotori-app/ 안에서 git status 하면 docs/, brand/, .github/ 변경이 안 보임
⚠️ git add/commit은 항상 레포 루트 기준으로 실행:
   git -C /home/sihu2129/dotori-ver2 add -A
   git -C /home/sihu2129/dotori-ver2 commit -m "..."
   git -C /home/sihu2129/dotori-ver2 push origin main
```

### Codex 에이전트 후처리
```
Codex가 feature branch에서 작업 완료 시:
1. git checkout main && git merge <branch> --no-edit
2. git branch -d <branch>
3. git push origin main
→ feature branch 방치 = 다음 세션에서 "레포 그대로" 원인
```

## 핵심 명령
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run build                    # 빌드 (20 pages)
npm test                         # 테스트 (804개, vitest, 70 test files)
npm run dev                      # 개발 서버

# 스크린샷 + 콘솔 통합 QA
npx tsx scripts/screenshot-check.ts

# Codex wave 병렬 (CLI)
./scripts/codex-wave.sh /tmp/tasks.txt --wave=4

# Git (항상 레포 루트 기준)
git -C /home/sihu2129/dotori-ver2 status        # 전체 상태 확인
git -C /home/sihu2129/dotori-ver2 add -A         # 전체 스테이징
git -C /home/sihu2129/dotori-ver2 push origin main

# 배포 (수동 전용 — 자동 배포 트리거 없음)
gh workflow run deploy.yml                                      # GitHub Actions
doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2  # 직접 doctl
```

## 현재 상태
→ **SSoT**: `dotori-app/.serena/memories/pending_tasks.md`
→ **Stats**: `dotori-app/.serena/memories/project_overview.md`
→ 이 파일에 상태를 중복 기록하지 않는다.

## Strategy v4.0 요약
- **유보통합 선제 대응**: 어린이집+유치원 통합 검색·TO예측·전자서명
- **풀퍼널 매칭**: 탐색 → TO예측 → 견학 → 전자서명 입소계약 (2~3시간 → 10분)
- **5개 공공 API**: 어린이집정보공개포털, 유치원알리미, 표준데이터, 행안부 인구, KOSIS
- **TO 예측 엔진**: `TO = 정원 - 현원 + 예상졸업 - 예상수요 × 시설매력도`
- **전자서명 7종**: Canvas+PDF 자체 + 모두싸인 하이브리드, 감사추적인증서
- **수익 확장**: B2C CPA → B2B SaaS (44K~132K/월) → B2B2B 화이트라벨 → B2G 지자체
- **경쟁**: 도토리(입소 전) ↔ 키즈노트(입소 후) ↔ 한그루(운영), 한그루와 보완 관계
- **상세**: `docs/STRATEGY_v4.0.md` 참조
