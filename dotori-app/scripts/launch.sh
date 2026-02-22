#!/bin/bash
# ㄱ 파이프라인 v3 — Codex 병렬 실행
# Usage: ./scripts/launch.sh [ROUND=r17] [MODEL=gpt-5.2]
# spark: CODEX_MODEL=gpt-5.3-codex-spark ./scripts/launch.sh r17

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r17}
CODEX_MODEL=${CODEX_MODEL:-gpt-5.2}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(token-my-core token-my-waitlist token-onboarding token-community token-auth-misc token-facility token-dotori-comp refactor-blocks test-api-core test-api-ext test-e2e-smoke)
MERGE_ORDER=(token-my-core token-my-waitlist token-onboarding token-community token-auth-misc token-facility token-dotori-comp refactor-blocks test-api-core test-api-ext test-e2e-smoke)
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
    token-my-core)
      echo "text-[Npx] → Tailwind 스케일 토큰 교체 (my 페이지 계열)

담당 파일 (이 파일들만 수정):
- src/app/(app)/my/page.tsx (34건)
- src/app/(app)/my/import/page.tsx (24건)
- src/app/(app)/my/support/page.tsx (9건)
- src/app/(app)/my/notifications/page.tsx (7건)
- src/app/(app)/my/interests/page.tsx (5건)
- src/app/(app)/my/notices/page.tsx (4건)

## 작업
모든 text-[Npx] 패턴을 Tailwind 표준 클래스로 교체:
- text-[10px] → text-[0.625rem] 또는 text-xs (상황에 따라)
- text-[11px] → text-xs (0.75rem = 12px)
- text-[12px] → text-xs
- text-[13px] → text-xs 또는 text-sm (디자인 의도에 따라)
- text-[14px] → text-sm (0.875rem = 14px)
- text-[15px] → text-base (1rem = 16px에 가까움) 또는 text-sm
- text-[16px] → text-base
- text-[17px] → text-base 또는 text-lg
- text-[18px] → text-lg (1.125rem = 18px)
- text-[20px] → text-xl
- text-[22px] → text-xl 또는 text-2xl
- text-[24px] → text-2xl
- text-[28px] → text-2xl 또는 text-3xl
- text-[32px] → text-3xl 이상

주의: leading-[Npx]도 함께 조정해야 할 수 있음 (leading-tight/snug/normal/relaxed).
w-[Npx], h-[Npx], p-[Npx] 등 다른 임의값은 건드리지 마라 — text-[Npx]만 교체.

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    token-my-waitlist)
      echo "text-[Npx] → Tailwind 스케일 토큰 교체 (대기 페이지)

담당 파일 (이 파일들만 수정):
- src/app/(app)/my/waitlist/page.tsx (35건)
- src/app/(app)/my/waitlist/[id]/page.tsx (33건)

## 작업
모든 text-[Npx] 패턴을 Tailwind 표준 클래스로 교체:
- text-[10px]~text-[11px] → text-xs
- text-[12px]~text-[13px] → text-xs 또는 text-sm
- text-[14px] → text-sm
- text-[15px]~text-[16px] → text-base
- text-[17px]~text-[18px] → text-lg
- text-[20px] → text-xl
- text-[22px]~text-[24px] → text-2xl
- text-[28px]~text-[32px] → text-3xl

주의: leading-[Npx]도 함께 조정. w-[Npx], h-[Npx] 등은 건드리지 마라.

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    token-onboarding)
      echo "text-[Npx] → Tailwind 스케일 토큰 교체 (온보딩)

담당 파일 (이 파일들만 수정):
- src/app/(onboarding)/onboarding/page.tsx (30건)
- src/app/(onboarding)/error.tsx (3건)

## 작업
모든 text-[Npx] 패턴을 Tailwind 표준 클래스로 교체.
매핑 규칙은 다른 에이전트와 동일 (text-[14px]→text-sm 등).

