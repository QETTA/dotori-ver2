# 에이전트 파일 소유권 맵 (R14 설계 — 2026-02-22)

## R14 목표: 불일치 해소 + 대규모 최적화 (11 에이전트)

---

## R14 태스크 배분

| 에이전트 | 담당 파일 | 목적 | 우선순위 |
|---------|---------|------|---------|
| **motion-stability** | `src/components/dotori/PageTransition.tsx`, `src/app/(app)/layout.tsx`, `src/app/(auth)/login/page.tsx` | 전환 안정성 + reduced motion 대응 | 🔴 P0 |
| **console-hardening** | `scripts/check-console.ts`, `src/app/(app)/facility/[id]/page.tsx` | 콘솔 오류 측정 안정화 | 🔴 P0 |
| **explore-structure** | `src/app/(app)/explore/page.tsx`, `src/components/dotori/explore/useExploreSearch.ts`, `src/components/dotori/explore/ExploreSearchHeader.tsx`, `src/components/dotori/explore/ExploreResultList.tsx` | Explore 상태/뷰 구조 분리 | 🟠 P1 |
| **facility-structure** | `src/app/(app)/facility/[id]/FacilityDetailClient.tsx`, `src/components/dotori/facility/useFacilityDetailActions.ts`, `src/components/dotori/facility/FacilityContactSection.tsx`, `src/components/dotori/facility/FacilityCapacitySection.tsx` | Facility 액션/섹션 구조 분리 | 🟠 P1 |
| **chat-structure** | `src/app/(app)/chat/page.tsx`, `src/components/dotori/chat/ChatPromptPanel.tsx`, `src/components/dotori/chat/useChatStream.ts` | Chat 스트림/패널 분리 | 🟠 P1 |
| **explore-ux-token** | `src/components/dotori/explore/ExploreSuggestionPanel.tsx`, `src/components/dotori/explore/ExploreSearchHeader.tsx`, `src/components/dotori/explore/ExploreResultList.tsx` | Explore 타이포/터치 타겟 정합화 | 🟡 P2 |
| **facility-ux-token** | `src/components/dotori/facility/FacilityStatusBadges.tsx`, `src/components/dotori/facility/FacilityPremiumSection.tsx`, `src/components/dotori/facility/facility-detail-helpers.ts` | Facility 용어/토큰 정합화 | 🟡 P2 |
| **chat-ux-token** | `src/components/dotori/ChatBubble.tsx`, `src/components/dotori/UsageCounter.tsx`, `src/components/dotori/StreamingIndicator.tsx` | Chat 색상/타이포 정합화 | 🟡 P2 |
| **color-compliance-app** | `src/app/(app)/my/notifications/page.tsx`, `src/app/(app)/my/interests/page.tsx`, `src/components/dotori/ActionConfirmSheet.tsx` | 앱 코드 색상 규칙 정렬 | 🟢 P3 |
| **typography-compliance-app** | `src/app/(app)/community/write/page.tsx`, `src/app/(app)/my/terms/page.tsx`, `src/app/(app)/my/app-info/page.tsx`, `src/components/dotori/MarkdownText.tsx` | 픽셀 타이포 토큰 정렬 | 🟢 P3 |
| **docs-sync-r14** | `../docs/CHANGELOG.md`, `.serena/memories/agent_task_registry.md`, `.serena/memories/project_overview.md` | R14 산출물 문서화 | 🟢 P3 |

---

## 머지 순서

```
1. motion-stability
2. console-hardening
3. explore-structure
4. facility-structure
5. chat-structure
6. explore-ux-token
7. facility-ux-token
8. chat-ux-token
9. color-compliance-app
10. typography-compliance-app
11. docs-sync-r14
```

---

## 파일 충돌 방지

- `src/components/dotori/PageTransition.tsx` — motion-stability만
- `scripts/check-console.ts` — console-hardening만
- `src/app/(app)/explore/page.tsx` — explore-structure만
- `src/app/(app)/facility/[id]/FacilityDetailClient.tsx` — facility-structure만
- `src/app/(app)/chat/page.tsx` — chat-structure만
- `src/components/dotori/explore/ExploreSuggestionPanel.tsx` — explore-ux-token만
- `src/components/dotori/facility/FacilityStatusBadges.tsx` — facility-ux-token만
- `src/components/dotori/ChatBubble.tsx` — chat-ux-token만
- `src/app/(app)/my/notifications/page.tsx` — color-compliance-app만
- `src/app/(app)/community/write/page.tsx` — typography-compliance-app만
- `../docs/CHANGELOG.md` — docs-sync-r14만

---

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
| R14 | 11개 | 준비완료 | 불일치 해소 + 대규모 최적화 |

---

## R14 완료 기준

- `BASE_URL=http://localhost:3000 npm run check-console` 경로별 콘솔 오류 0
- `npm run lint` 에러 0
- `npm run build` 성공
- Catalyst 내부 파일 수정 0
- 모바일 375px 기준 가독성/터치타겟 유지
