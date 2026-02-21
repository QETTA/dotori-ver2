# Pending Tasks — 다음 세션 컨텍스트 복원용
> 마지막 업데이트: 2026-02-22

## 완료된 작업 (이번 세션)
- MongoDB 비밀번호 변경 → .env.local 업데이트 ✅
- DigitalOcean App Platform MONGODB_URI 업데이트 (doctl) ✅
- 보안 픽스: .claude/settings.json git 제거 ✅
- CI/CD 파이프라인 정비 (lint→typecheck→test→build→deploy) ✅
- ESLint 에러 발견: PageTransition.tsx refs during render (6 errors) — 미수정

## P0 — ESLint 블로커 (CI 실패 원인)
- [ ] `src/components/dotori/PageTransition.tsx:20`
  - Cannot access `isInitialRender.current` during render
  - `react-hooks/refs` 규칙 위반, 6 errors
  - 수정법: useEffect로 isInitialRender 업데이트 분리

## P1 — 즉시 (Codex 워크트리 병렬)
| # | 작업 | 담당 에이전트 |
|---|------|--------------|
| #6 | DO 리전 sgp → nrt (도쿄) — .do/app.yaml 변경 | Claude 직접 (1줄) |
| #7 | NextAuth + Mongoose User 스키마 통합 | auth-agent |
| #8 | 서비스 레이어 (facility/post/alert service) | api-agent |
| #9 | API 인증 미들웨어 통일 (withApiHandler 패턴) | api-agent |
| #10 | 공통 ApiError 핸들러 | api-agent |
| #11 | env.ts Zod 전환 | engine-agent |

## P2 — 이후
- .dockerignore 추가
- Rate Limiting (API 라우트별)
- Sentry 로깅 연동
- E2E 테스트 (Playwright)
- 경기도 성남/수원/고양 시설 데이터 수집

## 세션 시작 시 확인 필수
1. `npm run build` — 0 에러 확인
2. `npm test` — 24 tests pass 확인
3. `npm run lint` — ESLint 에러 6개 여전히 존재 여부
4. `git log --oneline -5` — 최신 커밋 확인
5. `git push` 상태 (origin 동기화)

## 인프라 메모
- DO App ID: `29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2`
- 현재 리전: `sgp` (싱가포르) → nrt (도쿄) 변경 예정
- MongoDB: kidsmap.wdmgq0i.mongodb.net / dotori DB / 20,027 시설
- DB User: sihu2129_db_user (비밀번호 2026-02-22 변경 완료)
