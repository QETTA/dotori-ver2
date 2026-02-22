# Worktree + Codex 병렬 파이프라인 (2026-02-22, R13 확정)

## 핵심 구조
```
REPO root:  /home/sihu2129/dotori-ver2          ← git root
App 위치:   /home/sihu2129/dotori-ver2/dotori-app ← Next.js app
워크트리:   /home/sihu2129/dotori-ver2/.worktrees/rN-AGENT/
앱 in WT:   /home/sihu2129/dotori-ver2/.worktrees/rN-AGENT/dotori-app/
```

> git root ≠ app root. 워크트리 생성: `git -C $REPO`, Codex 실행: `--cd $WT/dotori-app`

## 실행 방법

모든 파이프라인은 `scripts/launch.sh`로 자동화되어 있음:

```bash
cd /home/sihu2129/dotori-ver2/dotori-app
./scripts/launch.sh rN
```

launch.sh가 처리하는 것:
1. Pre-flight 빌드 검증
2. 워크트리 생성 + node_modules 하드링크 + .env.local 복사
3. Codex 에이전트 병렬 발사
4. 완료 대기 + 자동 커밋
5. 빌드 검증 (MAX_PARALLEL=4 병렬)
6. Squash merge (MERGE_ORDER 순서)
7. 최종 빌드 + 워크트리 정리

## launch.sh 핵심 설정

```bash
CODEX_MODEL=${CODEX_MODEL:-gpt-5.3-codex}  # spark 한도 시 교체
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
MAX_PARALLEL=4    # 빌드 검증 동시 수
TIMEOUT=5400      # 90분 타임아웃
```

## 핵심 규칙 (R8~R13 검증 완료)

1. **1 파일 = 1 에이전트** (파일 충돌 방지, agent_task_registry.md에 명시)
2. **Serena memories = Codex는 읽기 전용** (Claude Code만 쓰기)
3. **node_modules = `cp -al` 하드링크** (symlink은 Turbopack 거부)
4. **git commit = launch.sh에서 처리** (Codex sandbox workspace-write는 .git/worktrees/ 접근 불가)
5. **빌드 체크 = temp file** (`| grep` 파이프 → 항상 false, mktemp 사용)
6. **MERGE_ORDER** → 인프라/보안 먼저, UI/테스트 마지막
7. **commit prefix**: 기능 = `feat()`, 보안 = `fix()`, 리팩토링 = `refactor()`

## 병목 분석 (R13 실측)

| 단계 | 시간 | 비고 |
|------|------|------|
| Pre-flight build | ~19s | 무시 가능 |
| cp -al × 11 | ~19s | 무시 가능 |
| 에이전트 대기 | 30~180s | 모델 속도 |
| 빌드 검증 (4병렬) | ~40s | MAX_PARALLEL=4 |
| 머지 × 11 | ~10s | 무시 가능 |
| 최종 빌드 + 정리 | ~20s | 무시 가능 |

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Codex 파일 못 찾음 | --cd 경로 오류 | `dotori-app/` 서브디렉토리 확인 |
| 빌드 실패 (env) | .env.local 없음 | launch.sh가 자동 복사 |
| Symlink invalid | ln -sf 사용 | cp -al 사용 |
| git commit denied | Codex sandbox | launch.sh에서 처리 |
| 스테일 워크트리 | 이전 잔재 | `git worktree prune` |
| Merge conflict | 파일 충돌 | agent_task_registry.md 확인 |
