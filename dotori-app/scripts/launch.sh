#!/bin/bash
# ㄱ 파이프라인 v2 — Codex 병렬 실행 (2026 AI UX + 비즈니스 플랜)
# Usage: ./scripts/launch.sh [ROUND=r11] [MODEL=gpt-5.3-codex-spark]
# spark 한도시: CODEX_MODEL=gpt-5.3-codex ./scripts/launch.sh r11

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r12}
# 모델 선택: spark 한도 시 gpt-5.3-codex 로 대체
CODEX_MODEL=${CODEX_MODEL:-gpt-5.3-codex}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(explore-clean facility-clean landing-clean engine-boost e2e-update)
MERGE_ORDER=(engine-boost explore-clean facility-clean landing-clean e2e-update)
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
    explore-clean)
      echo "src/app/(app)/explore/page.tsx 탐색 페이지를 폴리싱해라.

담당 파일: src/app/(app)/explore/page.tsx 만 수정.

## 먼저 파일 읽기 (필수)
cat src/app/(app)/explore/page.tsx | wc -l
head -150 src/app/(app)/explore/page.tsx

## 해야 할 것:

### 1. 이동 시나리오 칩 확인/추가
검색창 아래에 이동 시나리오 클릭 가능 칩:
['반편성 불만', '교사 교체', '국공립 당첨', '이사 예정']
각 클릭 시 해당 텍스트로 search 상태 업데이트.
칩 스타일: rounded-full bg-dotori-50 border border-dotori-100 px-3 py-1.5 text-sm text-dotori-700

### 2. 빈 결과 개선
검색 결과 없을 때:
- '토리에게 물어보기' 버튼 → Link href={'/chat?prompt=' + encodeURIComponent(search)}
  color='dotori'
- EmptyState 컴포넌트 활용

### 3. Button color 수정
color='forest' 를 Button에서 쓰고 있으면 반드시 color='dotori'로 변경.
(forest는 Badge 전용 — Button에는 사용 불가)

### 4. 불필요 코드 정리
사용되지 않는 변수/import 제거.
과도한 섹션/위젯 단순화.

### 5. TypeScript 확인
npx tsc --noEmit 오류 0개."
      ;;
    facility-clean)
      echo "시설 상세 페이지 폴리싱:

담당 파일: src/app/(app)/facility/[id]/ 디렉토리 내 파일만 수정.

## 먼저 파일 읽기 (필수)
ls src/app/(app)/facility/[id]/
cat src/app/(app)/facility/[id]/page.tsx | wc -l
head -100 src/app/(app)/facility/[id]/page.tsx

## 해야 할 것:

### 1. 정원 진행바 확인/개선
현원/정원 비율 막대:
- 60% 미만: bg-forest-500
- 60-90%: bg-warning
- 90%+: bg-danger

### 2. 액션 버튼 영역 개선
- '입소 신청' 버튼: color='dotori', 크게 (py-3)
- '관심 추가' 버튼: plain variant
- 버튼 사이 간격: gap-3

### 3. 시설 상태 뱃지
- available: Badge color='forest' '빈자리 있음'
- waiting: Badge color='amber' '대기 중'
- full: Badge color='red' '마감'

### 4. 불필요 UI/코드 제거
- 중복 정보 섹션 통합
- 사용되지 않는 변수/import 제거

### 5. TypeScript/ESLint
npx tsc --noEmit 오류 0개."
      ;;
    landing-clean)
      echo "랜딩 페이지 폴리싱 + 정리:

담당 파일: src/app/(landing)/landing/page.tsx 만 수정.

## 먼저 파일 읽기 (필수)
cat src/app/(landing)/landing/page.tsx | wc -l
head -100 src/app/(landing)/landing/page.tsx

## 해야 할 것:

### 1. 히어로 섹션 확인
- 헤드라인 간결한지 확인
- CTA 버튼: '무료로 시작하기' color='dotori'
- 통계 숫자: 20,027+ 시설 / 17개 시도

