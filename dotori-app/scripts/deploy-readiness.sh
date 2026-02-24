#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

APP_ID="${DOTORI_APP_ID:-${DO_APP_ID:-29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2}}"
APP_URL="${APP_URL:-}"
SKIP_BUILD="${SKIP_BUILD:-0}"
SKIP_HEALTH="${SKIP_HEALTH:-0}"
DEEP_HEALTH="${DEEP_HEALTH:-1}"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing required command: $1" >&2
    return 1
  fi
}

probe_endpoint() {
  local endpoint="$1"
  local attempts="$2"
  local wait_seconds="$3"

  for i in $(seq 1 "$attempts"); do
    if curl -fsS --max-time "$wait_seconds" "$endpoint" >/dev/null 2>&1; then
      echo "PASS: $endpoint"
      return 0
    fi
    sleep 2
  done

  echo "FAIL: $endpoint (timeout)" >&2
  return 1
}

printf "Dotori deployment readiness check\n"
printf "Working directory: %s\n" "$APP_DIR"
printf "Default app id: %s\n\n" "$APP_ID"

printf "[1/3] Tooling checks\n"
need_cmd node
need_cmd npm
need_cmd doctl
need_cmd docker
need_cmd curl

printf "[2/3] Build and quality checks\n"
npm run ci:preflight

if [ "$SKIP_BUILD" != "1" ]; then
  printf "[2b/3] Production build check\n"
  env -u NODE_ENV npm run build
else
  printf "[2b/3] Production build check skipped (SKIP_BUILD=1)\n"
fi

if [ "$SKIP_HEALTH" != "1" ] && [ -n "$APP_URL" ]; then
  printf "[3/3] Production smoke checks\n"
  APP_URL="${APP_URL%/}"
  probe_endpoint "$APP_URL/api/health" 15 6
  if [ "$DEEP_HEALTH" == "1" ]; then
    probe_endpoint "$APP_URL/api/health/deep" 10 8
  else
    printf "[3/3] Deep health check skipped (DEEP_HEALTH=0)\n"
  fi
else
  printf "[3/3] Production smoke checks skipped (SKIP_HEALTH=1 or APP_URL unset)\n"
fi

printf "\nDeployment readiness complete.\n"
printf "Optional follow-up: doctl apps create-deployment %s\n" "$APP_ID"
