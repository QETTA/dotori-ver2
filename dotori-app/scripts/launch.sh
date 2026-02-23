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
ALL_AGENTS=(r22-j r22-k r22-a r22-b r22-c r22-d r22-e r22-f r22-g r22-h r22-i)
MERGE_ORDER=(r22-j r22-k r22-a r22-b r22-c r22-d r22-e r22-f r22-g r22-h r22-i)

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

### ── 공통 컨텍스트 (R21 — DS 토큰 + 브랜드 에셋 강화) ──────────────────
SHARED_RULES='## 공통 규칙 (필수)
- text-[Npx] 절대 금지. 신규 시맨틱 토큰 우선 사용:
    헤딩: text-display(32px) text-h1(24px) text-h2(20px) text-h3(16px)
    본문: text-body(15px) text-body-sm(13px)
    소형: text-caption(11px) text-label(10px)
    위 없으면 기존 text-xs/sm/base/lg/xl 유지 (임의 px 금지)
- 폰트 굵기 기준: 헤딩 font-bold/semibold, 본문 font-medium/normal
- 브랜드 에셋: import { BRAND, BRAND_GUIDE } from "@/lib/brand-assets"
    앱 내부 소형 아이콘 → BRAND.symbol (symbolCorporate는 B2B 전용, 앱 내 금지)
    헤더 로고 → BRAND.lockupHorizontalKr h-7 (크기 통일)
    스플래시/온보딩 아이콘 → BRAND.appIconWarm