### 2. 기능 카드 단순화
3개 카드 이하로:
- 빈자리 실시간 확인
- AI 이동 상담
- 맞춤 알림

### 3. FAQ/후기 섹션 확인
- FAQ: 3-4개 항목 (아코디언 형태)
- 후기: 있으면 유지, 과도하면 3개로 축소

### 4. 불필요 코드 정리
- 사용되지 않는 변수/import 삭제
- 과도한 애니메이션 단순화

### 5. TypeScript/ESLint
npx tsc --noEmit 오류 0개."
      ;;
    engine-boost)
      echo "엔진 테스트 추가 확장 (최우선):

담당 파일: src/__tests__/engine/, src/lib/engine/__tests__/
절대 건드리지 않을 파일: 위 test 디렉토리 외 모든 것

## 현황 파악 (필수)
npx jest --passWithNoTests 2>&1 | tail -5
ls src/__tests__/engine/ 2>/dev/null || echo 없음
ls src/lib/engine/__tests__/ 2>/dev/null || echo 없음

## 현재 테스트 40개. 목표: 50개+

### 1. intent-classifier 엣지 케이스 추가
파일: src/__tests__/engine/intent-classifier.test.ts
- 빈 문자열 → general
- 이모지만 → general
- 매우 긴 문장 → 정상 분류
- 혼합 의도: '반편성도 맘에 안 들고 국공립 빈자리도 보고 싶어요' → transfer 또는 recommend

### 2. nba-engine 엣지 케이스 추가
파일: src/__tests__/engine/nba-engine.test.ts
- 모든 필드 null인 사용자 → crash 없이 기본 NBA 반환
- 대기중인 시설 있음 → '대기 순번 확인' NBA 포함
- alertCount > 0 → '알림 확인' NBA 포함

### 3. why-engine 추가 시나리오
파일: src/lib/engine/__tests__/why-engine.test.ts
- capacity.waiting === 0 인 시설 → public_waitlist reason 없음
- 특수문자 시설명 → crash 없음

### 4. response-builder 추가 시나리오
파일: src/lib/engine/__tests__/response-builder.test.ts
- explain + 시설 없음 → text + actions 블록
- status + userId 있음 → 대기 정보 포함

## 완료 기준
npx jest --passWithNoTests → 50개+ 테스트 pass. 실패 0개."
      ;;
    e2e-update)
      echo "E2E 테스트를 R11 단순화된 UI에 맞게 업데이트해라:

담당 파일: src/__tests__/e2e/ 디렉토리 내 파일만 수정.

## 현황 파악 (필수)
ls src/__tests__/e2e/
cat src/__tests__/e2e/home.spec.ts 2>/dev/null || echo 없음

## 해야 할 것:

### 1. 홈페이지 E2E 업데이트 (home.spec.ts)
R11에서 page.tsx가 대폭 변경됨:
- 히어로가 없어짐 → 인사말 + AI 토리 카드 + 빈자리 섹션
- 확인: '도토리에 오신 것을 환영해요' 텍스트 존재
- 확인: AI 토리 카드 클릭 → /chat 이동
- 확인: '내 주변 빈자리' 섹션 존재
- 확인: 커뮤니티 링크 1줄 존재

### 2. 탐색 E2E 확인 (explore.spec.ts)
기존 테스트 확인:
- placeholder: '이동 고민? 내 주변 빈자리 먼저 확인해요'
- 검색 동작 확인
- 이동 시나리오 칩 존재 확인 (새로 추가된 경우)

### 3. 채팅 E2E 확인 (chat.spec.ts)
기존 테스트가 sendMessage 변경으로 깨졌는지 확인.
깨진 셀렉터 업데이트.

### 4. 온보딩 E2E 확인 (onboarding.spec.ts)
기존 테스트 유지 확인. .first() 패턴 유지.

npx playwright test --list 로 테스트 목록 확인.
npx tsc --noEmit 오류 0개."
      ;;
    *)
      echo "agent_task_registry.md 에서 $agent 담당 작업을 확인해라."
      ;;
  esac
}

