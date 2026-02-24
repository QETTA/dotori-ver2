#!/bin/bash
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

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: ENV_FILE not found: $ENV_FILE" >&2
  exit 1
fi

SPEC_FILE="/tmp/do-spec-sync-$(date +%s).yaml"

echo "→ 현재 스펙 가져오는 중..."
doctl apps spec get "$APP_ID" > "$SPEC_FILE"

echo "→ env 동기화 중... (파일: $ENV_FILE)"
SPEC_FILE="$SPEC_FILE" ENV_FILE="$ENV_FILE" python3 - <<'PY'
import os
import re
import sys
from pathlib import Path

import yaml

spec_path = Path(os.environ["SPEC_FILE"])
env_path = Path(os.environ["ENV_FILE"])

# 안전장치: DO에 올릴 키 allowlist
ALLOWED_KEYS = {
    # Auth
    "NEXTAUTH_URL",
    "AUTH_SECRET",
    "AUTH_TRUST_HOST",
    "AUTH_KAKAO_ID",
    "AUTH_KAKAO_SECRET",
    # MongoDB
    "MONGODB_URI",
    "MONGODB_DB_NAME",
    # Kakao APIs
    "KAKAO_REST_API_KEY",
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
    # Analytics
    "NEXT_PUBLIC_GA_ID",
    # Cron
    "CRON_SECRET",
}

SECRET_LIKE_KEYS = {
    "AUTH_SECRET",
    "AUTH_KAKAO_ID",
    "AUTH_KAKAO_SECRET",
    "MONGODB_URI",
    "KAKAO_REST_API_KEY",
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

updated_keys: list[str] = []
added_keys: list[str] = []

for service in services:
    envs = service.setdefault("envs", [])
    existing_by_key = {e.get("key"): e for e in envs if isinstance(e, dict) and e.get("key")}
    for key, value in to_sync.items():
        if key in existing_by_key:
            existing_by_key[key]["value"] = value
            # 타입/스코프가 비어있으면 보정
            existing_by_key[key].setdefault("scope", "RUN_TIME")
            if key in SECRET_LIKE_KEYS or key.endswith("_SECRET"):
                existing_by_key[key]["type"] = "SECRET"
            updated_keys.append(key)
        else:
            new_env = {"key": key, "value": value, "scope": "RUN_TIME"}
            if key in SECRET_LIKE_KEYS or key.endswith("_SECRET"):
                new_env["type"] = "SECRET"
            envs.append(new_env)
            added_keys.append(key)

# AUTH_TRUST_HOST는 운영에서 기본 true 권장 (프록시/플랫폼 환경)
if "AUTH_TRUST_HOST" not in to_sync:
    for service in services:
        envs = service.setdefault("envs", [])
        if not any(isinstance(e, dict) and e.get("key") == "AUTH_TRUST_HOST" for e in envs):
            envs.append({"key": "AUTH_TRUST_HOST", "value": "true", "scope": "RUN_TIME"})
            added_keys.append("AUTH_TRUST_HOST")

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

print("OK: env 동기화 완료")
print("UPDATED:", ", ".join(updated_keys) if updated_keys else "(none)")
print("ADDED:", ", ".join(added_keys) if added_keys else "(none)")
PY

echo "→ DO 앱 스펙 적용 중..."
doctl apps update "$APP_ID" --spec "$SPEC_FILE" >/tmp/do-env-sync.out 2>/tmp/do-env-sync.err || {
  echo "ERROR: doctl apps update 실패" >&2
  tail -n 40 /tmp/do-env-sync.err >&2 || true
  exit 1
}

rm -f "$SPEC_FILE"
echo "✅ 완료: env 동기화됨"
echo ""
echo "새 배포 트리거:"
echo "  doctl apps create-deployment $APP_ID --wait"