leading-[Npx]도 함께 조정.

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    token-community)
      echo "text-[Npx] → Tailwind 스케일 토큰 교체 (커뮤니티)

담당 파일 (이 파일들만 수정):
- src/app/(app)/community/[id]/page.tsx (19건)
- src/app/(app)/community/page.tsx (16건)
- src/app/(app)/community/_components/CommunityEmptyState.tsx (1건)

## 작업
모든 text-[Npx] 패턴을 Tailwind 표준 클래스로 교체.
매핑 규칙은 다른 에이전트와 동일 (text-[14px]→text-sm 등).

leading-[Npx]도 함께 조정.

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    token-auth-misc)
      echo "text-[Npx] → Tailwind 스케일 토큰 교체 (auth + error + shared)

담당 파일 (이 파일들만 수정):
- src/app/(auth)/login/page.tsx (11건)
- src/app/(auth)/error.tsx (3건)
- src/app/not-found.tsx (1건)
- src/components/shared/ErrorBoundary.tsx (2건)

## 작업
모든 text-[Npx] 패턴을 Tailwind 표준 클래스로 교체.
매핑 규칙: text-[14px]→text-sm, text-[16px]→text-base, text-[18px]→text-lg 등.

leading-[Npx]도 함께 조정.

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    token-facility)
      echo "text-[Npx] → Tailwind 스케일 토큰 교체 (시설 상세)

담당 파일 (이 파일들만 수정):
- src/components/dotori/facility/IsalangCard.tsx (6건)
- src/components/dotori/facility/FacilityReviewsCard.tsx (6건)
- src/components/dotori/facility/FacilityCapacityCard.tsx (5건)
- src/components/dotori/facility/FacilityInsights.tsx (3건)
- src/components/dotori/facility/FacilityLocationCard.tsx (2건)
- src/components/dotori/facility/FacilityChecklistCard.tsx (2건)
- src/components/dotori/facility/FacilityInfoCard.tsx (1건)
- src/components/dotori/facility/FacilityFeaturesCard.tsx (1건)
- src/components/dotori/facility/FacilityDetailHeader.tsx (1건)
- src/app/(app)/facility/[id]/FacilityDetailClient.tsx (1건)
- src/app/(app)/facility/[id]/not-found.tsx (2건)

## 작업
모든 text-[Npx] 패턴을 Tailwind 표준 클래스로 교체.
매핑 규칙: text-[14px]→text-sm, text-[16px]→text-base, text-[18px]→text-lg 등.

leading-[Npx]도 함께 조정.

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    token-dotori-comp)
      echo "text-[Npx] → Tailwind 스케일 토큰 교체 (dotori 공통 컴포넌트)

담당 파일 (이 파일들만 수정):
- src/components/dotori/MapEmbed.tsx (5건)
- src/components/dotori/blocks/ChecklistBlock.tsx (5건)
- src/components/dotori/chat/ChatPromptPanel.tsx (2건)
- src/components/dotori/Toast.tsx (2건)
- src/components/dotori/ActionConfirmSheet.tsx (2건)
- src/components/dotori/CompareTable.tsx (1건)
- src/components/dotori/SourceChip.tsx (1건)
- src/components/dotori/blocks/TextBlock.tsx (1건)

## 작업
모든 text-[Npx] 패턴을 Tailwind 표준 클래스로 교체.
매핑 규칙: text-[14px]→text-sm, text-[16px]→text-base, text-[18px]→text-lg 등.

leading-[Npx]도 함께 조정.

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    refactor-blocks)
      echo "response-builder/blocks.ts 688줄 분리 리팩토링

담당 파일 (이 파일들만 수정):
- src/lib/engine/response-builder/blocks.ts (분리 원본)
- src/lib/engine/response-builder/index.ts (re-export 수정)
새 파일 생성 가능:
- src/lib/engine/response-builder/search.ts
- src/lib/engine/response-builder/status.ts
- src/lib/engine/response-builder/recommendation.ts

