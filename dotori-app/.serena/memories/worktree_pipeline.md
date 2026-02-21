# Worktree + Codex 병렬 파이프라인

## 실행 패턴 (Claude Code 지휘)

### Phase 0: 메모리 준비 (Claude Code + Serena)
```bash
# Serena로 공유 컨텍스트 업데이트
# agent_task_registry.md 작업 목록 작성
# 각 에이전트 담당 파일 정의
```

### Phase 1: 워크트리 생성
```bash
# 각 에이전트에 독립 브랜치 생성
git worktree add .worktrees/codex-A -b codex/task-A
git worktree add .worktrees/codex-B -b codex/task-B
git worktree add .worktrees/codex-C -b codex/task-C
```

### Phase 2: Codex 병렬 실행 (run_in_background=true)
```bash
codex exec -s workspace-write --cd .worktrees/codex-A \
  -o /tmp/results/task-A.txt \
  "먼저 .serena/memories/agent_task_registry.md 와 code_style_and_conventions.md 를 읽어라. 그 다음 [작업 내용]" \
  > /tmp/logs/task-A.log 2>&1 &

codex exec -s workspace-write --cd .worktrees/codex-B \
  -o /tmp/results/task-B.txt \
  "먼저 .serena/memories/ 파일들을 읽어라. [작업 내용]" \
  > /tmp/logs/task-B.log 2>&1 &

wait  # 모든 에이전트 완료 대기
```

### Phase 3: 검증 + 머지
```bash
# 각 워크트리에서 빌드 확인
npm run build --prefix .worktrees/codex-A

# 문제 없으면 squash merge
git merge --squash codex/task-A -m "feat: task-A by codex"
git merge --squash codex/task-B -m "feat: task-B by codex"

# 워크트리 정리
git worktree remove .worktrees/codex-A
git branch -d codex/task-A
```

### Phase 4: Serena 메모리 업데이트 (Claude Code)
```
- completed_work_log.md 업데이트
- project_overview.md 현재 상태 반영
- agent_task_registry.md 다음 라운드 준비
```

## Codex 에이전트 프롬프트 템플릿
```
## 작업 전 필수 확인
1. cat .serena/memories/agent_task_registry.md  (담당 파일 확인)
2. cat .serena/memories/code_style_and_conventions.md  (스타일 규칙)
3. cat .serena/memories/project_overview.md  (프로젝트 구조)

## 담당 작업
[여기에 구체적 작업 내용]

## 완료 조건
- npm run build 에서 0 TypeScript 에러
- 담당 파일 외 수정 없음
- Korean UI text 유지
```

## 핵심 규칙
1. **One task = one worktree** (파일 충돌 방지)
2. **Serena memories = 읽기 전용** (Codex는 읽기만, 쓰기는 Claude Code만)
3. **결과는 /tmp/results/ 로** (worktree 밖에 저장)
4. **빌드 검증 필수** (각 워크트리에서 독립적으로)
