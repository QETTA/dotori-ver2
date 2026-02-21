#!/bin/bash
# ㄱ 파이프라인 v2 — Codex 병렬 실행 (2026 AI UX + 비즈니스 플랜)
# Usage: ./scripts/launch.sh [ROUND=r11] [MODEL=gpt-5.3-codex-spark]
# spark 한도시: CODEX_MODEL=gpt-5.3-codex ./scripts/launch.sh r11

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r11}
# 모델 선택: spark 한도 시 gpt-5.3-codex 로 대체
CODEX_MODEL=${CODEX_MODEL:-gpt-5.3-codex-spark}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(home-simplify eslint-clean engine-tests chat-polish explore-polish facility-polish)
MERGE_ORDER=(eslint-clean engine-tests home-simplify chat-polish explore-polish facility-polish)
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
    home-simplify)
      echo "src/app/(app)/page.tsx 의 UI를 단순화하고 혼란 요소를 제거해라.

현재 문제: R10 에이전트가 너무 많은 섹션 추가 → 정보 과부하, 혼란스러움.

목표: 간결하고 명확한 홈 화면. 섹션 제거가 우선.

## 파일 읽기 먼저 (필수)
cat src/app/(app)/page.tsx | head -100

## 해야 할 것:
1) **섹션 축소** - 현재 섹션 목록 파악 후 다음만 남겨라:
   - 헤더 (인사말 + 이름)
   - AI 토리 입력 카드 (다크 카드 유지 — 핵심)
   - 빈자리 시설 섹션 (NBA 기반)
   - 하단 커뮤니티 링크 1줄 (섹션 X)
   제거 대상: 서비스 통계 가로스크롤, 이동 고민 긴급 섹션, 온보딩 CTA, 그 외 중복 배너

2) **헤더 단순화**:
   - 인사말: '{user}님, 안녕하세요' 또는 '도토리에 오신 것을 환영해요' 1줄
   - 부제: '어린이집 이동, 도토리가 함께해요' 1줄
   - 불필요한 아이콘/배지 제거

3) **AI 토리 카드** (bg-dotori-900 다크 카드 유지):
   - placeholder: '이동 고민이라면 뭐든 물어보세요'
   - 클릭 → /chat 이동
   - 칩 3개: 반편성 불만 / 교사 교체 / 국공립 당첨
   - 간결하게: 카드 내부 항목 3개 이하

4) **빈자리 섹션** (핵심 기능):
   - 제목: '내 주변 빈자리'
   - API 연동 유지 (기존 코드 활용)
   - FacilityCard compact 형태 유지

5) **TypeScript 오류 없어야 함**: npx tsc --noEmit 확인 필수
   - user 관련: user != null && user!.xxx 패턴 사용
   - stat.emphasized 같은 타입 에러: as { emphasized?: boolean } 캐스팅

전체적으로 코드 라인 수를 줄이는 것이 목표.
기존 기능(NBA, 시설 API, 상태관리)은 유지, UI만 단순화.
npx tsc --noEmit 최종 확인."
      ;;
    eslint-clean)
      echo "ESLint 경고를 전부 제거해라 (--max-warnings=0 기준):

먼저 현황 확인:
npx eslint src --format=compact 2>&1 | head -50

담당 범위: src/ 전체 (단, 다른 에이전트 담당 파일과 충돌 주의)
- home-simplify: src/app/(app)/page.tsx
- chat-polish: src/app/(app)/chat/page.tsx
- explore-polish: src/app/(app)/explore/page.tsx
- facility-polish: src/app/(app)/facility/

위 파일들의 ESLint 수정도 OK (overlap 허용 — ESLint fix는 안전한 수정).

주요 경고 패턴:
1) unused-vars: 사용하지 않는 변수/import 제거
   - 예: 'ArrowPathIcon' defined but never used → import 제거
   - 예: 'premiumProfile' assigned but never used → 변수 제거
   - 예: 'si' is defined but never used → 제거
   - 예: 'authorId', 'dataQuality', 'kakaoPlaceUrl', 'roomCount', 'teacherCount', 'establishmentYear', 'operatingHours' 등

2) unused-disable-directive: 불필요한 eslint-disable 주석 제거
   - 예: 'Unused eslint-disable directive (no problems were reported from react-hooks/set-state-in-effect)'
   - 해당 줄 eslint-disable 주석 삭제

3) exhaustive-deps: useCallback/useEffect 의존성 배열 수정
   - sendMessage, monthKey 등 누락된 의존성 추가 (또는 useCallback 밖으로 이동)
   - 단, 의도적으로 빈 배열인 경우 // eslint-disable-next-line react-hooks/exhaustive-deps 주석 추가

4) no-img-element: <img> → next/image <Image> 교체
   - import Image from 'next/image' 추가
   - <img src={...} alt={...} width={N} height={N} /> 형태로 변환

5) @typescript-eslint/no-unused-vars: _ prefix 규칙
   - 사용 안 되는 파라미터: 언더스코어 prefix 또는 제거

각 파일 수정 후 npx tsc --noEmit 로 TypeScript 에러 없는지 확인.
최종: npx eslint src --max-warnings=0 통과 목표."
      ;;
    engine-tests)
      echo "엔진 테스트 완전성 확보 (항상 최우선 과제):

