#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$REPO_ROOT/dotori-app"

APP_ID="${DOTORI_APP_ID:-${DO_APP_ID:-}}"
APP_SERVICE="${APP_SERVICE:-web}"
DOCTL_BIN="${DOCTL_BIN:-doctl}"
DOCTL_TOKEN="${DOCTL_ACCESS_TOKEN:-${DIGITALOCEAN_ACCESS_TOKEN:-${DO_TOKEN:-}}}"
RUN_PREFLIGHT="${RUN_PREFLIGHT:-1}"
WAIT_HEALTH="${WAIT_HEALTH:-1}"
DEEP_HEALTH="${DEEP_HEALTH:-1}"
DEPLOY_RETRIES="${DEPLOY_RETRIES:-3}"

if [ -z "$APP_ID" ]; then
  echo "ERROR: DO_APP_ID (or DOTORI_APP_ID) is required." >&2
  exit 1
fi

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing required command: $1" >&2
    exit 1
  fi
}

need_cmd "$DOCTL_BIN"
need_cmd python3
need_cmd curl

DOCTL_ARGS=()
if [ -n "$DOCTL_TOKEN" ]; then
  DOCTL_ARGS+=(--access-token "$DOCTL_TOKEN")
fi
doctl_cmd() {
  "$DOCTL_BIN" "${DOCTL_ARGS[@]}" "$@"
}

if [ "$RUN_PREFLIGHT" = "1" ]; then
  echo "▶ run ci preflight"
  (
    cd "$APP_DIR"
    npm run ci:preflight
  )
fi

echo "▶ verify app exists"
doctl_cmd apps get "$APP_ID" --format ID --no-header >/dev/null

echo "▶ verify DigitalOcean source deployment mode"
SPEC_JSON="$(mktemp)"
trap 'rm -f "$SPEC_JSON"' EXIT
doctl_cmd apps spec get "$APP_ID" --format json >"$SPEC_JSON"

SPEC_JSON="$SPEC_JSON" APP_SERVICE="$APP_SERVICE" python3 - <<'PY'
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
    print(f"ERROR: service '{service_name}' not found in app spec", file=sys.stderr)
    raise SystemExit(1)

if target.get("image"):
    print("ERROR: image deployment is still configured. remove image block first", file=sys.stderr)
    raise SystemExit(1)

if not target.get("github"):
    print("ERROR: github source is missing from service spec", file=sys.stderr)
    raise SystemExit(1)

if not target.get("dockerfile_path"):
    print("ERROR: dockerfile_path is missing from service spec", file=sys.stderr)
    raise SystemExit(1)

print("OK: source deployment mode validated")
PY

DEPLOY_ID=""
for attempt in $(seq 1 "$DEPLOY_RETRIES"); do
  echo "▶ create deployment (${attempt}/${DEPLOY_RETRIES})"
  DEPLOY_ID="$(doctl_cmd apps create-deployment "$APP_ID" --force-rebuild --wait --format ID --no-header | tr -d '[:space:]')"
  if [ -n "$DEPLOY_ID" ]; then
    break
  fi
  sleep 3
done

if [ -z "$DEPLOY_ID" ]; then
  echo "ERROR: deployment ID is empty after retries" >&2
  exit 1
fi

echo "▶ deployment id: $DEPLOY_ID"

APP_URL="$(doctl_cmd apps get "$APP_ID" --format DefaultIngress --no-header | tr -d '[:space:]')"
if [ -z "$APP_URL" ]; then
  echo "ERROR: app URL is empty" >&2
  exit 1
fi

if [ "$WAIT_HEALTH" = "1" ]; then
  BASE_URL="${APP_URL%/}"
  HEALTH_URL="${BASE_URL}/api/health"
  DEEP_HEALTH_URL="${BASE_URL}/api/health/deep"

  echo "▶ wait health: $HEALTH_URL"
  for i in $(seq 1 60); do
    if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
      echo "OK: health ready in $((i * 2))s"
      break
    fi
    if [ "$i" -eq 60 ]; then
      echo "ERROR: health check timeout ($HEALTH_URL)" >&2
      exit 1
    fi
    sleep 2
  done

  if [ "$DEEP_HEALTH" = "1" ]; then
    echo "▶ wait deep health: $DEEP_HEALTH_URL"
    for i in $(seq 1 30); do
      if curl -fsS --max-time 8 "$DEEP_HEALTH_URL" >/dev/null 2>&1; then
        echo "OK: deep health ready in $((i * 2))s"
        break
      fi
      if [ "$i" -eq 30 ]; then
        echo "ERROR: deep health check timeout ($DEEP_HEALTH_URL)" >&2
        exit 1
      fi
      sleep 2
    done
  fi
fi

echo "✅ deployment complete"
echo "   app_id: $APP_ID"
echo "   deployment_id: $DEPLOY_ID"
echo "   url: ${APP_URL%/}"
