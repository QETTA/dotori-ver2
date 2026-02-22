# 에이전트 파일 소유권 맵 (R17 — 2026-02-22)

## R17 목표: text-[Npx] 토큰화 286건 + API 테스트 + E2E smoke

---

## R17 태스크 배분

| 에이전트 | 담당 파일 | 목적 | 건수 |
|---------|---------|------|------|
| **token-my-core** | my/page, my/import, my/support, my/notifications, my/interests, my/notices | text-[Npx]→Tailwind | 83건 |
| **token-my-waitlist** | my/waitlist/page, my/waitlist/[id] | text-[Npx]→Tailwind | 68건 |
| **token-onboarding** | onboarding/page, onboarding/error | text-[Npx]→Tailwind | 33건 |
| **token-community** | community/[id], community/page, CommunityEmptyState | text-[Npx]→Tailwind | 36건 |
| **token-auth-misc** | login/page, auth/error, not-found, ErrorBoundary | text-[Npx]→Tailwind | 17건 |
| **token-facility** | facility/* 컴포넌트 11개 | text-[Npx]→Tailwind | 30건 |
| **token-dotori-comp** | MapEmbed, ChecklistBlock, ChatPromptPanel, Toast 등 8개 | text-[Npx]→Tailwind | 19건 |
| **refactor-blocks** | response-builder/blocks.ts → search/status/recommendation 분리 | 688줄 모듈화 | - |
| **test-api-core** | NEW: __tests__/api/facilities, waitlist, chat | API 유닛 테스트 | - |
| **test-api-ext** | NEW: __tests__/api/subscriptions, admin, community | API 유닛 테스트 | - |
| **test-e2e-smoke** | NEW: e2e/smoke.spec.ts, playwright.config.ts | E2E smoke | - |

---

## 머지 순서

```
1. token-my-core
2. token-my-waitlist
3. token-onboarding
4. token-community
5. token-auth-misc
6. token-facility
7. token-dotori-comp
8. refactor-blocks
9. test-api-core
10. test-api-ext
11. test-e2e-smoke
```

---

## 파일 충돌 방지

- token 에이전트 7개: 각각 다른 페이지/컴포넌트 담당 (겹침 0)
- refactor-blocks: response-builder/ 내부만
- test 에이전트 3개: 새 파일 생성만 (기존 파일 수정 0)

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
| R14-R16 | 33커밋 | Codex CLI 직접 | 구조분리 + 타입안전성 |
| R17 | 11개 | 진행중 | text-[Npx] 토큰화 + API테스트 + E2E |
