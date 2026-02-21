#!/bin/bash
# ㄱ 파이프라인 v2 — 11 Codex 병렬 실행 (비즈니스 플랜 중심)
# Usage: ./scripts/launch.sh [ROUND=r6]

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r6}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(eslint-fix premium-model admin-api unit-tests explore-ux landing-upgrade home-dashboard chat-engine e2e-chat e2e-explore e2e-onboarding)
MERGE_ORDER=(eslint-fix premium-model admin-api unit-tests explore-ux home-dashboard chat-engine landing-upgrade e2e-onboarding e2e-explore e2e-chat)
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
    eslint-fix)
      echo "ESLint 에러를 모두 제거해라. 먼저 npx eslint src --ext ts,tsx 실행해서 에러 목록 확인.

주요 패턴:
- 'any' 타입 → 명시적 타입으로 교체
- impure function during render → useEffect/useCallback 내부로 이동
- unused variables → 제거 또는 _prefix 사용
- missing deps in useEffect/useCallback → deps 배열 보완

담당 파일: ESLint가 리포트하는 에러 파일만 수정. npm run build도 에러 없어야 함."
      ;;
    premium-model)
      echo "PREMIUM_SPEC.md Task 1-3을 구현해라 (B2B 시설 프리미엄 기반):

1) src/models/Facility.ts 수정 — premium 서브스키마 추가:
   premium?: {
     isActive: boolean;        // default: false
     plan: 'basic' | 'pro';
     startDate: Date;
     endDate: Date;
     features: string[];
     sortBoost: number;        // default: 0, 검색 정렬 가중치
     verifiedAt?: Date;
     contactPerson?: string;
     contactPhone?: string;
     contactEmail?: string;
   }
   주의: 기존 필드 변경 금지. optional 서브스키마로 추가.

2) src/types/dotori.ts 수정 — FacilityPremium 인터페이스 추가:
   export interface FacilityPremium {
     isActive: boolean;
     plan: 'basic' | 'pro';
     features: string[];
     sortBoost: number;
     verifiedAt?: string;
   }
   기존 Facility 인터페이스에 premium?: FacilityPremium; 추가

3) src/lib/dto.ts 수정 — toFacilityDTO에서 premium 매핑:
   premium.isActive === true 인 경우에만 DTO에 premium 포함.
   false이거나 없으면 DTO에 premium 미포함 (프론트에 노출 안 됨)"
      ;;
    admin-api)
      echo "PREMIUM_SPEC.md Task 4+6을 구현해라 (시설 정렬 + Admin API):

1) src/app/api/facilities/route.ts 수정 — sortBoost 정렬:
   검색/필터 결과에서 premium.isActive=true && premium.sortBoost>0 인 시설을 상단 노출.
   MongoDB aggregate 또는 sort 활용. 동일 조건 시 sortBoost 내림차순.

2) src/app/api/admin/facility/[id]/premium/route.ts 신규:
   PUT 엔드포인트:
   - Authorization: Bearer ${process.env.CRON_SECRET} 검증 (없으면 401)
   - body: { isActive: boolean, plan: 'basic'|'pro', sortBoost: number, features?: string[] }
   - Facility 모델 premium 필드 업데이트 (upsert)
   - 응답: { success: true, facilityId, premium: { isActive, plan, sortBoost } }"
      ;;
    unit-tests)
      echo "핵심 엔진 유닛 테스트를 작성해라 (Jest):

먼저 src/lib/engine/ 디렉토리의 파일들을 읽어서 실제 함수 시그니처 파악.

1) src/__tests__/engine/intent-classifier.test.ts 신규:
   이동 수요 시나리오 인텐트 분류 테스트:
   - '이동하고 싶어요' → 이동/전원 관련 인텐트
   - '반편성이 맘에 안들어요' → 반편성 관련
   - '선생님이 또 바뀌었어요' → 교사 교체 관련
   - '국공립 대기 당첨됐어요' → 국공립 당첨 관련
   - '강남구 어린이집 추천해줘' → 시설 탐색 관련
   실제 함수를 import해서 테스트. mock은 최소화.

