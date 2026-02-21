# Worktree + Codex 병렬 파이프라인 v2 (2026-02-22) — R8 버전

## 핵심 구조 (반드시 숙지)
```
REPO root:  /home/sihu2129/dotori-ver2          ← git root
App 위치:   /home/sihu2129/dotori-ver2/dotori-app ← Next.js app (subdirectory!)
워크트리:   /home/sihu2129/dotori-ver2/.worktrees/r6-AGENT/
앱 in WT:   /home/sihu2129/dotori-ver2/.worktrees/r6-AGENT/dotori-app/
```

> ⚠️ git root ≠ app root. 워크트리 생성: `git -C $REPO`, Codex 실행: `--cd $WT/dotori-app`

## 설치된 Claude Code 플러그인 (파이프라인 사용 시점)
| 플러그인 | 사용 시점 |
|---------|---------|
| `frontend-design` | Phase 0: UI 작업 설계 전 |
| `frontend-excellence` | Phase 0: React 19/Next.js 패턴 확인 |
| `pr-review-toolkit` | Phase 3 이후: 머지 전 코드 리뷰 |
| `commit-commands` | Phase 4: 스쿼시 머지 커밋 |
| `code-refactoring` | Phase 3: 빌드 실패 에이전트 수동 수정 시 |

> Codex 에이전트는 플러그인 사용 불가. 플러그인은 Claude Code 단계에서만.

## 빠른 실행 (ㄱ 입력 시)
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
./scripts/launch.sh r6
# 진행 모니터링 (별도 터미널):
./scripts/wt-monitor.sh r6 --watch
```

## Phase 0: Pre-flight 체크리스트
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run build     # ✅ 필수: 0 errors
npm test          # ✅ 권장: 29 tests pass
npm run lint      # ℹ️ 정보: errors 수 확인
git status        # ℹ️ 미커밋 변경 확인
git worktree prune # 스테일 워크트리 정리
```

## Phase 1: 워크트리 생성 (11개)
```bash
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
ROUND=r6

# 일괄 생성
for AGENT in eslint auth service-facility service-community api-middleware env explore-fix home-data landing-cta geocode infra; do
  git -C $REPO worktree add "$REPO/.worktrees/$ROUND-$AGENT" -b "codex/$ROUND-$AGENT"
  cp $APP/.env.local $REPO/.worktrees/$ROUND-$AGENT/dotori-app/.env.local
  chmod -R 777 $REPO/.git/worktrees/$ROUND-$AGENT/
done
```

**중요**: `.env.local` 복사 필수 (빌드에 환경변수 필요). `chmod 777` 필수 (Codex 쓰기 권한).

## Phase 2: Codex 발사 패턴
```bash
PROMPT="먼저 이 파일들을 읽어라:
  cat .serena/memories/project_overview.md
  cat .serena/memories/code_style_and_conventions.md
  cat .serena/memories/agent_task_registry.md

## 담당 작업
[작업 내용]

## 완료 조건
1. 담당 파일 외 수정 금지
2. npm run build — 0 TypeScript 에러 확인 (필수)
3. 한국어 UI 유지, framer-motion 금지
4. git add -A && git commit -m 'feat(r6-AGENT): [요약]'"

codex exec -s workspace-write \
  --cd $REPO/.worktrees/$ROUND-$AGENT/dotori-app \
  -o /tmp/results/$ROUND/$AGENT.txt \
  "$PROMPT" \
  > /tmp/logs/$ROUND/$AGENT.log 2>&1 &
```

## Phase 3: 검증 (빌드 + 플러그인 리뷰)
```bash
# 각 워크트리 빌드
for AGENT in ...; do
  npm run build --prefix $REPO/.worktrees/$ROUND-$AGENT/dotori-app 2>&1 | grep -E "✓|error"
done
# 빌드 통과 후 → /pr-review-toolkit 으로 diff 리뷰
```

