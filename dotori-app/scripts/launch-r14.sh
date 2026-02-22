#!/bin/bash
# ㄱ 파이프라인 R14 — 불일치 해소 + 대규모 최적화
# Usage: ./scripts/launch-r14.sh [ROUND=r14] [MODEL=gpt-5.3-codex]
# Example: CODEX_MODEL=gpt-5.3-codex ./scripts/launch-r14.sh r14

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r14}
CODEX_MODEL=${CODEX_MODEL:-gpt-5.3-codex}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(
  motion-stability
  console-hardening
  explore-structure
  facility-structure
  chat-structure
  explore-ux-token
  facility-ux-token
  chat-ux-token
  color-compliance-app
  typography-compliance-app
  docs-sync-r14
)

MERGE_ORDER=(
  motion-stability
  console-hardening
  explore-structure
  facility-structure
  chat-structure
  explore-ux-token
  facility-ux-token
  chat-ux-token
  color-compliance-app
  typography-compliance-app
  docs-sync-r14
)

PIDS=()
PASS=()
FAIL=()

### ── 컬러 출력 ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; exit 1; }
step() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }
info() { echo "     $1"; }

### ── 에이전트별 작업 프롬프트 ─────────────────────────────────────────────
get_task() {
  local agent=$1
  case $agent in
    motion-stability)
      cat <<'EOF'
전환 안정성 + 접근성 최적화

담당 파일만 수정:
- src/components/dotori/PageTransition.tsx
- src/app/(app)/layout.tsx
- src/app/(auth)/login/page.tsx

작업:
1) reduced motion 환경에서 애니메이션 완화
2) 페이지 전환 시 불필요한 re-render를 줄이기 위한 최소 구조 정리
3) 사용자 체감이 바뀌지 않게 기존 동작 유지

완료 조건:
- 담당 파일 외 수정 금지
- npx tsc --noEmit 에러 0
EOF
      ;;

    console-hardening)
      cat <<'EOF'
콘솔 점검 스크립트 안정화

담당 파일만 수정:
- scripts/check-console.ts
- src/app/(app)/facility/[id]/page.tsx

작업:
1) /facility/:id 라우트 검사 시 유효 ID 없을 때 false positive 제거
2) 콘솔 오류 수집 로직에서 noisy 에러 필터를 최소 범위로 정제
3) facility 페이지의 예외 처리 시 pageerror가 과다 노출되지 않도록 방어

완료 조건:
- 담당 파일 외 수정 금지
- BASE_URL=http://localhost:3000 npm run check-console 실행 시 스크립트 자체 에러 없음
EOF
      ;;

    explore-structure)
      cat <<'EOF'
Explore 구조 최적화 (상태/뷰 분리)

담당 파일만 수정:
- src/app/(app)/explore/page.tsx
- src/components/dotori/explore/useExploreSearch.ts (신규 가능)
- src/components/dotori/explore/ExploreSearchHeader.tsx (신규 가능)
- src/components/dotori/explore/ExploreResultList.tsx (신규 가능)

작업:
1) page.tsx에 몰린 상태/핸들러를 훅 + 섹션 컴포넌트로 분리
2) 검색/필터/페이지네이션 데이터 흐름 유지
3) 리렌더 범위를 줄이기 위한 props 정리 (파생값 memo 유지)

완료 조건:
- 담당 파일 외 수정 금지
- 기존 Explore 기능 회귀 없음
- npx tsc --noEmit 에러 0
EOF
      ;;

    facility-structure)
      cat <<'EOF'
Facility 상세 구조 최적화 (섹션/액션 분리)

담당 파일만 수정:
- src/app/(app)/facility/[id]/FacilityDetailClient.tsx
- src/components/dotori/facility/useFacilityDetailActions.ts (신규 가능)
- src/components/dotori/facility/FacilityContactSection.tsx (신규 가능)
- src/components/dotori/facility/FacilityCapacitySection.tsx (신규 가능)

