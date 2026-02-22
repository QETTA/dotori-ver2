#!/bin/bash
# ㄱ 파이프라인 v6 — Codex 병렬 + Serena Hub + 자동 라운드
# Usage: ./scripts/launch.sh [ROUND] [--skip-build] [--agents=a,b,c]
#   ROUND: 생략 시 git log에서 마지막 rN 자동 감지 + 1
#   --skip-build: pre-flight 빌드 skip (이미 빌드된 경우)
#   --agents=a,b: 특정 에이전트만 실행 (콤마 구분)

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
CODEX_MODEL=${CODEX_MODEL:-gpt-5.2}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
SERENA_HUB_PORT=8765
SERENA_HUB_URL="http://localhost:$SERENA_HUB_PORT"
SERENA_HUB_PID=""
MAX_PARALLEL=${MAX_PARALLEL:-6}          # 빌드 검증 병렬 수 (v5: 4 → v6: 6)
TIMEOUT=${CODEX_TIMEOUT:-5400}           # 90분 (환경변수로 override 가능)
SKIP_BUILD=0

### ── 인수 파싱 ───────────────────────────────────────────────────────────
ROUND=""
CUSTOM_AGENTS=""
for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=1 ;;
    --agents=*)   CUSTOM_AGENTS="${arg#--agents=}" ;;
    r[0-9]*)      ROUND="$arg" ;;
    *)            ;;
  esac
done

# 자동 라운드 감지: git log에서 마지막 feat(rN) 파싱
if [ -z "$ROUND" ]; then
  last_round=$(git -C "$APP" log --oneline | grep -oE '\br[0-9]+\b' | head -1 || echo "r0")
  last_num="${last_round#r}"
  ROUND="r$((last_num + 1))"
fi

RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

### ── 에이전트 목록 ──────────────────────────────────────────────────────
ALL_AGENTS=(polish-login polish-home polish-chat polish-explore polish-community polish-my polish-facility polish-shared polish-waitlist polish-onboarding polish-comp)
MERGE_ORDER=(polish-comp polish-shared polish-login polish-home polish-chat polish-explore polish-community polish-my polish-facility polish-waitlist polish-onboarding)

if [ -n "$CUSTOM_AGENTS" ]; then
  IFS=',' read -ra AGENTS <<< "$CUSTOM_AGENTS"
  MERGE_ORDER=("${AGENTS[@]}")
else
  AGENTS=("${ALL_AGENTS[@]}")
fi

PIDS=()
PASS=()
FAIL=()
declare -A BUILD_PIDS BUILD_LOGS BUILD_EXIT

### ── 컬러 출력 ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; exit 1; }
step() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }
info() { echo "     $1"; }