## 작업
blocks.ts의 688줄을 기능별로 분리:
1. search.ts — buildSearchResponse, buildFacilityDetailResponse (시설 검색 관련)
2. status.ts — buildStatusResponse, buildWaitlistStatusResponse (상태 조회 관련)
3. recommendation.ts — buildRecommendationResponse, buildComparisonResponse (추천/비교 관련)
4. blocks.ts — buildResponse (메인 라우터), 나머지 작은 헬퍼

index.ts에서 buildResponse와 필요한 타입을 re-export.
기존 import 경로 호환성 유지 (response-builder에서 buildResponse import하는 곳).

## 주의
- src/lib/engine/__tests__/response-builder.test.ts는 수정하지 마라
- 기존 테스트가 import { buildResponse } from '../response-builder'로 작동해야 함

## 검증
npx tsc --noEmit 에러 0개.
npm test 실행하여 91개 테스트 전부 통과 확인."
      ;;
    test-api-core)
      echo "핵심 API route 테스트 작성

새 파일 생성:
- src/__tests__/api/facilities.test.ts
- src/__tests__/api/waitlist.test.ts
- src/__tests__/api/chat.test.ts

## 작업
핵심 3개 API route에 대해 유닛 테스트 작성:

### facilities.test.ts
- GET /api/facilities — 목록 응답 스키마 검증
- GET /api/facilities/[id] — 상세 응답 스키마 검증
- 잘못된 id 형식 시 400 에러

### waitlist.test.ts
- POST /api/waitlist — 필수 필드 누락 시 400
- POST /api/waitlist — 올바른 데이터로 생성 성공
- GET /api/waitlist — 인증 없으면 401

### chat.test.ts
- POST /api/chat — 빈 메시지 시 400
- POST /api/chat — 메시지 길이 제한 검증

테스트 프레임워크: vitest (import { describe, it, expect } from 'vitest')
DB 모킹: vi.mock('@/lib/db') + vi.mock('@/models/Facility') 등

## 주의
실제 DB 연결하지 마라. 모든 외부 의존성 mock 처리.
import 경로: @/ alias 사용.

## 검증
npm test 실행하여 전체 테스트 통과."
      ;;
    test-api-ext)
      echo "확장 API route 테스트 작성

새 파일 생성:
- src/__tests__/api/subscriptions.test.ts
- src/__tests__/api/admin-premium.test.ts
- src/__tests__/api/community.test.ts

## 작업

### subscriptions.test.ts
- POST /api/subscriptions — admin이 아니면 403
- GET /api/subscriptions — 인증 없으면 401

### admin-premium.test.ts
- PUT /api/admin/facility/[id]/premium — CRON_SECRET 없으면 401
- PUT /api/admin/facility/[id]/premium — 올바른 Bearer 토큰으로 성공

### community.test.ts
- GET /api/community/posts — 목록 응답 스키마 검증
- POST /api/community/posts — 인증 없으면 401
- POST /api/community/posts — 올바른 데이터로 생성

테스트 프레임워크: vitest (import { describe, it, expect } from 'vitest')
DB 모킹: vi.mock 사용.

## 주의
실제 DB 연결하지 마라. 모든 외부 의존성 mock 처리.

## 검증
npm test 실행하여 전체 테스트 통과."
      ;;
    test-e2e-smoke)
      echo "Playwright E2E smoke 테스트 작성

새 파일 생성:
- e2e/smoke.spec.ts
- playwright.config.ts (없으면 생성, 있으면 확인)

## 작업
주요 페이지 접근 가능 여부 smoke 테스트:

