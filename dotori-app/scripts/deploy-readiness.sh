#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

APP_ID="${DOTORI_APP_ID:-${DO_APP_ID:-}}"
APP_URL="${APP_URL:-}"
SKIP_BUILD="${SKIP_BUILD:-0}"
SKIP_HEALTH="${SKIP_HEALTH:-0}"
SKIP_SPEC_CHECK="${SKIP_SPEC_CHECK:-0}"
DEEP_HEALTH="${DEEP_HEALTH:-1}"

if [ -z "$APP_ID" ]; then
  echo "ERROR: DO_APP_ID (or DOTORI_APP_ID) is required." >&2
  exit 1
fi

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

printf "[1/4] Tooling checks\n"
need_cmd node
need_cmd npm
need_cmd doctl
need_cmd curl

printf "[2/4] Build and quality checks\n"
npm run ci:preflight

if [ "$SKIP_BUILD" != "1" ]; then
  printf "[2b/4] Production build check\n"
  env -u NODE_ENV npm run build
else
  printf "[2b/4] Production build check skipped (SKIP_BUILD=1)\n"
fi

if [ "$SKIP_SPEC_CHECK" != "1" ]; then
  printf "[3/4] DigitalOcean app mode check\n"
  SPEC_JSON="$(mktemp)"
  trap 'rm -f "$SPEC_JSON"' EXIT
  doctl apps spec get "$APP_ID" --format json > "$SPEC_JSON"
  APP_SERVICE="web" SPEC_JSON="$SPEC_JSON" python3 - <<'PY'
import json
import os
import sys

path = os.environ["SPEC_JSON"]
service_name = os.environ["APP_SERVICE"]

with open(path, "r", encoding="utf-8") as fp:
    spec = json.load(fp)

services = spec.get("services") or []
target = next((svc for svc in services if svc.get("name") == service_name), None)
if target is None:
    print(f"ERROR: service '{service_name}' not found", file=sys.stderr)
    raise SystemExit(1)
if target.get("image"):
    print("ERROR: image deployment mode detected (Docker registry path).", file=sys.stderr)
    raise SystemExit(1)
if not target.get("github"):
    print("ERROR: github source block missing.", file=sys.stderr)
    raise SystemExit(1)
if not target.get("dockerfile_path"):
    print("ERROR: dockerfile_path missing.", file=sys.stderr)
    raise SystemExit(1)
print("PASS: source deployment mode is active")
PY
else
  printf "[3/4] DigitalOcean app mode check skipped (SKIP_SPEC_CHECK=1)\n"
fi

if [ "$SKIP_HEALTH" != "1" ] && [ -n "$APP_URL" ]; then
  printf "[4/4] Production smoke checks\n"
  APP_URL="${APP_URL%/}"
  probe_endpoint "$APP_URL/api/health" 15 6
  if [ "$DEEP_HEALTH" == "1" ]; then
    probe_endpoint "$APP_URL/api/health/deep" 10 8
  else
    printf "[4/4] Deep health check skipped (DEEP_HEALTH=0)\n"
  fi
else
  printf "[4/4] Production smoke checks skipped (SKIP_HEALTH=1 or APP_URL unset)\n"
fi

printf "\nDeployment readiness complete.\n"
printf "Optional follow-up: doctl apps create-deployment %s\n" "$APP_ID"
