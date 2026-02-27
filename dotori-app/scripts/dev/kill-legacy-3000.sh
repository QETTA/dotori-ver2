#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"

if ! command -v lsof >/dev/null 2>&1; then
  echo "lsof not found; can't auto-kill port ${PORT}."
  echo "Use: ss -ltnp | grep \":${PORT}\""
  exit 1
fi

PIDS="$(lsof -ti "tcp:${PORT}" -sTCP:LISTEN || true)"
if [[ -z "${PIDS}" ]]; then
  echo "No process is listening on port ${PORT}."
  exit 0
fi

for pid in ${PIDS}; do
  cmd="$(ps -p "${pid}" -o command= || true)"
  if echo "${cmd}" | grep -Eiq '(next|node)'; then
    echo "Killing pid ${pid} (port ${PORT}): ${cmd}"
    kill -TERM "${pid}" || true
  else
    echo "Refusing to kill pid ${pid} (unexpected command): ${cmd}"
    exit 1
  fi
done

