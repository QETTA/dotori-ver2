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

AGENTS=(eslint-infra subscription-api analytics-track premium-gate chat-quota facility-premium alert-premium home-upsell my-upgrade landing-b2c onboarding-value)
MERGE_ORDER=(eslint-infra analytics-track subscription-api premium-gate chat-quota alert-premium facility-premium home-upsell my-upgrade landing-b2c onboarding-value)
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
    eslint-infra)
      echo "두 가지 작업을 해라:
1) src/components/dotori/PageTransition.tsx ESLint 에러 수정:
   - Cannot call impure function during render → useEffect 내부로 이동
   - Unexpected any 타입 제거
2) .dockerignore 신규 생성 (node_modules, .next, .env*, .git 제외)
3) src/middleware.ts rate limiting 추가 (Map 기반 in-memory, /api/* 경로)"
      ;;
    subscription-api)
      echo "구독 시스템 API 기반을 만들어라 (결제 연동 준비):

1) src/models/Subscription.ts 신규:
   - userId, plan('free'|'premium'|'partner'), status('active'|'cancelled'|'expired')
   - startedAt, expiresAt, paymentMethod(optional), amount

2) src/app/api/subscriptions/route.ts 신규:
   - GET: 현재 사용자 구독 상태 조회
   - POST: 구독 생성/업그레이드 (실제 결제는 TODO, 지금은 mock — plan을 DB에 저장만)
   - body: { plan: 'premium' | 'partner' }
   - 성공 시 User.plan 업데이트

3) src/app/api/users/me/route.ts 수정:
   - PATCH allowedFields에 'plan' 추가 (어드민/구독 API에서 업데이트 가능)

주의: 실제 결제 로직 없음 (Stripe는 추후). 지금은 plan 필드 DB 업데이트만."
      ;;
    analytics-track)
      echo "사용량 추적 시스템을 만들어라 (채팅 쿼터 기반):

1) src/models/UsageLog.ts 신규:
   - userId, type('chat'|'alert'|'export'), count, month(YYYY-MM 형식)
   - 월별 카운터: 같은 userId + type + month면 upsert

2) src/app/api/analytics/usage/route.ts 신규:
   - GET: 현재 사용자의 이번 달 사용량 반환
   - Response: { chat: number, alert: number, limits: { free: { chat: 5 }, premium: { chat: -1 } } }

3) src/types/dotori.ts 에 UsageStats 타입 추가:
   { chat: number; alert: number; limits: { chat: number } }  (-1은 무제한)"
      ;;
    premium-gate)
      echo "프리미엄 게이트 공통 컴포넌트를 만들어라:

1) src/components/dotori/PremiumGate.tsx 신규:
   Props: { feature: string; description: string; children: ReactNode; isPremium: boolean }
   - isPremium=true면 children 그대로 렌더
   - isPremium=false면 잠금 오버레이 + '프리미엄으로 업그레이드' CTA 버튼 표시
   - 버튼 클릭 → /my/settings 로 이동
   - 디자인: dotori 색상, 잠금 아이콘(HeroIcons LockClosedIcon)

2) src/components/dotori/UsageCounter.tsx 신규:
   Props: { current: number; limit: number; label: string }
   - 진행바 표시 (limit=-1이면 '무제한' 표시)
   - limit의 80% 이상 → amber 색상 경고
   - limit 초과 → red + '업그레이드' 링크"
      ;;
    chat-quota)
      echo "채팅 월 5회 무료 제한을 구현해라 (B2C 핵심 수익화):

1) src/app/(app)/chat/page.tsx 수정:
   - 페이지 로드 시 /api/analytics/usage fetch
   - 무료 사용자(plan=free): 채팅 5회/월 초과 시 PremiumGate 컴포넌트로 입력창 잠금
   - 채팅 창 상단에 UsageCounter 표시 (예: '이번 달 3/5회 사용')
   - 잠금 상태에서 '업그레이드하면 무제한으로 대화해요' 메시지

2) src/app/api/chat/stream/route.ts 수정:
   - 요청 시 userId + 이번 달 chat 카운트 확인
   - free 플랜 + count >= 5 → 403 반환 { error: 'quota_exceeded', message: '이번 달 무료 채팅 횟수를 모두 사용했어요. 프리미엄으로 업그레이드하면 무제한으로 대화할 수 있어요.' }
   - 성공 시 UsageLog upsert (count+1)
   - 비로그인 → 3회 제한 (sessionStorage 기반 간단 카운트)"
      ;;
    facility-premium)
      echo "시설 상세에 인증 파트너 기능을 렌더링해라 (B2B 가치 증명):

1) src/app/(app)/facility/[id]/FacilityDetailClient.tsx 수정:
   - facility.isPremium=true인 경우 '인증 파트너' 배지 표시 (forest 색상, ShieldCheckIcon)
   - facility.premiumProfile.directorMessage 있으면 원장 한마디 섹션 표시
   - facility.premiumProfile.programs 있으면 프로그램 목록 칩 표시
   - facility.premium.verifiedAt 있으면 '검증일: YYYY.MM' 표시
   - 비프리미엄 시설에는 '이 시설은 아직 파트너 미가입' 안내 (선택)"
      ;;
    alert-premium)
      echo "빈자리 알림을 프리미엄 전용으로 처리해라 (B2C 핵심 가치):

1) src/app/(app)/my/waitlist/page.tsx 수정:
   - 무료 사용자: 대기 신청은 가능, 즉시 알림은 PremiumGate로 잠금
   - '빈자리 즉시 알림'은 프리미엄 전용임을 명시
   - 무료: '빈자리 생기면 앱 열었을 때 확인 가능', 프리미엄: '빈자리 즉시 푸시 알림'
   - 업그레이드 CTA: '월 1,900원으로 즉시 알림 받기'

2) src/app/api/alerts/route.ts 수정 (있으면):
   - 알림 생성 시 plan 확인 — free면 즉시 발송 안 하고 pending 상태만"
      ;;
    home-upsell)
      echo "홈 페이지에 프리미엄 업셀 요소를 추가해라:

src/app/(app)/page.tsx 수정:
1) 무료 사용자에게 배너 표시:
   - '빈자리 즉시 알림 서비스 — 월 1,900원'
   - 작은 카드형 배너, 닫기 가능(localStorage), dotori 색상
   - 클릭 → /my/settings

2) AI 브리핑 카드에 사용량 힌트:
   - 무료: '이번 달 N/5회 사용 · 프리미엄은 무제한'
   - 프리미엄: '프리미엄 이용 중 · 무제한 AI 대화'

3) 빈자리 알림 섹션:
   - 무료: 알림 수 대신 '프리미엄 전용 기능' 안내
   - 프리미엄: 실제 알림 카운트"
      ;;
    my-upgrade)
      echo "MY 페이지 플랜 업그레이드 UI와 settings 페이지를 구현해라:

1) src/app/(app)/my/page.tsx 수정:
   - 무료 사용자 플랜 섹션에 업그레이드 카드 추가:
     '프리미엄 · 월 1,900원' — 즉시 알림, 무제한 AI, 우선 매칭
   - '지금 시작하기' 버튼 → /my/settings

2) src/app/(app)/my/settings/page.tsx 신규 생성:
   - 현재 플랜 표시 (free / premium)
   - 프리미엄 혜택 목록:
     ✓ 빈자리 즉시 알림
     ✓ 토리챗 무제한 대화
     ✓ 이동 우선 매칭
   - '프리미엄 시작하기' 버튼 (클릭 → /api/subscriptions POST, mock 결제)
   - 프리미엄이면 '이용 중' 배지 + 다음 갱신일 표시
   - 고객센터 링크 (카카오톡 채널)"
      ;;
    landing-b2c)
      echo "랜딩 페이지에 B2C 프리미엄 플랜을 추가하고 CTA를 강화해라:

src/app/(landing)/landing/page.tsx 수정:
1) pricingPlans 배열에 B2C 플랜 추가:
   - 이름: '부모 프리미엄'
   - 가격: 월 1,900원
   - 혜택: 빈자리 즉시 알림, 토리챗 무제한, 이동 전략 리포트
   - 버튼: '무료로 시작하기' → /onboarding

2) 히어로 섹션 업데이트:
   - '어린이집 이동, 더 이상 혼자 고민하지 마세요'
   - 숫자 강조: 20,027개 시설 · AI 맞춤 분석 · 실시간 빈자리 알림

3) 사회적 증거 섹션 (신규):
   - '이미 N,NNN명의 부모가 사용 중' (mock 숫자 OK)
   - 후기 카드 2-3개"
      ;;
    onboarding-value)
      echo "온보딩에 프리미엄 가치 제안을 강화해라:

src/app/(onboarding)/onboarding/page.tsx 수정:
1) 슬라이드 중 프리미엄 가치 제안 슬라이드 추가/강화:
   - '빈자리 생기면 바로 알려드려요' 슬라이드
   - '토리챗 AI가 이동 전략을 짜줘요' 슬라이드
   - 가격 언급: '월 1,900원으로 시작'

2) 마지막 슬라이드 CTA 개선:
   - 현재: '시작하기' → /
   - 개선: '무료로 시작하기' (메인) + '프리미엄 보기' (서브, /my/settings 링크)

3) 건너뛰기 텍스트: '나중에' → '무료로 먼저 체험하기'"
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
echo -e "${BLUE}║  목표: 수익화 퍼널 구현 (B2C + B2B)            ║${NC}"
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
