#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_ID="${DO_APP_ID:-29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2}"
APP_URL="${APP_URL:-https://dotori-app-pwyc9.ondigitalocean.app}"
EXPECT_SHA="${EXPECT_SHA:-}"
CI_WORKFLOW="${CI_WORKFLOW:-CI}"
GITHUB_REPO="${GITHUB_REPO:-QETTA/dotori-ver2}"
REQUIRE_CLEAN="${REQUIRE_CLEAN:-1}"
CHECK_CI="${CHECK_CI:-1}"
CHECK_DO="${CHECK_DO:-1}"
CHECK_HEALTH="${CHECK_HEALTH:-1}"
DOCTL_BIN="${DOCTL_BIN:-doctl}"
DOCTL_TOKEN="${DOCTL_ACCESS_TOKEN:-${DIGITALOCEAN_ACCESS_TOKEN:-${DO_TOKEN:-}}}"
APP_JSON=""

cleanup() { rm -f "$APP_JSON"; }
trap cleanup EXIT

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "FAIL: missing required command: $1" >&2; exit 1
  fi
}

DOCTL_ARGS=()
if [ -n "$DOCTL_TOKEN" ]; then
  DOCTL_ARGS+=(--access-token "$DOCTL_TOKEN")
fi
doctl_cmd() { "$DOCTL_BIN" "${DOCTL_ARGS[@]}" "$@"; }

echo "Release audit start"
echo "Repository: $ROOT_DIR"

need_cmd git
need_cmd python3

# ── 1. Working tree clean check ──
if [ "$REQUIRE_CLEAN" = "1" ]; then
  if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo "FAIL: working tree is dirty" >&2; exit 1
  fi
fi

git fetch origin main --quiet
if [ -z "$EXPECT_SHA" ]; then
  EXPECT_SHA="$(git rev-parse origin/main)"
fi
echo "Target SHA: ${EXPECT_SHA:0:7}"

# ── 2. CI status check ──
if [ "$CHECK_CI" = "1" ]; then
  need_cmd gh
  CI_RESULT="$(
    CI_JSON="$(gh run list --repo "$GITHUB_REPO" --workflow "$CI_WORKFLOW" --branch main --limit 30 --json databaseId,headSha,status,conclusion,url)"
    CI_JSON="$CI_JSON" EXPECT_SHA="$EXPECT_SHA" python3 - <<'PY'
import json, os, sys
runs = json.loads(os.environ["CI_JSON"])
expected = os.environ["EXPECT_SHA"].strip()
target = next((r for r in runs if (r.get("headSha") or "").strip() == expected), None)
if not target: print("MISSING"); sys.exit(0)
status = (target.get("status") or "").strip()
conclusion = (target.get("conclusion") or "").strip()
run_id = str(target.get("databaseId") or "")
url = target.get("url") or ""
if status != "completed": print(f"PENDING {run_id} {url}"); sys.exit(0)
if conclusion != "success": print(f"FAILED {run_id} {conclusion} {url}"); sys.exit(0)
print(f"OK {run_id} {url}")
PY
  )"
  case "$CI_RESULT" in
    OK\ *)      echo "PASS: CI verified ($CI_RESULT)" ;;
    PENDING\ *) echo "FAIL: CI still running ($CI_RESULT)" >&2; exit 1 ;;
    FAILED\ *)  echo "FAIL: CI failed ($CI_RESULT)" >&2; exit 1 ;;
    MISSING)    echo "FAIL: no CI run for SHA ${EXPECT_SHA:0:7}" >&2; exit 1 ;;
    *)          echo "FAIL: CI parse error: $CI_RESULT" >&2; exit 1 ;;
  esac
fi

