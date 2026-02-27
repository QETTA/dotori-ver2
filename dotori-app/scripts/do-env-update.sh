#!/usr/bin/env bash
# DigitalOcean 환경변수 단일 키 안전 업데이트
# 사용법: ./scripts/do-env-update.sh <APP_ID> <KEY> <VALUE>
# 목적: 전체 스펙 교체 시 EV[...] 암호화 값 손상 방지
#
# 기존 문제: doctl apps update --spec 으로 전체 스펙 교체 시
#   - 변경하지 않은 키의 EV[...] 암호화 값이 손상됨
#   - AUTH_SECRET, KAKAO 키 등이 읽히지 않아 배포 실패
#
# 해결: 변경할 키만 업데이트, 나머지 EV[...] 값은 그대로 유지

set -euo pipefail

APP_ID="${1:?'Usage: $0 <APP_ID> <KEY> <VALUE>'}"
KEY="${2:?'Usage: $0 <APP_ID> <KEY> <VALUE>'}"
VALUE="${3:?'Usage: $0 <APP_ID> <KEY> <VALUE>'}"
APP_SERVICE="${APP_SERVICE:-web}"
ALLOW_EMPTY_VALUE="${ALLOW_EMPTY_VALUE:-0}"
DOCTL_BIN="${DOCTL_BIN:-doctl}"
DOCTL_TOKEN="${DOCTL_ACCESS_TOKEN:-${DIGITALOCEAN_ACCESS_TOKEN:-${DO_TOKEN:-}}}"
FORCE_SPEC_UPDATE="${FORCE_SPEC_UPDATE:-0}"
ALLOW_SPEC_MUTATION="${ALLOW_SPEC_MUTATION:-0}"

if [ "${CI:-}" = "true" ] || [ "${GITHUB_ACTIONS:-}" = "true" ]; then
  echo "ERROR: this script is blocked in CI/GitHub Actions." >&2
  echo "Use doctl apps create-deployment in automation pipelines." >&2
  exit 1
fi

if [ "$FORCE_SPEC_UPDATE" != "1" ] || [ "$ALLOW_SPEC_MUTATION" != "I_UNDERSTAND_SECRET_RISK" ]; then
  echo "ERROR: spec update is blocked by default." >&2
  echo "Set FORCE_SPEC_UPDATE=1 and ALLOW_SPEC_MUTATION=I_UNDERSTAND_SECRET_RISK." >&2
  echo "For routine deploy, use doctl apps create-deployment." >&2
  exit 1
fi

if ! command -v "$DOCTL_BIN" >/dev/null 2>&1; then
  echo "ERROR: doctl not found: $DOCTL_BIN" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found." >&2
  exit 1
fi

if [ -z "$VALUE" ] && [ "$ALLOW_EMPTY_VALUE" != "1" ]; then
  echo "ERROR: empty value is blocked by default." >&2
  echo "Set ALLOW_EMPTY_VALUE=1 only when intentional." >&2
  exit 1
fi

DOCTL_ARGS=()
if [ -n "$DOCTL_TOKEN" ]; then
  DOCTL_ARGS+=(--access-token "$DOCTL_TOKEN")
fi
doctl_cmd() {
  "$DOCTL_BIN" "${DOCTL_ARGS[@]}" "$@"
}

SPEC_FILE="$(mktemp)"
trap 'rm -f "$SPEC_FILE"' EXIT

echo "→ 현재 스펙 가져오는 중..."
doctl_cmd apps spec get "$APP_ID" > "$SPEC_FILE"

echo "→ '$KEY' 값 업데이트 중..."

if [ "$KEY" = "MONGODB_URI" ] && [ -n "$VALUE" ]; then
  case "$VALUE" in
    mongodb://*|mongodb+srv://*)
      ;;
    *)
      echo "ERROR: MONGODB_URI 값이 잘못되었습니다. mongodb:// 또는 mongodb+srv:// 로 시작해야 합니다." >&2
      echo "현재 값: ${VALUE:0:20}..." >&2
      exit 1
      ;;
  esac
fi

SPEC_FILE="$SPEC_FILE" KEY="$KEY" VALUE="$VALUE" APP_SERVICE="$APP_SERVICE" python3 - <<'PY'
import os
import sys
import yaml

spec_path = os.environ["SPEC_FILE"]
key = os.environ["KEY"]
value = os.environ["VALUE"]
service_name = os.environ["APP_SERVICE"]

with open(spec_path, "r", encoding="utf-8") as f:
    spec = yaml.safe_load(f)

services = spec.get("services") or []
if not services:
    print("ERROR: spec.services가 비어 있습니다", file=sys.stderr)
    raise SystemExit(1)

target = None
for service in services:
    if service.get("name") == service_name:
        target = service
        break
if target is None:
    print(f"ERROR: service '{service_name}'를 찾을 수 없습니다", file=sys.stderr)
    raise SystemExit(1)

secret_like_keys = {
    "AUTH_SECRET",
    "AUTH_KAKAO_ID",
    "AUTH_KAKAO_SECRET",
    "MONGODB_URI",
    "KAKAO_REST_API_KEY",
    "KAKAO_NATIVE_APP_KEY",
    "KAKAO_ADMIN_KEY",
    "ANTHROPIC_API_KEY",
    "PUBLIC_DATA_API_KEY",
    "CHILDCARE_PORTAL_KEY",
    "CRON_SECRET",
    "NEXTAUTH_SECRET",
}
is_secret = key in secret_like_keys or key.endswith("_SECRET")

envs = target.setdefault("envs", [])
existing = None
for env in envs:
    if isinstance(env, dict) and env.get("key") == key:
        existing = env
        break

if existing is not None:
    existing["value"] = value
    existing.setdefault("scope", "RUN_TIME")
    if is_secret:
        existing["type"] = "SECRET"
    action = "updated"
else:
    new_env = {"key": key, "value": value, "scope": "RUN_TIME"}
    if is_secret:
        new_env["type"] = "SECRET"
    envs.append(new_env)
    action = "added"

with open(spec_path, "w", encoding="utf-8") as f:
    yaml.safe_dump(spec, f, sort_keys=False, allow_unicode=True)

print(f"OK: '{key}' {action} on service '{target.get('name', '(unknown)')}'")
PY

echo "→ DO 앱 스펙 적용 중..."
doctl_cmd apps update "$APP_ID" --spec "$SPEC_FILE" --wait >/dev/null

echo "✅ 완료: $KEY 업데이트됨"
echo "   service: ${APP_SERVICE}"
