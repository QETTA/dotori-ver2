# 에이전트 파일 소유권 맵 (R19 기준)

## R19 에이전트 (진행 중)
| 에이전트 | 담당 파일 |
|---------|---------|
| polish-login | src/app/(auth)/login/page.tsx, src/app/(auth)/error.tsx |
| polish-home | src/app/(app)/page.tsx |
| polish-chat | src/app/(app)/chat/page.tsx, src/components/dotori/chat/ChatPromptPanel.tsx |
| polish-explore | src/app/(app)/explore/page.tsx, src/components/dotori/explore/* |
| polish-community | src/app/(app)/community/page.tsx, src/app/(app)/community/[id]/page.tsx |
| polish-my | src/app/(app)/my/page.tsx, src/app/(app)/my/settings/page.tsx |
| polish-facility | src/app/(app)/facility/[id]/FacilityDetailClient.tsx, src/components/dotori/facility/* |
| polish-shared | src/components/dotori/AiBriefingCard.tsx, UsageCounter.tsx, EmptyState.tsx, ErrorState.tsx, Toast.tsx, ActionConfirmSheet.tsx, Wallpaper.tsx |
| polish-waitlist | src/app/(app)/my/waitlist/*.tsx, src/app/(app)/my/notifications/page.tsx, src/app/(app)/my/interests/page.tsx |
| polish-onboarding | src/app/(onboarding)/onboarding/page.tsx |
| polish-comp | src/components/dotori/FacilityCard.tsx, Skeleton.tsx, SourceChip.tsx, blocks/* |

## R18 에이전트 (완료)
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
- src/app/globals.css (Claude Code만 수정)
- src/app/layout.tsx (Claude Code만 수정)
- src/lib/motion.ts (Claude Code만 수정)
- src/hooks/useTheme.ts (Claude Code만 수정)
- src/components/catalyst/* (절대 수정 금지)
- src/lib/db.ts, src/lib/api.ts, src/types/* (로직 파일, 수정 금지)
