#!/bin/bash
# ㄱ 파이프라인 v4 — Codex 병렬 실행
# Usage: ./scripts/launch.sh [ROUND=r18] [MODEL=gpt-5.2]

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r18}
CODEX_MODEL=${CODEX_MODEL:-gpt-5.2}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(ux-home ux-chat ux-explore ux-community ux-facility ux-my-core ux-my-waitlist ux-onboarding ux-auth-landing ux-core-comp ux-blocks)
MERGE_ORDER=(ux-core-comp ux-blocks ux-home ux-chat ux-explore ux-community ux-facility ux-my-core ux-my-waitlist ux-onboarding ux-auth-landing)
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

### ── 공통 다크모드 규칙 (모든 에이전트 공유) ──────────────────────────────
DARK_RULES='## 다크모드 규칙
CSS 변수 시스템이 이미 globals.css에 설정되어 있다.
- 라이트: --color-bg-primary(dotori-50), --color-bg-surface(white), --color-text-primary(dotori-900)
- 다크: --color-bg-primary(#1a1510), --color-bg-surface(#2d2418), --color-text-primary(#f5ede0)
- .dark 클래스가 <html>에 토글됨

### 적용 패턴:
1. bg-white → bg-white dark:bg-dotori-950
2. bg-dotori-50 → bg-dotori-50 dark:bg-dotori-900
3. bg-dotori-100 → bg-dotori-100 dark:bg-dotori-800
4. text-dotori-900 → text-dotori-900 dark:text-dotori-50
5. text-dotori-800 → text-dotori-800 dark:text-dotori-100
6. text-dotori-700 → text-dotori-700 dark:text-dotori-200
7. text-dotori-600 → text-dotori-600 dark:text-dotori-300
8. text-dotori-500 → 그대로 (브랜드 색상, 라이트/다크 공통)
9. text-dotori-400 → 그대로 (브랜드 색상)
10. border-dotori-100 → border-dotori-100 dark:border-dotori-800
11. border-dotori-200 → border-dotori-200 dark:border-dotori-700
12. divide-dotori-100 → divide-dotori-100 dark:divide-dotori-800
13. bg-forest-500 → 그대로 (성공 색상은 변경 불요)
14. shadow-* → shadow-* dark:shadow-none 또는 유지 (케이스별 판단)
15. placeholder 색상: placeholder:text-dotori-400 dark:placeholder:text-dotori-600

### 금지:
- bg-black, bg-gray-* 사용 금지 → dotori 팔레트만 사용
- 새로운 CSS 변수 정의 금지 (globals.css 건드리지 마라)
- Catalyst 컴포넌트 내부 수정 금지 (이미 dark: 지원됨)'

### ── 공통 모션 규칙 ──────────────────────────────────────────────────────
MOTION_RULES='## 모션 프리셋 규칙
src/lib/motion.ts에 중앙화된 프리셋이 있다. 인라인 모션 정의 대신 이것을 사용해라.

import { fadeUp, stagger, tap, glass } from "@/lib/motion";

### 사용 패턴:
- 페이지 섹션 등장: <motion.div {...fadeUp}>
- 리스트 아이템 순차 등장: <motion.ul {...stagger.container}> + <motion.li {...stagger.item}>
- 카드 탭 피드백: <motion.div {...tap.card}>
- 버튼 탭: <motion.button {...tap.button}>

### 글래스 효과 (globals.css 유틸리티):
- 고정 헤더: className="glass-header sticky top-0 z-10"
- 바텀시트: className="glass-sheet"
- 플로팅 카드: className="glass-card"
- 오버레이: className="glass-overlay"

### 금지:
- framer-motion import 금지 → motion/react만 사용
- 새로운 인라인 variants 정의 최소화 (motion.ts 프리셋 우선)'

### ── 에이전트별 작업 프롬프트 ─────────────────────────────────────────────
get_task() {
  local agent=$1
  case $agent in
    ux-home)
      echo "홈 페이지 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(app)/page.tsx

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가 (위 규칙 따라서)
2. 섹션별 fadeUp 적용 (AI 토리, 내 주변 빈자리, NBA 카드)
3. NBA 카드 리스트에 stagger 적용
4. 상단 헤더 영역에 glass-header 적용 (있으면)

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-chat)
      echo "채팅 페이지 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(app)/chat/page.tsx
- src/components/dotori/chat/ChatBubble.tsx (있으면)
- src/components/dotori/chat/ChatPromptPanel.tsx

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가
2. 채팅 버블 배경: 사용자=dotori-100 dark:dotori-800, AI=white dark:dotori-900
3. ChatPromptPanel에서 기존 인라인 variants → motion.ts의 stagger 프리셋으로 교체
4. 상단 헤더에 glass-header 적용

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-explore)
      echo "탐색 페이지 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(app)/explore/page.tsx