담당 파일: src/__tests__/engine/, src/lib/engine/__tests__/
절대 건드리지 않을 파일: 위 test 디렉토리 외 모든 것

## 먼저 현황 파악
ls src/__tests__/engine/ 2>/dev/null || echo 없음
ls src/lib/engine/__tests__/ 2>/dev/null || echo 없음
npx jest --passWithNoTests 2>&1 | tail -10

## 구현 목표

### 1. intent-classifier 테스트 (src/__tests__/engine/intent-classifier.test.ts)
파일 있으면 보완, 없으면 신규:
- import { classifyIntent } from '@/lib/engine/intent-classifier'
- 이동 시나리오 → transfer/recommend/knowledge/status/checklist/compare intent
- '반편성 결과 실망' → transfer 포함
- '교사 바뀌었어요' → transfer 포함
- '강남구 빈자리' → recommend 포함
- '서류 준비' → knowledge 또는 checklist 포함

### 2. nba-engine 테스트 (src/__tests__/engine/nba-engine.test.ts)
파일 있으면 보완, 없으면 신규:
- import { generateNBA } from '@/lib/engine/nba-engine'
- 미등록 아이: '아이 등록' NBA 포함
- 이동 의향 있음: '빈자리 알림' NBA 포함
- 관심 시설 있음: '시설 비교' NBA 포함

### 3. why-engine 추가 테스트 (src/lib/engine/__tests__/why-engine.test.ts)
기존 파일에 테스트 추가:
- 민간 시설 + 교사 1명: teacher_turnover reason 포함 (이미 있으면 skip)
- 국공립 + 대기 12명: public_waitlist reason 포함 (이미 있으면 skip)

### 4. response-builder 추가 테스트 (src/lib/engine/__tests__/response-builder.test.ts)
기존 파일에 추가:
- transfer + 교사교체 → empathy 응답 포함
- checklist → categories 배열 포함 (이미 있으면 skip)

## 완료 기준
npx jest --passWithNoTests 2>&1 | grep -E 'Tests:|failed'
모든 테스트 pass. 새 테스트 최소 5개 추가."
      ;;
    chat-polish)
      echo "채팅 페이지 폴리싱 + ESLint 경고 수정:

담당 파일: src/app/(app)/chat/page.tsx 만 수정.

## 먼저 파일 읽기
head -100 src/app/(app)/chat/page.tsx

## 해야 할 것:

### 1. ESLint 경고 수정 (우선순위 최고)
현재 경고:
- useCallback missing dependency: 'sendMessage'
- useEffect missing dependency: 'sendMessage'
- useEffect missing dependency: 'monthKey'

수정 방법:
- sendMessage가 useCallback으로 만들어진 경우: deps 배열에 추가 또는 useCallback 재구성
- monthKey: useMemo로 감싸거나 deps 배열에 추가
- 의도적인 경우: // eslint-disable-next-line react-hooks/exhaustive-deps 주석

### 2. UI 폴리싱 (단순화 방향)
- 토리 온라인 상태 표시: 헤더에 작은 status dot (animate-pulse bg-forest-500)
- 사용량 표시: 기존 텍스트 → 간결한 'N/5' 표시 (progress bar는 단순하게)
- 빈 상태: 토리 아이콘 + '이동 고민이라면 뭐든 물어보세요' (지금도 있으면 개선만)

### 3. TypeScript 확인
npx tsc --noEmit 오류 없어야 함
motion/react 사용 시 'use client' 확인."
      ;;
    explore-polish)
      echo "탐색 페이지 폴리싱 + 정리:

담당 파일: src/app/(app)/explore/page.tsx 만 수정.

## 먼저 파일 읽기
head -120 src/app/(app)/explore/page.tsx

## 해야 할 것:

### 1. 이동 시나리오 칩 추가/확인
검색창 위 또는 바로 아래:
['반편성 불만', '교사 교체', '국공립 당첨', '이사 예정']
각 클릭 시 해당 텍스트로 search 상태 업데이트.
칩 스타일: rounded-full bg-dotori-50 border border-dotori-100 px-3 py-1 text-sm text-dotori-700

### 2. 빈 결과 개선
검색 결과 없을 때:
- '토리에게 물어보기' 버튼 (color='dotori') → Link href={'/chat?prompt=' + encodeURIComponent(search)}
- '다른 지역 보기' 버튼

### 3. Button color 수정 확인
color='forest' 를 Button에서 쓰고 있으면 color='dotori'로 변경.
(forest는 Badge 전용)

### 4. TypeScript 확인
npx tsc --noEmit 오류 없어야 함."
      ;;
    facility-polish)
      echo "시설 상세 페이지 폴리싱:

담당 파일: src/app/(app)/facility/[id]/page.tsx 만 수정.

## 먼저 파일 읽기
head -100 src/app/(app)/facility/[id]/page.tsx

## 해야 할 것:

### 1. 정원 진행바 확인/개선
이미 있으면: 현원/정원 비율 막대 색상 개선
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

### 4. 불필요 UI 제거
- 중복 정보 섹션이 있으면 하나로 통합
- 지나치게 긴 섹션 축소

### 5. ESLint warnings 해결
파일 내 unused vars, missing deps 모두 수정.
npx tsc --noEmit 오류 없어야 함."
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
echo -e "${BLUE}║  목표: 혼란 제거 + ESLint 클린 + 엔진 테스트    ║${NC}"
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
