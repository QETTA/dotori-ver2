#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

echo "Starting Dotori dev server: http://${HOST}:${PORT}"
echo "Tip: override with PORT=3000 HOST=127.0.0.1"

exec next dev --turbopack --hostname "${HOST}" --port "${PORT}"