### ═══════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ㄱ 파이프라인 v2 — ROUND: ${ROUND}               ║${NC}"
echo -e "${BLUE}║  목표: 탐색/시설/랜딩 폴리싱 + 엔진 50+ 테스트  ║${NC}"
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
[ "$LINT_ERRORS" -gt 0 ] && warn "ESLint errors: ${LINT_ERRORS}개 (r6-eslint-infra가 수정)" || ok "ESLint clean"

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
    # .env.local 복사
    cp "$APP/.env.local" "$WT_APP_DIR/.env.local" 2>/dev/null || true
    # node_modules 하드링크 복사 (symlink는 Turbopack이 거부)
    cp -al "$APP/node_modules" "$WT_APP_DIR/node_modules"
    # git 쓰기 권한 (워크트리 전체 + .git 메타)
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
5. **디자인 시스템 필수 사용** (위반 시 빌드 실패 간주):
   - Catalyst: Button, Badge, Input, Fieldset, Field, Select, Heading, Text
   - Dotori: Skeleton, EmptyState, ErrorState, FacilityCard, AiBriefingCard
   - 임의 픽셀값 금지: text-[Npx] → text-xs/sm/base/lg/xl 사용
   - 커스텀 className 대신 Tailwind 스케일 토큰 사용
6. npx tsc --noEmit 실행 — TypeScript 에러 없어야 함 (npm run build는 launch.sh가 자동 실행)
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

# ─── 에이전트 변경사항 자동 커밋 (sandbox 외부에서 실행) ───
info "에이전트 변경사항 자동 커밋..."
echo ""
for AGENT in "${AGENTS[@]}"; do
  WT_DIR="$WT_BASE/$ROUND-$AGENT"
  printf "  %-28s" "$AGENT"
  CHANGES=$(git -C "$WT_DIR" status --porcelain 2>/dev/null | wc -l)
  if [[ $CHANGES -gt 0 ]]; then
    git -C "$WT_DIR" add -A 2>/dev/null
    git -C "$WT_DIR" commit -m "feat($ROUND-$AGENT): 수익화 퍼널 구현" 2>/dev/null \
      && echo "✅ ($CHANGES files changed)" \
      || echo "❌ commit 실패"
  else
    echo "⚠️  변경없음"
  fi
done

# ─── 빌드 검증 (병렬 4개 동시 — 11×19s → ~40s 병목 해소) ───
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
  # 동시 실행 수 제한: MAX_PARALLEL 초과 시 가장 오래된 것 대기
  running=$(jobs -p | wc -l)
  while [[ $running -ge $MAX_PARALLEL ]]; do
    sleep 1
    running=$(jobs -p | wc -l)
  done
done
# 모든 빌드 완료 대기 + 결과 수집
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
    git commit -m "feat($ROUND-$AGENT): $SUMMARY

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
npm test 2>&1 | grep -E "Tests:|Test Suites:" | tail -3

for AGENT in "${AGENTS[@]}"; do
  git -C "$REPO" worktree remove --force "$WT_BASE/$ROUND-$AGENT" 2>/dev/null || true
  git -C "$REPO" branch -D "codex/$ROUND-$AGENT" 2>/dev/null || true
done
git -C "$REPO" worktree prune 2>/dev/null || true
ok "워크트리 정리 완료"

### ═══ 최종 리포트 ═══════════════════════════════════════════════════
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  R6 완료 — $(date +%H:%M)  수익화 퍼널 구현              ║${NC}"
printf "${BLUE}║  Merged %-3d  Failed %-3d  Skipped %-3d           ║${NC}\n" "${#MERGED[@]}" "${#FAIL[@]}" "${#SKIPPED[@]}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "  다음 단계:"
echo "  1. /pr-review-toolkit  — 코드 리뷰"
echo "  2. /commit-commands    — 최종 커밋"
echo "  3. git push origin main"
echo "  4. doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2"
echo ""
