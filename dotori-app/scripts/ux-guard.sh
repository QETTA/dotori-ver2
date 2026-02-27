#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3002}"
OUT_DIR="${UX_GUARD_OUT:-/tmp/dotori-ux-guard}"
LOG_DIR="${OUT_DIR}/logs"

SCREEN_DIR="/tmp/dotori-screenshots"
SCROLL_DIR="/tmp/dotori-audit-v3"

mkdir -p "${LOG_DIR}"
rm -rf "${SCREEN_DIR}" "${SCROLL_DIR}"

run_step() {
	local name="$1"
	local cmd="$2"
	local log_file="${LOG_DIR}/${name}.log"
	echo "==> ${name}"
	if bash -lc "${cmd}" >"${log_file}" 2>&1; then
		echo "✓ ${name}"
		return 0
	fi

	echo "✗ ${name} (log: ${log_file})"
	tail -n 40 "${log_file}" || true
	return 1
}

if ! curl -fsS "${BASE_URL}/api/health" >/dev/null 2>&1; then
	echo "Server is not ready: ${BASE_URL}"
	exit 1
fi

run_step "check-console" "BASE_URL='${BASE_URL}' npm run check-console"
run_step "screenshot-check" "BASE_URL='${BASE_URL}' npm run screenshot"
run_step "scroll-audit" "BASE_URL='${BASE_URL}' npx tsx scripts/scroll-audit.ts"

mkdir -p "${OUT_DIR}"
cp -R "${SCREEN_DIR}" "${OUT_DIR}/screenshots" 2>/dev/null || true
cp -R "${SCROLL_DIR}" "${OUT_DIR}/scroll" 2>/dev/null || true

echo "UX guard passed. Artifacts: ${OUT_DIR}"
