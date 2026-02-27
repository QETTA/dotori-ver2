#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SCAN_TARGETS=(src/app src/components/dotori)
SCAN_GLOBS=(
  --glob '!**/components/catalyst/**'
  --glob '!**/__tests__/**'
)

echo "[style-guard] Enforce no text-[Npx] typography escape hatches"
TEXT_PX_PATTERN='text-\[[0-9]+px\]'
if rg -n --pcre2 "$TEXT_PX_PATTERN" "${SCAN_TARGETS[@]}" "${SCAN_GLOBS[@]}"
then
  echo "ERROR: text-[Npx] is forbidden. Use DS_TYPOGRAPHY or text-display/h1/h2/h3/body/body-sm/caption/label."
  exit 1
fi

echo "[style-guard] Enforce motion/react-only imports"
FRAMER_MOTION_PATTERN='(?:from|require\()\s*["'"'"']framer-motion["'"'"']'
if rg -n --pcre2 "$FRAMER_MOTION_PATTERN" "${SCAN_TARGETS[@]}" "${SCAN_GLOBS[@]}"
then
  echo "ERROR: framer-motion is forbidden. Use motion/react."
  exit 1
fi

echo "[style-guard] OK"
