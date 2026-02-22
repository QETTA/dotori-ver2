#!/bin/bash
# ㄱ 파이프라인 v4 — Codex 병렬 실행
# Usage: ./scripts/launch.sh [ROUND=r18] [MODEL=gpt-5.2]

set -uo pipefail

### ── CONFIG ─────────────────────────────────────────────────────────────
ROUND=${1:-r19}
CODEX_MODEL=${CODEX_MODEL:-gpt-5.2}
REPO=/home/sihu2129/dotori-ver2
APP=$REPO/dotori-app
WT_BASE=$REPO/.worktrees
RESULTS=/tmp/results/$ROUND
LOGS=/tmp/logs/$ROUND

AGENTS=(polish-login polish-home polish-chat polish-explore polish-community polish-my polish-facility polish-shared polish-waitlist polish-onboarding polish-comp)
MERGE_ORDER=(polish-comp polish-shared polish-login polish-home polish-chat polish-explore polish-community polish-my polish-facility polish-waitlist polish-onboarding)
PIDS=()
PASS=()
FAIL=()

### ── 컬러 출력 ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; exit 1; }
step() { echo -e "\n${BLUE}═══ $1 ═══${NC}"; }
info() { echo "     $1"; }

### ── 공통 다크모드 규칙 (모든 에이전트 공유) ──────────────────────────────
DARK_RULES='## 다크모드 규칙
CSS 변수 시스템이 이미 globals.css에 설정되어 있다.
- 라이트: --color-bg-primary(dotori-50), --color-bg-surface(white), --color-text-primary(dotori-900)
- 다크: --color-bg-primary(#1a1510), --color-bg-surface(#2d2418), --color-text-primary(#f5ede0)
- .dark 클래스가 <html>에 토글됨

### 적용 패턴:
1. bg-white → bg-white dark:bg-dotori-950
2. bg-dotori-50 → bg-dotori-50 dark:bg-dotori-900
3. bg-dotori-100 → bg-dotori-100 dark:bg-dotori-800
4. text-dotori-900 → text-dotori-900 dark:text-dotori-50
5. text-dotori-800 → text-dotori-800 dark:text-dotori-100
6. text-dotori-700 → text-dotori-700 dark:text-dotori-200
7. text-dotori-600 → text-dotori-600 dark:text-dotori-300
8. text-dotori-500 → 그대로 (브랜드 색상, 라이트/다크 공통)
9. text-dotori-400 → 그대로 (브랜드 색상)
10. border-dotori-100 → border-dotori-100 dark:border-dotori-800
11. border-dotori-200 → border-dotori-200 dark:border-dotori-700
12. divide-dotori-100 → divide-dotori-100 dark:divide-dotori-800
13. bg-forest-500 → 그대로 (성공 색상은 변경 불요)
14. shadow-* → shadow-* dark:shadow-none 또는 유지 (케이스별 판단)
15. placeholder 색상: placeholder:text-dotori-400 dark:placeholder:text-dotori-600

### 금지:
- bg-black, bg-gray-* 사용 금지 → dotori 팔레트만 사용
- 새로운 CSS 변수 정의 금지 (globals.css 건드리지 마라)
- Catalyst 컴포넌트 내부 수정 금지 (이미 dark: 지원됨)'

### ── 공통 모션 규칙 ──────────────────────────────────────────────────────
MOTION_RULES='## 모션 프리셋 규칙
src/lib/motion.ts에 중앙화된 프리셋이 있다. 인라인 모션 정의 대신 이것을 사용해라.

import { fadeUp, stagger, tap, glass } from "@/lib/motion";

### 사용 패턴:
- 페이지 섹션 등장: <motion.div {...fadeUp}>
- 리스트 아이템 순차 등장: <motion.ul {...stagger.container}> + <motion.li {...stagger.item}>
- 카드 탭 피드백: <motion.div {...tap.card}>
- 버튼 탭: <motion.button {...tap.button}>

### 글래스 효과 (globals.css 유틸리티):
- 고정 헤더: className="glass-header sticky top-0 z-10"
- 바텀시트: className="glass-sheet"
- 플로팅 카드: className="glass-card"
- 오버레이: className="glass-overlay"

### 금지:
- framer-motion import 금지 → motion/react만 사용
- 새로운 인라인 variants 정의 최소화 (motion.ts 프리셋 우선)'

### ── R19 공통 원칙 ─────────────────────────────────────────────────────
R19_PRINCIPLE='## R19 원칙 (반드시 준수)
R18에서 dark mode + glass + motion 기반을 장착했다. R19는 레이아웃 폴리싱과 인터랙션 완성이 목표다.

### 금지 (R19에서 하지 말아야 할 것):
1. dark: 클래스를 이미 있는 곳에 중복 추가 금지 — 파일을 읽어서 이미 적용됐으면 건드리지 마라
2. globals.css 수정 금지
3. motion.ts 수정 금지
4. layout.tsx 수정 금지
5. framer-motion import 금지

### 해야 할 것:
1. 간격(spacing) 개선: 과도한 빈공간 제거, 섹션 간 균형 잡기
2. 타이포그래피: 계층 강화 (제목 크기, 본문 대비)
3. 인터랙션: tap/hover 피드백이 빠진 곳 추가
4. 빈 상태(empty state): 더 친근한 메시지와 시각 처리
5. CTA 일관성: 주요 버튼은 항상 min-h-11 이상, full-width
6. text-[Npx] 확인 및 제거

### 설계 기준:
- 화면의 20% 이상이 빈 공간이면 안 된다 (로그인 예외: 브랜딩 여백)
- 섹션 간격: space-y-4 또는 mt-6 기본
- 카드 패딩: px-4 py-4 또는 p-5 기본
- 터치 타깃: 모든 버튼/링크 min-h-11 이상'

### ── 에이전트별 작업 프롬프트 ─────────────────────────────────────────────
get_task() {
  local agent=$1
  case $agent in
    polish-login)
      echo "로그인 페이지 레이아웃 폴리싱

담당 파일:
- src/app/(auth)/login/page.tsx
- src/app/(auth)/error.tsx

$R19_PRINCIPLE

## 구체적 문제
현재 login/page.tsx의 내부 flex 컨테이너가 min-h-dvh flex-col pt-8이다.
화면 상단 40% 가량이 비어 보이고, 'mt-auto'로 인해 하단 terms 위 큰 공백이 발생한다.

## 수정 방법
LoginPageClient()의 return 문에서 내부 레이아웃을 다음으로 변경:

before:
  <div className=\"relative min-h-dvh overflow-x-hidden bg-dotori-50 ...\">
    <LoginBackgroundDecoration />
    {shouldReduceMotion ? (
      <div className=\"... flex min-h-dvh w-full max-w-md flex-col items-center px-6 pt-8 text-center\">
    ) : (
      <motion.div className=\"... flex min-h-dvh w-full max-w-md flex-col items-center px-6 pt-8 text-center\">

after:
  - 외부 div는 그대로 (bg, min-h-dvh, overflow)
  - 내부 컨테이너: flex min-h-dvh flex-col items-center px-6 text-center
    - 상단 영역 (flex-1 flex flex-col justify-center): LoginIntro + error + LoginCard
    - '로그인 없이 둘러보기' 링크: 카드 바로 아래 (mt-6)
    - Terms 단락: pb-6 pt-4 (mt-auto 제거, flex-col 끝에 자연 배치)

LoginFooter 컴포넌트 수정:
  - mt-auto pt-10 → mt-4 pb-6 pt-6 (mt-auto 제거)

LoginCard 수정:
  - mt-7 → mt-8 (약간 더 간격)

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-home)
      echo "홈 페이지 폴리싱

담당 파일:
- src/app/(app)/page.tsx

$R19_PRINCIPLE

## 구체적 개선
1. 헤더 섹션 압축
   - 인사말(Heading level=1) + 서브텍스트 + 상태카드 3개
   - 상태카드의 py-2.5 → py-2로 세로 압축
   - 헤더 mb-3 → mb-2

2. AI 토리 섹션 개선
   - AI 칩 스타일: 현재 <Badge color='dotori'>가 작고 눌림감 없음
   - 각 칩에 active:scale-[0.97] transition 추가
   - AI 칩 3개 배열을 더 균등하게

3. 내 주변 빈자리 섹션
   - AiBriefingCard 내부 Select 드롭다운에 min-h-11 확인
   - 빈자리 없을 때 empty Surface: 좀 더 격려하는 메시지

4. NBA 추천 섹션
   - NBA 카드 리스트가 이미 stagger 적용됐으면 건드리지 마라
   - 카드 내 action 버튼 full-width 확인

5. 하단 커뮤니티 바
   - 현재 border-t + link만 있음
   - 약간 더 눈에 띄는 처리: bg-dotori-50/50 rounded-2xl px-4 py-3 등

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-chat)
      echo "채팅 페이지 폴리싱

담당 파일:
- src/app/(app)/chat/page.tsx
- src/components/dotori/chat/ChatPromptPanel.tsx

$R19_PRINCIPLE

## 구체적 개선
1. ChatPromptPanel 개선
   - 중앙 아이콘(acorn): 현재 크기/위치 확인, 더 임팩트 있게 h-16 w-16 또는 h-20 w-20
   - 제목 텍스트 크기 확인 (text-2xl 이상이어야 함)
   - 제안 칩 2개: 더 명확한 카드 스타일, 클릭 영역 min-h-14

2. 채팅 헤더 영역 (chat/page.tsx)
   - '대화 초기화' 버튼 위치/스타일 확인
   - UsageCounter 위치 확인 (0/3이 너무 위에 있으면 헤더 안으로)

3. 채팅 입력 영역
   - 하단 입력창이 glass-sheet 또는 solid white 배경인지 확인
   - 전송 버튼 min-h-11 확인

4. 채팅 메시지 없을 때 (ChatPromptPanel)
   - 제안 칩 2개를 stagger.container + stagger.item으로 등장 처리
   - 각 칩에 active:scale-[0.97] transition 추가

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-explore)
      echo "탐색 페이지 폴리싱

