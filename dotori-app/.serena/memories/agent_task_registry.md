# 에이전트 파일 소유권 맵 (R20 완료 기준)

## 현재 상태 (2026-02-22)
- **R19 완료**: 11/11 에이전트, 0 실패, 16분 소요
- **누적 에이전트**: 113개 완료 (R1~R3: 36, R5: 11, R8: 11, R9: 11, R11: 6, R12: 5, R13: 11, R17: 11, R18: 11개)
- 실제로는 R19: 11 추가 = 124개
- **빌드**: 47페이지, 0 TypeScript 에러
- **E2E**: 15/15 통과 (trustHost 픽스 포함)

## R19 에이전트 (완료 ✅)
| 에이전트 | 담당 파일 | 변경 내용 |
|---------|---------|---------|
| polish-login | src/app/(auth)/login/page.tsx, error.tsx | 레이아웃 재배치(flex-1 + mt-auto 제거), 탭 피드백 |
| polish-home | src/app/(app)/page.tsx | 헤더/칩/빈상태 CTA/커뮤니티 바 터치 피드백 |
| polish-chat | src/app/(app)/chat/page.tsx, chat/ChatPromptPanel.tsx | UsageCounter 헤더 이동, 전송 버튼 active:scale |
| polish-explore | src/app/(app)/explore/page.tsx, explore/* | 칩 피드백, 필터 버튼 레이블, 빈 상태 개선 |
| polish-community | src/app/(app)/community/page.tsx, community/[id]/page.tsx | 카드/댓글/좋아요 레이아웃 정리 |
| polish-my | src/app/(app)/my/page.tsx, my/settings/page.tsx | 프로필 헤더 Surface, 테마 세그먼트 선택 표시 |
| polish-facility | facility/FacilityDetailClient.tsx, facility/* | 정원 숫자 text-2xl bold, CTA min-h-12 |
| polish-shared | AiBriefingCard, UsageCounter, EmptyState, ErrorState, Toast, ActionConfirmSheet, Wallpaper | glass-sheet, 톤 통일, CTA w-full |
| polish-waitlist | my/waitlist/*.tsx, notifications/page.tsx, interests/page.tsx | 순위 text-4xl, 읽지않은 border-l-dotori-400 |
| polish-onboarding | src/app/(onboarding)/onboarding/page.tsx | 진행 바, 선택 버튼 링/피드백, 완료 화면 |
| polish-comp | FacilityCard.tsx, Skeleton.tsx, blocks/* | 블록 레이아웃, 스켈레톤 톤, 카드 compact |

## R18 에이전트 (완료 ✅)
| 에이전트 | 담당 파일 |
|---------|---------|
| ux-home | src/app/(app)/page.tsx |
| ux-chat | src/app/(app)/chat/page.tsx, src/components/dotori/chat/* |
| ux-explore | src/app/(app)/explore/page.tsx, src/components/dotori/explore/* |
| ux-community | src/app/(app)/community/* |
| ux-facility | src/app/(app)/facility/*, src/components/dotori/facility/* |
| ux-my-core | src/app/(app)/my/page.tsx, my/settings, my/support, my/app-info, my/terms, my/notices |
| ux-my-waitlist | src/app/(app)/my/waitlist/*, my/notifications, my/interests, my/import |
| ux-onboarding | src/app/(onboarding)/* |
| ux-auth-landing | src/app/(auth)/login/*, src/app/(landing)/* |
| ux-core-comp | src/components/dotori/ (핵심 17개) |
| ux-blocks | src/components/dotori/blocks/* |

## 공통 파일 (에이전트 수정 금지)
- src/app/globals.css — Claude Code만 수정 (glass utilities, CSS 변수)
- src/app/layout.tsx — Claude Code만 수정
- src/lib/motion.ts — Claude Code만 수정 (animation presets)
- src/hooks/useTheme.ts — Claude Code만 수정
- src/components/catalyst/* — 절대 수정 금지
- src/lib/db.ts, src/lib/api.ts, src/types/* — 로직 파일, 수정 금지
- e2e/*.spec.ts — Claude Code만 수정

## R20 에이전트 (완료 ✅)
| 에이전트 | 담당 파일 | 변경 내용 |
|---------|---------|---------|
| r20-a | login/page.tsx | 타이틀 1줄(text-base), 카카오 K-SVG 아이콘, 카피 개선, 푸터 safe-area |
| r20-b | page.tsx (home) | 헤더 safe-area, 상태카드 레이블 업데이트, 섹션 헤딩 text-base |
| r20-c | ChatPromptPanel.tsx, ExploreSearchHeader.tsx | 채팅 헤딩 text-xl 1줄, 탐색 헤딩 text-xl, ⚡ 제거 |
| r20-d | community/page.tsx, FacilityDetailClient.tsx | 카드 space-y-3, 탭 min-h-11, 시설 레이아웃 |

## 다음 라운드 가이드 (R21+)
R20까지: 나노단위 UI 폴리싱 완성
R21 후보: 기능 확장
- 후보 A: 시설 상세 이미지 갤러리 (슬라이드)
- 후보 B: 커뮤니티 실시간 업데이트 (SSE/polling)
- 후보 C: 온보딩 A/B 테스트 변형
