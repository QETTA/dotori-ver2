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

## R21 에이전트 (진행 중 🔄) — 로고·아이콘·폰트 재정립

### 배경
- 디자인 시스템 재정립 완료 (2026-02-24): tokens.ts 확장, brand-assets.ts BRAND_GUIDE 추가
- globals.css @theme에 타이포 스케일 8단계 추가 (text-display ~ text-label)
- 기존 컴포넌트 대부분 text-xs/sm/base/lg/xl 사용 → 시맨틱 토큰으로 점진적 마이그레이션

### 신규 타이포 스케일 (globals.css @theme 등록 완료)
| 토큰 | 픽셀 | 대체 대상 |
|------|------|---------|
| text-h1 | 24px | text-2xl (헤딩) |
| text-h2 | 20px | text-xl (섹션 헤딩) |
| text-h3 | 16px | text-base (서브헤딩) |
| text-body | 15px | text-sm (주요 본문) |
| text-body-sm | 13px | text-sm (보조 본문) |
| text-caption | 11px | text-xs (캡션·타임스탬프) |
| text-label | 10px | text-xs (배지·탭레이블) |

### 브랜드 에셋 수정 사항
- BRAND.symbolCorporate → B2B 전용, 앱 내부 금지
- 앱 내 소형 아이콘 = BRAND.symbol
- 헤더 로고 크기 통일 = lockupHorizontalKr h-7

### R21 파일 소유권
| 에이전트 | 담당 파일 |
|---------|---------|
| r21-a | src/app/(app)/page.tsx |
| r21-b | src/app/(auth)/login/page.tsx, src/app/(landing)/landing/page.tsx |
| r21-c | src/app/(app)/chat/page.tsx, src/components/dotori/chat/ChatPromptPanel.tsx |
| r21-d | src/app/(app)/explore/page.tsx, explore/ExploreSearchHeader.tsx, ExploreSuggestionPanel.tsx |
| r21-e | src/app/(app)/community/*.tsx (3 files) |
| r21-f | src/app/(app)/my/page.tsx, my/settings/page.tsx, my/app-info/page.tsx, my/support/page.tsx |
| r21-g | src/app/(app)/my/waitlist/*.tsx, my/notifications/page.tsx, my/interests/page.tsx |
| r21-h | facility/FacilityDetailClient.tsx, facility/FacilityDetailHeader.tsx, FacilityInfoCard.tsx, FacilityCapacityCard.tsx |
| r21-i | src/app/(onboarding)/onboarding/page.tsx |
| r21-j | EmptyState.tsx, ErrorState.tsx, PremiumGate.tsx, StreamingIndicator.tsx, UsageCounter.tsx |
| r21-k | BottomTabBar.tsx, blocks/TextBlock.tsx, ChecklistBlock.tsx, ActionsBlock.tsx |

### 공통 금지 파일 (추가)
- src/lib/design-system/tokens.ts — Claude Code만 수정
- src/lib/brand-assets.ts — Claude Code만 수정
- src/lib/analytics.ts — Claude Code만 수정
