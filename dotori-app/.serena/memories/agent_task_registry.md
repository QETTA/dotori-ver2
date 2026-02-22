# 에이전트 파일 소유권 맵 (R14 실행 기준 — 2026-02-22)

## R14 작업 목적
- R14 실행 전 기준 문서를 동기화해 목적, 범위, 소유권, 머지 순서를 한 번에 확인 가능하도록 정리한다.
- R13 보안 중심 수정 이후, R14 구조/토큰/콘솔 안정화 중심 작업 흐름으로 전환된 상태를 명확히 기록한다.

## R14 작업 범위
- 코드 구조 안정화: motion/console/explore/facility/chat 구조 정리
- UX/디자인 토큰 정합화: explore/facility/chat/app 색상·타이포 정리
- 문서 동기화: changelog/메모리 문서 업데이트

## R14 진행 상태 (docs-sync-r14 기준)
- 문서 기준선 동기화 완료 (R14 목적/범위/완료 조건 반영)
- 11개 에이전트 소유권 및 고정 머지 순서 명시 완료
- 코드 변경 에이전트는 아래 머지 순서 1→11 고정으로 실행

## R14 태스크 배분 + 머지 순서 (11 에이전트)

| 머지 순서 | 에이전트 | 담당 파일 | 목적 | 우선순위 | 진행상태 |
|---------|---------|---------|------|---------|---------|
| 1 | **motion-stability** | `src/components/dotori/PageTransition.tsx`, `src/app/(app)/layout.tsx`, `src/app/(auth)/login/page.tsx` | 전환 안정성 + reduced motion 대응 | 🔴 P0 | 대기 |
| 2 | **console-hardening** | `scripts/check-console.ts`, `src/app/(app)/facility/[id]/page.tsx` | 콘솔 오류 측정 안정화 | 🔴 P0 | 대기 |
| 3 | **explore-structure** | `src/app/(app)/explore/page.tsx`, `src/components/dotori/explore/useExploreSearch.ts`, `src/components/dotori/explore/ExploreSearchHeader.tsx`, `src/components/dotori/explore/ExploreResultList.tsx` | Explore 상태/뷰 구조 분리 | 🟠 P1 | 대기 |
| 4 | **facility-structure** | `src/app/(app)/facility/[id]/FacilityDetailClient.tsx`, `src/components/dotori/facility/useFacilityDetailActions.ts`, `src/components/dotori/facility/FacilityContactSection.tsx`, `src/components/dotori/facility/FacilityCapacitySection.tsx` | Facility 액션/섹션 구조 분리 | 🟠 P1 | 대기 |
| 5 | **chat-structure** | `src/app/(app)/chat/page.tsx`, `src/components/dotori/chat/ChatPromptPanel.tsx`, `src/components/dotori/chat/useChatStream.ts` | Chat 스트림/패널 분리 | 🟠 P1 | 대기 |
| 6 | **explore-ux-token** | `src/components/dotori/explore/ExploreSuggestionPanel.tsx`, `src/components/dotori/explore/ExploreSearchHeader.tsx`, `src/components/dotori/explore/ExploreResultList.tsx` | Explore 타이포/터치 타겟 정합화 | 🟡 P2 | 대기 |
| 7 | **facility-ux-token** | `src/components/dotori/facility/FacilityStatusBadges.tsx`, `src/components/dotori/facility/FacilityPremiumSection.tsx`, `src/components/dotori/facility/facility-detail-helpers.ts` | Facility 용어/토큰 정합화 | 🟡 P2 | 대기 |
| 8 | **chat-ux-token** | `src/components/dotori/ChatBubble.tsx`, `src/components/dotori/UsageCounter.tsx`, `src/components/dotori/StreamingIndicator.tsx` | Chat 색상/타이포 정합화 | 🟡 P2 | 대기 |
| 9 | **color-compliance-app** | `src/app/(app)/my/notifications/page.tsx`, `src/app/(app)/my/interests/page.tsx`, `src/components/dotori/ActionConfirmSheet.tsx` | 앱 코드 색상 규칙 정렬 | 🟢 P3 | 대기 |
| 10 | **typography-compliance-app** | `src/app/(app)/community/write/page.tsx`, `src/app/(app)/my/terms/page.tsx`, `src/app/(app)/my/app-info/page.tsx`, `src/components/dotori/MarkdownText.tsx` | 픽셀 타이포 토큰 정렬 | 🟢 P3 | 대기 |
| 11 | **docs-sync-r14** | `../docs/CHANGELOG.md`, `.serena/memories/agent_task_registry.md`, `.serena/memories/project_overview.md` | R14 산출물 문서화 | 🟢 P3 | 완료 (문서 동기화) |

## 파일 충돌 방지 (핵심 소유권)
- `src/components/dotori/PageTransition.tsx` — motion-stability 전용
- `scripts/check-console.ts` — console-hardening 전용
- `src/app/(app)/explore/page.tsx` — explore-structure 전용
- `src/app/(app)/facility/[id]/FacilityDetailClient.tsx` — facility-structure 전용
- `src/app/(app)/chat/page.tsx` — chat-structure 전용
- `src/components/dotori/explore/ExploreSuggestionPanel.tsx` — explore-ux-token 전용
- `src/components/dotori/facility/FacilityStatusBadges.tsx` — facility-ux-token 전용
- `src/components/dotori/ChatBubble.tsx` — chat-ux-token 전용
- `src/app/(app)/my/notifications/page.tsx` — color-compliance-app 전용
- `src/app/(app)/community/write/page.tsx` — typography-compliance-app 전용
- `../docs/CHANGELOG.md` — docs-sync-r14 전용

## 완료된 라운드 기록

| 라운드 | 에이전트 수 | 결과 | 주요 내용 |
|--------|----------|------|---------|
| R1-R3 | 36개 | 성공 | 기초 구조, 채팅, 시설탐색 |
| R5 | 11개 | 성공 | GPS/지도, 커뮤니티, 온보딩 |
| R8 | 11개 | 성공 | 수익화 퍼널 |
| R9 | 11개 | 성공 | 프리미엄 모델 + 테스트 |
| R11 | 6개 | 3/6 merged | 혼란 제거 + 엔진 테스트 40개 |
| R12 | 5개 | 5/5 merged | 폴리싱 + 테스트 50개 |
| R13 | 11개 | 11/11 완료 | Opus P0~P2 보안+품질 수정 |
| R14 | 11개 | 문서 동기화 완료 | 구조/토큰/콘솔 안정화 라운드 준비 |

## R14 완료 조건 (필수)
- `BASE_URL=http://localhost:3000 npm run check-console` 경로별 콘솔 오류 0
- `npm run lint` 에러 0
- `npm run build` 성공
- `npx tsc --noEmit` 에러 0
- `src/components/catalyst/*` 수정 0
