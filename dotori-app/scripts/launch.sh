#!/bin/bash
# ㄱ 파이프라인 v2 — Codex 병렬 실행
# Usage: ./scripts/launch.sh [ROUND=r13] [MODEL=gpt-5.3-codex]
# spark 한도시: CODEX_MODEL=gpt-5.3-codex ./scripts/launch.sh r13

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r13}
CODEX_MODEL=${CODEX_MODEL:-gpt-5.3-codex}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(sec-users-me sec-subscriptions sec-chat-stream sec-admin middleware-fix search-sanitize nba-null-guard page-null-fix test-dedup waitlist-fix alert-logic)
MERGE_ORDER=(middleware-fix sec-users-me sec-subscriptions sec-chat-stream sec-admin search-sanitize nba-null-guard page-null-fix waitlist-fix alert-logic test-dedup)
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
    sec-users-me)
      echo "보안 수정: /api/users/me PATCH에서 plan 필드 제거

담당 파일: src/app/api/users/me/route.ts 만 수정.

## 문제 (P0 — 치명)
PATCH /api/users/me의 allowedFields 배열에 'plan'이 포함되어 있어,
인증된 사용자가 { \"plan\": \"premium\" }을 보내면 결제 없이 프리미엄 전환 가능.

## 수정 방법
1. allowedFields 배열에서 'plan' 문자열 제거
2. plan 변경 시도 시 무시되도록 (에러 안 내도 됨, 그냥 필터링)

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    sec-subscriptions)
      echo "보안+코드품질 수정: /api/subscriptions POST

담당 파일: src/app/api/subscriptions/route.ts 만 수정.

## 문제 1 (P0 — 치명)
POST /api/subscriptions에서 { plan: 'premium' }만 보내면 결제 없이 프리미엄 활성화.
amount: 0으로 하드코딩됨.

## 수정 1
- POST 핸들러 최상단에 현재 사용자의 role이 'admin'인지 체크
- admin이 아니면 403 반환: { error: '관리자만 구독을 생성할 수 있습니다' }
- 추후 결제 연동 시 이 체크를 결제 검증으로 교체할 수 있음

## 문제 2 (P2 — 코드품질)
withApiHandler에 schema를 전달하지 않고 핸들러 내부에서 req.json() + safeParse를 직접 수행.
다른 라우트와 패턴 불일치.

## 수정 2
- withApiHandler의 schema 옵션 사용으로 통일
- 핸들러에서는 body 파라미터 직접 사용

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    sec-chat-stream)
      echo "보안+안정성 수정: /api/chat/stream

담당 파일: src/app/api/chat/stream/route.ts 만 수정.

## 문제 1 (P0 — 게스트 채팅 제한 우회)
비인증 사용자의 사용량을 x-chat-guest-usage 헤더에서 파싱하는데,
이 값은 클라이언트 sessionStorage에서 전송. 공격자가 헤더를 0으로 조작하면 제한 우회.

## 수정 1
x-chat-guest-usage 헤더 의존을 제거.
대신 IP 기반 서버 측 카운트:
- 파일 최상단에 const guestUsageMap = new Map<string, { count: number; resetAt: number }>() 추가
- IP는 req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
- 월별 리셋: resetAt = 다음 달 1일 timestamp
- GUEST_LIMIT = 3 (기존 값 유지)
- 헤더 대신 guestUsageMap에서 카운트 확인

## 문제 2 (P1 — 스트림 미종료)
ReadableStream에서 에러 발생 시 스트림이 열린 채 남을 수 있음.

## 수정 2
ReadableStream 생성 시 cancel 콜백 추가:
cancel() { /* cleanup if needed */ }

## 문제 3 (P3 — UsageLog 모델 중복)
usageLogSchema와 UsageLog 모델이 이 파일 내에 인라인 정의됨.
별도 src/models/UsageLog.ts가 이미 존재.

## 수정 3
인라인 usageLogSchema + UsageLog 모델 정의 제거.
import UsageLog from '@/models/UsageLog' 추가.
(먼저 cat src/models/UsageLog.ts로 존재 확인)

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    sec-admin)
      echo "보안 수정: admin API 인증 강화

담당 파일: src/app/api/admin/facility/[id]/premium/route.ts 만 수정.

## 문제 (P1)
auth: false로 설정된 상태에서 CRON_SECRET Bearer 토큰만으로 인증.
세션 인증이 완전히 우회됨.

