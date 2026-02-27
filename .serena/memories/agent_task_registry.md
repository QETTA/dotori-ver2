# Agent Task Registry — 에이전트 파일 소유권 맵

## 규칙
- 1 파일 = 1 에이전트 (충돌 방지)
- 공유 파일 (types/dotori.ts, layout.tsx 등) → 한 에이전트만 담당
- MERGE_ORDER: 인프라/보안 먼저, UI/테스트 마지막

## R33 파일 소유권 (2026-02-26)
| 파일 | 담당 | 상태 |
|------|------|------|
| explore/page.tsx | Claude직접 | 완료 |
| ExploreSearchHeader.tsx | Claude직접 | 완료 |
| ExploreSearchInput.tsx | Claude직접 | 완료 |
| ExploreResultList.tsx | Claude직접 | 완료 |
| ExploreFilterToolbar.tsx | Claude직접 | 완료 |
| ExploreFilterPanel.tsx | Claude직접 | 완료 |
| ExploreToOnlyToggle.tsx | Claude직접 | 완료 |
| my/page.tsx | Claude직접 | 완료 |
| login/page.tsx | Claude직접 | 완료 |
| settings/page.tsx | Claude직접 | 완료 |
| waitlist/page.tsx | Claude직접 | 완료 |
| documents/page.tsx | Claude직접 | 완료 (신규) |
| interests/page.tsx | Claude직접 | 완료 (신규) |
| support/page.tsx | Claude직접 | 완료 (신규) |
| app-info/page.tsx | Claude직접 | 완료 (신규) |
| notifications/page.tsx | Claude직접 | 완료 |
| community/page.tsx | Claude직접 | 완료 |
| community/write/page.tsx | Claude직접 | 완료 |
| onboarding/page.tsx | Claude직접 | 완료 |
| chat/page.tsx | Claude직접 | 완료 |
