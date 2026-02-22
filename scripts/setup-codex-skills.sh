#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALLER="$HOME/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py"
SKILLS=("openai-docs" "pdf" "spreadsheet" "transcribe" "sentry")
GLOBAL_DEST="$HOME/.codex/skills"
LOCAL_DEST="$REPO_ROOT/.codex-local/skills"
EXPLICIT_DEST="false"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 가 필요합니다." >&2
  exit 1
fi

if [[ ! -f "$INSTALLER" ]]; then
  echo "skill-installer 스크립트를 찾지 못했습니다: $INSTALLER" >&2
  exit 1
fi

if [[ $# -gt 0 ]]; then
  DEST="$1"
  EXPLICIT_DEST="true"
else
  DEST="$GLOBAL_DEST"
fi

mkdir -p "$DEST"

if [[ "$EXPLICIT_DEST" == "false" && "$DEST" == "$GLOBAL_DEST" ]]; then
  PROBE_FILE="$GLOBAL_DEST/.codex_write_probe.$$"
  if ! touch "$PROBE_FILE" >/dev/null 2>&1; then
    echo "[info] 글로벌 skills 경로 쓰기 권한이 없어 로컬 경로를 사용합니다: $LOCAL_DEST"
    DEST="$LOCAL_DEST"
    mkdir -p "$DEST"
  else
    rm -f "$PROBE_FILE"
  fi
fi

install_skill() {
  local skill="$1"
  local dest="$2"

  python3 "$INSTALLER" \
    --repo openai/skills \
    --path "skills/.curated/$skill" \
    --dest "$dest"
}

for skill in "${SKILLS[@]}"; do
  if [[ -d "$DEST/$skill" ]]; then
    echo "[skip] $skill (already installed in $DEST)"
    continue
  fi

  echo "[install] $skill"
  if install_skill "$skill" "$DEST"; then
    continue
  fi

  if [[ "$EXPLICIT_DEST" == "false" && "$DEST" == "$GLOBAL_DEST" ]]; then
    echo "[warn] 글로벌 경로 권한 오류로 로컬 경로로 전환합니다: $LOCAL_DEST"
    DEST="$LOCAL_DEST"
    mkdir -p "$DEST"

    if [[ -d "$DEST/$skill" ]]; then
      echo "[skip] $skill (already installed in $DEST)"
      continue
    fi

    echo "[install] $skill (retry)"
    install_skill "$skill" "$DEST"
  else
    exit 1
  fi
done

echo
echo "skills 설치 경로: $DEST"
if [[ "$DEST" == "$LOCAL_DEST" ]]; then
  echo "Codex에서 로컬 skills를 쓰려면:"
  echo "  export CODEX_HOME=\"$REPO_ROOT/.codex-local\""
  echo "  codex"
fi
echo "Restart Codex to pick up new skills."
