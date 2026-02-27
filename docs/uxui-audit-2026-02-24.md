# UXUI 하드코드 점검 (2026-02-24) — 강화 교차검수

## 범위
- 대상: `dotori-app/src/app` (`page.tsx`) + `dotori-app/src/components`
- 분석 방식: TS AST 기반 `JsxAttribute(className)`에서 문자열 리터럴이 직접 들어가는 경우를 `하드코딩`으로 집계
  - `className="..."` / `className='...'`
  - `className={... "..." ...}` (cn/clsx/템플릿 내 문자열)
- 기준: `page.tsx` 21개 + 상위 사용량 컴포넌트 상위 60개

## 페이지별 하드코딩 상태 (`src/app/**/*/page.tsx`)
| 파일 | 하드코딩 className | 전체 className |
| --- | ---: | ---: |
| src/app/(onboarding)/onboarding/page.tsx | 108 | 111 |
| src/app/(app)/my/waitlist/[id]/page.tsx | 108 | 108 |
| src/app/(app)/my/page.tsx | 103 | 116 |
| src/app/(app)/page.tsx | 80 | 80 |
| src/app/(app)/my/settings/page.tsx | 65 | 65 |
| src/app/(app)/community/page.tsx | 59 | 66 |
| src/app/(landing)/landing/page.tsx | 46 | 46 |
| src/app/(app)/community/write/page.tsx | 43 | 43 |
| src/app/(auth)/login/page.tsx | 34 | 34 |
| src/app/(app)/my/notifications/page.tsx | 30 | 30 |
| src/app/(app)/my/support/page.tsx | 28 | 28 |
| src/app/(app)/chat/page.tsx | 22 | 29 |
| src/app/(app)/my/interests/page.tsx | 18 | 18 |
| src/app/(app)/my/terms/page.tsx | 12 | 12 |
| src/app/(app)/my/notices/page.tsx | 11 | 11 |
| src/app/(app)/explore/page.tsx | 4 | 4 |
| src/app/(app)/my/app-info/page.tsx | 3 | 23 |
| src/app/(app)/my/waitlist/page.tsx | 0 | 80 |
| src/app/(app)/my/import/page.tsx | 0 | 77 |
| src/app/(app)/community/[id]/page.tsx | 0 | 62 |
| src/app/(app)/facility/[id]/page.tsx | 0 | 0 |

### 100% 치환 상태
- 전체 페이지: 21개
- 하드코딩 0개 달성: 4개
  - `src/app/(app)/my/waitlist/page.tsx`
  - `src/app/(app)/my/import/page.tsx`
  - `src/app/(app)/community/[id]/page.tsx`
  - `src/app/(app)/facility/[id]/page.tsx`
- 하드코딩 잔존: 17개