담당 파일:
- src/app/(app)/explore/page.tsx
- src/components/dotori/explore/ExploreSearchHeader.tsx
- src/components/dotori/explore/ExploreResultList.tsx
- src/components/dotori/explore/ExploreSuggestionPanel.tsx

$R19_PRINCIPLE

## 구체적 개선
1. ExploreSearchHeader 개선
   - 시나리오 칩 (반편성 불만 / 교사 교체 등): active:scale-[0.97] 추가
   - 필터/지도 버튼: 더 명확한 아이콘 + 텍스트 레이블
   - '이동 가능 시설만 보기 N' 버튼: 현재 어두운 pill 스타일
     → color='forest' Button으로 교체하거나 bg-forest-500 text-white rounded-2xl

2. ExploreResultList 개선
   - 시설 카드 리스트: 이미 FacilityCard를 사용, spacing만 확인
   - AI 브리핑 카드가 결과 상단에 나오는지 확인

3. 빈 결과 상태
   - 더 친근한 메시지 및 조건 조정 버튼 full-width

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-community)
      echo "커뮤니티 페이지 폴리싱

담당 파일:
- src/app/(app)/community/page.tsx
- src/app/(app)/community/[id]/page.tsx

$R19_PRINCIPLE

## 구체적 개선
1. 커뮤니티 목록 (community/page.tsx)
   - 게시글 카드: 현재 rounded-[28px] border bg-white p-5
     → 약간 더 compact한 p-4 또는 p-4 px-5
   - 저자 아바타: 현재 h-8 w-8 rounded-full overflow-hidden
     → 도토리 브랜드 bg를 bg-dotori-100 text-dotori-600으로 통일
   - 좋아요/댓글 카운터: flex items-center gap-3 text-xs 확인
   - 글쓰기 FAB: 하단 우측에 충분히 크게 (h-14 w-14)

