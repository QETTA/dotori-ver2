#!/bin/bash
# ㄱ 파이프라인 v2 — Codex 병렬 실행 (2026 AI UX + 비즈니스 플랜)
# Usage: ./scripts/launch.sh [ROUND=r10]

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r10}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(home-redesign chat-upgrade landing-2026 explore-2026 motion-upgrade engine-tests premium-backend)
MERGE_ORDER=(premium-backend engine-tests home-redesign chat-upgrade landing-2026 explore-2026 motion-upgrade)
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
    home-redesign)
      echo "src/app/(app)/page.tsx 를 2026 글로벌 AI 서비스 UX 트렌드에 맞게 리디자인해라.

현재 문제:
- 섹션 8개 스택 → 정보 과부하
- 인터랙티브 위젯 없음
- AI 채팅 진입점이 작고 묻혀있음

목표 (이 파일만 수정):
1) 히어로 섹션 개선:
   - '어린이집 이동 고민, 도토리가 해결해드려요' → 더 임팩트 있게
   - 副headline: 반편성/교사교체/국공립당첨 3개 시나리오 pill 형태로 애니메이션 전환
   - 배경: dotori-50 그라디언트 (from-dotori-50 to-white)

2) 빠른 액션 개선:
   - 기존 4개 박스형 → 수평 스크롤 pill 버튼
   - 각 pill: emoji + label, bg-white border border-dotori-100 shadow-sm rounded-full
   - px-4 py-2.5 text-sm font-medium

3) AI 진입 위젯 추가 (홈 상단 눈에 띄게):
   - 큰 카드형: '토리에게 물어보세요' placeholder
   - 실제 클릭 시 /chat 이동 (Link 컴포넌트)
   - 카드: bg-dotori-900 text-white rounded-3xl px-5 py-4 (다크 카드)
   - 하단에 suggestPrompts 3개 (반편성/교사교체/국공립당첨) inline chips

4) 불필요 섹션 축소:
   - 커뮤니티 소식 → 최대 1줄 요약 링크로 대체 (섹션 제거)
   - 로그인 배너 → 최하단 단일 line (not full section)
   - NBA 아이템 → 이동 고민 NBA만 상단 유지, 나머지 최하단

5) 서비스 통계:
   - 시설 수(SERVICE_FACILITY_COUNT) 를 큰 숫자로 강조
   - 가로 스크롤 stat chip 3개: '20,027개 시설', '17개 시도', '실시간 업데이트'

motion/react 애니메이션 유지 (cardReveal, sectionStagger 패턴 이미 있음).
Catalyst Heading, Text, Button, Badge 컴포넌트 사용.
color='dotori' CTA, color='forest' 성공."
      ;;
    chat-upgrade)
      echo "토리챗 UI를 2026 AI 서비스 트렌드에 맞게 업그레이드해라:

담당 파일: src/app/(app)/chat/page.tsx 만 수정.

1) AI 아이덴티티 강화:
   - 채팅 상단: 토리 avatar 이미지(BRAND.TORI_ICON) + '토리 · 온라인' 상태 표시
   - status dot: animate-pulse bg-forest-500 w-2 h-2 rounded-full
   - 헤더 더 시각적으로: 토리 이름 font-semibold, 온라인 상태 badge

2) 사용량 표시 개선:
   - 기존 '이번 달 X/3회 사용' 텍스트 → 프로그레스 바 + 숫자 조합
   - 컨테이너: flex items-center gap-2 text-sm
   - progress bar: w-24 h-1.5 bg-dotori-100 rounded-full + inner bg-dotori-400
   - 게스트(3회)와 일반 유저(5회) 각각 처리

3) 제안 칩 애니메이션:
   - suggestedPrompts 렌더링 시 motion.div로 stagger 진입 애니메이션 추가
   - initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }
   - transition.staggerChildren: 0.06

4) 빈 상태 개선:
   - 채팅 히스토리 비었을 때: 토리 아이콘 + '이동 고민이라면 뭐든 물어보세요' 메시지
   - 이동 시나리오 칩 3개 항상 보이도록 (스크롤 없이)"
      ;;
    landing-2026)
      echo "랜딩 페이지를 2026 AI 서비스 비주얼 트렌드로 업그레이드해라:

담당 파일: src/app/(landing)/landing/page.tsx 만 수정.

1) 히어로 섹션 임팩트 강화:
   - 헤드라인: '반편성 불만·교사 교체·빈자리 탐색, 도토리가 한 번에' (기존 유지)
   - 서브헤드: '이동 수요 특화 AI — 전국 20,000+ 어린이집 실시간 연결'
   - 배지 추가: '무료로 시작' green badge + '월 1,900원' text
   - 통계 숫자 3개 수평 배치: 20,027 시설 / 17개 시도 / AI 매칭

2) 기능 카드 섹션 개선:
   - 아이콘 + 한 줄 헤드라인 + 한 줄 설명 구조로 명확화
   - 이동 시나리오별 기능: 반편성 탐색 / 교사교체 대응 / 국공립 당첨 비교
   - 각 카드: rounded-2xl bg-dotori-50 p-4, 좌측 컬러 아이콘

3) 후기 섹션 추가 (기존에 없으면 추가):
   - 3개 후기 카드: 강남맘/성동맘/서초맘 이동 성공 사례
   - rounded-2xl border border-dotori-100 bg-white p-4