- DS 토큰: import { DS_STATUS, DS_GLASS, DS_LAYOUT } from "@/lib/design-system/tokens"
- motion/react만 사용: framer-motion import 금지
- color="dotori" → CTA 버튼, color="forest" → Badge 성공 표시만
- dark: 클래스 = dotori 팔레트 (bg-gray-* 금지)
- touch target: min-h-11 이상
- globals.css / layout.tsx / motion.ts / tokens.ts / brand-assets.ts 수정 금지
- Catalyst 컴포넌트(src/components/catalyst/*) 내부 수정 금지
- 담당 파일 외 수정 금지
- npx tsc --noEmit → TypeScript 에러 0개 필수'

### ── 에이전트별 태스크 R22 (스크린샷 기반 UX/UI 개선) ────────────────────
get_task() {
  local agent=$1
  case $agent in
    r22-a)
      echo "담당: src/app/(app)/page.tsx
[UX] 첫 방문 빈 상태 개선:
  - 상태카드(0건/0곳/0건) → 데이터 없을 때 행동 유도 메시지 (예: '온보딩 완료하면 주변 빈자리를 알려드려요')
  - 빈자리 0건일 때 EmptyState 대신 온보딩/탐색 CTA 버튼 표시
  - AI 브리핑 카드를 첫 화면 상단에 더 prominence 있게 배치 (그라데이션 배경 강화)
[타이포] text-xl → text-h2, text-2xl → text-h1, text-xs → text-caption (시맨틱 토큰 마이그레이션)"
      ;;
    r22-b)
      echo "담당: src/app/(auth)/login/page.tsx, src/app/(landing)/landing/page.tsx
[UX-login] 로그인 페이지: 로고 아래 여백 줄이고 CTA 영역을 뷰포트 중앙에 배치
[UX-landing] 랜딩 모바일 375px 최적화:
  - Hero 섹션: 텍스트 text-2xl→text-h1, 여백 py-16→py-10 (모바일에서 첫 CTA 빨리 보이게)
  - 통계 카드: grid-cols-2 유지하되 gap-3→gap-2, padding p-4→p-3 (컴팩트)
  - FAQ: 텍스트 크기 text-sm→text-body-sm
[타이포] 시맨틱 토큰 적용 (text-h1/h2/h3/body-sm/caption)"
      ;;
    r22-c)
      echo "담당: src/app/(app)/chat/page.tsx, src/components/dotori/chat/ChatPromptPanel.tsx
[UX] 제안 카드(이동 고민/반편성 불만/빈자리 탐색) → 카드 간 gap-3→gap-2.5, 아이콘+텍스트 정렬 fine-tune
[UX] 채팅 헤더: 토리 아바타+이름+온라인 상태 → 정보 밀도 최적화 (gap 축소)
[UX] 입력 필드: 전송 버튼 active:scale-[0.97] 확인, placeholder 텍스트 가독성
[타이포] 시맨틱 토큰 적용 (text-h2/h3/body-sm/caption/label)"
      ;;
    r22-d)
      echo "담당: src/app/(app)/explore/page.tsx, src/components/dotori/explore/ExploreSearchHeader.tsx,
       src/components/dotori/explore/ExploreSuggestionPanel.tsx
[UX 핵심] '이동 가능 시설만 보기' 버튼: bg-forest-500 → bg-dotori-400 text-white (Button에 forest 금지, Badge만)
  - 활성: bg-dotori-500 font-semibold text-white shadow-sm ring-1 ring-dotori-400/60
  - 비활성: bg-dotori-50 text-dotori-700 ring-1 ring-dotori-200
  - 활성 도트: bg-white, 비활성 도트: bg-dotori-500
[UX] 시나리오 칩(반편성 불만/교사 교체 등) → 간격 gap-2 유지, min-h-11 터치 타겟 확인
[타이포] 시맨틱 토큰 (text-h2/label/caption)"
      ;;
    r22-e)
      echo "담당: src/app/(app)/community/page.tsx, src/app/(app)/community/[id]/page.tsx,
       src/app/(app)/community/write/page.tsx
[UX 핵심] 커뮤니티 카드 리디자인 — 스크린샷에서 텍스트 벽으로 보임:
  - 카드 간 gap: space-y-2 → space-y-3 (호흡 확보)
  - 카드 내부: 카테고리 뱃지 + 제목 한 줄 → 본문 미리보기 2줄(line-clamp-2) → 메타(작성자·시간·좋아요)
  - 카드 배경: bg-white rounded-2xl ring-1 ring-dotori-100/70 shadow-sm (카드 느낌 강화)
  - 카테고리 뱃지: 각 카테고리별 일관된 color (dotori, forest) — Badge 컴포넌트 사용 권장
[UX] 상세 페이지: 댓글 카드 간 구분선 추가 (border-b border-dotori-100)
[타이포] 시맨틱 토큰 (text-h2/h3/body-sm/caption)"
      ;;
    r22-f)
      echo "담당: src/app/(app)/my/page.tsx, src/app/(app)/my/settings/page.tsx,
       src/app/(app)/my/app-info/page.tsx, src/app/(app)/my/support/page.tsx
[UX] 마이 페이지: 메뉴 항목을 Surface 카드로 그룹화 (계정·앱설정·지원 3그룹)
  - 그룹 간 gap: space-y-4, 그룹 내 항목: divide-y divide-dotori-100
[UX] 설정: 테마 토글 영역 → 현재 선택 상태 시각적으로 명확하게 (ring-2 ring-dotori-400)
[타이포] 시맨틱 토큰 (text-h2/h3/body-sm/caption)"
      ;;
    r22-g)
      echo "담당: src/app/(app)/my/waitlist/page.tsx, src/app/(app)/my/waitlist/[id]/page.tsx,
       src/app/(app)/my/notifications/page.tsx, src/app/(app)/my/interests/page.tsx
[UX] 대기 신청 카드: 순위 숫자 → Surface 카드 내부에 배치, 상태 뱃지 우측 정렬
[UX] 알림 카드: 읽음/안읽음 구분 → 안읽음은 border-l-2 border-l-dotori-400, 읽음은 border-l-transparent
[UX] 관심 시설: 카드 간 gap 확보, 삭제 버튼 터치 영역 min-h-11
[타이포] 시맨틱 토큰 (text-h2/h3/body-sm/caption)"
      ;;
    r22-h)
      echo "담당: src/components/dotori/facility/FacilityDetailClient.tsx,
       src/components/dotori/facility/FacilityCapacitySection.tsx,
       src/components/dotori/facility/FacilityContactSection.tsx,
       src/components/dotori/facility/FacilityOperatingSection.tsx
[UX] 섹션 간 구분 강화: 각 섹션 사이 border-b border-dotori-100 dark:border-dotori-800 + py-6
[UX] 정원 현황 섹션: 숫자 prominence 향상 (text-h1 font-bold for capacity numbers)
[UX] 연락처 섹션: 전화·주소 복사 버튼 min-h-11 터치 타겟
[타이포] 시맨틱 토큰 (text-h1/h2/h3/body-sm/caption)"
      ;;
    r22-i)
      echo "담당: src/app/(onboarding)/onboarding/page.tsx
[UX] 진행 바: bg-dotori-200 → bg-dotori-100 (배경), 활성 바 bg-dotori-400 → bg-dotori-500 (contrast 강화)
[UX] 성별 선택 버튼: 선택 시 ring-2 ring-dotori-400 bg-dotori-50 (현재 선택 명확히)
[UX] 하단 '다음' 버튼: sticky bottom-0 py-4 (항상 보이게, safe-area 포함)
[타이포] 시맨틱 토큰 (text-h1/h2/body-sm/caption)"
      ;;
    r22-j)
      echo "담당: src/components/dotori/EmptyState.tsx, src/components/dotori/ErrorState.tsx,
       src/components/dotori/PremiumGate.tsx, src/components/dotori/UsageCounter.tsx
[UX] EmptyState: 아이콘 크기 h-12 → h-14, 제목+설명 간격 조정 (gap-1→gap-2)
[UX] ErrorState: 재시도 버튼 color='dotori' 확인, 에러 메시지 가독성
[UX] PremiumGate: 잠금 아이콘 + 업그레이드 CTA prominence 강화
[UX] UsageCounter: 프로그레스 바 높이 h-1→h-1.5 (가시성), 텍스트 contrast
[타이포] 시맨틱 토큰 (text-h3/body-sm/caption/label)"
      ;;
    r22-k)
      echo "담당: src/components/dotori/BottomTabBar.tsx,
       src/components/dotori/blocks/TextBlock.tsx,
       src/components/dotori/blocks/ChecklistBlock.tsx,
       src/components/dotori/blocks/ActionsBlock.tsx
[UX] BottomTabBar: 활성 탭 → 아이콘 color dotori-500 + 레이블 font-semibold (현재 구분 약함)
[UX] TextBlock: 문단 간 spacing → space-y-2.5
[UX] ChecklistBlock: 체크 아이콘 → forest-500 (완료), dotori-300 (미완료)
[UX] ActionsBlock: 버튼 min-h-11 터치 타겟, gap-2 간격
[타이포] BottomTabBar 탭 레이블 text-xs → text-label"
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
  # NODE_ENV=development 가 쉘에 남아있으면 Next.js prerender 크래시 → unset
  if env -u NODE_ENV npm run build > "$BUILD_LOG" 2>&1; then
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
WT_IDX=0
for AGENT in "${AGENTS[@]}"; do
  # 0.3초 스태거: git config.lock 동시 접근 충돌 방지
  sleep "0.$(printf '%02d' $((WT_IDX * 3 % 100)))"
  (
    if git -C "$REPO" worktree add "$WT_BASE/$ROUND-$AGENT" -b "codex/$ROUND-$AGENT" 2>/dev/null; then
      WT_APP_DIR="$WT_BASE/$ROUND-$AGENT/dotori-app"
      cp "$APP/.env.local" "$WT_APP_DIR/.env.local" 2>/dev/null || true
      cp -al "$APP/node_modules" "$WT_APP_DIR/node_modules" 2>/dev/null || true
      chmod -R 777 "$WT_BASE/$ROUND-$AGENT/" 2>/dev/null || true
      echo "✅ $ROUND-$AGENT"
    else
      # 재시도 1회 (lock 해제 후)
      sleep 1
      if git -C "$REPO" worktree add "$WT_BASE/$ROUND-$AGENT" -b "codex/$ROUND-$AGENT" 2>/dev/null; then
        WT_APP_DIR="$WT_BASE/$ROUND-$AGENT/dotori-app"
        cp "$APP/.env.local" "$WT_APP_DIR/.env.local" 2>/dev/null || true
        cp -al "$APP/node_modules" "$WT_APP_DIR/node_modules" 2>/dev/null || true
        chmod -R 777 "$WT_BASE/$ROUND-$AGENT/" 2>/dev/null || true
        echo "✅ $ROUND-$AGENT (재시도)"
      else
        echo "❌ $ROUND-$AGENT 생성 실패"
      fi
    fi
  ) &
  WT_PIDS+=($!)
  WT_IDX=$((WT_IDX + 1))
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