2. 게시글 상세 (community/[id]/page.tsx)
   - 헤더 glass-header sticky 확인
   - 댓글 영역: 댓글 카드에 적절한 배경 처리
   - 댓글 입력창: 하단 고정 glass-sheet 효과

3. 카테고리 필터 탭
   - 선택된 탭: bg-dotori-900 text-white rounded-full
   - 미선택: border border-dotori-200 text-dotori-600

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-my)
      echo "마이페이지 폴리싱

담당 파일:
- src/app/(app)/my/page.tsx
- src/app/(app)/my/settings/page.tsx

$R19_PRINCIPLE

## 구체적 개선
1. my/page.tsx 프로필 섹션
   - 아바타 크기: h-16 w-16 (현재 상태 확인)
   - 닉네임 텍스트: text-lg font-bold
   - 프로필 상단 섹션 배경: 현재 bg-white dark:bg-dotori-950
     → Surface 컴포넌트 사용 또는 bg-dotori-50 rounded-3xl p-5

2. 메뉴 그룹핑
   - 각 메뉴 항목: flex items-center justify-between gap-3 min-h-12
   - 섹션 구분선: border-t border-dotori-100 dark:border-dotori-800 my-2
   - 아이콘 있는 메뉴 항목: 아이콘 h-5 w-5 text-dotori-500