- src/components/dotori/explore/ExploreSuggestionPanel.tsx
- src/components/dotori/explore/ExploreSearchHeader.tsx (있으면)
- src/components/dotori/explore/ExploreResultList.tsx (있으면)

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가
2. 검색 결과 리스트에 stagger.fast 적용
3. 필터 칩에 tap.chip 적용
4. 검색 헤더에 glass-header 적용

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-community)
      echo "커뮤니티 페이지 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(app)/community/page.tsx
- src/app/(app)/community/[id]/page.tsx
- src/app/(app)/community/write/page.tsx
- src/app/(app)/community/_components/CommunityEmptyState.tsx (있으면)

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가
2. 게시글 카드 리스트에 stagger 적용
3. 카드에 tap.card 적용
4. 헤더에 glass-header 적용

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-facility)
      echo "시설 상세 페이지 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(app)/facility/[id]/page.tsx
- src/app/(app)/facility/[id]/FacilityDetailClient.tsx (있으면)
- src/components/dotori/facility/FacilityCapacitySection.tsx
- src/components/dotori/facility/FacilityContactSection.tsx
- src/components/dotori/facility/FacilityPremiumSection.tsx
- src/components/dotori/facility/FacilityReviewSection.tsx
- src/components/dotori/facility/FacilityStatusBadges.tsx
- src/components/dotori/facility/FacilityWaitlistCTA.tsx
- src/components/dotori/facility/FacilityLocationSection.tsx
- src/components/dotori/facility/FacilityOperatingSection.tsx
- src/components/dotori/facility/FacilityProgramSection.tsx
- src/components/dotori/facility/facility-detail-helpers.ts

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가 (모든 facility 컴포넌트)
2. 섹션별 fadeUp 적용 (capacity, contact, review 등)
3. 상단 sticky 헤더에 glass-header 적용

## 주의
- useFacilityDetailActions.ts, useFacilityDetailData.ts는 수정하지 마라 (훅 로직)
- FacilityCard.tsx는 ux-core-comp 에이전트가 담당

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-my-core)
      echo "마이페이지 핵심 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(app)/my/page.tsx
- src/app/(app)/my/settings/page.tsx  ← 다크모드 토글 UI 추가!
- src/app/(app)/my/support/page.tsx
- src/app/(app)/my/app-info/page.tsx
- src/app/(app)/my/terms/page.tsx
- src/app/(app)/my/notices/page.tsx

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가
2. my/settings/page.tsx에 다크모드 토글 추가:
   - import { useTheme } from '@/hooks/useTheme'
   - 라이트/다크/시스템 3단 토글 (라디오 또는 세그먼트 컨트롤)
   - 현재 모드 표시
3. 메뉴 항목 리스트에 stagger 적용

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-my-waitlist)
      echo "마이 대기/알림 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(app)/my/waitlist/page.tsx
- src/app/(app)/my/waitlist/[id]/page.tsx
- src/app/(app)/my/notifications/page.tsx
- src/app/(app)/my/interests/page.tsx
- src/app/(app)/my/import/page.tsx

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가
2. 대기 목록/알림 리스트에 stagger 적용
3. 카드에 tap.card 적용

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-onboarding)
      echo "온보딩 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(onboarding)/onboarding/page.tsx
- src/app/(onboarding)/layout.tsx (있으면)
- src/app/(onboarding)/error.tsx

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가
2. 각 스텝 전환에 fadeUp 적용
3. 선택 버튼에 tap.button 적용

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-auth-landing)
      echo "로그인 + 랜딩 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/app/(auth)/login/page.tsx
- src/app/(auth)/error.tsx
- src/app/(landing)/landing/page.tsx
- src/components/landing/ 디렉토리 내 파일 (있으면)

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가
2. login/page.tsx: 기존 인라인 motion 프리셋을 유지하되, dark: 클래스 추가
3. landing/page.tsx: 다크모드 + 섹션별 fadeUp

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-core-comp)
      echo "핵심 공통 컴포넌트 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/components/dotori/BottomTabBar.tsx  ← glass-header 적용!
- src/components/dotori/FacilityCard.tsx  ← tap.card 프리셋으로 교체
- src/components/dotori/Toast.tsx
- src/components/dotori/ToastProvider.tsx
- src/components/dotori/Skeleton.tsx
- src/components/dotori/EmptyState.tsx
- src/components/dotori/ErrorState.tsx
- src/components/dotori/Surface.tsx (있으면)
- src/components/dotori/Wallpaper.tsx (있으면)
- src/components/dotori/PremiumGate.tsx
- src/components/dotori/UsageCounter.tsx
- src/components/dotori/AiBriefingCard.tsx
- src/components/dotori/MapEmbed.tsx
- src/components/dotori/SourceChip.tsx
- src/components/dotori/StreamingIndicator.tsx
- src/components/dotori/ActionConfirmSheet.tsx
- src/components/dotori/CompareTable.tsx
- src/components/dotori/MarkdownText.tsx

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가 (모든 컴포넌트)
2. BottomTabBar: glass-header 유틸리티 적용 (하단 고정 바에 글래스 효과)
3. FacilityCard: 기존 인라인 motionCardProps → import { tap } from '@/lib/motion' 의 tap.card로 교체
4. SourceChip: 기존 인라인 spring 값 → import { spring } from '@/lib/motion' 으로 교체
5. Toast: 다크모드 배경 색상

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    ux-blocks)
      echo "채팅 블록 컴포넌트 UX 플러그인 적용