작업:
1) 신청/관심/체크리스트 액션 로직을 훅으로 분리
2) 카드/섹션 UI를 컴포넌트로 분리해 본문 복잡도 축소
3) 기존 비즈니스 동작(관심, 신청, 토스트, 시트)은 유지

완료 조건:
- 담당 파일 외 수정 금지
- npx tsc --noEmit 에러 0
EOF
      ;;

    chat-structure)
      cat <<'EOF'
Chat 구조 최적화 (스트림/프롬프트 패널 분리)

담당 파일만 수정:
- src/app/(app)/chat/page.tsx
- src/components/dotori/chat/ChatPromptPanel.tsx (신규 가능)
- src/components/dotori/chat/useChatStream.ts (신규 가능)

작업:
1) page.tsx의 스트림 처리 로직을 커스텀 훅으로 분리
2) 제안 프롬프트/패널 UI를 별도 컴포넌트화
3) 기존 SSE 이벤트 처리 의미를 유지

완료 조건:
- 담당 파일 외 수정 금지
- npx tsc --noEmit 에러 0
EOF
      ;;

    explore-ux-token)
      cat <<'EOF'
Explore UI 토큰 정합화

담당 파일만 수정:
- src/components/dotori/explore/ExploreSuggestionPanel.tsx
- src/components/dotori/explore/ExploreSearchHeader.tsx
- src/components/dotori/explore/ExploreResultList.tsx

작업:
1) text-[Npx]를 text-xs/sm/base/lg/xl 토큰으로 교체
2) 클릭 타겟 최소 min-h-[44px] 보장
3) CTA 계열은 dotori, 성공 상태는 forest 중심으로 통일

완료 조건:
- 담당 파일 외 수정 금지
- npx tsc --noEmit 에러 0
EOF
      ;;

    facility-ux-token)
      cat <<'EOF'
Facility UI 토큰/용어 정합화

담당 파일만 수정:
- src/components/dotori/facility/FacilityStatusBadges.tsx
- src/components/dotori/facility/FacilityPremiumSection.tsx
- src/components/dotori/facility/facility-detail-helpers.ts

작업:
1) 사용자 노출 용어는 '인증 시설'로 통일
2) text-[Npx] 제거하고 의미 토큰 사용
3) 상태색 규칙: available=forest, waiting=amber, full=red 유지

완료 조건:
- 담당 파일 외 수정 금지
- npx tsc --noEmit 에러 0
EOF
      ;;

    chat-ux-token)
      cat <<'EOF'
Chat UI 토큰/색상 정합화

담당 파일만 수정:
- src/components/dotori/ChatBubble.tsx
- src/components/dotori/UsageCounter.tsx
- src/components/dotori/StreamingIndicator.tsx

작업:
1) text-[Npx] 토큰 치환
2) 경고/한도 도달 표현 색상 체계를 dotori/forest/amber 기준으로 정리
3) 가독성 유지 (모바일 우선)

완료 조건:
- 담당 파일 외 수정 금지
- npx tsc --noEmit 에러 0
EOF
      ;;

    color-compliance-app)
      cat <<'EOF'
앱 코드 색상 정합화 (Catalyst 수정 금지)

담당 파일만 수정:
- src/app/(app)/my/notifications/page.tsx
- src/app/(app)/my/interests/page.tsx
- src/components/dotori/ActionConfirmSheet.tsx

작업:
1) 앱 코드에서 green-* 사용시 forest-*로 정리
2) red/blue 계열 사용을 상태 문맥에 맞게 최소화
3) 색상 변경으로 의미가 달라지지 않게 유지

