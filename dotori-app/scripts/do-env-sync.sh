#!/usr/bin/env bash
# DigitalOcean 환경변수(.env 파일) → App Platform 스펙 envs 안전 동기화
#
# 목적:
# - doctl apps update --spec 전체 교체로 SECRET(EV[...])이 손상되는 사고를 방지하면서,
#   필요한 키들을 한 번에 업데이트한다.
# - 값은 출력하지 않는다.
#
# Usage:
#   ./scripts/do-env-sync.sh <APP_ID> [ENV_FILE]
#
# Example:
#   ./scripts/do-env-sync.sh 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2 .env.local
#
set -euo pipefail

APP_ID="${1:?'Usage: $0 <APP_ID> [ENV_FILE]'}"
ENV_FILE="${2:-.env.local}"
APP_SERVICE="${APP_SERVICE:-web}"
ALLOW_EMPTY_VALUES="${ALLOW_EMPTY_VALUES:-0}"
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

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: ENV_FILE not found: $ENV_FILE" >&2
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

DOCTL_ARGS=()
if [ -n "$DOCTL_TOKEN" ]; then
  DOCTL_ARGS+=(--access-token "$DOCTL_TOKEN")
fi
doctl_cmd() {
  "$DOCTL_BIN" "${DOCTL_ARGS[@]}" "$@"
}

SPEC_FILE="$(mktemp)"
SYNC_STDOUT="$(mktemp)"
SYNC_STDERR="$(mktemp)"
CHANGED_FILE="$(mktemp)"
trap 'rm -f "$SPEC_FILE" "$SYNC_STDOUT" "$SYNC_STDERR" "$CHANGED_FILE"' EXIT

echo "→ 현재 스펙 가져오는 중..."
doctl_cmd apps spec get "$APP_ID" > "$SPEC_FILE"

echo "→ env 동기화 중... (파일: $ENV_FILE)"
if ! SPEC_FILE="$SPEC_FILE" ENV_FILE="$ENV_FILE" APP_SERVICE="$APP_SERVICE" ALLOW_EMPTY_VALUES="$ALLOW_EMPTY_VALUES" CHANGED_FILE="$CHANGED_FILE" python3 - >"$SYNC_STDOUT" 2>"$SYNC_STDERR" <<'PY'
import os
import re
import sys
from pathlib import Path

import yaml

spec_path = Path(os.environ["SPEC_FILE"])
env_path = Path(os.environ["ENV_FILE"])
service_name = os.environ["APP_SERVICE"]
allow_empty_values = os.environ["ALLOW_EMPTY_VALUES"] == "1"
changed_path = Path(os.environ["CHANGED_FILE"])

# 안전장치: DO에 올릴 키 allowlist
ALLOWED_KEYS = {
    # Auth
    "NEXTAUTH_URL",
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
    "AUTH_TRUST_HOST",
    "AUTH_KAKAO_ID",
    "AUTH_KAKAO_SECRET",
    # MongoDB
    "MONGODB_URI",
    "MONGODB_DB_NAME",
    # Kakao APIs
    "KAKAO_REST_API_KEY",
    "KAKAO_NATIVE_APP_KEY",
    "KAKAO_ADMIN_KEY",
    # AI
    "ANTHROPIC_API_KEY",
    "AI_MODEL",
    # Public data APIs
    "PUBLIC_DATA_API_KEY",
    "CHILDCARE_PORTAL_KEY",
    # App
    "NODE_ENV",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_KAKAO_JS_KEY",
    "NEXT_PUBLIC_KAKAO_MAP_KEY",
    "NEXT_PUBLIC_KAKAO_CHANNEL_ID",
    "NEXT_PUBLIC_KAKAO_KEY",
    # Analytics
    "NEXT_PUBLIC_GA_ID",
    # Cron
    "CRON_SECRET",
}

SECRET_LIKE_KEYS = {
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
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
}

def parse_env_file(text: str) -> dict[str, str]:
    # Minimal .env parser: KEY=VALUE (supports quoted values)
    out: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export "):].lstrip()
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$", line)
        if not m:
            continue
        key, value = m.group(1), m.group(2)
        # Strip inline comments for unquoted values: KEY=value # comment
        if value and value[0] not in ("'", '"'):
            value = value.split(" #", 1)[0].split("\t#", 1)[0].rstrip()
        value = value.strip()
        if len(value) >= 2 and ((value[0] == value[-1] == '"') or (value[0] == value[-1] == "'")):
            value = value[1:-1]
        out[key] = value
    return out