담당 파일 (이 파일들만 수정):
- src/components/dotori/blocks/ChecklistBlock.tsx
- src/components/dotori/blocks/TextBlock.tsx (있으면)
- src/components/dotori/blocks/ActionBlock.tsx (있으면)
- src/components/dotori/blocks/AlertsBlock.tsx (있으면)
- src/components/dotori/blocks/CompareBlock.tsx (있으면)
- src/components/dotori/blocks/FacilityBlock.tsx (있으면)
- src/components/dotori/blocks/RecommendBlock.tsx (있으면)
- src/components/dotori/blocks/SummaryBlock.tsx (있으면)
- src/components/dotori/blocks/WaitlistBlock.tsx (있으면)

$DARK_RULES
$MOTION_RULES

## 작업
1. 다크모드 dark: 클래스 추가 (모든 블록 컴포넌트)
2. 카드/블록에 glass-card 적용 (어울리는 곳)
3. 리스트형 블록에 stagger 적용

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
echo -e "${BLUE}║  ㄱ 파이프라인 v4 — ROUND: ${ROUND}               ║${NC}"
echo -e "${BLUE}║  R18: 다크모드 + 글래스 + 모션 프리셋       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"

### ═══ PHASE 0: PRE-FLIGHT ════════════════════════════════════════════
step "PHASE 0: PRE-FLIGHT"

echo "  [0a] npm run build..."
cd "$APP"
BUILD_LOG=$(mktemp)
npm run build > "$BUILD_LOG" 2>&1
if [ $? -eq 0 ]; then
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
  cat src/lib/motion.ts

## 담당 작업 ($ROUND-$AGENT)
$TASK_TEXT

## 완료 조건 (반드시 순서대로)
1. 담당 파일 외 수정 금지 — 특히 globals.css, layout.tsx, motion.ts 수정 금지
2. 한국어 UI 텍스트 유지 (코드·변수명은 영어)
3. framer-motion import 금지 → motion/react 사용
4. color='dotori' CTA 버튼, color='forest' 성공 상태
5. text-[Npx] 임의 픽셀값 금지 → Tailwind 스케일 토큰
6. dark: 클래스 추가 시 dotori 팔레트만 사용 (bg-gray-* 금지)
7. npx tsc --noEmit 실행 — TypeScript 에러 없어야 함
8. 파일 생성·수정만 완료하면 됨 (git add/commit은 launch.sh가 자동 처리)"

  codex exec -m "$CODEX_MODEL" -s workspace-write \
    --cd "$WT_APP" \
    -o "$RESULTS/$AGENT.txt" \
    "$PROMPT" \
    > "$LOGS/$AGENT.log" 2>&1 &

  PIDS+=($!)
  echo -e "  🚀 ${GREEN}$ROUND-$AGENT${NC} (PID: ${PIDS[-1]})"
done

ok "${#AGENTS[@]}개 에이전트 발사 완료"

### ═══ PHASE 3: 완료 대기 + 빌드 검증 ═══════════════════════════════
step "PHASE 3: 완료 대기 (최대 90분)"

TIMEOUT=5400
START=$(date +%s)

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
    git -C "$WT_DIR" commit -m "feat($ROUND-$AGENT): 다크모드 + 글래스 + 모션" 2>/dev/null \
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
  if [ $? -eq 0 ] || grep -q "prerendered as static content" "$WT_BUILD_LOG" 2>/dev/null; then
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
    git commit -m "feat($ROUND-$AGENT): 다크모드 + 글래스 + 모션 적용

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
npm run build 2>&1 | tail -5
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
echo -e "${BLUE}║  ${ROUND} 완료 — ${ELAPSED_MIN}분                           ║${NC}"
echo -e "${BLUE}║  다크모드 + 글래스 + 모션 프리셋 적용        ║${NC}"
printf "${BLUE}║  Merged %-3d  Failed %-3d  Skipped %-3d           ║${NC}\n" "${#MERGED[@]}" "${#FAIL[@]}" "${#SKIPPED[@]}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "  다음 단계:"
echo "  1. git push origin main"
echo "  2. doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2"
echo ""
