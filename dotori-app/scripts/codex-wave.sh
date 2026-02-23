#!/bin/bash
# codex-wave.sh — Codex CLI 병렬 wave 실행기
# MCP 직렬 호출 병목 해결: Claude가 단일 Bash 호출로 N개 Codex를 wave 병렬 실행
#
# Usage: ./scripts/codex-wave.sh <tasks-file> [--wave=4] [--model=gpt-5.3-codex]
#   tasks-file: 라인별 "agent_id|파일목록|태스크설명" (파이프 구분)
#   --wave=N: wave 크기 (기본 4)
#   --model=M: Codex 모델 (기본 gpt-5.2)
#
# Example tasks file (tasks.txt):
#   a|src/app/(app)/page.tsx|Home 빈 상태 CTA 추가
#   b|src/app/(app)/chat/page.tsx|Chat 타이포그래피 정리
#   c|src/components/dotori/EmptyState.tsx|EmptyState 아이콘 크기 조정

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────
APP=$(cd "$(dirname "$0")/.." && pwd)
CODEX_MODEL=${CODEX_MODEL:-gpt-5.2}
WAVE_SIZE=4
TASKS_FILE=""

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; }
step() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }

### ── 인수 파싱 ───────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --wave=*)  WAVE_SIZE="${arg#--wave=}" ;;
    --model=*) CODEX_MODEL="${arg#--model=}" ;;
    *)         TASKS_FILE="$arg" ;;
  esac
done

if [ -z "$TASKS_FILE" ] || [ ! -f "$TASKS_FILE" ]; then
  echo "Usage: $0 <tasks-file> [--wave=N] [--model=M]"
  echo "  tasks-file: 라인별 'agent_id|files|description'"
  exit 1
fi

### ── 공통 규칙 ────────────────────────────────────────────────────────
SHARED_RULES='## 공통 규칙

### 디자인 미학 (Dotori 브랜드)
- Tone: Warm organic — 따뜻한 육아앱, 제네릭 AI 디자인 금지
- 카드: rounded-2xl/3xl, shadow-sm, ring-1 ring-dotori-100/70
- 모션: motion/react spring, whileTap feedback, 진입 stagger
- 배경: glass morphism (DS_GLASS), dotori-50 tint
- 공간: generous padding, border-b 섹션 구분

### 코드
- text-[Npx] 금지 → text-display/h1/h2/h3/body/body-sm/caption/label
- import { BRAND } from "@/lib/brand-assets"
- import { DS_STATUS, DS_GLASS } from "@/lib/design-system/tokens"
- motion/react만 (framer-motion 금지)
- color="dotori" CTA, color="forest" Badge만
- touch target: min-h-11
- 담당 파일 외 수정 금지
- npx tsc --noEmit → 0 에러'

### ── 태스크 로드 ──────────────────────────────────────────────────────
declare -a AGENT_IDS AGENT_FILES AGENT_DESCS
while IFS='|' read -r aid afiles adesc; do
  # 빈 줄/주석 건너뛰기
  [[ -z "$aid" || "$aid" == \#* ]] && continue
  AGENT_IDS+=("$aid")
  AGENT_FILES+=("$afiles")
  AGENT_DESCS+=("$adesc")
done < "$TASKS_FILE"

TOTAL=${#AGENT_IDS[@]}
WAVE_COUNT=$(( (TOTAL + WAVE_SIZE - 1) / WAVE_SIZE ))
RESULTS_DIR="/tmp/codex-wave-results"
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
printf "${BLUE}║  codex-wave: %d agents → %d waves (size %d)    ║${NC}\n" "$TOTAL" "$WAVE_COUNT" "$WAVE_SIZE"
printf "${BLUE}║  model: %-36s║${NC}\n" "$CODEX_MODEL"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"

PASS=(); FAIL=(); WAVE_ABORTED=0

### ── WAVE 루프 ────────────────────────────────────────────────────────
for WAVE_IDX in $(seq 0 $((WAVE_COUNT - 1))); do
  WAVE_NUM=$((WAVE_IDX + 1))
  WAVE_START=$((WAVE_IDX * WAVE_SIZE))
  WAVE_END=$((WAVE_START + WAVE_SIZE))
  [ "$WAVE_END" -gt "$TOTAL" ] && WAVE_END=$TOTAL

  step "Wave ${WAVE_NUM}/${WAVE_COUNT} (agents $((WAVE_START+1))-${WAVE_END})"

  # ── 병렬 Codex 발사 ──
  WAVE_PIDS=()
  WAVE_AIDS=()
  for i in $(seq $WAVE_START $((WAVE_END - 1))); do
    AID="${AGENT_IDS[$i]}"
    AFILES="${AGENT_FILES[$i]}"
    ADESC="${AGENT_DESCS[$i]}"
    WAVE_AIDS+=("$AID")

    PROMPT="## 담당 파일: ${AFILES}
## 작업: ${ADESC}

${SHARED_RULES}

## 순서
1. 담당 파일 읽기
2. 수정 실행
3. npx tsc --noEmit → 0 에러 확인"

    codex exec -m "$CODEX_MODEL" -s workspace-write \
      --cd "$APP" \
      -o "$RESULTS_DIR/${AID}.txt" \
      "$PROMPT" \
      > "$RESULTS_DIR/${AID}.log" 2>&1 &

    WAVE_PIDS+=($!)
    echo -e "  🚀 ${GREEN}${AID}${NC} (PID: ${WAVE_PIDS[-1]})"
  done

  # ── 완료 대기 ──
  WAVE_TS=$(date +%s)
  for j in "${!WAVE_PIDS[@]}"; do
    wait "${WAVE_PIDS[$j]}" 2>/dev/null
    echo "  ✓ ${WAVE_AIDS[$j]}"
  done
  WAVE_ELAPSED=$(( $(date +%s) - WAVE_TS ))
  ok "Wave ${WAVE_NUM} 완료 (${WAVE_ELAPSED}s)"

  # ── Inter-wave tsc 검증 ──
  echo "  tsc 검증..."
  TSC_OUT=$(cd "$APP" && npx tsc --noEmit 2>&1)
  TSC_EXIT=$?
  if [ "$TSC_EXIT" -eq 0 ]; then
    ok "tsc ✅ — 타입 에러 0개"
    for aid in "${WAVE_AIDS[@]}"; do PASS+=("$aid"); done
  else
    TSC_ERRORS=$(echo "$TSC_OUT" | grep -c "error TS" || echo "?")
    fail "tsc ❌ (${TSC_ERRORS} errors)"
    echo "$TSC_OUT" | grep "error TS" | head -10
    for aid in "${WAVE_AIDS[@]}"; do FAIL+=("$aid"); done

    if [ "$WAVE_NUM" -lt "$WAVE_COUNT" ]; then
      warn "Wave ${WAVE_NUM}에서 타입 에러 → 나머지 wave 중단"
      WAVE_ABORTED=1
      break
    fi
  fi

  echo ""
done

### ── 최종 리포트 ──────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
printf "${BLUE}║  완료: Pass %-3d  Fail %-3d  Aborted: %-9s║${NC}\n" "${#PASS[@]}" "${#FAIL[@]}" "$( [ $WAVE_ABORTED -eq 1 ] && echo 'yes' || echo 'no' )"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "결과: $RESULTS_DIR/"

[ "${#FAIL[@]}" -gt 0 ] && exit 1 || exit 0