### smoke.spec.ts
- test('홈페이지 로드', async) — / 접근, 200, 주요 텍스트 존재
- test('로그인 페이지 로드', async) — /login 접근, 200, 카카오 로그인 버튼 존재
- test('탐색 페이지 로드', async) — /explore 접근, 200
- test('채팅 페이지 로드', async) — /chat 접근, 200
- test('커뮤니티 페이지 로드', async) — /community 접근, 200
- test('랜딩 페이지 로드', async) — /landing 접근, 200

### playwright.config.ts
- baseURL: process.env.BASE_URL || 'http://localhost:3000'
- projects: [{ name: 'mobile', use: { viewport: { width: 375, height: 812 } } }]
- webServer: { command: 'npm run start', port: 3000, reuseExistingServer: true }

## 주의
- @playwright/test 사용 (이미 devDependencies에 있음)
- 인증이 필요한 페이지는 테스트하지 마라 (로그인 없이 접근 가능한 것만)

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    *)
      echo "agent_task_registry.md 에서 $agent 담당 작업을 확인해라."
      ;;
  esac
}

### ═══════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ㄱ 파이프라인 v3 — ROUND: ${ROUND}               ║${NC}"
echo -e "${BLUE}║  R17: text-[Npx] 토큰화 + API테스트 + E2E   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"

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

LINT_LOG=$(mktemp)
npm run lint > "$LINT_LOG" 2>&1 || true
LINT_ERRORS=$(grep -c " error " "$LINT_LOG" || true)
rm -f "$LINT_LOG"
[ "$LINT_ERRORS" -gt 0 ] && warn "ESLint errors: ${LINT_ERRORS}개" || ok "ESLint clean"

npm test > /dev/null 2>&1 && ok "Tests passed" || warn "Tests 불안정"

echo "  [0e] 스테일 워크트리 정리..."
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
  printf "  %-28s" "Creating $ROUND-$AGENT..."
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
2. 한국어 UI 텍스트 유지 (코드·변수명은 영어)
3. framer-motion import 금지 → motion/react 사용
4. color='dotori' CTA 버튼, color='forest' 성공 상태
5. text-[Npx] 임의 픽셀값 금지 → Tailwind 스케일 토큰 (text-xs/sm/base/lg/xl/2xl)
6. npx tsc --noEmit 실행 — TypeScript 에러 없어야 함
7. 파일 생성·수정만 완료하면 됨 (git add/commit은 launch.sh가 자동 처리)"

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

# ─── 에이전트 변경사항 자동 커밋 ───
info "에이전트 변경사항 자동 커밋..."
echo ""
for AGENT in "${AGENTS[@]}"; do
  WT_DIR="$WT_BASE/$ROUND-$AGENT"
  printf "  %-28s" "$AGENT"
  CHANGES=$(git -C "$WT_DIR" status --porcelain 2>/dev/null | wc -l)
  if [[ $CHANGES -gt 0 ]]; then
    git -C "$WT_DIR" add -A 2>/dev/null
    git -C "$WT_DIR" commit -m "refactor($ROUND-$AGENT): text-[Npx] 토큰화 + 테스트" 2>/dev/null \
      && echo "✅ ($CHANGES files changed)" \
      || echo "❌ commit 실패"
  else
    echo "⚠️  변경없음"
  fi
done

# ─── 빌드 검증 (병렬 4개 동시) ───
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
  printf "  %-28s" "$AGENT"
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
  printf "  %-28s" "Merging $ROUND-$AGENT..."
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
npm test 2>&1 | grep -E "Tests:|test files|tests" | tail -3

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
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  R17 완료 — ${ELAPSED_MIN}분                           ║${NC}"
echo -e "${BLUE}║  text-[Npx] 토큰화 + API테스트 + E2E       ║${NC}"
printf "${BLUE}║  Merged %-3d  Failed %-3d  Skipped %-3d           ║${NC}\n" "${#MERGED[@]}" "${#FAIL[@]}" "${#SKIPPED[@]}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "  다음 단계:"
echo "  1. git push origin main"
echo "  2. doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2"
echo ""
