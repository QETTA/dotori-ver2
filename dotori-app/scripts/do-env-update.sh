#!/bin/bash
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

SPEC_FILE="/tmp/do-spec-$(date +%s).yaml"

echo "→ 현재 스펙 가져오는 중..."
doctl apps spec get "$APP_ID" > "$SPEC_FILE"

echo "→ '$KEY' 값 업데이트 중..."
SPEC_FILE="$SPEC_FILE" KEY="$KEY" VALUE="$VALUE" python3 - <<'PY'
import os
import sys
import yaml

spec_path = os.environ["SPEC_FILE"]
key = os.environ["KEY"]
value = os.environ["VALUE"]

with open(spec_path, "r", encoding="utf-8") as f:
    spec = yaml.safe_load(f)

services = spec.get("services") or []
if not services:
    print("ERROR: spec.services가 비어 있습니다", file=sys.stderr)
    raise SystemExit(1)

updated = False
for service in services:
    envs = service.setdefault("envs", [])
    for env in envs:
        if env.get("key") == key:
            env["value"] = value
            updated = True
            break
    if updated:
        break

if not updated:
    first_service = services[0]
    envs = first_service.setdefault("envs", [])
    new_env = {
        "key": key,
        "scope": "RUN_TIME",
        "value": value,
    }
    secret_like_keys = {
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
    if key in secret_like_keys or key.endswith("_SECRET"):
        new_env["type"] = "SECRET"
    envs.append(new_env)

with open(spec_path, "w", encoding="utf-8") as f:
    yaml.safe_dump(spec, f, sort_keys=False, allow_unicode=True)

print(f"OK: '{key}' 업데이트 완료")
PY

echo "→ DO 앱 스펙 적용 중..."
doctl apps update "$APP_ID" --spec "$SPEC_FILE"

rm -f "$SPEC_FILE"
echo "✅ 완료: $KEY 업데이트됨"
echo ""
echo "새 배포 트리거하려면:"
echo "  doctl apps create-deployment $APP_ID"