3. my/settings/page.tsx 다크모드 토글 추가
   - 현재 파일 읽어서 다크모드 설정 UI 없으면 추가:
   - import { useTheme } from '@/hooks/useTheme'
   - 테마 섹션: 라이트 / 다크 / 시스템 3단 세그먼트 컨트롤
   - 선택된 세그먼트: bg-dotori-900 text-white rounded-xl
   - 미선택: text-dotori-600

4. 로그인 필요 안내 (비로그인 상태)
   - 더 브랜드다운 빈 상태 + 로그인 버튼 full-width

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-facility)
      echo "시설 상세 페이지 폴리싱

담당 파일:
- src/app/(app)/facility/[id]/FacilityDetailClient.tsx
- src/components/dotori/facility/FacilityCapacitySection.tsx
- src/components/dotori/facility/FacilityContactSection.tsx
- src/components/dotori/facility/FacilityWaitlistCTA.tsx

$R19_PRINCIPLE

## 구체적 개선
1. FacilityDetailClient
   - 이미지 없는 시설: 플레이스홀더 배경 더 브랜드답게 (bg-dotori-100 + acorn watermark)
   - 섹션 구분: space-y-4 또는 divide-y 사용 확인
   - 하단 CTA (아이사랑 앱 열기 등): w-full min-h-12

2. FacilityCapacitySection
   - 정원/현원/대기 3칸 그리드: 숫자 크기 text-2xl font-bold로 강조
   - 진행 바: 현재 존재하면 색상 확인 (forest-500 → forest-500)

3. FacilityContactSection
   - 전화번호/주소 항목: 클릭 가능하면 active:scale-[0.97] 추가
   - 지도 섹션: MapEmbed 위에 제목 표시 확인

4. FacilityWaitlistCTA (있으면)
   - 대기 신청 버튼: color='dotori' w-full min-h-12

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-shared)
      echo "공유 컴포넌트 폴리싱

담당 파일:
- src/components/dotori/AiBriefingCard.tsx
- src/components/dotori/UsageCounter.tsx
- src/components/dotori/EmptyState.tsx
- src/components/dotori/ErrorState.tsx
- src/components/dotori/Toast.tsx
- src/components/dotori/ActionConfirmSheet.tsx
- src/components/dotori/Wallpaper.tsx

$R19_PRINCIPLE

