#!/bin/bash
# 모바일 QA 자동 검수
# - 콘솔 에러 점검
# - 핵심 시나리오 E2E 점검
# - 전체 화면 스크린샷/스크롤 캡처
#
# Usage:
#   ./scripts/mobile-qa.sh
#   QA_PORT=3002 STRICT_QA=false ./scripts/mobile-qa.sh

set -uo pipefail

APP=/home/sihu2129/dotori-ver2/dotori-app
QA_PORT=${QA_PORT:-3002}
BASE_URL=${BASE_URL:-http://localhost:$QA_PORT}
STRICT_QA=${STRICT_QA:-true}
OUT=${QA_OUT:-/tmp/dotori-mobile-qa}
LOG_DIR="$OUT/logs"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
err()  { echo -e "${RED}  ❌ $1${NC}"; }
step() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }

SERVER_STARTED=false
DEV_PID=""

cleanup() {
	if [ "$SERVER_STARTED" = true ] && [ -n "$DEV_PID" ]; then
		kill "$DEV_PID" 2>/dev/null || true
		wait "$DEV_PID" 2>/dev/null || true
		ok "QA 전용 dev 서버 종료"
	fi
}
trap cleanup EXIT

mkdir -p "$LOG_DIR"

run_step() {
	local name="$1"
	local cmd="$2"
	local logfile="$LOG_DIR/$name.log"

	step "$name"
	if bash -lc "$cmd" > "$logfile" 2>&1; then
		ok "$name 통과"
		return 0
	fi

	warn "$name 실패 (로그: $logfile)"
	tail -20 "$logfile" || true
	return 1
}

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  모바일 QA 자동 검수                         ║${NC}"
echo -e "${BLUE}║  BASE: $BASE_URL                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"

cd "$APP"

step "개발 서버 확인"
if curl -fsS "$BASE_URL/api/health" > /dev/null 2>&1; then
	ok "이미 실행 중인 서버 사용 ($BASE_URL)"
else
	warn "서버 미실행 — QA용 서버 시작"
	NEXTAUTH_URL="$BASE_URL" npm run dev:3002 > "$LOG_DIR/dev-server.log" 2>&1 &
	DEV_PID=$!
	SERVER_STARTED=true

	for i in $(seq 1 45); do
		sleep 1
		if curl -fsS "$BASE_URL/api/health" > /dev/null 2>&1; then
			ok "서버 시작 완료 (${i}초)"
			break
		fi
		if [ "$i" -eq 45 ]; then
			err "서버 시작 실패 (로그: $LOG_DIR/dev-server.log)"
			exit 1
		fi
	done
fi

FAILED=0

run_step "check-console" "BASE_URL='$BASE_URL' npm run check-console" || FAILED=$((FAILED + 1))
run_step "e2e-test" "BASE_URL='$BASE_URL' npx tsx scripts/e2e-test.ts" || FAILED=$((FAILED + 1))
run_step "screenshot-check" "BASE_URL='$BASE_URL' npx tsx scripts/screenshot-check.ts" || FAILED=$((FAILED + 1))
run_step "scroll-audit" "BASE_URL='$BASE_URL' npx tsx scripts/scroll-audit.ts" || FAILED=$((FAILED + 1))

echo ""
echo -e "${BLUE}═══ QA 요약 ═══${NC}"
if [ "$FAILED" -eq 0 ]; then
	ok "모든 모바일 QA 단계 통과"
	echo "  로그 디렉토리: $LOG_DIR"
	echo "  스크린샷: /tmp/dotori-screenshots, /tmp/dotori-audit-v3"
	exit 0
fi

warn "실패 단계 수: $FAILED"
echo "  로그 디렉토리: $LOG_DIR"
echo "  스크린샷: /tmp/dotori-screenshots, /tmp/dotori-audit-v3"

if [ "$STRICT_QA" = "true" ]; then
	err "STRICT_QA=true 이므로 실패로 종료"
	exit 1
fi

warn "STRICT_QA=false 이므로 경고만 남기고 종료"
exit 0