## Phase 4: Squash Merge 순서
```
infra → eslint → env → api-middleware → auth →
service-facility → service-community →
explore-fix → geocode → home-data → landing-cta
```
(인프라 먼저, UI 마지막 — 의존성 충돌 최소화)

## Phase 5: 정리
```bash
for AGENT in ...; do
  git -C $REPO worktree remove --force $REPO/.worktrees/$ROUND-$AGENT
  git -C $REPO branch -D codex/$ROUND-$AGENT
done
git -C $REPO worktree prune
npm run build  # 최종 확인
```

## 핵심 규칙 (R8 검증 완료)
1. **One task = one worktree** (파일 충돌 방지)
2. **Serena memories = 읽기 전용** (Codex는 읽기, Claude Code만 쓰기)
3. **플러그인은 Claude Code 단계에서만** (Phase 3~4)
4. **git root vs app root 혼동 금지**
5. **.env.local 복사 필수** (각 워크트리마다)
6. **node_modules = `cp -al` 하드링크** (symlink는 Turbopack이 거부 — R7 교훈)
7. **git commit은 launch.sh에서 처리** (Codex sandbox workspace-write는 .git/worktrees/ 접근 불가 — R7 교훈)
8. **빌드 체크 = temp file** (`npm run build | grep` 파이프 버그 → 항상 false 반환)
9. **타임아웃 90분** (장시간 hang 방지)

## 병목 분석 (R8 실측 — 2026-02-22)
| 단계 | 시간 | 병목? |
|------|------|-------|
| Phase 0: pre-flight build | ~19s | 무시 가능 |
| Phase 1: cp -al × 11 | ~19s (1.7s/개) | 무시 가능 |
| Phase 2: 에이전트 발사 | <1s | 없음 |
| Phase 3: 에이전트 대기 | gpt-5.3-spark는 30-120s | 모델 속도에 따름 |
| Phase 3: 자동 커밋 × 11 | ~5s | 없음 |
| **Phase 3: 빌드 검증 × 11 순차** | **~19s × 11 = 3.5분** | **★ 최대 병목** |
| Phase 4: 머지 × 11 | ~10s | 없음 |
| Phase 5: 최종 빌드 + 정리 | ~20s | 없음 |

**핵심**: 에이전트(gpt-5.3-spark)는 빠르지만 11개 순차 빌드가 병목.
**R8 이후 해결**: launch.sh Phase 3 빌드 검증을 `MAX_PARALLEL=4` 병렬 실행으로 변경 → 3.5분 → ~40초.

## Phase 1 중요 (R8 확정):
```bash
# node_modules: symlink 금지, 하드링크 사용
cp -al "$APP/node_modules" "$WT_APP_DIR/node_modules"  # ~1.7초/워크트리

# git commit: Codex 프롬프트에서 제거, launch.sh에서 자동 처리
git -C "$WT_DIR" add -A && git -C "$WT_DIR" commit -m "feat($ROUND-$AGENT): ..."
```

## 트러블슈팅
| 증상 | 원인 | 해결 |
|------|------|------|
| Codex가 파일 못 찾음 | --cd 경로 오류 | `dotori-app/` 서브디렉토리 확인 |
| 빌드 실패 (env 에러) | .env.local 없음 | `cp .env.local .worktrees/.../dotori-app/` |
| `Symlink node_modules invalid` | ln -sf 사용 | `cp -al $APP/node_modules $WT/node_modules` |
| git commit permission denied | Codex sandbox 차단 | launch.sh에서 git commit (sandbox 외부) |
| 빌드 체크 항상 실패 | `\| grep` 파이프 | `mktemp` 파일로 빌드 출력 → grep |
| 스테일 워크트리 에러 | 이전 실행 잔재 | `git worktree prune && git branch -D codex/$NAME` |
| Merge conflict | 파일 소유권 충돌 | agent_task_registry.md 파일 배분 확인 |
