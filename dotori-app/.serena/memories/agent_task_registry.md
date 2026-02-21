# 에이전트 파일 소유권 맵 (R6 준비, 2026-02-22)

## R6 태스크 배분 (11 Codex 에이전트)

| 에이전트 | 담당 파일 | 작업 내용 |
|---------|---------|---------|
| **r6-eslint** | `src/components/dotori/PageTransition.tsx` | refs during render → useEffect 분리 (ESLint P0) |
| **r6-auth** | `src/lib/models/User.ts`, `src/lib/auth.ts` | NextAuth + Mongoose User 스키마 통합 |
| **r6-service-facility** | `src/lib/services/facility-service.ts` (신규) | 시설 서비스 레이어 분리 |
| **r6-service-community** | `src/lib/services/post-service.ts`, `alert-service.ts` (신규) | 커뮤니티/알림 서비스 레이어 |
| **r6-api-middleware** | `src/lib/middleware/withApiHandler.ts`, `src/lib/errors/ApiError.ts` | API 인증 미들웨어 통일 |
| **r6-env** | `src/env.ts` | env.ts Zod validation 전환 |
| **r6-explore-fix** | `src/app/(app)/explore/page.tsx` | placeholder 수정 + 필터 칩 줄바꿈 fix |
| **r6-home-data** | `src/app/(app)/page.tsx` | 퀵액세스 카드 실제 DB 데이터 연결 |
| **r6-landing-cta** | `src/app/(landing)/page.tsx` | 파트너 플랜 CTA 강화 (수익화 핵심) |
| **r6-geocode** | `src/app/api/geocode/reverse/route.ts` | Kakao API 실제 연동 확인 |
| **r6-infra** | `.dockerignore`, `src/middleware.ts` | Rate Limiting + 인프라 정비 |

## 충돌 금지 규칙
- `types/dotori.ts` — 한 에이전트만 수정
- `(app)/page.tsx` (홈) — r6-home-data만
- `(landing)/page.tsx` — r6-landing-cta만
- `chat/stream/route.ts` — 엔진 에이전트만
- `intent-classifier.ts` + `response-builder.ts` — 같은 에이전트만

## R6 Codex 발사 스크립트 (Claude Code 실행용)
```bash
#!/bin/bash
APP=/home/sihu2129/dotori-ver2/dotori-app
AGENTS=(eslint auth service-facility service-community api-middleware env explore-fix home-data landing-cta geocode infra)
mkdir -p /tmp/results/r6 /tmp/logs/r6

for AGENT in "${AGENTS[@]}"; do
  git -C $APP worktree add .worktrees/r6-$AGENT -b codex/r6-$AGENT 2>/dev/null
done
```

## 완료된 작업 (R5, 2026-02-22)

| 에이전트 | 수정 파일 | 내용 |
|---------|---------|------|
| r5-a | `src/app/(app)/explore/page.tsx` | GPS 내 위치 버튼 + 이동 가능 시설 필터 |
| r5-b | `src/components/dotori/MapEmbed.tsx` | 사용자 위치 마커 + 에러 UI 개선 |
| r5-c | `src/app/(auth)/login/page.tsx` | 에러 처리 + 카카오 버튼 개선 |
| r5-d | `src/app/(app)/facility/[id]/FacilityDetailClient.tsx` | 입소설명회 안내 섹션 |
| r5-d | `src/components/dotori/facility/FacilityCapacityCard.tsx` | 정원 progress bar |
| r5-e | `src/app/(app)/facility/[id]/FacilityDetailClient.tsx` | 대기 신청 UX 개선 |
| r5-e | `src/app/(app)/my/waitlist/page.tsx` | 대기 현황 UI 개선 |
| r5-e | `src/app/api/waitlist/route.ts` | API 에러처리 강화 |
| r5-f | `src/app/(app)/community/page.tsx` | 이웃 게시판 UX + FAB + 탭 개선 |
| r5-g | `src/app/(app)/page.tsx` | 홈 UX 현대화 + 퀵액세스 카드 |
| r5-h | `src/app/(app)/my/page.tsx` | MY 페이지 + 비로그인 CTA |
| r5-i | `src/app/(onboarding)/onboarding/page.tsx` | 온보딩 슬라이더 + 나중에 설정 |
| r5-j | `src/app/(app)/chat/page.tsx` | 빠른 응답 칩 + 대화 초기화 버튼 |