## 구체적 개선
1. AiBriefingCard
   - 상단 'AI분석' 배지와 업데이트 시간이 작고 흐릿함
   - 카드 배경: bg-dotori-50/80 또는 Surface muted tone 사용
   - 내부 패딩 적절히: px-4 py-3

2. UsageCounter
   - 0/3 형태 사용량 카운터: 현재 작은 바
   - 프로그레스 바 색상: forest-500 (사용 가능) → dotori-300 (사용됨)
   - 카운터 텍스트 크기/위치 확인

3. EmptyState / ErrorState
   - 더 친근한 일러스트 or 아이콘 사용
   - 제목: text-base font-semibold, 설명: text-sm text-dotori-600
   - 액션 버튼: full-width min-h-11

4. ActionConfirmSheet
   - glass-sheet 효과 확인 (bottom sheet)
   - 취소/확인 버튼: 적절한 크기 및 색상 대비

5. Toast
   - 성공: bg-forest-100 text-forest-800 border-forest-200
   - 에러: bg-red-50 text-red-700 border-red-200
   - 다크: dark:bg-forest-900/20 dark:text-forest-100

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-waitlist)
      echo "대기/알림 페이지 폴리싱

담당 파일:
- src/app/(app)/my/waitlist/page.tsx
- src/app/(app)/my/waitlist/[id]/page.tsx
- src/app/(app)/my/notifications/page.tsx
- src/app/(app)/my/interests/page.tsx

$R19_PRINCIPLE

## 구체적 개선
1. waitlist/page.tsx
   - 대기 신청 카드: 더 명확한 상태 표시 (순위, 시설명 강조)
   - 신청 날짜: text-xs text-dotori-400
   - 빈 상태: '아직 대기 신청이 없어요' + 탐색하러 가기 버튼

2. waitlist/[id]/page.tsx
   - 상세 정보 섹션: 순위 숫자 크게 (text-4xl font-bold)
   - 진행 상황 바: 시각적으로 더 명확

3. notifications/page.tsx
   - 알림 카드: 읽은/읽지않은 구분 더 명확
   - 읽지 않은 알림: 좌측 border-l-4 border-l-dotori-400

4. interests/page.tsx
   - 관심 시설 목록: FacilityCard compact 사용 확인
   - 관심 시설 없을 때 empty state

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-onboarding)
      echo "온보딩 페이지 폴리싱

담당 파일:
- src/app/(onboarding)/onboarding/page.tsx

$R19_PRINCIPLE

## 구체적 개선
1. 온보딩 스텝 카드
   - 각 스텝 컨테이너: 더 깔끔한 흰 배경 + shadow-sm
   - 스텝 번호/타이틀: 더 큰 타이포 (text-xl font-bold)

2. 선택 버튼 (지역, 관심사 등)
   - 선택됨: bg-dotori-900 text-white 또는 ring-2 ring-dotori-400
   - 미선택: bg-white border border-dotori-200 text-dotori-700
   - 버튼 크기: min-h-12

3. 진행 바
   - 현재 상태 확인, dotori-400 색상으로 진행 표시

4. 다음/완료 버튼
   - 항상 하단 고정, w-full min-h-12 bg-dotori-900

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    polish-comp)
      echo "핵심 공유 컴포넌트 폴리싱

담당 파일:
- src/components/dotori/FacilityCard.tsx
- src/components/dotori/Skeleton.tsx
- src/components/dotori/SourceChip.tsx
- src/components/dotori/blocks/ChecklistBlock.tsx
- src/components/dotori/blocks/ 내 모든 파일

$R19_PRINCIPLE

## 구체적 개선
1. FacilityCard
   - compact 모드: 정보 계층 더 명확히 (시설명 font-semibold, 주소 text-sm text-dotori-500)
   - status pill 크기: 더 명확하게 px-3 py-1
   - '자리 N석' 텍스트: text-forest-700 font-semibold

2. Skeleton
   - 스켈레톤 색상: bg-dotori-100/80 dark:bg-dotori-800/60 통일
   - motion-safe:animate-pulse 확인