2) src/__tests__/lib/dto.test.ts 신규 (있으면 보완):
   - toFacilityDTO: premium.isActive=false → premium 필드 없음
   - toFacilityDTO: premium.isActive=true → premium 필드 포함
   - toFacilityDTO: premium 없는 시설 → premium 미포함

3) 파일이 없으면 src/__tests__/smoke.test.ts 에 기본 import 스모크 테스트 추가.
   테스트 실행: npx jest --passWithNoTests"
      ;;
    explore-ux)
      echo "탐색 페이지를 이동 수요 포지셔닝으로 개선해라:

src/app/(app)/explore/page.tsx 수정:

1) 검색창 placeholder 변경:
   현재: '이동할 시설 검색 (이름, 지역)'
   변경: '이동 고민? 내 주변 빈자리 먼저 확인해요'

2) 이동 수요 프롬프트 칩 추가 (POPULAR_SEARCHES 배열 개선):
   현재 칩들 유지하되 앞에 추가:
   ['반편성 불만', '교사 교체', '국공립 당첨', '이사 예정']
   → 클릭 시 해당 키워드로 검색

3) 이동 가능 시설 필터 버튼 강조:
   '이동 가능 시설' 필터 칩에 forest 색상 강조 (현재보다 눈에 띄게)
   또는 상단에 '이동 가능 시설만 보기' 토글 추가

4) 빈 결과 EmptyState 메시지 개선:
   '해당 조건의 시설이 없어요' → '이 조건의 이동 가능 시설이 없어요. 조건을 바꿔보세요'"
      ;;
    landing-upgrade)
      echo "랜딩 페이지 FAQ + 후기 섹션을 추가해라 (reference/template-components 참고):

src/app/(landing)/landing/page.tsx 수정:

1) FAQ 아코디언 섹션 추가 (페이지 하단 CTA 위):
   이동 수요 타겟 FAQ:
   Q: '지금 다니는 어린이집에서 이동하려면 어떻게 해야 하나요?'
   A: '도토리 탐색에서 빈자리 시설을 찾고, 관심 등록 후 연락해보세요. 이동 절차 가이드도 제공해요.'
   Q: '반편성 결과가 맘에 안들면 이동할 수 있나요?'
   A: '가능해요. 3월 초가 이동 최적 시기이며, 도토리가 인근 빈자리 시설을 바로 보여드려요.'
   Q: '국공립 대기번호가 당첨됐는데 현재 민간 어린이집과 어떻게 비교하나요?'
   A: '토리챗에 물어보면 AI가 두 시설을 비교 분석해드려요.'
   UI: details/summary 또는 useState로 토글. Tailwind만 사용.

2) 사용자 후기 섹션 추가 (FAQ 위):
   후기 카드 3개 (mock 데이터 OK):
   - 강남맘: '반편성 불만으로 이동 고민하다 도토리로 3일 만에 새 시설 찾았어요'
   - 성동맘: '국공립 당첨됐는데 현재 민간이랑 토리챗으로 비교해보니 답이 나오더라고요'
   - 서초맘: '교사 교체 후 불안했는데 빈자리 알림 걸어두고 기다렸다가 이동했어요'
   card 스타일: rounded-3xl bg-white border border-dotori-100 p-4, Avatar(이니셜), Text(dotori)"
      ;;
    home-dashboard)
      echo "홈 대시보드를 실제 데이터와 연동해라:

src/app/(app)/page.tsx 수정:

1) 관심 시설 섹션 실제 데이터 연동:
   현재 관심 시설이 있으면 각 시설의 최신 status 표시
   /api/facilities?ids=xxx 로 관심 시설 현황 fetch
   status='available'이면 '빈자리 있어요!' Toast/Badge 강조

2) 서비스 통계 카드 실제 숫자:
   시설 수: 20,027 (하드코딩 OK, DB 쿼리 비용 아낌)
   '실시간 AI 분석 중' 뱃지 추가

3) 이동 수요 NBA 카드:
   기존 NBA 카드 중 '이동 고민이라면?' 우선 노출:
   ActionCard title='이동 고민 중이세요?'
   description='AI 토리가 인근 빈자리 시설을 바로 찾아드려요'
   href='/explore' or href='/chat?prompt=이동'