## 수정
1. withApiHandler에 auth: true로 변경 (또는 auth 옵션 제거 — 기본이 true)
2. 핸들러 내부에서 세션의 user.role === 'admin' 체크 추가
3. CRON_SECRET 체크는 유지 (세션 인증 OR CRON_SECRET 중 하나 통과하면 허용)
   - 세션 인증 성공 + admin role → 허용
   - Bearer CRON_SECRET 일치 → 허용 (cron job용)
   - 둘 다 실패 → 403

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    middleware-fix)
      echo "보안+성능 수정: middleware rate limit 메모리 누수

담당 파일: src/middleware.ts 만 수정.

## 문제 1 (P1 — 인메모리 rate limit)
rateLimitMap이 Map<string, number[]>로 선언되어 있는데,
오래된 IP 항목이 절대 삭제되지 않아 메모리 누수.

## 수정
rateLimitMap에 주기적 정리 로직 추가.
rate limit 체크 함수 내에서:
1. 현재 windowMs 밖의 타임스탬프는 배열에서 제거 (기존 로직 확인)
2. 매 100번째 요청마다 전체 맵 순회하여 빈 배열인 IP 항목 삭제
3. 맵 크기가 10000 초과하면 가장 오래된 항목부터 정리

구체적 구현:
let cleanupCounter = 0 (파일 최상단)
rate limit 함수 내:
cleanupCounter++
if (cleanupCounter % 100 === 0) {
  const now = Date.now()
  for (const [ip, timestamps] of rateLimitMap) {
    const valid = timestamps.filter(t => now - t < windowMs)
    if (valid.length === 0) rateLimitMap.delete(ip)
    else rateLimitMap.set(ip, valid)
  }
}

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    search-sanitize)
      echo "보안 수정: response-builder.ts에서 NoSQL \$text 검색 입력 새니타이즈

담당 파일: src/lib/engine/response-builder.ts 만 수정.

## 문제 (P1)
Facility.find({ \$text: { \$search: message } })에서 message가 사용자 채팅 원문.
MongoDB \$text의 특수문자(-, \", ')가 검색 로직에 영향.

## 수정
1. 파일 내에 sanitizeSearchQuery 헬퍼 함수 추가:
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[\"'\\\\]/g, '')  // 따옴표, 백슬래시 제거
    .replace(/[-~]/g, ' ')      // negation/fuzzy 연산자를 공백으로
    .trim()
    .slice(0, 200);             // 길이 제한
}

2. \$text: { \$search: message } 를 모두 \$text: { \$search: sanitizeSearchQuery(message) } 로 교체
   (파일 내 \$search 사용처 전부 찾아서 적용)

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    nba-null-guard)
      echo "타입안전성 수정: nba-engine.ts에서 non-null assertion 제거

담당 파일: src/lib/engine/nba-engine.ts 만 수정.

## 문제 (P2)
ctx.user!.children 등 non-null assertion(!)이 8곳에서 사용됨.
condition과 generate가 분리된 함수이므로 리팩토링 시 크래시 위험.

## 수정
각 generate 함수의 최상단에 null guard 추가:
- ctx.user! → if (!ctx.user) return { ... fallback NBA item }
- ctx.user!.children → ctx.user?.children ?? []
- ctx.user!.nickname → ctx.user?.nickname ?? '회원'

모든 ! (non-null assertion) 연산자를 optional chaining(?.) 또는
null guard 패턴으로 교체.

파일에서 '!' 를 grep하여 모든 위치 확인 후 수정.

## 검증
npx tsc --noEmit 에러 0개.
npx jest --passWithNoTests 기존 테스트 통과."
      ;;
    page-null-fix)
      echo "타입안전성 수정: 홈/대기 페이지 non-null assertion 제거

담당 파일 2개만 수정:
- src/app/(app)/page.tsx
- src/app/(app)/my/waitlist/page.tsx

## 문제 1 (P2 — page.tsx:70-71)
user != null && user!.nickname — 불필요한 ! assertion.

