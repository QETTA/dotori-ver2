#!/bin/bash
# multi-agent-next-wave.sh — next-wave tasks launcher wrapper

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
TASKS_FILE_DEFAULT="$SCRIPT_DIR/tasks/multi-agent-next-wave.tasks"
WAVE_SIZE_DEFAULT="${WAVE_SIZE:-4}"
CODEX_MODEL_DEFAULT="${CODEX_MODEL:-gpt-5.3-codex}"

if [ ! -f "$TASKS_FILE_DEFAULT" ]; then
  echo "ERROR: Tasks file not found: $TASKS_FILE_DEFAULT"
  echo ""
  echo "This wrapper expects a task file at the path above."
  echo "Create it with lines in format: agent_id|files|description"
  echo "Or call codex-wave.sh directly: ./scripts/codex-wave.sh <your-tasks-file>"
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