## 상위 60 하드코드 파일 (page + components)
| 순위 | 파일 | 하드코딩 className | 전체 className |
| --- | ---:| ---:| ---: |
| 1 | src/app/(onboarding)/onboarding/page.tsx | 108 | 111 |
| 2 | src/app/(app)/my/waitlist/[id]/page.tsx | 108 | 108 |
| 3 | src/app/(app)/my/page.tsx | 103 | 116 |
| 4 | src/app/(app)/page.tsx | 80 | 80 |
| 5 | src/components/dotori/FacilityCard.tsx | 75 | 75 |
| 6 | src/app/(app)/my/settings/page.tsx | 65 | 65 |
| 7 | src/components/dotori/Skeleton.tsx | 60 | 60 |
| 8 | src/app/(app)/community/page.tsx | 59 | 66 |
| 9 | src/components/dotori/explore/ExploreSearchHeader.tsx | 56 | 56 |
| 10 | src/components/dotori/facility/FacilityCapacitySection.tsx | 54 | 54 |
| 11 | src/app/(landing)/landing/page.tsx | 46 | 46 |
| 12 | src/app/(app)/community/write/page.tsx | 43 | 43 |
| 13 | src/app/(auth)/login/page.tsx | 34 | 34 |
| 14 | src/components/dotori/explore/ExploreResultList.tsx | 33 | 34 |
| 15 | src/components/dotori/explore/ExploreSuggestionPanel.tsx | 30 | 31 |
| 16 | src/app/(app)/my/notifications/page.tsx | 30 | 30 |
| 17 | src/app/(app)/my/support/page.tsx | 28 | 28 |
| 18 | src/app/(app)/chat/page.tsx | 22 | 29 |
| 19 | src/components/dotori/AiBriefingCard.tsx | 20 | 20 |
| 20 | src/components/dotori/blocks/ChecklistBlock.tsx | 20 | 20 |
| 21 | src/components/dotori/facility/FacilityPremiumSection.tsx | 20 | 20 |
| 22 | src/app/(app)/my/interests/page.tsx | 18 | 18 |
| 23 | src/components/dotori/chat/ChatPromptPanel.tsx | 18 | 18 |
| 24 | src/components/dotori/ActionConfirmSheet.tsx | 16 | 24 |
| 25 | src/components/dotori/ChatBubble.tsx | 16 | 20 |
| 26 | src/components/dotori/CompareTable.tsx | 16 | 16 |
| 27 | src/components/dotori/facility/FacilityCapacityCard.tsx | 14 | 14 |
| 28 | src/components/catalyst/sidebar-layout.tsx | 13 | 13 |
| 29 | src/components/catalyst/listbox.tsx | 12 | 13 |
| 30 | src/components/catalyst/sidebar.tsx | 12 | 13 |
| 31 | src/app/(app)/my/terms/page.tsx | 12 | 12 |
| 32 | src/components/catalyst/stacked-layout.tsx | 12 | 12 |
| 33 | src/components/dotori/facility/FacilityReviewsCard.tsx | 12 | 12 |
| 34 | src/components/dotori/MapEmbed.tsx | 12 | 12 |
| 35 | src/app/(app)/my/notices/page.tsx | 11 | 11 |
| 36 | src/components/dotori/facility/FacilityInsights.tsx | 11 | 11 |
| 37 | src/components/dotori/UsageCounter.tsx | 11 | 11 |
| 38 | src/components/catalyst/combobox.tsx | 10 | 11 |
| 39 | src/components/dotori/facility/FacilityChecklistCard.tsx | 10 | 10 |
| 40 | src/components/dotori/facility/FacilityDetailHeader.tsx | 10 | 10 |
| 41 | src/components/dotori/facility/IsalangCard.tsx | 10 | 10 |
| 42 | src/components/dotori/PremiumGate.tsx | 10 | 10 |
| 43 | src/components/catalyst/dropdown.tsx | 9 | 11 |
| 44 | src/components/catalyst/pagination.tsx | 9 | 9 |
| 45 | src/components/catalyst/table.tsx | 9 | 9 |
| 46 | src/components/dotori/EmptyState.tsx | 8 | 41 |
| 47 | src/components/catalyst/navbar.tsx | 8 | 9 |
| 48 | src/components/catalyst/alert.tsx | 8 | 8 |
| 49 | src/components/catalyst/dialog.tsx | 8 | 8 |
| 50 | src/components/dotori/SplashScreen.tsx | 8 | 8 |
| 51 | src/components/dotori/Toast.tsx | 8 | 8 |
| 52 | src/components/catalyst/fieldset.tsx | 7 | 7 |
| 53 | src/components/dotori/MarkdownText.tsx | 7 | 7 |
| 54 | src/components/catalyst/checkbox.tsx | 6 | 7 |
| 55 | src/components/dotori/facility/FacilityInfoCard.tsx | 6 | 6 |
| 56 | src/components/dotori/facility/FacilityLocationCard.tsx | 6 | 6 |
| 57 | src/components/shared/ErrorBoundary.tsx | 6 | 6 |
| 58 | src/components/dotori/blocks/FacilityListBlock.tsx | 5 | 5 |
| 59 | src/components/dotori/StreamingIndicator.tsx | 5 | 5 |
| 60 | src/components/dotori/facility/FacilityContactSection.tsx | 4 | 57 |

## 스타일 가이드 위반 의심 패턴
- `text-[Npx]`, 임의 값 브래킷 사용(`[]`) 잔존

```
src/components/catalyst/avatar.tsx:41:                    className="size-full fill-current p-[5%] text-[48px] font-medium uppercase select-none"
src/app/(app)/error.tsx:13:                <div className="flex min-h-[60dvh] items-center justify-center">
src/app/(app)/loading.tsx:5:            <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3">
src/components/shared/ErrorBoundary.tsx:82:            <div className="flex min-h-[60dvh] items-center justify-center">
src/components/dotori/ChatBubble.tsx:137:      <div className="flex max-w-[85%] flex-col gap-2">
```