4) FAQ 아코디언 추가 (기존에 없으면 추가):
   - useState로 열림/닫힘 토글
   - Q: '이동하려면 어떻게 하나요?' / '반편성 후 이동 가능한가요?' 등 3-4개"
      ;;
    explore-2026)
      echo "탐색 페이지를 2026 AI UX로 업그레이드해라:

담당 파일: src/app/(app)/explore/page.tsx 만 수정.

1) 검색창 placeholder 확인 및 필요시 변경:
   현재 placeholder 확인 후 '이동 고민? 내 주변 빈자리 먼저 확인해요'로 유지

2) 이동 수요 시나리오 칩 추가:
   검색창 포커스 시 또는 상단 고정 영역에:
   ['반편성 불만', '교사 교체', '국공립 당첨', '이사 예정'] 클릭 가능 칩
   → 클릭 시 해당 키워드로 setSearch() 호출

3) '이동 가능 시설' 필터 시각적 강조:
   이동 가능 시설 필터 칩에 이미 forest 색상 있으면 더 강조 (font-semibold)
   없으면 '이동 가능만' 토글을 hero 영역 바로 아래에 배치

4) 빈 결과 상태 개선:
   검색 결과 없을 때: AI 추천 받기 버튼 강조
   '토리에게 물어보기' button color='dotori' → /chat?prompt={검색어} 링크"
      ;;
    motion-upgrade)
      echo "motion/react 미세 인터랙션을 앱 전반에 추가해라 (2026 AI UX 트렌드):

담당 파일: src/components/dotori/ 내 컴포넌트들 (FacilityCard.tsx, ActionCard.tsx, FilterChip.tsx 등)

1) FacilityCard.tsx 카드 hover/press 효과:
   motion.div whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
   whileTap={{ scale: 0.98 }}
   transition={{ type: 'spring', stiffness: 400, damping: 30 }}

2) FilterChip.tsx 선택 애니메이션:
   선택 시 scale: [1, 1.08, 1] spring 바운스
   배경색 전환 layout transition 추가

3) EmptyState.tsx 진입 애니메이션:
   motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
   transition={{ duration: 0.4, ease: 'easeOut' }}

4) Skeleton.tsx 로딩 pulse 개선:
   animate-pulse 대신 motion/react gradient shimmer 효과
   (CSS 변수 활용: bg-gradient-to-r from-dotori-50 via-dotori-100 to-dotori-50)

주의: framer-motion import 절대 금지. motion/react 만 사용."
      ;;
    engine-tests)
      echo "엔진 테스트를 확장하고 커버리지를 높여라 (최우선 과제):

담당 파일: src/__tests__/engine/, src/lib/engine/__tests__/

1) intent-classifier 추가 테스트 (있으면 보완, 없으면 신규):
   다양한 이동 시나리오 문장 → 올바른 intent 매핑 확인
   - '반편성 결과가 너무 실망스러워요' → transfer 또는 반편성 intent
   - '교사가 또 바뀌었어요 너무 불안해' → transfer 또는 교사교체 intent
   - '강남구 국공립 빈자리 있어요?' → recommend/search intent
   - '입소 서류 어떻게 준비하나요?' → general/checklist intent
   실제 함수 import. mock 최소화.

2) response-builder 추가 테스트:
   - transfer intent + 반편성 시나리오 → 공감 응답 포함 확인
   - recommend intent → 시설 목록 응답 구조 확인

3) nba-engine 테스트 (있으면 보완):
   - 미등록 사용자 → '아이 등록' NBA 최우선 반환
   - 이동 의향 있는 사용자 → '빈자리 알림' NBA 포함

4) why-engine 추가 테스트:
   - 국공립 시설 + 대기 많음 → public_waitlist reason 포함
   - 교사 교체 이력 시설 → 교사 관련 reason 포함

테스트 실행 확인: npx jest --testPathPattern='engine' --passWithNoTests"
      ;;
    premium-backend)
      echo "B2B 프리미엄 백엔드를 완성해라 (PREMIUM_SPEC.md 미완성 태스크):

먼저 현재 상태 확인:
- cat src/models/Facility.ts | grep -A20 'premium'
- cat src/types/dotori.ts | grep -A10 'Premium'
- cat src/lib/dto.ts | grep -A15 'premium'
- cat src/app/api/admin/facility/'[id]'/premium/route.ts

이미 구현된 부분은 건드리지 말고 누락된 부분만 보완.

확인/보완 대상:
1) Facility.ts: premium 서브스키마 (isActive, plan, sortBoost, features)
2) types/dotori.ts: FacilityPremium 인터페이스 + Facility에 premium?: FacilityPremium
3) dto.ts: premium.isActive=true 일 때만 DTO에 premium 포함
4) admin API: PUT /api/admin/facility/[id]/premium
   - Bearer CRON_SECRET 인증
   - isActive, plan, sortBoost, features 업데이트
5) facilities/route.ts: sortBoost 기반 정렬 (premium 시설 상단)

누락된 것만 추가. 이미 있는 건 변경 금지."
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
echo -e "${BLUE}║  목표: 2026 AI UX 트렌드 + 엔진 테스트 풀가동   ║${NC}"
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

  codex exec -s workspace-write \
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