완료 조건:
- src/components/catalyst/* 절대 수정 금지
- npx tsc --noEmit 에러 0
EOF
      ;;

    typography-compliance-app)
      cat <<'EOF'
앱 코드 타이포 정합화 (픽셀 타이포 축소)

담당 파일만 수정:
- src/app/(app)/community/write/page.tsx
- src/app/(app)/my/terms/page.tsx
- src/app/(app)/my/app-info/page.tsx
- src/components/dotori/MarkdownText.tsx

작업:
1) text-[Npx]를 의미 토큰으로 교체
2) 필요한 경우 line-height도 토큰 기반으로 정리
3) 한국어 가독성 유지

완료 조건:
- 담당 파일 외 수정 금지
- npx tsc --noEmit 에러 0
EOF
      ;;

    docs-sync-r14)
      cat <<'EOF'
R14 문서 동기화

담당 파일만 수정:
- ../docs/CHANGELOG.md
- .serena/memories/agent_task_registry.md
- .serena/memories/project_overview.md (필요 시)

작업:
1) R14 작업 목적/범위/진행상태를 문서화
2) 11개 에이전트 파일 소유권과 머지 순서 명시
3) R14의 완료 조건(콘솔 오류 0, lint/build 통과) 기록

완료 조건:
- 담당 파일 외 수정 금지
- markdown 포맷 깨짐 없음
EOF
      ;;

    *)
      echo "agent_task_registry.md 에서 $agent 담당 작업을 확인해라."
      ;;
  esac
}

### ═══════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ㄱ 파이프라인 R14 — 불일치 해소 + 대규모 최적화       ║${NC}"
echo -e "${BLUE}║  ROUND: ${ROUND} / MODEL: ${CODEX_MODEL}                         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"

### ═══ PHASE 0: PRE-FLIGHT ════════════════════════════════════════════
step "PHASE 0: PRE-FLIGHT"

echo "  [0a] npm run build..."
cd "$APP"
BUILD_LOG=$(mktemp)
npm run build > "$BUILD_LOG" 2>&1
if grep -q "Compiled successfully" "$BUILD_LOG"; then
  ok "Build OK"
else
  echo "  빌드 로그:"
  tail -20 "$BUILD_LOG"
  rm -f "$BUILD_LOG"
  fail "빌드 실패 — launch 중단"
fi
rm -f "$BUILD_LOG"

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
ok "디렉토리 준비: $RESULTS, $LOGS"

### ═══ PHASE 1: 워크트리 생성 ═════════════════════════════════════════
step "PHASE 1: 워크트리 생성 (${#AGENTS[@]}개)"
mkdir -p "$WT_BASE"

for AGENT in "${AGENTS[@]}"; do
  printf "  %-30s" "Creating $ROUND-$AGENT..."
  if git -C "$REPO" worktree add "$WT_BASE/$ROUND-$AGENT" -b "codex/$ROUND-$AGENT" 2>/dev/null; then
    WT_APP_DIR="$WT_BASE/$ROUND-$AGENT/dotori-app"
    cp "$APP/.env.local" "$WT_APP_DIR/.env.local" 2>/dev/null || true
    cp -al "$APP/node_modules" "$WT_APP_DIR/node_modules"
    chmod -R 777 "$WT_BASE/$ROUND-$AGENT/"
    chmod -R 777 "$REPO/.git/worktrees/$ROUND-$AGENT/" 2>/dev/null || true
    echo "✅"
  else
    echo "❌ 실패"
  fi
done
ok "모든 워크트리 생성 완료"

### ═══ PHASE 2: CODEX 병렬 발사 ══════════════════════════════════════
step "PHASE 2: Codex ${#AGENTS[@]}개 병렬 발사"

for AGENT in "${AGENTS[@]}"; do
  WT_APP="$WT_BASE/$ROUND-$AGENT/dotori-app"
  TASK_TEXT=$(get_task "$AGENT")

  PROMPT="먼저 이 파일들을 읽어라 (필수):
  cat .serena/memories/project_overview.md
  cat .serena/memories/code_style_and_conventions.md
  cat .serena/memories/agent_task_registry.md

## 담당 작업 ($ROUND-$AGENT)
$TASK_TEXT

## 완료 조건 (반드시 순서대로)
1. 담당 파일 외 수정 금지
2. src/components/catalyst/* 수정 금지
3. 한국어 UI 텍스트 유지 (코드/변수명은 영어)
4. framer-motion import 금지 (motion/react만 허용)
5. npx tsc --noEmit 실행 — TypeScript 에러 없어야 함
6. 작업 완료 후 변경 요약을 짧게 출력"

  codex exec -m "$CODEX_MODEL" -s workspace-write \
    --cd "$WT_APP" \
    -o "$RESULTS/$AGENT.txt" \
    "$PROMPT" \
    > "$LOGS/$AGENT.log" 2>&1 &

  PIDS+=($!)
  echo -e "  🚀 ${GREEN}$ROUND-$AGENT${NC} (PID: ${PIDS[-1]})"
done

ok "${#AGENTS[@]}개 에이전트 발사 완료"
info "진행 확인: ./scripts/wt-monitor.sh $ROUND --watch"

### ═══ PHASE 3: 완료 대기 + 빌드 검증 ═══════════════════════════════
step "PHASE 3: 완료 대기 (최대 90분)"

TIMEOUT=5400
START=$(date +%s)

echo "  (완료까지 대기 중 — 모니터: ./scripts/wt-monitor.sh $ROUND --watch)"

( sleep $TIMEOUT && kill "${PIDS[@]}" 2>/dev/null ) &
WATCHDOG=$!

for i in "${!PIDS[@]}"; do
  wait "${PIDS[$i]}" 2>/dev/null && echo "  ✓ ${AGENTS[$i]}" || echo "  ? ${AGENTS[$i]} exited"
done

kill "$WATCHDOG" 2>/dev/null || true
ok "모든 에이전트 완료"

### ─── 에이전트 변경사항 자동 커밋 ─────────────────────────────────
info "에이전트 변경사항 자동 커밋..."
echo ""
for AGENT in "${AGENTS[@]}"; do
  WT_DIR="$WT_BASE/$ROUND-$AGENT"
  printf "  %-30s" "$AGENT"
  CHANGES=$(git -C "$WT_DIR" status --porcelain 2>/dev/null | wc -l)
  if [[ $CHANGES -gt 0 ]]; then
    git -C "$WT_DIR" add -A 2>/dev/null
    git -C "$WT_DIR" commit -m "refactor($ROUND-$AGENT): R14 최적화/정합화" 2>/dev/null \
      && echo "✅ ($CHANGES files changed)" \
      || echo "❌ commit 실패"
  else
    echo "⚠️  변경없음"
  fi
done

### ─── 빌드 검증 (병렬 4개 동시) ────────────────────────────────────
echo ""
info "빌드 검증 병렬 실행 중 (max 4 concurrent)..."
MAX_PARALLEL=4
declare -A BUILD_PIDS BUILD_LOGS
for AGENT in "${AGENTS[@]}"; do
  WT_APP="$WT_BASE/$ROUND-$AGENT/dotori-app"
  WT_BUILD_LOG=$(mktemp)
  BUILD_LOGS[$AGENT]="$WT_BUILD_LOG"
  (cd "$WT_APP" && npm run build > "$WT_BUILD_LOG" 2>&1) &
  BUILD_PIDS[$AGENT]=$!
  running=$(jobs -p | wc -l)
  while [[ $running -ge $MAX_PARALLEL ]]; do
    sleep 1
    running=$(jobs -p | wc -l)
  done
done

for AGENT in "${AGENTS[@]}"; do
  wait "${BUILD_PIDS[$AGENT]}" 2>/dev/null
  WT_BUILD_LOG="${BUILD_LOGS[$AGENT]}"
  printf "  %-30s" "$AGENT"
  if grep -q "Compiled successfully" "$WT_BUILD_LOG"; then
    PASS+=("$AGENT"); echo "✅"
  else
    FAIL+=("$AGENT"); echo "❌ (로그: $LOGS/$AGENT.log)"
  fi
  rm -f "$WT_BUILD_LOG"
done

ok  "Pass: ${#PASS[@]}개"
[ "${#FAIL[@]}" -gt 0 ] && warn "Fail: ${FAIL[*]}"

### ═══ PHASE 4: SQUASH MERGE ═════════════════════════════════════════
step "PHASE 4: Squash Merge"

cd "$APP"
MERGED=(); SKIPPED=()

for AGENT in "${MERGE_ORDER[@]}"; do
  printf "  %-30s" "Merging $ROUND-$AGENT..."
  if [[ " ${FAIL[*]} " == *" $AGENT "* ]]; then
    SKIPPED+=("$AGENT"); echo "⏭️  skip (빌드 실패)"; continue
  fi
  COMMIT_COUNT=$(git -C "$WT_BASE/$ROUND-$AGENT" log --oneline "HEAD...$(git -C "$REPO" rev-parse HEAD)" 2>/dev/null | wc -l || echo "0")
  if [ "$COMMIT_COUNT" -eq 0 ]; then
    SKIPPED+=("$AGENT"); echo "⏭️  skip (커밋 없음)"; continue
  fi
  if git merge --squash "codex/$ROUND-$AGENT" 2>/dev/null; then
    SUMMARY=$(head -1 "$RESULTS/$AGENT.txt" 2>/dev/null | cut -c1-60 || echo "$ROUND-$AGENT")
    git commit -m "refactor($ROUND-$AGENT): $SUMMARY

Co-Authored-By: Codex <noreply@openai.com>" 2>/dev/null || true
    MERGED+=("$AGENT"); echo "✅"
  else
    SKIPPED+=("$AGENT"); git merge --abort 2>/dev/null || true; warn "Conflict — 수동 처리"
  fi
done

ok  "Merged: ${#MERGED[@]}개"
[ "${#SKIPPED[@]}" -gt 0 ] && warn "Skipped: ${SKIPPED[*]}"

### ═══ PHASE 5: 최종 검증 + 정리 ════════════════════════════════════
step "PHASE 5: 최종 검증 + 정리"

cd "$APP"
npm run build 2>&1 | grep -q "Compiled successfully" && ok "최종 빌드 OK" || warn "최종 빌드 문제 — 수동 확인"

echo ""
info "모바일 실검수 실행 (check-console + e2e + screenshot + scroll)"
if QA_PORT=3002 STRICT_QA=true ./scripts/mobile-qa.sh; then
  ok "모바일 QA 통과"
else
  if [ "${STOP_ON_QA_FAIL:-true}" = "true" ]; then
    fail "모바일 QA 실패 — 배포 전 수정 필요"
  fi
  warn "모바일 QA 실패 — STOP_ON_QA_FAIL=false 로 계속 진행"
fi

for AGENT in "${AGENTS[@]}"; do
  git -C "$REPO" worktree remove --force "$WT_BASE/$ROUND-$AGENT" 2>/dev/null || true
  git -C "$REPO" branch -D "codex/$ROUND-$AGENT" 2>/dev/null || true
done
git -C "$REPO" worktree prune 2>/dev/null || true
ok "워크트리 정리 완료"

### ═══ 최종 리포트 ═══════════════════════════════════════════════════
ELAPSED=$(( $(date +%s) - START ))
ELAPSED_MIN=$(( ELAPSED / 60 ))
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  R14 완료 — ${ELAPSED_MIN}분  대규모 최적화/정합화             ║${NC}"
printf "${BLUE}║  Merged %-3d  Failed %-3d  Skipped %-3d                     ║${NC}\n" "${#MERGED[@]}" "${#FAIL[@]}" "${#SKIPPED[@]}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  다음 단계:"
echo "  1. ./scripts/vision-eval.sh 로 후속 비전평가"
echo "  2. git push origin main"
echo "  3. 배포 후 /api/health 및 핵심 화면 점검"
echo ""
