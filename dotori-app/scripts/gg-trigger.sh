#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=$(cd "$(dirname "$0")/.." && pwd)
BASE_URL="${BASE_URL:-http://127.0.0.1:3002}"
GG_MODE="${GG_MODE:-full}" # fast | full | auto
GG_SCREENSHOT_PASSES="${GG_SCREENSHOT_PASSES:-}"
GG_RUN_UX_GUARD="${GG_RUN_UX_GUARD:-0}"
GG_RUN_CONSOLE_GUARD="${GG_RUN_CONSOLE_GUARD:-1}"
GG_CONSOLE_BROWSER="${GG_CONSOLE_BROWSER:-chromium}"
GG_CONSOLE_CHANNEL="${GG_CONSOLE_CHANNEL:-chrome}"
GG_MULTI_AGENT="${GG_MULTI_AGENT:-0}"
GG_MULTI_AGENT_CMD="${GG_MULTI_AGENT_CMD:-npm run multi-agent:overdrive}"
GG_ADAPTIVE_ORCHESTRATION="${GG_ADAPTIVE_ORCHESTRATION:-1}"
GG_AUTO_MULTI_AGENT_MIN_ROUTE_LIMIT="${GG_AUTO_MULTI_AGENT_MIN_ROUTE_LIMIT:-50}"
GG_AUTO_MULTI_AGENT_MIN_STREAK="${GG_AUTO_MULTI_AGENT_MIN_STREAK:-2}"
GG_AUTO_UX_GUARD_MIN_ROUTE_LIMIT="${GG_AUTO_UX_GUARD_MIN_ROUTE_LIMIT:-40}"
GG_AUTO_UX_GUARD_MIN_STREAK="${GG_AUTO_UX_GUARD_MIN_STREAK:-1}"
GG_START_SERVER="${GG_START_SERVER:-0}"
GG_LOG_DIR="${GG_LOG_DIR:-/tmp/dotori-gg-trigger}"
GG_SELF_GROWTH="${GG_SELF_GROWTH:-1}"
GG_SELF_GROWTH_RESET="${GG_SELF_GROWTH_RESET:-0}"
GG_STATE_FILE="${GG_STATE_FILE:-$GG_LOG_DIR/self-growth.env}"
GG_MIN_NAV_RETRIES="${GG_MIN_NAV_RETRIES:-1}"
GG_MAX_NAV_RETRIES="${GG_MAX_NAV_RETRIES:-5}"
GG_MIN_NAV_TIMEOUT_MS="${GG_MIN_NAV_TIMEOUT_MS:-22000}"
GG_MAX_NAV_TIMEOUT_MS="${GG_MAX_NAV_TIMEOUT_MS:-60000}"
GG_MIN_SCREENSHOT_PASSES="${GG_MIN_SCREENSHOT_PASSES:-1}"
GG_MAX_SCREENSHOT_PASSES="${GG_MAX_SCREENSHOT_PASSES:-4}"
GG_NAV_RETRY_SIGNAL_THRESHOLD="${GG_NAV_RETRY_SIGNAL_THRESHOLD:-1}"
GG_MIN_QUALITY_RETRY_COUNT="${GG_MIN_QUALITY_RETRY_COUNT:-1}"
GG_MAX_QUALITY_RETRY_COUNT="${GG_MAX_QUALITY_RETRY_COUNT:-3}"
GG_MIN_QUALITY_RETRY_WAIT_MS="${GG_MIN_QUALITY_RETRY_WAIT_MS:-700}"
GG_MAX_QUALITY_RETRY_WAIT_MS="${GG_MAX_QUALITY_RETRY_WAIT_MS:-3000}"
GG_QUALITY_RETRY_SIGNAL_THRESHOLD="${GG_QUALITY_RETRY_SIGNAL_THRESHOLD:-1}"
GG_MIN_ROUTE_LIMIT="${GG_MIN_ROUTE_LIMIT:-20}"
GG_MAX_ROUTE_LIMIT="${GG_MAX_ROUTE_LIMIT:-60}"
GG_ROUTE_LIMIT_STEP="${GG_ROUTE_LIMIT_STEP:-10}"