### ── 공통 컨텍스트 (경량화 — 이미 완성된 규칙 제거) ─────────────────────
SHARED_RULES='## 공통 규칙 (필수)
- Tailwind 스케일 토큰만 사용: text-[Npx] 금지 → text-xs/sm/base/lg/xl
- motion/react만 사용: framer-motion import 금지
- color="dotori" → CTA, color="forest" → 성공 Badge만
- dark: 클래스 = dotori 팔레트 (bg-gray-* 금지)
- touch target: min-h-11 이상
- globals.css / layout.tsx / motion.ts 수정 금지
- Catalyst 컴포넌트(src/components/catalyst/*) 내부 수정 금지
- 담당 파일 외 수정 금지
- npx tsc --noEmit → TypeScript 에러 0개 필수'

### ── 에이전트별 태스크 (라운드 독립적으로 분리) ──────────────────────────
get_task() {
  local agent=$1
  case $agent in
    polish-login)
      echo "src/app/(auth)/login/page.tsx, src/app/(auth)/error.tsx 폴리싱
로그인 페이지: 타이틀 1줄(text-base leading-snug), 카피 간결화, 카카오 버튼 아이콘, footer safe-area.
error.tsx: 에러 메시지 친근하게, CTA full-width."
      ;;
    polish-home)
      echo "src/app/(app)/page.tsx 폴리싱
헤더 safe-area 처리(pt-[max(0.5rem,env(safe-area-inset-top))]), 상태카드 레이블 간결화,
섹션 헤딩 text-base, 빈 상태 CTA full-width."
      ;;
    polish-chat)
      echo "src/app/(app)/chat/page.tsx, src/components/dotori/chat/ChatPromptPanel.tsx 폴리싱
ChatPromptPanel 헤딩 text-xl 1줄, 아바타 h-16 w-16, 칩 min-h-12, 칩 active:scale-[0.97]."
      ;;
    polish-explore)
      echo "src/app/(app)/explore/page.tsx, src/components/dotori/explore/ExploreSearchHeader.tsx 폴리싱
헤딩 text-xl, 시나리오 칩 active:scale-[0.97], 필터 버튼 레이블 명확화, emoji 제거."
      ;;
    polish-community)
      echo "src/app/(app)/community/page.tsx, src/app/(app)/community/[id]/page.tsx 폴리싱
카드 space-y-3, 탭 min-h-11, 댓글 입력창 하단 고정 glass-sheet, FAB h-14 w-14."
      ;;
    polish-my)
      echo "src/app/(app)/my/page.tsx, src/app/(app)/my/settings/page.tsx 폴리싱
프로필 헤더 Surface 사용, 메뉴 항목 min-h-12, 설정 다크모드 세그먼트 컨트롤."
      ;;
    polish-facility)
      echo "src/app/(app)/facility/[id]/FacilityDetailClient.tsx, src/components/dotori/facility/*.tsx 폴리싱
정원 숫자 text-2xl font-bold, CTA min-h-12 w-full, 플레이스홀더 bg-dotori-100."
      ;;
    polish-shared)
      echo "src/components/dotori/AiBriefingCard.tsx, UsageCounter.tsx, EmptyState.tsx, ErrorState.tsx, Toast.tsx, ActionConfirmSheet.tsx 폴리싱
glass-sheet 효과 확인, Toast 성공/에러 컬러, EmptyState CTA full-width."
      ;;
    polish-waitlist)
      echo "src/app/(app)/my/waitlist/page.tsx, waitlist/[id]/page.tsx, my/notifications/page.tsx, my/interests/page.tsx 폴리싱
대기 순위 text-4xl font-bold, 읽지않은 알림 border-l-4 border-l-dotori-400, 빈 상태 CTA."
      ;;
    polish-onboarding)
      echo "src/app/(onboarding)/onboarding/page.tsx 폴리싱
진행 바 dotori-400, 선택 버튼 ring-2 ring-dotori-400 선택 상태, CTA w-full min-h-12."
      ;;
    polish-comp)
      echo "src/components/dotori/FacilityCard.tsx, Skeleton.tsx, blocks/*.tsx 폴리싱
FacilityCard compact: 시설명 font-semibold, 빈자리 text-forest-700, 스켈레톤 dark:bg-dotori-800/60."
      ;;
    *)
      echo "agent_task_registry.md 에서 $agent 담당 작업을 확인해라."
      ;;
  esac
}

### ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
printf "${BLUE}║  ㄱ 파이프라인 v6 — ROUND: %-17s║${NC}\n" "$ROUND"
printf "${BLUE}║  에이전트: %-32s║${NC}\n" "${#AGENTS[@]}개 / skip-build: $SKIP_BUILD"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
info "모델: $CODEX_MODEL  |  타임아웃: ${TIMEOUT}s  |  빌드병렬: ${MAX_PARALLEL}"

### ═══ PHASE 0: PRE-FLIGHT ════════════════════════════════════════════
step "PHASE 0: PRE-FLIGHT"
cd "$APP"

if [ "$SKIP_BUILD" -eq 1 ]; then
  warn "pre-flight 빌드 skip (--skip-build)"
else
  echo "  [0a] npm run build..."
  BUILD_LOG=$(mktemp)
  if npm run build > "$BUILD_LOG" 2>&1; then
    ok "Build OK"
  else
    tail -20 "$BUILD_LOG"; rm -f "$BUILD_LOG"
    fail "빌드 실패 — launch 중단"
  fi
  rm -f "$BUILD_LOG"

  LINT_LOG=$(mktemp)
  npm run lint > "$LINT_LOG" 2>&1 || true
  LINT_ERR=$(grep -c " error " "$LINT_LOG" 2>/dev/null || echo "0")
  rm -f "$LINT_LOG"
  [ "$LINT_ERR" -gt 0 ] && warn "ESLint errors: ${LINT_ERR}개" || ok "ESLint clean"

  npm test -- --run > /dev/null 2>&1 && ok "Tests passed" || warn "Tests 불안정"
fi

echo "  [0b] 스테일 워크트리 정리..."
git -C "$REPO" worktree prune 2>/dev/null || true
for AGENT in "${AGENTS[@]}"; do
  if [ -d "$WT_BASE/$ROUND-$AGENT" ]; then
    warn "스테일 제거: $ROUND-$AGENT"
    git -C "$REPO" worktree remove --force "$WT_BASE/$ROUND-$AGENT" 2>/dev/null || true
    git -C "$REPO" branch -D "codex/$ROUND-$AGENT" 2>/dev/null || true
  fi
done
ok "워크트리 정리 완료"

mkdir -p "$RESULTS" "$LOGS"
ok "디렉토리: $RESULTS, $LOGS"

### ═══ PHASE 0.5: Serena HTTP Hub 시작 ════════════════════════════════
step "PHASE 0.5: Serena HTTP Hub ($SERENA_HUB_URL)"

lsof -ti :$SERENA_HUB_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

uvx --from git+https://github.com/oraios/serena serena start-mcp-server \
  --project "$APP" \
  --transport streamable-http \
  --port "$SERENA_HUB_PORT" \
  --enable-web-dashboard false \
  --open-web-dashboard false \
  > "$LOGS/serena-hub.log" 2>&1 &
SERENA_HUB_PID=$!

# 최대 20초 대기
SERENA_READY=0
for i in $(seq 1 20); do
  sleep 1
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$SERENA_HUB_URL/mcp" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"launch","version":"1"}}}' \
    2>/dev/null || echo "0")
  if [ "$HTTP_CODE" = "200" ]; then
    ok "Serena Hub 준비 완료 (${i}초)"
    SERENA_READY=1
    break
  fi
done
[ $SERENA_READY -eq 0 ] && warn "Serena Hub 없음 — cat 폴백 모드로 진행"

### ═══ PHASE 1: 워크트리 병렬 생성 (v6 개선: 순차→병렬) ════════════════
step "PHASE 1: 워크트리 병렬 생성 (${#AGENTS[@]}개)"
mkdir -p "$WT_BASE"

WT_PIDS=()
for AGENT in "${AGENTS[@]}"; do
  (
    if git -C "$REPO" worktree add "$WT_BASE/$ROUND-$AGENT" -b "codex/$ROUND-$AGENT" 2>/dev/null; then
      WT_APP_DIR="$WT_BASE/$ROUND-$AGENT/dotori-app"
      cp "$APP/.env.local" "$WT_APP_DIR/.env.local" 2>/dev/null || true
      cp -al "$APP/node_modules" "$WT_APP_DIR/node_modules" 2>/dev/null || true
      chmod -R 777 "$WT_BASE/$ROUND-$AGENT/" 2>/dev/null || true
      echo "✅ $ROUND-$AGENT"
    else
      echo "❌ $ROUND-$AGENT 생성 실패"
    fi
  ) &
  WT_PIDS+=($!)
done
wait "${WT_PIDS[@]}"
ok "모든 워크트리 생성 완료"

### ═══ PHASE 2: Codex 병렬 발사 ══════════════════════════════════════
step "PHASE 2: Codex ${#AGENTS[@]}개 병렬 발사"

# Serena Hub fallback 지시 (Hub 미응답 시 cat 사용)
if [ "$SERENA_READY" -eq 1 ]; then
  MEMORY_HEADER="## 메모리 읽기 (Serena Hub):
  python3 scripts/serena-hub.py read_memory project_overview.md
  python3 scripts/serena-hub.py read_memory code_style_and_conventions.md
  python3 scripts/serena-hub.py read_memory agent_task_registry.md"
else
  MEMORY_HEADER="## 메모리 읽기 (cat 폴백 — Hub 없음):
  cat .serena/memories/project_overview.md
  cat .serena/memories/code_style_and_conventions.md
  cat .serena/memories/agent_task_registry.md"
fi

for AGENT in "${AGENTS[@]}"; do
  WT_APP="$WT_BASE/$ROUND-$AGENT/dotori-app"
  TASK_TEXT=$(get_task "$AGENT")

  PROMPT="${MEMORY_HEADER}

## 담당 작업 ($ROUND-$AGENT)
${TASK_TEXT}

${SHARED_RULES}

## 완료 순서
1. 위 메모리 파일 읽기 (컨텍스트 파악)
2. 담당 파일 읽기 (find_symbol 또는 cat)
3. 수정 실행
4. npx tsc --noEmit 에러 0개 확인
5. 파일 저장 완료 (git add/commit은 launch.sh가 처리)"

  codex exec -m "$CODEX_MODEL" -s workspace-write \
    --cd "$WT_APP" \
    -o "$RESULTS/$AGENT.txt" \
    "$PROMPT" \
    > "$LOGS/$AGENT.log" 2>&1 &

  PIDS+=($!)
  echo -e "  🚀 ${GREEN}$ROUND-$AGENT${NC} (PID: ${PIDS[-1]})"
done

ok "${#AGENTS[@]}개 에이전트 발사 완료"

### ═══ PHASE 3: 완료 대기 + 진행 모니터 ═════════════════════════════
step "PHASE 3: 완료 대기 (타임아웃: ${TIMEOUT}s)"

# 워치독: 타임아웃 초과 시 강제 종료
( sleep $TIMEOUT && echo "⏰ 타임아웃 — 강제 종료" && kill "${PIDS[@]}" 2>/dev/null ) &
WATCHDOG=$!

# 진행 상황 폴링 (10초마다 완료 수 표시)
(
  START_TS=$(date +%s)
  while true; do
    sleep 10
    DONE=0
    for pid in "${PIDS[@]}"; do
      kill -0 "$pid" 2>/dev/null || DONE=$((DONE + 1))
    done
    ELAPSED=$(( $(date +%s) - START_TS ))
    printf "\r     진행: %d/%d 완료  (%ds 경과)   " "$DONE" "${#PIDS[@]}" "$ELAPSED"
  done
) &
MONITOR_PID=$!

for i in "${!PIDS[@]}"; do
  wait "${PIDS[$i]}" 2>/dev/null
  echo "  ✓ ${AGENTS[$i]}"
done

kill "$WATCHDOG" "$MONITOR_PID" 2>/dev/null || true
echo ""
ok "모든 에이전트 완료"

### ── 에이전트 변경사항 자동 커밋 ───
info "에이전트 변경사항 커밋..."
for AGENT in "${AGENTS[@]}"; do
  WT_DIR="$WT_BASE/$ROUND-$AGENT"
  printf "  %-28s" "$AGENT"
  CHANGES=$(git -C "$WT_DIR" status --porcelain 2>/dev/null | wc -l || echo "0")
  if [[ "$CHANGES" -gt 0 ]]; then
    git -C "$WT_DIR" add -A 2>/dev/null
    git -C "$WT_DIR" commit -m "feat($ROUND-$AGENT): 폴리싱" 2>/dev/null \
      && echo "✅ (${CHANGES}파일)" || echo "❌ commit 실패"
  else
    echo "⚠️  변경없음"
  fi
done

### ── 빌드 검증 병렬 (v6 개선: exit code 캡처 버그 수정) ─────────────
echo ""
info "빌드 검증 (MAX_PARALLEL=${MAX_PARALLEL})..."
RUNNING_COUNT=0

for AGENT in "${AGENTS[@]}"; do
  WT_APP="$WT_BASE/$ROUND-$AGENT/dotori-app"
  WT_BUILD_LOG=$(mktemp)
  BUILD_LOGS[$AGENT]="$WT_BUILD_LOG"
  (cd "$WT_APP" && npm run build > "$WT_BUILD_LOG" 2>&1; echo $? > "${WT_BUILD_LOG}.exit") &
  BUILD_PIDS[$AGENT]=$!
  RUNNING_COUNT=$((RUNNING_COUNT + 1))
  # MAX_PARALLEL 도달 시 가장 오래된 job 완료 대기
  if [[ "$RUNNING_COUNT" -ge "$MAX_PARALLEL" ]]; then
    wait -n 2>/dev/null || wait
    RUNNING_COUNT=$((RUNNING_COUNT - 1))
  fi
done
# 나머지 전부 완료 대기
wait

for AGENT in "${AGENTS[@]}"; do
  WT_BUILD_LOG="${BUILD_LOGS[$AGENT]}"
  EXIT_CODE=$(cat "${WT_BUILD_LOG}.exit" 2>/dev/null || echo "1")
  printf "  %-28s" "$AGENT"
  if [ "$EXIT_CODE" -eq 0 ]; then
    PASS+=("$AGENT"); echo "✅"
  else
    FAIL+=("$AGENT"); echo "❌ → $LOGS/$AGENT.log"
  fi
  rm -f "$WT_BUILD_LOG" "${WT_BUILD_LOG}.exit"
done

ok  "Pass: ${#PASS[@]}  /  Fail: ${#FAIL[@]}"
[ "${#FAIL[@]}" -gt 0 ] && warn "실패: ${FAIL[*]}"

### ═══ PHASE 4: Squash Merge ═════════════════════════════════════════
step "PHASE 4: Squash Merge"
cd "$APP"
MERGED=(); SKIPPED=()

for AGENT in "${MERGE_ORDER[@]}"; do
  # MERGE_ORDER에 없는 에이전트 건너뜀
  [[ " ${AGENTS[*]} " != *" $AGENT "* ]] && continue
  printf "  %-28s" "Merging $ROUND-$AGENT..."

  if [[ " ${FAIL[*]} " == *" $AGENT "* ]]; then
    SKIPPED+=("$AGENT"); echo "⏭️  skip (빌드 실패)"; continue
  fi

  COMMIT_COUNT=$(git -C "$WT_BASE/$ROUND-$AGENT" log --oneline \
    "HEAD...$(git -C "$REPO" rev-parse HEAD)" 2>/dev/null | wc -l || echo "0")
  if [ "$COMMIT_COUNT" -eq 0 ]; then
    SKIPPED+=("$AGENT"); echo "⏭️  skip (커밋 없음)"; continue
  fi

  if git merge --squash "codex/$ROUND-$AGENT" 2>/dev/null; then
    git commit -m "feat($ROUND-$AGENT): 폴리싱

Co-Authored-By: Codex <noreply@openai.com>" 2>/dev/null || true
    MERGED+=("$AGENT"); echo "✅"
  else
    # v6 개선: abort 후 restore로 unstaged 잔재 제거
    git merge --abort 2>/dev/null || true
    git restore . 2>/dev/null || true
    SKIPPED+=("$AGENT"); warn "Conflict — 수동 처리 필요"
  fi
done

ok  "Merged: ${#MERGED[@]}  /  Skipped: ${#SKIPPED[@]}"

### ═══ PHASE 5: 최종 검증 + 정리 ════════════════════════════════════
step "PHASE 5: 최종 검증 + 정리"
cd "$APP"

echo "  최종 빌드..."
npm run build 2>&1 | tail -3
npm test -- --run 2>&1 | grep -E "Tests:|test files" | tail -2

# ─── 에이전트 노트 집계 (Hub 종료 전에 실행) ───────────────────────
if [ "$SERENA_READY" -eq 1 ]; then
  info "에이전트 노트 집계 → Serena 메모리..."
  NOTES_SUMMARY=""
  for AGENT in "${AGENTS[@]}"; do
    NOTE=$(python3 "$APP/scripts/serena-hub.py" read_memory "$ROUND-$AGENT-notes.md" 2>/dev/null || echo "")
    if [ -n "$NOTE" ] && [[ "$NOTE" != *"not found"* ]] && [[ "$NOTE" != *"ERROR"* ]]; then
      NOTES_SUMMARY="${NOTES_SUMMARY}\n### $AGENT\n${NOTE}\n"
    fi
  done
  if [ -n "$NOTES_SUMMARY" ]; then
    python3 "$APP/scripts/serena-hub.py" write_memory "$ROUND-summary.md" \
      "# $ROUND 에이전트 요약 ($(date '+%Y-%m-%d %H:%M'))\n\n${NOTES_SUMMARY}" 2>/dev/null || true
    ok "에이전트 노트 저장 → $ROUND-summary.md"
  fi
fi

# ─── Serena Hub 종료 (노트 집계 이후) ──────────────────────────────
if [ -n "$SERENA_HUB_PID" ]; then
  kill "$SERENA_HUB_PID" 2>/dev/null || true
  lsof -ti :$SERENA_HUB_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
  ok "Serena Hub 종료"
fi

# ─── 워크트리 정리 (병렬) ──────────────────────────────────────────
WT_CLEAN_PIDS=()
for AGENT in "${AGENTS[@]}"; do
  (
    git -C "$REPO" worktree remove --force "$WT_BASE/$ROUND-$AGENT" 2>/dev/null || true
    git -C "$REPO" branch -D "codex/$ROUND-$AGENT" 2>/dev/null || true
  ) &
  WT_CLEAN_PIDS+=($!)
done
wait "${WT_CLEAN_PIDS[@]}"
git -C "$REPO" worktree prune 2>/dev/null || true
ok "워크트리 정리 완료"

### ═══ 최종 리포트 ═══════════════════════════════════════════════════
ELAPSED_TOTAL=$(( $(date +%s) - $(date -d "now -${TIMEOUT}s" +%s 2>/dev/null || echo 0) ))
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
printf "${BLUE}║  %-44s║${NC}\n" "$ROUND 완료 — v6 파이프라인"
printf "${BLUE}║  Merged %-3d  Failed %-3d  Skipped %-12s║${NC}\n" "${#MERGED[@]}" "${#FAIL[@]}" "${#SKIPPED[@]}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "  다음 단계:"
echo "  git push origin main"
echo "  doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2"
echo ""
