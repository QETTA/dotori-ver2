# Agent Task Registry — R18 (다크모드 + 글래스 + 모션)

## 머지 순서 (MERGE_ORDER)
1. ux-core-comp (공통 컴포넌트 먼저)
2. ux-blocks
3. ux-home
4. ux-chat
5. ux-explore
6. ux-community
7. ux-facility
8. ux-my-core
9. ux-my-waitlist
10. ux-onboarding
11. ux-auth-landing

## 파일 소유권

### ux-home
- src/app/(app)/page.tsx

### ux-chat
- src/app/(app)/chat/page.tsx
- src/components/dotori/chat/ChatBubble.tsx
- src/components/dotori/chat/ChatPromptPanel.tsx

### ux-explore
- src/app/(app)/explore/page.tsx
- src/components/dotori/explore/ExploreSuggestionPanel.tsx
- src/components/dotori/explore/ExploreSearchHeader.tsx
- src/components/dotori/explore/ExploreResultList.tsx

### ux-community
- src/app/(app)/community/page.tsx
- src/app/(app)/community/[id]/page.tsx
- src/app/(app)/community/write/page.tsx
- src/app/(app)/community/_components/CommunityEmptyState.tsx

### ux-facility
- src/app/(app)/facility/[id]/page.tsx
- src/app/(app)/facility/[id]/FacilityDetailClient.tsx
- src/components/dotori/facility/FacilityCapacitySection.tsx
- src/components/dotori/facility/FacilityContactSection.tsx
- src/components/dotori/facility/FacilityPremiumSection.tsx
- src/components/dotori/facility/FacilityReviewSection.tsx
- src/components/dotori/facility/FacilityStatusBadges.tsx
- src/components/dotori/facility/FacilityWaitlistCTA.tsx
- src/components/dotori/facility/FacilityLocationSection.tsx
- src/components/dotori/facility/FacilityOperatingSection.tsx
- src/components/dotori/facility/FacilityProgramSection.tsx
- src/components/dotori/facility/facility-detail-helpers.ts

### ux-my-core
- src/app/(app)/my/page.tsx
- src/app/(app)/my/settings/page.tsx (다크모드 토글 UI!)
- src/app/(app)/my/support/page.tsx
- src/app/(app)/my/app-info/page.tsx
- src/app/(app)/my/terms/page.tsx
- src/app/(app)/my/notices/page.tsx

### ux-my-waitlist
- src/app/(app)/my/waitlist/page.tsx
- src/app/(app)/my/waitlist/[id]/page.tsx
- src/app/(app)/my/notifications/page.tsx
- src/app/(app)/my/interests/page.tsx
- src/app/(app)/my/import/page.tsx

### ux-onboarding
- src/app/(onboarding)/onboarding/page.tsx
- src/app/(onboarding)/layout.tsx
- src/app/(onboarding)/error.tsx

### ux-auth-landing
- src/app/(auth)/login/page.tsx
- src/app/(auth)/error.tsx
- src/app/(landing)/landing/page.tsx
- src/components/landing/*

### ux-core-comp
- src/components/dotori/BottomTabBar.tsx (glass-header!)
- src/components/dotori/FacilityCard.tsx (tap.card 교체)
- src/components/dotori/Toast.tsx
- src/components/dotori/ToastProvider.tsx
- src/components/dotori/Skeleton.tsx
- src/components/dotori/EmptyState.tsx
- src/components/dotori/ErrorState.tsx
- src/components/dotori/Surface.tsx
- src/components/dotori/Wallpaper.tsx
- src/components/dotori/PremiumGate.tsx
- src/components/dotori/UsageCounter.tsx
- src/components/dotori/AiBriefingCard.tsx
- src/components/dotori/MapEmbed.tsx
- src/components/dotori/SourceChip.tsx (spring 교체)
- src/components/dotori/StreamingIndicator.tsx
- src/components/dotori/ActionConfirmSheet.tsx
- src/components/dotori/CompareTable.tsx
- src/components/dotori/MarkdownText.tsx

### ux-blocks
- src/components/dotori/blocks/ChecklistBlock.tsx
- src/components/dotori/blocks/TextBlock.tsx
- src/components/dotori/blocks/ActionBlock.tsx
- src/components/dotori/blocks/AlertsBlock.tsx
- src/components/dotori/blocks/CompareBlock.tsx
- src/components/dotori/blocks/FacilityBlock.tsx
- src/components/dotori/blocks/RecommendBlock.tsx
- src/components/dotori/blocks/SummaryBlock.tsx
- src/components/dotori/blocks/WaitlistBlock.tsx

## 공유 금지 파일 (수정 불가)
- src/app/globals.css
- src/app/layout.tsx
- src/lib/motion.ts
- src/hooks/useTheme.ts
- src/hooks/useAppState.ts
- src/types/dotori.ts
