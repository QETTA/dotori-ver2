# CLAUDE.md — Dotori V2 Workspace

## 구조
```
dotori-ver2/
├── dotori-app/   ★ 메인앱 (항상 여기서 작업)
├── brand/        브랜드 에셋 SVG
├── docs/         사양서
└── .claude/      MCP 설정
```

## 에이전트 아키텍처 (2026-02-22 확정)

```
Claude Code (지휘관)
├── Serena MCP    → 코드 인텔리전스 + 에이전트 공유 메모리 허브
├── Git Worktrees → 각 Codex 에이전트 격리 실행 공간
├── Codex CLI     → 코드 구현 에이전트 (codex exec, 병렬 최대 11개)
└── Plugins       → 리뷰/커밋/리팩토링 자동화 (Claude Code 전용)
```

### 역할 분담
| 작업 유형 | 담당 |
|-----------|------|
| 코드 생성/리팩토링/버그 수정 | **Codex** (워크트리) |
| 코드 분석/심볼 검색/타입 확인 | **Serena** |
| 머지 전 코드 리뷰 | **pr-review-toolkit** 플러그인 |
| 커밋/PR 생성 | **commit-commands** 플러그인 |
| UI 컴포넌트 설계 | **frontend-excellence** 플러그인 |
| 1-2줄 직접 수정 | Claude (Edit 도구) |
| 파일 탐색/검색 | Claude (Glob/Grep) |
| git/배포/빌드 검증 | Claude (Bash) |
| 아키텍처 결정/설계 | Claude (대화) |

### 설치된 플러그인
| 플러그인 | 사용 시점 |
|---------|---------|
| `frontend-design` | UI 컴포넌트 제작 |
| `frontend-excellence` | React 19/Next.js 패턴 |
| `pr-review-toolkit` | Codex 머지 전 리뷰 (Phase 3) |
| `commit-commands` | 스쿼시 머지 커밋 (Phase 4) |
| `code-refactoring` | 리팩토링 필요 시 |

## Codex 워크트리 병렬 파이프라인

### 실행 방법 (Bash run_in_background=true)
```bash
# 1. 워크트리 생성
git -C /home/sihu2129/dotori-ver2/dotori-app worktree add \
  .worktrees/codex-A -b codex/task-A

# 2. 병렬 실행 (승인 없이)
codex exec -s workspace-write \
  --cd /home/sihu2129/dotori-ver2/dotori-app/.worktrees/codex-A \
  -o /tmp/results/task-A.txt \
  "먼저 .serena/memories/ 파일 읽기: project_overview.md, code_style_and_conventions.md, agent_task_registry.md. 그 다음: [작업]" \
  > /tmp/logs/task-A.log 2>&1 &

# 3. 머지
git -C /home/sihu2129/dotori-ver2/dotori-app merge --squash codex/task-A

# 4. 워크트리 정리
git -C /home/sihu2129/dotori-ver2/dotori-app worktree remove .worktrees/codex-A
git -C /home/sihu2129/dotori-ver2/dotori-app branch -d codex/task-A
```

### Codex 프롬프트 필수 헤더
```
먼저 이 파일들을 읽어라:
- cat .serena/memories/project_overview.md
- cat .serena/memories/code_style_and_conventions.md
- cat .serena/memories/agent_task_registry.md

담당 파일만 수정. npm run build 0에러 확인 필수.
```

## Serena 메모리 허브

```
.serena/memories/
├── project_overview.md         ← 프로젝트 구조/현재 상태
├── code_style_and_conventions.md ← 코딩 컨벤션 (필수 준수)
├── agent_task_registry.md      ← 에이전트 파일 소유권 맵
└── worktree_pipeline.md        ← 파이프라인 가이드
```

**Serena 메모리 = 에이전트 간 공유 컨텍스트**
- Claude Code만 메모리 쓰기 (Codex는 읽기만)
- 새 작업 라운드 시작 전 `agent_task_registry.md` 업데이트

## MCP 서버
| 서버 | 용도 |
|------|------|
| **serena** | TypeScript LSP + 에이전트 메모리 허브 ★ |
| **codex** | gpt-5.3-codex-spark (백그라운드 Bash CLI 사용) |
| context7 | 라이브러리 문서 |
| mongodb | Atlas readOnly |
| playwright | 브라우저 자동화 |

## DB 현황 (2026-02-22)
- MongoDB: `dotori` DB 단독 (kidsmap 레거시 삭제 완료)
- `dotori.facilities`: 20,027 시설 (17개 시도)
- URI: `kidsmap.wdmgq0i.mongodb.net/dotori?appName=dotori`

## 핵심 명령
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run dev        # 개발 서버
npm run build      # 빌드 (45페이지)
npm run screenshot # 스크린샷
```

## 브랜드 색상
- `color="dotori"` → CTA 브라운
- `color="forest"` → 성공/활성
- `color="amber"` → 카카오 전용 (앱 CTA 사용 금지)

## 축약어
| 입력 | 동작 |
|------|------|
| `ㄱ` | 스크린샷→비전평가→태스크재편→Codex(11)병렬→pr-review→머지→빌드→리포트 |
| `ㄱㄱ` | 위 사이클 반복 |
| `ㅂ` | 빌드 검증만 |
| `ㅅ` | 스크린샷 + Claude 비전 평가 |

## ㄱ 전체 파이프라인 (비전 평가 통합)
```
[Pre] ㅅ: ./scripts/vision-eval.sh → Claude Read 스크린샷 → 비전 평가
         → 개선 항목 도출 → agent_task_registry.md 업데이트

[Run] ㄱ: ./scripts/launch.sh r6
  Phase 0: Pre-flight (빌드확인 + ESLint + 스테일 워크트리 정리)
  Phase 1: 11개 워크트리 생성 (.env.local 복사 + chmod 777)
  Phase 2: Codex 11개 병렬 발사 (각자 git commit)
  Phase 3: 빌드 검증 → /pr-review-toolkit 리뷰
  Phase 4: Squash Merge → /commit-commands
  Phase 5: 최종 빌드 + 정리 + 메모리 업데이트

[Post] ㅅ: 다시 스크린샷 → 비전 비교 평가 → ㄱㄱ 반복

# 모니터링
./scripts/wt-monitor.sh r6 --watch
```

## 비전 평가 관점 (ㅅ 실행 시 자동 적용)
1. 브랜드 일관성 — dotori 색상 조합, 촌스러움 여부
2. 수익화 CTA — 프리미엄 유도, 업그레이드 버튼 가시성
3. 모바일 UX — 375px, 터치 타겟 44px, 가독성
4. 전환 퍼널 — 각 화면의 다음 액션 명확성
5. 비즈니스 목표 달성도

**원칙: ㅅ 비전평가 → Serena 컨텍스트 → Codex(11) 구현 → 플러그인 리뷰 → 배포 → 반복**