4) 홈 헤더 인사말:
   비로그인: '어린이집 이동 고민, 도토리가 해결해드려요'
   로그인: '○○맘, 관심 시설 현황을 확인해보세요'"
      ;;
    chat-engine)
      echo "토리챗 이동 수요 엔진을 강화해라:

1) src/lib/engine/intent-classifier.ts 수정 (있으면):
   이동 수요 인텐트 추가/강화:
   - 반편성 키워드: '반편성', '반 배정', '같은 반', '친한 친구'
   - 교사교체 키워드: '선생님 바뀌', '교사 교체', '담임 바뀌'
   - 설명회실망 키워드: '설명회', '원장 태도', '시설이 낡'
   - 국공립당첨 키워드: '국공립 당첨', '대기 당첨', '연락 왔'
   - 이사예정 키워드: '이사', '이사 예정', '통원 거리'

2) src/lib/engine/response-builder.ts 수정 (있으면):
   이동 시나리오별 공감 응답 추가:
   - 반편성: '반편성 결과가 실망스러우셨군요. 이동 골든타임은 3월 초예요...'
   - 교사교체: '교사 교체 후 불안한 마음이 드실 수 있어요...'
   - 국공립당첨: '국공립 당첨 축하해요! 현재 시설과 비교해볼게요...'

3) 파일이 없으면 분석 결과만 docs로 정리 (수정 대상 없음으로 처리)"
      ;;
    e2e-chat)
      echo "토리챗 E2E 테스트를 작성해라 (Playwright):

src/__tests__/e2e/chat.spec.ts 신규:

import { test, expect } from '@playwright/test'
const BASE = process.env.BASE_URL || 'http://localhost:3000'

1) 게스트 채팅 쿼터 테스트:
   - /chat 접속
   - 입력창에 '강남구 국공립 추천해줘' 입력 후 전송
   - 응답 수신 또는 에러 메시지 확인
   - UsageCounter 또는 쿼터 표시 요소 확인

2) 채팅 UI 렌더 테스트:
   - 채팅 입력창 존재 확인 (textarea or input)
   - 전송 버튼 존재 확인
   - BottomTabBar 존재 확인

playwright.config.ts 없으면 신규 생성:
  testDir: 'src/__tests__/e2e'
  use: { baseURL: 'http://localhost:3000', headless: true }"
      ;;
    e2e-explore)
      echo "탐색 페이지 E2E 테스트를 작성해라 (Playwright):

src/__tests__/e2e/explore.spec.ts 신규:

1) 탐색 페이지 렌더 테스트:
   - /explore 접속 (waitUntil: 'load', timeout: 30000)
   - 검색창 존재 확인
   - 필터 칩 존재 확인 (국공립, 민간 등)

2) 검색 플로우 테스트:
   - 검색창에 '강남' 입력
   - debounce 대기 (500ms)
   - 시설 카드 또는 EmptyState 렌더링 확인

3) 탐색→상세 네비게이션 테스트:
   - 시설 카드가 있으면 클릭
   - URL이 /facility/로 시작하는지 확인

playwright.config.ts 활용 (e2e-chat 에이전트가 만든 것 사용)"
      ;;
    e2e-onboarding)
      echo "온보딩 플로우 E2E 테스트를 작성해라 (Playwright):

src/__tests__/e2e/onboarding.spec.ts 신규:

1) 온보딩 페이지 렌더 테스트:
   - /onboarding 접속
   - 온보딩 콘텐츠 렌더링 확인 (슬라이드 또는 스텝)
   - '시작하기' 또는 CTA 버튼 존재 확인

2) 온보딩 완주 테스트:
   - 슬라이더가 있으면 next 버튼 클릭 반복
   - 마지막 CTA 클릭
   - / 또는 /login으로 이동하는지 확인

3) 건너뛰기 테스트:
   - 건너뛰기 버튼이 있으면 클릭
   - 홈 또는 로그인으로 이동 확인

playwright.config.ts 활용"
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
echo -e "${BLUE}║  목표: 테스트 완전성 + B2B 프리미엄 기반        ║${NC}"
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
