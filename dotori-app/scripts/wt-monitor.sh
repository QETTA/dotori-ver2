#!/bin/bash
# wt-monitor.sh — Codex 에이전트 진행 상황 실시간 모니터링
# Usage: ./scripts/wt-monitor.sh [ROUND=r6] [--watch]
#
# --watch: 5초마다 자동 갱신

ROUND=${1:-r6}
WATCH_MODE=false
[[ "${2:-}" == "--watch" ]] && WATCH_MODE=true

LOGS=/tmp/logs/$ROUND
RESULTS=/tmp/results/$ROUND
AGENTS=(eslint auth service-facility service-community api-middleware env explore-fix home-data landing-cta geocode infra)

show_status() {
  clear
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  Codex 모니터 — ROUND: $ROUND  $(date +%H:%M:%S)                    ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  DONE=0
  RUNNING=0
  WAITING=0

  for AGENT in "${AGENTS[@]}"; do
    RESULT="$RESULTS/$AGENT.txt"
    LOG="$LOGS/$AGENT.log"

    if [ -f "$RESULT" ]; then
      SUMMARY=$(head -1 "$RESULT" 2>/dev/null | cut -c1-55 || echo "완료")
      printf "  ✅ %-22s %s\n" "$AGENT" "$SUMMARY"
      DONE=$(( DONE + 1 ))
    elif [ -f "$LOG" ]; then
      LINES=$(wc -l < "$LOG" 2>/dev/null || echo "0")
      LAST=$(tail -1 "$LOG" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | cut -c1-50)
      printf "  🔄 %-22s [%4d줄] %s\n" "$AGENT" "$LINES" "$LAST"
      RUNNING=$(( RUNNING + 1 ))
    else
      printf "  ⏳ %-22s 대기중\n" "$AGENT"
      WAITING=$(( WAITING + 1 ))
    fi
  done

  echo ""
  echo "  완료: $DONE  |  실행중: $RUNNING  |  대기: $WAITING  |  전체: ${#AGENTS[@]}"
  echo ""
  echo "  로그 보기:  tail -f $LOGS/<agent>.log"
  echo "  결과 보기:  cat $RESULTS/<agent>.txt"
  $WATCH_MODE && echo "  (5초마다 갱신 — Ctrl+C 종료)"
}

if $WATCH_MODE; then
  while true; do
    show_status
    sleep 5
  done
else
  show_status
fi