3. SourceChip
   - 소스 배지 크기 적절한지 확인 (text-xs)
   - 신선도 표시: 초록/노랑 dot 확인

4. blocks/ 컴포넌트
   - ChecklistBlock: 체크박스 최소 h-5 w-5, 클릭 영역 min-h-11
   - FacilityBlock (있으면): FacilityCard compact 사용 확인
   - 나머지 블록: 배경 bg-dotori-50/80 dark:bg-dotori-900/60, rounded-2xl, p-4

## 검증
npx tsc --noEmit 에러 0개."
      ;;
    *)
      echo "agent_task_registry.md 에서 $agent 담당 작업을 확인해라."
      ;;
  esac
}

### ═══════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ㄱ 파이프라인 v4 — ROUND: ${ROUND}               ║${NC}"
echo -e "${BLUE}║  R19: UX 풀가동 — 레이아웃 + 인터랙션 완성  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"

### ═══ PHASE 0: PRE-FLIGHT ════════════════════════════════════════════
step "PHASE 0: PRE-FLIGHT"

echo "  [0a] npm run build..."
cd "$APP"
BUILD_LOG=$(mktemp)
npm run build > "$BUILD_LOG" 2>&1
if [ $? -eq 0 ]; then
  ok "Build OK"
else
  echo "  빌드 로그:"
  tail -20 "$BUILD_LOG"
  rm -f "$BUILD_LOG"
  fail "빌드 실패 — launch 중단"
fi
rm -f "$BUILD_LOG"

LINT_LOG=$(mktemp)
npm run lint > "$LINT_LOG" 2>&1 || true
LINT_ERRORS=$(grep -c " error " "$LINT_LOG" || true)
rm -f "$LINT_LOG"
[ "$LINT_ERRORS" -gt 0 ] && warn "ESLint errors: ${LINT_ERRORS}개" || ok "ESLint clean"

npm test > /dev/null 2>&1 && ok "Tests passed" || warn "Tests 불안정"

echo "  [0e] 스테일 워크트리 정리..."
git -C "$REPO" worktree prune 2>/dev/null || true
for AGENT in "${AGENTS[@]}"; do
  if [ -d "$WT_BASE/$ROUND-$AGENT" ]; then
    warn "스테일 제거: $ROUND-$AGENT"
    git -C "$REPO" worktree remove --force "$WT_BASE/$ROUND-$AGENT" 2>/dev/null || true
    git -C "$REPO" branch -D "codex/$ROUND-$AGENT" 2>/dev/null || true
  fi
done
ok "워크트리 정리 완료"

mkdir -p "$RESULTS" "$LOGS"
ok "디렉토리 준비: $RESULTS, $LOGS"

### ═══ PHASE 1: 워크트리 생성 ═════════════════════════════════════════
step "PHASE 1: 워크트리 생성 (${#AGENTS[@]}개)"
mkdir -p "$WT_BASE"

for AGENT in "${AGENTS[@]}"; do
  printf "  %-28s" "Creating $ROUND-$AGENT..."
  if git -C "$REPO" worktree add "$WT_BASE/$ROUND-$AGENT" -b "codex/$ROUND-$AGENT" 2>/dev/null; then
    WT_APP_DIR="$WT_BASE/$ROUND-$AGENT/dotori-app"
    cp "$APP/.env.local" "$WT_APP_DIR/.env.local" 2>/dev/null || true
    cp -al "$APP/node_modules" "$WT_APP_DIR/node_modules"
    chmod -R 777 "$WT_BASE/$ROUND-$AGENT/"
    chmod -R 777 "$REPO/.git/worktrees/$ROUND-$AGENT/" 2>/dev/null || true
    echo "✅"
  else
    echo "❌ 실패"
  fi
done
ok "모든 워크트리 생성 완료"