mkdir -p "$GG_LOG_DIR"
LOG_TS=$(date +"%Y%m%d-%H%M%S")
LOG_DIR="$GG_LOG_DIR/$LOG_TS"
mkdir -p "$LOG_DIR"

SERVER_STARTED=0
DEV_PID=""
SCREENSHOT_LAST_LOG=""
SCREENSHOT_LAST_OK=0

LEARNED_NAV_RETRIES=2
LEARNED_NAV_TIMEOUT_MS=30000
LEARNED_SCREENSHOT_PASSES=2
LEARNED_QUALITY_RETRY_COUNT=1
LEARNED_QUALITY_RETRY_WAIT_MS=1200
LEARNED_ROUTE_LIMIT=20
LEARNED_SUCCESS_STREAK=0

EFFECTIVE_NAV_RETRIES=2
EFFECTIVE_NAV_TIMEOUT_MS=30000
EFFECTIVE_SCREENSHOT_PASSES=2
EFFECTIVE_QUALITY_RETRY_COUNT=1
EFFECTIVE_QUALITY_RETRY_WAIT_MS=1200
EFFECTIVE_ROUTE_LIMIT=20
RUN_MULTI_AGENT=0
RUN_UX_GUARD=0

cleanup() {
  if [ "$SERVER_STARTED" = "1" ] && [ -n "$DEV_PID" ]; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
    wait "$DEV_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

step() {
  echo
  echo "==> $1"
}

run_step() {
  local name="$1"
  local cmd="$2"
  local log_file="$LOG_DIR/$name.log"
  step "$name"
  if bash -lc "$cmd" >"$log_file" 2>&1; then
    echo "✓ $name"
    return 0
  fi
  echo "✗ $name (log: $log_file)"
  tail -n 40 "$log_file" || true
  return 1
}

clamp_int() {
  local value="$1"
  local min="$2"
  local max="$3"
  local clamped="$value"

  if [ "$clamped" -lt "$min" ]; then
    clamped="$min"
  fi
  if [ "$clamped" -gt "$max" ]; then
    clamped="$max"
  fi
  echo "$clamped"
}

load_self_growth_state() {
  if [ "$GG_SELF_GROWTH" != "1" ]; then
    return 0
  fi

  if [ "$GG_SELF_GROWTH_RESET" = "1" ]; then
    rm -f "$GG_STATE_FILE"
  fi

  if [ ! -f "$GG_STATE_FILE" ]; then
    return 0
  fi

  # shellcheck disable=SC1090
  source "$GG_STATE_FILE"

  LEARNED_NAV_RETRIES=$(clamp_int "${LEARNED_NAV_RETRIES:-2}" "$GG_MIN_NAV_RETRIES" "$GG_MAX_NAV_RETRIES")
  LEARNED_NAV_TIMEOUT_MS=$(clamp_int "${LEARNED_NAV_TIMEOUT_MS:-30000}" "$GG_MIN_NAV_TIMEOUT_MS" "$GG_MAX_NAV_TIMEOUT_MS")
  LEARNED_SCREENSHOT_PASSES=$(clamp_int "${LEARNED_SCREENSHOT_PASSES:-2}" "$GG_MIN_SCREENSHOT_PASSES" "$GG_MAX_SCREENSHOT_PASSES")
  LEARNED_QUALITY_RETRY_COUNT=$(clamp_int "${LEARNED_QUALITY_RETRY_COUNT:-1}" "$GG_MIN_QUALITY_RETRY_COUNT" "$GG_MAX_QUALITY_RETRY_COUNT")
  LEARNED_QUALITY_RETRY_WAIT_MS=$(clamp_int "${LEARNED_QUALITY_RETRY_WAIT_MS:-1200}" "$GG_MIN_QUALITY_RETRY_WAIT_MS" "$GG_MAX_QUALITY_RETRY_WAIT_MS")
  LEARNED_ROUTE_LIMIT=$(clamp_int "${LEARNED_ROUTE_LIMIT:-20}" "$GG_MIN_ROUTE_LIMIT" "$GG_MAX_ROUTE_LIMIT")
  LEARNED_SUCCESS_STREAK=$(clamp_int "${LEARNED_SUCCESS_STREAK:-0}" 0 9999)
}

resolve_growth_config() {
  if [ -n "${SCREENSHOT_NAV_RETRIES:-}" ]; then
    EFFECTIVE_NAV_RETRIES="$SCREENSHOT_NAV_RETRIES"
  else
    EFFECTIVE_NAV_RETRIES="$LEARNED_NAV_RETRIES"
  fi

  if [ -n "${SCREENSHOT_NAV_TIMEOUT_MS:-}" ]; then
    EFFECTIVE_NAV_TIMEOUT_MS="$SCREENSHOT_NAV_TIMEOUT_MS"
  else
    EFFECTIVE_NAV_TIMEOUT_MS="$LEARNED_NAV_TIMEOUT_MS"
  fi

  if [ -n "${GG_SCREENSHOT_PASSES:-}" ]; then
    EFFECTIVE_SCREENSHOT_PASSES="$GG_SCREENSHOT_PASSES"
  else
    EFFECTIVE_SCREENSHOT_PASSES="$LEARNED_SCREENSHOT_PASSES"
  fi

  if [ -n "${SCREENSHOT_QUALITY_RETRY_COUNT:-}" ]; then
    EFFECTIVE_QUALITY_RETRY_COUNT="$SCREENSHOT_QUALITY_RETRY_COUNT"
  else
    EFFECTIVE_QUALITY_RETRY_COUNT="$LEARNED_QUALITY_RETRY_COUNT"
  fi

  if [ -n "${SCREENSHOT_QUALITY_RETRY_WAIT_MS:-}" ]; then
    EFFECTIVE_QUALITY_RETRY_WAIT_MS="$SCREENSHOT_QUALITY_RETRY_WAIT_MS"
  else
    EFFECTIVE_QUALITY_RETRY_WAIT_MS="$LEARNED_QUALITY_RETRY_WAIT_MS"
  fi

  EFFECTIVE_NAV_RETRIES=$(clamp_int "$EFFECTIVE_NAV_RETRIES" "$GG_MIN_NAV_RETRIES" "$GG_MAX_NAV_RETRIES")
  EFFECTIVE_NAV_TIMEOUT_MS=$(clamp_int "$EFFECTIVE_NAV_TIMEOUT_MS" "$GG_MIN_NAV_TIMEOUT_MS" "$GG_MAX_NAV_TIMEOUT_MS")
  EFFECTIVE_SCREENSHOT_PASSES=$(clamp_int "$EFFECTIVE_SCREENSHOT_PASSES" "$GG_MIN_SCREENSHOT_PASSES" "$GG_MAX_SCREENSHOT_PASSES")
  EFFECTIVE_QUALITY_RETRY_COUNT=$(clamp_int "$EFFECTIVE_QUALITY_RETRY_COUNT" "$GG_MIN_QUALITY_RETRY_COUNT" "$GG_MAX_QUALITY_RETRY_COUNT")
  EFFECTIVE_QUALITY_RETRY_WAIT_MS=$(clamp_int "$EFFECTIVE_QUALITY_RETRY_WAIT_MS" "$GG_MIN_QUALITY_RETRY_WAIT_MS" "$GG_MAX_QUALITY_RETRY_WAIT_MS")
}

save_self_growth_state() {
  if [ "$GG_SELF_GROWTH" != "1" ]; then
    return 0
  fi

  mkdir -p "$(dirname "$GG_STATE_FILE")"
  cat >"$GG_STATE_FILE" <<EOF
LEARNED_NAV_RETRIES=$LEARNED_NAV_RETRIES
LEARNED_NAV_TIMEOUT_MS=$LEARNED_NAV_TIMEOUT_MS
LEARNED_SCREENSHOT_PASSES=$LEARNED_SCREENSHOT_PASSES
LEARNED_QUALITY_RETRY_COUNT=$LEARNED_QUALITY_RETRY_COUNT
LEARNED_QUALITY_RETRY_WAIT_MS=$LEARNED_QUALITY_RETRY_WAIT_MS
LEARNED_ROUTE_LIMIT=$LEARNED_ROUTE_LIMIT
LEARNED_SUCCESS_STREAK=$LEARNED_SUCCESS_STREAK
EOF
}

learn_from_screenshot_cycle() {
  if [ "$GG_SELF_GROWTH" != "1" ]; then
    return 0
  fi

  local nav_retry_signals=0
  local quality_retry_signals=0
  local route_failure_count=0
  local visual_issue_count=0

  if [ -n "$SCREENSHOT_LAST_LOG" ] && [ -f "$SCREENSHOT_LAST_LOG" ]; then
    nav_retry_signals=$(grep -c "nav attempt" "$SCREENSHOT_LAST_LOG" 2>/dev/null || true)
    quality_retry_signals=$(grep -c "quality retry" "$SCREENSHOT_LAST_LOG" 2>/dev/null || true)
    route_failure_count=$(grep -Eo "라우트 캡처 실패: [0-9]+건" "$SCREENSHOT_LAST_LOG" | tail -n1 | grep -Eo "[0-9]+" || true)
    visual_issue_count=$(grep -Eo "시각 품질 이슈: [0-9]+건" "$SCREENSHOT_LAST_LOG" | tail -n1 | grep -Eo "[0-9]+" || true)
  fi

  if [ -z "$route_failure_count" ]; then
    route_failure_count=0
  fi
  if [ -z "$visual_issue_count" ]; then
    visual_issue_count=0
  fi

  if [ "$SCREENSHOT_LAST_OK" = "1" ] && [ "$route_failure_count" -eq 0 ] && [ "$visual_issue_count" -eq 0 ]; then
    LEARNED_SUCCESS_STREAK=$((LEARNED_SUCCESS_STREAK + 1))

    if [ "$nav_retry_signals" -ge "$GG_NAV_RETRY_SIGNAL_THRESHOLD" ]; then
      LEARNED_NAV_RETRIES=$(clamp_int $((LEARNED_NAV_RETRIES + 1)) "$GG_MIN_NAV_RETRIES" "$GG_MAX_NAV_RETRIES")
      LEARNED_SCREENSHOT_PASSES=$(clamp_int 2 "$GG_MIN_SCREENSHOT_PASSES" "$GG_MAX_SCREENSHOT_PASSES")
      LEARNED_ROUTE_LIMIT=$(clamp_int $((LEARNED_ROUTE_LIMIT - GG_ROUTE_LIMIT_STEP)) "$GG_MIN_ROUTE_LIMIT" "$GG_MAX_ROUTE_LIMIT")
    fi

    if [ "$quality_retry_signals" -ge "$GG_QUALITY_RETRY_SIGNAL_THRESHOLD" ]; then
      LEARNED_QUALITY_RETRY_COUNT=$(clamp_int $((LEARNED_QUALITY_RETRY_COUNT + 1)) "$GG_MIN_QUALITY_RETRY_COUNT" "$GG_MAX_QUALITY_RETRY_COUNT")
      LEARNED_QUALITY_RETRY_WAIT_MS=$(clamp_int $((LEARNED_QUALITY_RETRY_WAIT_MS + 150)) "$GG_MIN_QUALITY_RETRY_WAIT_MS" "$GG_MAX_QUALITY_RETRY_WAIT_MS")
    elif [ "$LEARNED_SUCCESS_STREAK" -ge 2 ]; then
      LEARNED_NAV_RETRIES=$(clamp_int $((LEARNED_NAV_RETRIES - 1)) "$GG_MIN_NAV_RETRIES" "$GG_MAX_NAV_RETRIES")
      LEARNED_NAV_TIMEOUT_MS=$(clamp_int $((LEARNED_NAV_TIMEOUT_MS - 2000)) "$GG_MIN_NAV_TIMEOUT_MS" "$GG_MAX_NAV_TIMEOUT_MS")
      LEARNED_SCREENSHOT_PASSES=$(clamp_int 1 "$GG_MIN_SCREENSHOT_PASSES" "$GG_MAX_SCREENSHOT_PASSES")
      LEARNED_QUALITY_RETRY_COUNT=$(clamp_int $((LEARNED_QUALITY_RETRY_COUNT - 1)) "$GG_MIN_QUALITY_RETRY_COUNT" "$GG_MAX_QUALITY_RETRY_COUNT")
      LEARNED_QUALITY_RETRY_WAIT_MS=$(clamp_int $((LEARNED_QUALITY_RETRY_WAIT_MS - 100)) "$GG_MIN_QUALITY_RETRY_WAIT_MS" "$GG_MAX_QUALITY_RETRY_WAIT_MS")
      LEARNED_ROUTE_LIMIT=$(clamp_int $((LEARNED_ROUTE_LIMIT + GG_ROUTE_LIMIT_STEP)) "$GG_MIN_ROUTE_LIMIT" "$GG_MAX_ROUTE_LIMIT")
    fi
  elif [ "$SCREENSHOT_LAST_OK" = "1" ] && [ "$route_failure_count" -eq 0 ] && [ "$visual_issue_count" -gt 0 ]; then
    LEARNED_SUCCESS_STREAK=0
    LEARNED_QUALITY_RETRY_COUNT=$(clamp_int $((LEARNED_QUALITY_RETRY_COUNT + 1)) "$GG_MIN_QUALITY_RETRY_COUNT" "$GG_MAX_QUALITY_RETRY_COUNT")
    LEARNED_QUALITY_RETRY_WAIT_MS=$(clamp_int $((LEARNED_QUALITY_RETRY_WAIT_MS + 250)) "$GG_MIN_QUALITY_RETRY_WAIT_MS" "$GG_MAX_QUALITY_RETRY_WAIT_MS")
    LEARNED_SCREENSHOT_PASSES=$(clamp_int 2 "$GG_MIN_SCREENSHOT_PASSES" "$GG_MAX_SCREENSHOT_PASSES")
    LEARNED_ROUTE_LIMIT=$(clamp_int $((LEARNED_ROUTE_LIMIT - GG_ROUTE_LIMIT_STEP)) "$GG_MIN_ROUTE_LIMIT" "$GG_MAX_ROUTE_LIMIT")
  else
    LEARNED_SUCCESS_STREAK=0
    LEARNED_NAV_RETRIES=$(clamp_int $((LEARNED_NAV_RETRIES + 1)) "$GG_MIN_NAV_RETRIES" "$GG_MAX_NAV_RETRIES")
    LEARNED_NAV_TIMEOUT_MS=$(clamp_int $((LEARNED_NAV_TIMEOUT_MS + 5000)) "$GG_MIN_NAV_TIMEOUT_MS" "$GG_MAX_NAV_TIMEOUT_MS")
    LEARNED_SCREENSHOT_PASSES=$(clamp_int $((LEARNED_SCREENSHOT_PASSES + 1)) "$GG_MIN_SCREENSHOT_PASSES" "$GG_MAX_SCREENSHOT_PASSES")
    LEARNED_QUALITY_RETRY_COUNT=$(clamp_int $((LEARNED_QUALITY_RETRY_COUNT + 1)) "$GG_MIN_QUALITY_RETRY_COUNT" "$GG_MAX_QUALITY_RETRY_COUNT")
    LEARNED_QUALITY_RETRY_WAIT_MS=$(clamp_int $((LEARNED_QUALITY_RETRY_WAIT_MS + 250)) "$GG_MIN_QUALITY_RETRY_WAIT_MS" "$GG_MAX_QUALITY_RETRY_WAIT_MS")
    LEARNED_ROUTE_LIMIT=$(clamp_int $((LEARNED_ROUTE_LIMIT - GG_ROUTE_LIMIT_STEP)) "$GG_MIN_ROUTE_LIMIT" "$GG_MAX_ROUTE_LIMIT")
  fi

  save_self_growth_state

  echo "self-growth: streak=$LEARNED_SUCCESS_STREAK nav_retries=$LEARNED_NAV_RETRIES nav_timeout_ms=$LEARNED_NAV_TIMEOUT_MS screenshot_passes=$LEARNED_SCREENSHOT_PASSES quality_retry_count=$LEARNED_QUALITY_RETRY_COUNT quality_retry_wait_ms=$LEARNED_QUALITY_RETRY_WAIT_MS route_limit=$LEARNED_ROUTE_LIMIT"
}

ensure_server() {
  if curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
    echo "Server ready: $BASE_URL"
    return 0
  fi

  if [ "$GG_START_SERVER" != "1" ]; then
    echo "Server is not ready: $BASE_URL (set GG_START_SERVER=1 to auto-start dev server)"
    return 1
  fi

  step "start-dev-server"
  (
    cd "$APP_ROOT"
    npm run dev:3002 >"$LOG_DIR/dev-server.log" 2>&1
  ) &
  DEV_PID=$!
  SERVER_STARTED=1

  for i in $(seq 1 60); do
    sleep 1
    if curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
      echo "✓ dev server ready (${i}s)"
      return 0
    fi
  done

  echo "✗ dev server did not become ready (log: $LOG_DIR/dev-server.log)"
  return 1
}

resolve_route_limit() {
  if [ -n "${SCREENSHOT_ROUTE_LIMIT:-}" ]; then
    EFFECTIVE_ROUTE_LIMIT=$(clamp_int "$SCREENSHOT_ROUTE_LIMIT" "$GG_MIN_ROUTE_LIMIT" "$GG_MAX_ROUTE_LIMIT")
    echo "$EFFECTIVE_ROUTE_LIMIT"
    return 0
  fi
  if [ "$GG_MODE" = "fast" ]; then
    EFFECTIVE_ROUTE_LIMIT="$GG_MIN_ROUTE_LIMIT"
    echo "$EFFECTIVE_ROUTE_LIMIT"
    return 0
  fi
  if [ "$GG_MODE" = "auto" ]; then
    EFFECTIVE_ROUTE_LIMIT=$(clamp_int "$LEARNED_ROUTE_LIMIT" "$GG_MIN_ROUTE_LIMIT" "$GG_MAX_ROUTE_LIMIT")
    echo "$EFFECTIVE_ROUTE_LIMIT"
    return 0
  fi
  EFFECTIVE_ROUTE_LIMIT="$GG_MAX_ROUTE_LIMIT"
  echo "$EFFECTIVE_ROUTE_LIMIT"
}

run_screenshot_cycle() {
  local route_limit="$1"
  local nav_retries="$EFFECTIVE_NAV_RETRIES"
  local nav_timeout="$EFFECTIVE_NAV_TIMEOUT_MS"
  local max_route_failures="${SCREENSHOT_MAX_ROUTE_FAILURES:-0}"
  local screenshot_passes="$EFFECTIVE_SCREENSHOT_PASSES"
  local quality_retry_count="$EFFECTIVE_QUALITY_RETRY_COUNT"
  local quality_retry_wait_ms="$EFFECTIVE_QUALITY_RETRY_WAIT_MS"

  local pass
  for pass in $(seq 1 "$screenshot_passes"); do
    SCREENSHOT_LAST_LOG="$LOG_DIR/screenshot-pass-$pass.log"
    if run_step \
      "screenshot-pass-$pass" \
      "cd '$APP_ROOT' && BASE_URL='$BASE_URL' SCREENSHOT_ROUTE_LIMIT='$route_limit' SCREENSHOT_NAV_RETRIES='$nav_retries' SCREENSHOT_NAV_TIMEOUT_MS='$nav_timeout' SCREENSHOT_MAX_ROUTE_FAILURES='$max_route_failures' SCREENSHOT_QUALITY_RETRY_COUNT='$quality_retry_count' SCREENSHOT_QUALITY_RETRY_WAIT_MS='$quality_retry_wait_ms' npm run screenshot"; then
      return 0
    fi
  done

  return 1
}

resolve_adaptive_orchestration() {
  RUN_MULTI_AGENT="$GG_MULTI_AGENT"
  RUN_UX_GUARD="$GG_RUN_UX_GUARD"

  if [ "$GG_ADAPTIVE_ORCHESTRATION" != "1" ]; then
    return 0
  fi

  if [ "$RUN_MULTI_AGENT" != "1" ] && [ "$GG_MODE" != "fast" ]; then
    if [ "$EFFECTIVE_ROUTE_LIMIT" -ge "$GG_AUTO_MULTI_AGENT_MIN_ROUTE_LIMIT" ] && [ "$LEARNED_SUCCESS_STREAK" -ge "$GG_AUTO_MULTI_AGENT_MIN_STREAK" ]; then
      RUN_MULTI_AGENT=1
    fi
  fi

  if [ "$RUN_UX_GUARD" != "1" ]; then
    if [ "$EFFECTIVE_ROUTE_LIMIT" -ge "$GG_AUTO_UX_GUARD_MIN_ROUTE_LIMIT" ] && [ "$LEARNED_SUCCESS_STREAK" -ge "$GG_AUTO_UX_GUARD_MIN_STREAK" ]; then
      RUN_UX_GUARD=1
    fi
  fi
}

echo "GG trigger start"
echo "mode=$GG_MODE base=$BASE_URL logs=$LOG_DIR"

ensure_server

load_self_growth_state
resolve_growth_config

ROUTE_LIMIT=$(resolve_route_limit)
resolve_adaptive_orchestration

echo "screenshot-config: passes=$EFFECTIVE_SCREENSHOT_PASSES nav_retries=$EFFECTIVE_NAV_RETRIES nav_timeout_ms=$EFFECTIVE_NAV_TIMEOUT_MS quality_retry_count=$EFFECTIVE_QUALITY_RETRY_COUNT quality_retry_wait_ms=$EFFECTIVE_QUALITY_RETRY_WAIT_MS route_limit=$ROUTE_LIMIT"
echo "orchestration: adaptive=$GG_ADAPTIVE_ORCHESTRATION multi_agent=$RUN_MULTI_AGENT ux_guard=$RUN_UX_GUARD streak=$LEARNED_SUCCESS_STREAK"
echo "console-guard: enabled=$GG_RUN_CONSOLE_GUARD browser=$GG_CONSOLE_BROWSER channel=$GG_CONSOLE_CHANNEL"

if [ "$RUN_MULTI_AGENT" = "1" ]; then
  run_step "multi-agent" "cd '$APP_ROOT' && $GG_MULTI_AGENT_CMD"
fi

run_step "style-guard" "cd '$APP_ROOT' && npm run lint:style-guard"
run_step "typecheck" "cd '$APP_ROOT' && npx tsc --noEmit"
run_step "test" "cd '$APP_ROOT' && npm test"

if [ "$GG_RUN_CONSOLE_GUARD" = "1" ]; then
  run_step "check-console" "cd '$APP_ROOT' && BASE_URL='$BASE_URL' BROWSER='$GG_CONSOLE_BROWSER' CHECK_CONSOLE_CHANNEL='$GG_CONSOLE_CHANNEL' npm run check-console"
fi

if run_screenshot_cycle "$ROUTE_LIMIT"; then
  SCREENSHOT_LAST_OK=1
else
  SCREENSHOT_LAST_OK=0
fi

learn_from_screenshot_cycle

if [ "$SCREENSHOT_LAST_OK" != "1" ]; then
  exit 1
fi

if [ "$RUN_UX_GUARD" = "1" ]; then
  run_step "ux-guard" "cd '$APP_ROOT' && BASE_URL='$BASE_URL' npm run ux:guard"
fi

echo
echo "GG trigger passed"
echo "logs: $LOG_DIR"
