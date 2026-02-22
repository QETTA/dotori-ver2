#!/bin/bash
# vision-eval.sh — 모바일 스크린샷 캡처 + Claude 비전 검수 준비
# Usage: ./scripts/vision-eval.sh
#
# 1. 개발 서버 실행 확인
# 2. 스크린샷 촬영 (10개 페이지)
# 3. 경로 리포트 출력 → Claude가 Read 도구로 읽어서 비전 평가

set -uo pipefail

APP=/home/sihu2129/dotori-ver2/dotori-app
OUT=/tmp/dotori-screenshots
PORT=3002
BASE_URL=${BASE_URL:-http://localhost:$PORT}

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
step() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  비전 검수 — 모바일 스크린샷 촬영              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"

### ── 개발 서버 확인 ────────────────────────────────────────────────
step "서버 확인"

if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
  ok "개발 서버 실행 중 (포트 $PORT)"
  SERVER_STARTED=false
else
  warn "개발 서버 미실행 — 시작 중..."
  cd "$APP"
  NEXTAUTH_URL="$BASE_URL" npm run dev:3002 > /tmp/dev-server.log 2>&1 &
  DEV_PID=$!
  SERVER_STARTED=true

  # 최대 30초 대기
  for i in $(seq 1 30); do
    sleep 1
    if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
      ok "서버 시작 완료 (${i}초)"
      break
    fi
    if [ "$i" -eq 30 ]; then
      warn "서버 시작 실패 — 수동으로 'npm run dev' 실행 후 재시도"
      exit 1
    fi
  done
fi

### ── 스크린샷 촬영 ─────────────────────────────────────────────────
step "스크린샷 촬영 (10개 페이지)"

mkdir -p "$OUT"
cd "$APP"
BASE_URL="$BASE_URL" npx tsx scripts/screenshot-check.ts

ok "스크린샷 저장: $OUT"

### ── 정리 ──────────────────────────────────────────────────────────
if [ "${SERVER_STARTED:-false}" = true ]; then
  kill "$DEV_PID" 2>/dev/null || true
  ok "개발 서버 종료"
fi

### ── 비전 검수 가이드 출력 ─────────────────────────────────────────
step "Claude 비전 검수 준비 완료"

echo ""
echo "  📱 촬영된 스크린샷:"
ls "$OUT"/*.png 2>/dev/null | while read f; do
  SIZE=$(du -sh "$f" 2>/dev/null | cut -f1)
  echo "     $(basename $f)  ($SIZE)"
done

echo ""
echo -e "${BLUE}  ── Claude 비전 평가 지시사항 ───────────────────────${NC}"
echo "  아래 내용을 Claude에게 전달하세요:"
echo ""
echo "  『$OUT 의 모든 PNG 스크린샷을 Read 도구로 읽고,"
echo "   아래 관점으로 각 화면을 평가해라:"
echo "   1. 비즈니스 목표 달성도 (수익화 CTA, 프리미엄 유도)"
echo "   2. UX 품질 (모바일 375px 기준, 터치 타겟, 가독성)"
echo "   3. 브랜드 일관성 (dotori 색상, 컴포넌트 통일성)"
echo "   4. 전환 퍼널 (다음 액션이 명확한가)"
echo "   평가 후 개선 항목을 Codex 태스크로 정리.』"
echo ""
echo "  또는 ./scripts/mobile-qa.sh 실행 시 자동 QA에 포함됩니다."
echo ""