### ═══ PHASE 2: CODEX 병렬 발사 ══════════════════════════════════════
step "PHASE 2: Codex ${#AGENTS[@]}개 병렬 발사"

for AGENT in "${AGENTS[@]}"; do
  WT_APP="$WT_BASE/$ROUND-$AGENT/dotori-app"
  TASK_TEXT=$(get_task "$AGENT")

  PROMPT="먼저 이 파일들을 읽어라 (필수):
  cat .serena/memories/project_overview.md
  cat .serena/memories/code_style_and_conventions.md
  cat .serena/memories/agent_task_registry.md
  cat src/lib/motion.ts

## 담당 작업 ($ROUND-$AGENT)
$TASK_TEXT

## 완료 조건 (반드시 순서대로)
1. 담당 파일 외 수정 금지 — 특히 globals.css, layout.tsx, motion.ts 수정 금지
2. 한국어 UI 텍스트 유지 (코드·변수명은 영어)
3. framer-motion import 금지 → motion/react 사용
4. color='dotori' CTA 버튼, color='forest' 성공 상태
5. text-[Npx] 임의 픽셀값 금지 → Tailwind 스케일 토큰
6. dark: 클래스 추가 시 dotori 팔레트만 사용 (bg-gray-* 금지)
7. npx tsc --noEmit 실행 — TypeScript 에러 없어야 함
8. 파일 생성·수정만 완료하면 됨 (git add/commit은 launch.sh가 자동 처리)"

  codex exec -m "$CODEX_MODEL" -s workspace-write \
    --cd "$WT_APP" \
    -o "$RESULTS/$AGENT.txt" \
    "$PROMPT" \
    > "$LOGS/$AGENT.log" 2>&1 &

  PIDS+=($!)
  echo -e "  🚀 ${GREEN}$ROUND-$AGENT${NC} (PID: ${PIDS[-1]})"
done

ok "${#AGENTS[@]}개 에이전트 발사 완료"

### ═══ PHASE 3: 완료 대기 + 빌드 검증 ═══════════════════════════════
step "PHASE 3: 완료 대기 (최대 90분)"

TIMEOUT=5400
START=$(date +%s)

( sleep $TIMEOUT && kill "${PIDS[@]}" 2>/dev/null ) &
WATCHDOG=$!

for i in "${!PIDS[@]}"; do
  wait "${PIDS[$i]}" 2>/dev/null && echo "  ✓ ${AGENTS[$i]}" || echo "  ? ${AGENTS[$i]} exited"
done

kill "$WATCHDOG" 2>/dev/null || true
ok "모든 에이전트 완료"

# ─── 에이전트 변경사항 자동 커밋 ───
info "에이전트 변경사항 자동 커밋..."
echo ""
for AGENT in "${AGENTS[@]}"; do
  WT_DIR="$WT_BASE/$ROUND-$AGENT"
  printf "  %-28s" "$AGENT"
  CHANGES=$(git -C "$WT_DIR" status --porcelain 2>/dev/null | wc -l)
  if [[ $CHANGES -gt 0 ]]; then
    git -C "$WT_DIR" add -A 2>/dev/null
    git -C "$WT_DIR" commit -m "feat($ROUND-$AGENT): UX 폴리싱" 2>/dev/null \
      && echo "✅ ($CHANGES files changed)" \
      || echo "❌ commit 실패"
  else
    echo "⚠️  변경없음"
  fi
done

# ─── 빌드 검증 (병렬 4개 동시) ───
echo ""
info "빌드 검증 병렬 실행 중 (max 4 concurrent)..."
MAX_PARALLEL=4
declare -A BUILD_PIDS BUILD_LOGS
for AGENT in "${AGENTS[@]}"; do
  WT_APP="$WT_BASE/$ROUND-$AGENT/dotori-app"
  WT_BUILD_LOG=$(mktemp)
  BUILD_LOGS[$AGENT]="$WT_BUILD_LOG"
  (cd "$WT_APP" && npm run build > "$WT_BUILD_LOG" 2>&1) &
  BUILD_PIDS[$AGENT]=$!
  running=$(jobs -p | wc -l)
  while [[ $running -ge $MAX_PARALLEL ]]; do
    sleep 1
    running=$(jobs -p | wc -l)
  done