## 수정 1
user?.nickname ? \`\${user.nickname}님, 안녕하세요\` : '도토리에 오신 것을 환영해요'

## 문제 2 (P2 — waitlist/page.tsx:406-407)
item.requiredDocs!.length와 item.requiredDocs!.filter(...)

## 수정 2
item.requiredDocs?.length ?? 0
item.requiredDocs?.filter(...) ?? []
optional chaining으로 교체.

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    test-dedup)
      echo "코드품질: 중복 테스트 파일 정리

담당 파일: src/__tests__/engine/ 디렉토리 내 파일만 수정/삭제.

## 문제 (P2)
동일 모듈 테스트가 두 위치에 존재:
- src/__tests__/engine/nba-engine.test.ts
- src/lib/engine/__tests__/nba-engine.test.ts
- src/__tests__/engine/intent-classifier.test.ts
- src/lib/engine/__tests__/intent-classifier.test.ts

## 수정
1. 먼저 양쪽 파일 비교:
   cat src/__tests__/engine/nba-engine.test.ts | wc -l
   cat src/lib/engine/__tests__/nba-engine.test.ts | wc -l
   (더 완전한 파일 유지)

2. src/lib/engine/__tests__/ 위치를 정본으로 유지
3. src/__tests__/engine/의 중복 파일에서 src/lib/engine/__tests__/에 없는 테스트가 있으면
   정본에 병합(merge)
4. 병합 후 src/__tests__/engine/의 중복 파일 삭제

## 검증
npx jest --passWithNoTests → 기존 테스트 수 유지 또는 증가. 실패 0개."
      ;;
    waitlist-fix)
      echo "코드품질: waitlist API 이중 파싱 + 하드코딩 수정

담당 파일 2개만 수정:
- src/app/api/waitlist/route.ts
- src/app/api/waitlist/import/route.ts

## 문제 1 (P2 — route.ts)
const rawBody = await req.clone().json().catch(() => ({}));
withApiHandler가 이미 body를 파싱하여 body로 제공하는데,
Zod 스키마에 없는 필드를 위해 원본을 다시 파싱.

## 수정 1
waitlistCreateSchema에 누락된 필드 추가:
hasMultipleChildren: z.boolean().optional()
isDualIncome: z.boolean().optional()
isSingleParent: z.boolean().optional()
hasDisability: z.boolean().optional()
그 후 rawBody 대신 body에서 이 필드들 사용. req.clone().json() 제거.

## 문제 2 (P3 — import/route.ts:143,165)
childBirthDate ?? '2024-01-01' 하드코딩.

## 수정 2
아이 정보 없을 시 현재 연도 기준 기본값 사용:
const defaultBirthDate = new Date().getFullYear() + '-01-01'
childBirthDate ?? defaultBirthDate

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    alert-logic)
      echo "비즈니스로직 수정: 비프리미엄 vacancy 알림 처리

담당 파일: src/app/api/alerts/route.ts 만 수정.

## 문제 (P3)
비프리미엄 사용자가 vacancy 알림을 생성하면 즉시 active: false로 업데이트.
알림을 만들었다가 바로 비활성화 → DB 쓰기 낭비 + UX 혼란.

## 수정
비프리미엄 사용자가 vacancy 타입 알림 생성 시도 시:
1. DB에 저장하지 않고 즉시 응답 반환
2. 응답: 200 OK + { data: null, message: '빈자리 알림은 프리미엄 기능입니다', requiresPremium: true }
3. 기존의 알림 생성 후 비활성화 코드 제거

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
echo -e "${BLUE}║  ㄱ 파이프라인 v2 — ROUND: ${ROUND}               ║${NC}"
echo -e "${BLUE}║  목표: Opus 분석 P0~P2 보안+품질 11개 수정   ║${NC}"
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
5. npx tsc --noEmit 실행 — TypeScript 에러 없어야 함
6. 파일 생성·수정만 완료하면 됨 (git add/commit은 launch.sh가 자동 처리)"

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
    git -C "$WT_DIR" commit -m "fix($ROUND-$AGENT): Opus P0-P2 보안+품질 수정" 2>/dev/null \
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
    git commit -m "fix($ROUND-$AGENT): $SUMMARY

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
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  R13 완료 — ${ELAPSED_MIN}분  Opus P0-P2 보안+품질 수정  ║${NC}"
printf "${BLUE}║  Merged %-3d  Failed %-3d  Skipped %-3d           ║${NC}\n" "${#MERGED[@]}" "${#FAIL[@]}" "${#SKIPPED[@]}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "  다음 단계:"
echo "  1. git push origin main"
echo "  2. doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2"
echo ""
