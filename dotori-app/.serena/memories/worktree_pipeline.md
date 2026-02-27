# Worktree + Codex 병렬 파이프라인 (v8, R51 기준)

## 핵심 구조
```
REPO root:  /home/sihu2129/dotori-ver2          ← git root
App 위치:   /home/sihu2129/dotori-ver2/dotori-app ← Next.js app
워크트리:   /home/sihu2129/dotori-ver2/.worktrees/rN-AGENT/
```

## 실행 방법

### codex-wave.sh (CLI 병렬, 4~11 에이전트) ★ 권장
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
./scripts/codex-wave.sh /tmp/tasks.txt --wave=4
```

### launch.sh v7 (워크트리 격리, 11+ 에이전트)
```bash
./scripts/launch.sh rN
```

## 핵심 설정
```bash
CODEX_MODEL=${CODEX_MODEL:-gpt-5.2}
WAVE_SIZE=${WAVE_SIZE:-4}
MAX_PARALLEL=${MAX_PARALLEL:-6}
TIMEOUT=${CODEX_TIMEOUT:-5400}  # 90분
```

## 핵심 규칙
1. **1 파일 = 1 에이전트** (파일 충돌 방지)
2. **Serena memories = Codex 읽기 전용** (Claude Code만 쓰기)
3. **node_modules = `cp -al` 하드링크** (symlink은 Turbopack 거부)
4. **MERGE_ORDER** → 인프라/보안 먼저, UI/테스트 마지막
5. **빌드 체크** = temp file (mktemp 사용, pipe | grep 금지)

## 트러블슈팅
| 증상 | 해결 |
|------|------|
| Codex 파일 못 찾음 | `dotori-app/` 서브디렉토리 확인 |
| 빌드 실패 (env) | .env.local 자동 복사 확인 |
| git commit denied | launch.sh에서 처리 |
| 스테일 워크트리 | `git worktree prune` |
| Merge conflict | agent_task_registry.md 확인 |