done
for AGENT in "${AGENTS[@]}"; do
  wait "${BUILD_PIDS[$AGENT]}" 2>/dev/null
  WT_BUILD_LOG="${BUILD_LOGS[$AGENT]}"
  printf "  %-28s" "$AGENT"
  if [ $? -eq 0 ] || grep -q "prerendered as static content" "$WT_BUILD_LOG" 2>/dev/null; then
    PASS+=("$AGENT"); echo "✅"
  else
    FAIL+=("$AGENT"); echo "❌ (로그: $LOGS/$AGENT.log)"
  fi
  rm -f "$WT_BUILD_LOG"
done

ok  "Pass: ${#PASS[@]}개"
[ "${#FAIL[@]}" -gt 0 ] && warn "Fail: ${FAIL[*]}"

### ═══ PHASE 4: SQUASH MERGE ═════════════════════════════════════════
step "PHASE 4: Squash Merge"

cd "$APP"
MERGED=(); SKIPPED=()

for AGENT in "${MERGE_ORDER[@]}"; do
  printf "  %-28s" "Merging $ROUND-$AGENT..."
  if [[ " ${FAIL[*]} " == *" $AGENT "* ]]; then
    SKIPPED+=("$AGENT"); echo "⏭️  skip (빌드 실패)"; continue
  fi
  COMMIT_COUNT=$(git -C "$WT_BASE/$ROUND-$AGENT" log --oneline "HEAD...$(git -C "$REPO" rev-parse HEAD)" 2>/dev/null | wc -l || echo "0")
  if [ "$COMMIT_COUNT" -eq 0 ]; then
    SKIPPED+=("$AGENT"); echo "⏭️  skip (커밋 없음)"; continue
  fi
  if git merge --squash "codex/$ROUND-$AGENT" 2>/dev/null; then
    git commit -m "feat($ROUND-$AGENT): UX 폴리싱

Co-Authored-By: Codex <noreply@openai.com>" 2>/dev/null || true
    MERGED+=("$AGENT"); echo "✅"
  else
    SKIPPED+=("$AGENT"); git merge --abort 2>/dev/null || true; warn "Conflict — 수동 처리"
  fi
done

ok  "Merged: ${#MERGED[@]}개"
[ "${#SKIPPED[@]}" -gt 0 ] && warn "Skipped: ${SKIPPED[*]}"

### ═══ PHASE 5: 최종 검증 + 정리 ════════════════════════════════════
step "PHASE 5: 최종 검증 + 정리"

cd "$APP"
npm run build 2>&1 | tail -5
npm test 2>&1 | grep -E "Tests:|test files|tests" | tail -3

for AGENT in "${AGENTS[@]}"; do
  git -C "$REPO" worktree remove --force "$WT_BASE/$ROUND-$AGENT" 2>/dev/null || true
  git -C "$REPO" branch -D "codex/$ROUND-$AGENT" 2>/dev/null || true
done
git -C "$REPO" worktree prune 2>/dev/null || true
ok "워크트리 정리 완료"

### ═══ 최종 리포트 ═══════════════════════════════════════════════════
ELAPSED=$(( $(date +%s) - START ))
ELAPSED_MIN=$(( ELAPSED / 60 ))
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ${ROUND} 완료 — ${ELAPSED_MIN}분                           ║${NC}"
echo -e "${BLUE}║  UX 풀가동 폴리싱 완료                        ║${NC}"
printf "${BLUE}║  Merged %-3d  Failed %-3d  Skipped %-3d           ║${NC}\n" "${#MERGED[@]}" "${#FAIL[@]}" "${#SKIPPED[@]}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "  다음 단계:"
echo "  1. git push origin main"
echo "  2. doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2"
echo ""