# ── 3. DO deployment SHA check ──
if [ "$CHECK_DO" = "1" ]; then
  need_cmd "$DOCTL_BIN"
  APP_JSON="$(mktemp)"
  if ! doctl_cmd apps get "$APP_ID" -o json > "$APP_JSON" 2>/tmp/doctl-audit.err; then
    echo "FAIL: doctl apps get failed" >&2
    cat /tmp/doctl-audit.err 2>/dev/null >&2 || true
    rm -f /tmp/doctl-audit.err
    exit 1
  fi
  rm -f /tmp/doctl-audit.err
  if ! python3 -c "import json; json.load(open('$APP_JSON'))" 2>/dev/null; then
    echo "FAIL: doctl output is not valid JSON" >&2
    head -5 "$APP_JSON" >&2
    exit 1
  fi
  DO_RESULT="$(
    APP_JSON="$APP_JSON" EXPECT_SHA="$EXPECT_SHA" python3 - <<'PY'
import json, os, sys
app = json.load(open(os.environ["APP_JSON"], "r", encoding="utf-8"))[0]
active = app.get("active_deployment") or {}
services = active.get("services") or []
sha = (services[0].get("source_commit_hash") or "").strip() if services else ""
expected = os.environ["EXPECT_SHA"].strip()
if not sha: print("MISSING"); sys.exit(0)
if sha != expected: print(f"MISMATCH {sha[:7]} {expected[:7]}"); sys.exit(0)
print(f"OK {sha[:7]}")
PY
  )"
  case "$DO_RESULT" in
    OK\ *)      echo "PASS: DO deployment verified ($DO_RESULT)" ;;
    MISSING)    echo "WARN: DO active deployment SHA empty" ;;
    MISMATCH\ *) echo "WARN: DO deployment drift ($DO_RESULT)" ;;
    *)          echo "FAIL: DO parse error: $DO_RESULT" >&2; exit 1 ;;
  esac
fi

# ── 4. Health check ──
if [ "$CHECK_HEALTH" = "1" ]; then
  need_cmd curl
  BASE_URL="${APP_URL%/}"
  HEALTH_ERR=""
  HEALTH_BODY="$(curl -fsS --max-time 8 "$BASE_URL/api/health" 2>/tmp/ra-health.err)" || { HEALTH_ERR="$(cat /tmp/ra-health.err 2>/dev/null)"; HEALTH_BODY=""; }
  DEEP_ERR=""
  DEEP_BODY="$(curl -fsS --max-time 10 "$BASE_URL/api/health/deep" 2>/tmp/ra-deep.err)" || { DEEP_ERR="$(cat /tmp/ra-deep.err 2>/dev/null)"; DEEP_BODY=""; }
  rm -f /tmp/ra-health.err /tmp/ra-deep.err
  HEALTH_STATUS="$(
    HEALTH_BODY="$HEALTH_BODY" DEEP_BODY="$DEEP_BODY" python3 - <<'PY'
import json, os
hb = os.environ.get("HEALTH_BODY", "").strip()
db = os.environ.get("DEEP_BODY", "").strip()
if not hb or not db:
    print("CURL_FAIL"); raise SystemExit(0)
health = json.loads(hb)
deep = json.loads(db)
if (health.get("status") or "").strip() != "healthy": print("HEALTH_FAIL"); raise SystemExit(0)
if (deep.get("status") or "").strip() != "healthy": print("DEEP_FAIL"); raise SystemExit(0)
mongodb = ((deep.get("checks") or {}).get("mongodb") or {}).get("status")
if (mongodb or "").strip() != "ok": print("MONGO_FAIL"); raise SystemExit(0)
print("OK")
PY
  )"
  case "$HEALTH_STATUS" in
    OK) echo "PASS: Health endpoints verified" ;;
    CURL_FAIL)
      echo "FAIL: health check ($HEALTH_STATUS)" >&2
      [ -n "$HEALTH_ERR" ] && echo "  /api/health error: $HEALTH_ERR" >&2
      [ -n "$DEEP_ERR" ] && echo "  /api/health/deep error: $DEEP_ERR" >&2
      exit 1 ;;
    *)  echo "FAIL: health check ($HEALTH_STATUS)" >&2; exit 1 ;;
  esac
fi

echo "Release audit complete: PASS"
echo "  sha=${EXPECT_SHA:0:7} app_id=$APP_ID"