spec = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
services = spec.get("services") or []
if not services:
    print("ERROR: spec.services가 비어 있습니다", file=sys.stderr)
    raise SystemExit(1)

env_text = env_path.read_text(encoding="utf-8")
env_map = parse_env_file(env_text)

to_sync = {k: v for k, v in env_map.items() if k in ALLOWED_KEYS}
if not to_sync:
    print("ERROR: 동기화할 키가 없습니다. allowlist 또는 .env 내용을 확인하세요.", file=sys.stderr)
    raise SystemExit(1)

if not allow_empty_values:
    to_sync = {k: v for k, v in to_sync.items() if v != ""}

if not to_sync:
    print("ERROR: 빈 값만 감지되어 동기화를 중단했습니다. ALLOW_EMPTY_VALUES=1 로 명시하세요.", file=sys.stderr)
    raise SystemExit(1)

updated_keys: list[str] = []
added_keys: list[str] = []
skipped_empty_keys: list[str] = []

target = None
for service in services:
    if service.get("name") == service_name:
        target = service
        break
if target is None:
    print(f"ERROR: service '{service_name}'를 찾을 수 없습니다", file=sys.stderr)
    raise SystemExit(1)

envs = target.setdefault("envs", [])
existing_by_key = {e.get("key"): e for e in envs if isinstance(e, dict) and e.get("key")}
for key, value in to_sync.items():
    if value == "" and not allow_empty_values:
        skipped_empty_keys.append(key)
        continue
    if key in existing_by_key:
        existing = existing_by_key[key]
        if existing.get("value") != value:
            existing["value"] = value
            updated_keys.append(key)
        # 타입/스코프가 비어있으면 보정
        existing.setdefault("scope", "RUN_TIME")
        if key in SECRET_LIKE_KEYS or key.endswith("_SECRET"):
            existing["type"] = "SECRET"
    else:
        new_env = {"key": key, "value": value, "scope": "RUN_TIME"}
        if key in SECRET_LIKE_KEYS or key.endswith("_SECRET"):
            new_env["type"] = "SECRET"
        envs.append(new_env)
        added_keys.append(key)

# AUTH_TRUST_HOST는 운영에서 기본 true 권장 (프록시/플랫폼 환경)
if "AUTH_TRUST_HOST" not in to_sync:
    if not any(isinstance(e, dict) and e.get("key") == "AUTH_TRUST_HOST" for e in envs):
        envs.append({"key": "AUTH_TRUST_HOST", "value": "true", "scope": "RUN_TIME"})
        added_keys.append("AUTH_TRUST_HOST")

changed = bool(updated_keys or added_keys)
changed_path.write_text("1" if changed else "0", encoding="utf-8")

if changed:
    spec_path.write_text(yaml.safe_dump(spec, sort_keys=False, allow_unicode=True), encoding="utf-8")

def dedupe(items: list[str]) -> list[str]:
    seen = set()
    out = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out

updated_keys = dedupe(updated_keys)
added_keys = dedupe(added_keys)
skipped_empty_keys = dedupe(skipped_empty_keys)

if changed:
    print("OK: env 동기화 완료")
else:
    print("OK: 변경 사항 없음 (스펙 업데이트 생략)")
print("SERVICE:", target.get("name", "(unknown)"))
print("UPDATED:", ", ".join(updated_keys) if updated_keys else "(none)")
print("ADDED:", ", ".join(added_keys) if added_keys else "(none)")
print("SKIPPED_EMPTY:", ", ".join(skipped_empty_keys) if skipped_empty_keys else "(none)")
PY
then
  cat "$SYNC_STDERR" >&2
  exit 1
fi

cat "$SYNC_STDOUT"

if [ "$(cat "$CHANGED_FILE")" != "1" ]; then
  echo "✅ 완료: 변경 없음"
  exit 0
fi

echo "→ DO 앱 스펙 적용 중..."
doctl_cmd apps update "$APP_ID" --spec "$SPEC_FILE" --wait >"$SYNC_STDOUT" 2>"$SYNC_STDERR" || {
  echo "ERROR: doctl apps update 실패" >&2
  tail -n 40 "$SYNC_STDERR" >&2 || true
  exit 1
}

echo "✅ 완료: env 동기화됨"
echo "   service: ${APP_SERVICE}"
