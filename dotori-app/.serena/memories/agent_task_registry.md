# 에이전트 파일 소유권 맵 (R13 설계 — 2026-02-22)

## R13 목표: Opus 4.6 분석 P0~P2 보안+품질 수정 (11 에이전트)

---

## R13 태스크 배분

| 에이전트 | 담당 파일 | 이슈 | 우선순위 |
|---------|---------|------|---------|
| **sec-users-me** | `api/users/me/route.ts` | P0#2 plan 자가변경 차단 | 🔴 P0 |
| **sec-subscriptions** | `api/subscriptions/route.ts` | P0#3 결제미검증 + P2#18 이중파싱 | 🔴 P0 |
| **sec-chat-stream** | `api/chat/stream/route.ts` | P0#4 게스트제한우회 + P1#9 스트림안전 + P3#30 UsageLog중복 | 🔴 P0 |
| **sec-admin** | `api/admin/facility/[id]/premium/route.ts` | P1#8 admin 인증 강화 | 🟠 P1 |
| **middleware-fix** | `middleware.ts` | P1#5+#6 rate limit 메모리누수 | 🟠 P1 |
| **search-sanitize** | `lib/engine/response-builder.ts` | P1#7 NoSQL $text 주입 방지 | 🟠 P1 |
| **nba-null-guard** | `lib/engine/nba-engine.ts` | P2#10 non-null assertion 8곳 제거 | 🟡 P2 |
| **page-null-fix** | `app/(app)/page.tsx`, `app/(app)/my/waitlist/page.tsx` | P2#11+#12 assertion 교체 | 🟡 P2 |
| **test-dedup** | `__tests__/engine/` | P2#17 중복 테스트 파일 병합 | 🟡 P2 |
| **waitlist-fix** | `api/waitlist/route.ts`, `api/waitlist/import/route.ts` | P2#19 이중파싱 + P3#31 하드코딩 | 🟡 P2 |
| **alert-logic** | `api/alerts/route.ts` | P3#29 비프리미엄 알림 로직 | 🟢 P3 |

---

## 머지 순서

```
1. middleware-fix      (인프라 — 모든 요청에 영향)
2. sec-users-me        (보안 독립)
3. sec-subscriptions   (보안 독립)
4. sec-chat-stream     (보안 독립)
5. sec-admin           (보안 독립)
6. search-sanitize     (엔진 독립)
7. nba-null-guard      (엔진 독립)
8. page-null-fix       (UI 독립)
9. waitlist-fix        (API 독립)
10. alert-logic        (API 독립)
11. test-dedup         (테스트만 — 마지막)
```

---

## 파일 충돌 방지

- `middleware.ts` — middleware-fix만
- `api/users/me/route.ts` — sec-users-me만
- `api/subscriptions/route.ts` — sec-subscriptions만
- `api/chat/stream/route.ts` — sec-chat-stream만
- `api/admin/facility/[id]/premium/route.ts` — sec-admin만
- `lib/engine/response-builder.ts` — search-sanitize만
- `lib/engine/nba-engine.ts` — nba-null-guard만
- `app/(app)/page.tsx` — page-null-fix만
- `app/(app)/my/waitlist/page.tsx` — page-null-fix만
- `api/waitlist/route.ts` — waitlist-fix만
- `api/waitlist/import/route.ts` — waitlist-fix만
- `api/alerts/route.ts` — alert-logic만
- `__tests__/engine/` — test-dedup만

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
| R13 | 11개 | 진행중 | Opus P0~P2 보안+품질 수정 |

---

## Opus 분석 결과 요약 (메모리: opus_analysis_r12.md)

- P0 4건: 시크릿 노출(직접수정완료), plan 자가변경, 결제미검증, 게스트제한우회
- P1 5건: 인메모리 rate limit, 메모리 누수, NoSQL 주입, admin 인증, 스트림 안정성
- P2 10건: non-null assertion, 거대 컴포넌트, 테스트 부재, 이중파싱
- P3 14건: 타입 캐스팅, UX 미세조정 등
