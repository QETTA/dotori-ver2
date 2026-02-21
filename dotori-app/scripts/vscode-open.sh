#!/bin/bash
# Dotori VS Code Workspace Launcher
# Usage: dcode [front|back|db|all]

VSCODE="/mnt/c/Users/sihu2/AppData/Local/Programs/Microsoft VS Code/bin/code"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

case "${1:-front}" in
  front|f)  "$VSCODE" "$APP_DIR/frontend.code-workspace" ;;
  back|b)   "$VSCODE" "$APP_DIR/backend.code-workspace" ;;
  db|d)     "$VSCODE" "$APP_DIR/mongodb.code-workspace" ;;
  all|a)
    "$VSCODE" "$APP_DIR/frontend.code-workspace"
    "$VSCODE" "$APP_DIR/backend.code-workspace"
    "$VSCODE" "$APP_DIR/mongodb.code-workspace"
    ;;
  *)
    echo "dcode [front|back|db|all]"
    echo "  f — UI     b — API     d — DB     a — 전부"
    exit 1
    ;;
esac
