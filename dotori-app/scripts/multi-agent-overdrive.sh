#!/bin/bash
# multi-agent-overdrive.sh — expanded multi-agent launcher

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
TASKS_FILE_DEFAULT="$SCRIPT_DIR/tasks/multi-agent-overdrive.tasks"
WAVE_SIZE_DEFAULT="${WAVE_SIZE:-6}"
CODEX_MODEL_DEFAULT="${CODEX_MODEL:-gpt-5.3-codex}"

if [ ! -f "$TASKS_FILE_DEFAULT" ]; then
  echo "Tasks file not found: $TASKS_FILE_DEFAULT"
  exit 1
fi

HAS_WAVE=0
HAS_MODEL=0
for arg in "$@"; do
  case "$arg" in
    --wave=*) HAS_WAVE=1 ;;
    --model=*) HAS_MODEL=1 ;;
  esac
done

CMD=(bash "$SCRIPT_DIR/codex-wave.sh" "$TASKS_FILE_DEFAULT")
[ "$HAS_WAVE" -eq 0 ] && CMD+=("--wave=$WAVE_SIZE_DEFAULT")
[ "$HAS_MODEL" -eq 0 ] && CMD+=("--model=$CODEX_MODEL_DEFAULT")

for arg in "$@"; do
  CMD+=("$arg")
done

echo "Launch: ${CMD[*]}"
"${CMD[@]}"
