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
python3 - <<EOF
import re

with open('$SPEC_FILE', 'r') as f:
    content = f.read()

# KEY 바로 다음 value: 만 교체 (type: SECRET 여부 무관)
# 패턴: "- key: KEY\n  (scope/type 라인들)\n  value: OLD" → "value: NEW"
pattern = r'(- key: $KEY\n(?:(?!- key:).)*?value:)[^\n]*'
replacement = r'\1 $VALUE'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

if new_content == content:
    print(f"WARNING: '$KEY' 키를 찾지 못했습니다")
    exit(1)

with open('$SPEC_FILE', 'w') as f:
    f.write(new_content)

print(f"OK: '$KEY' 업데이트 완료")
EOF

echo "→ DO 앱 스펙 적용 중..."
doctl apps update "$APP_ID" --spec "$SPEC_FILE"

rm -f "$SPEC_FILE"
echo "✅ 완료: $KEY 업데이트됨"
echo ""
echo "새 배포 트리거하려면:"
echo "  doctl apps create-deployment $APP_ID"
