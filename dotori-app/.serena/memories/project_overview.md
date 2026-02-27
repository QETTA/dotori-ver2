# 도토리 (Dotori) 프로젝트 개요

## 현재 상태 (2026-02-27, R51 완료)

- **20 pages**, 0 TypeScript errors, **804 tests** (vitest, 70 test files), 빌드 성공
- **21 models**, **54 API routes**, **139 components**
- **MongoDB**: 20,027 시설 (17개 시도), Atlas `dotori` DB
- **DO 배포**: DigitalOcean App Platform (sgp 리전) — Source Build (Dockerfile)
  - URL: https://dotori-app-pwyc9.ondigitalocean.app
  - App ID: 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
  - 배포: 수동 전용 (deploy.yml workflow_dispatch), 자동 트리거 없음
- **완료 라운드**: R1~R51, 160+ 에이전트
- **보안**: P0~P1 이슈 0건
- **UX**: dark mode, glass morphism, motion/react, BrandWatermark 18/18, DS_CARD 100%
- **파이프라인 v8**: 디자인 품질 게이트 + Sonnet QA(10점) + TP5 필수 패턴
- **R50**: Visual Impact — brand-tinted shadows, directional shimmer, 3-layer hover, premium glassmorphism cards, Sonnet QA 5.93→6.68
- **R51**: Design Polish — gradient text 6곳, 3-layer hover 3곳 추가, Landing 라이트 테마 통일, DS_CARD.flat shadow 추가

## CI/CD — Source Build Deployment (2026-02-27)

- **CI**: `ci.yml` — push/PR시 lint + typecheck + test (배포 없음)
- **Deploy**: `deploy.yml` — workflow_dispatch 수동 전용
  - CI gate → spec 검증 → SHA 중복 체크 → create-deployment → health check
- **Audit**: `release-audit.yml` — 매일 1회 모니터링 (자동 배포 없음)
- **Preview**: `preview.yml` — PR 프리뷰 배포
- **Dockerfile**: multi-stage (deps → build → runner), npm cache mount, standalone output

## 기술 스택

- Next.js 16.1 (App Router) + React 19 + TypeScript 5.8 strict
- Tailwind CSS 4, motion/react (NEVER framer-motion)
- Headless UI v2.2 + Catalyst UI Kit (27 components)
- Mongoose 8.23 + MongoDB Atlas (db: dotori)
- NextAuth v5, Kakao OAuth, JWT strategy
- Anthropic Claude API (토리챗 SSE 스트리밍, Sonnet 4.6)

## MCP 서버

- serena: TypeScript LSP + 메모리 허브
- context7: 라이브러리 문서
- mongodb: Atlas 읽기 전용
- sentry: 에러 모니터링

## 핵심 명령

```bash
npm run build                   # 빌드 (20 pages)
npm test                        # 테스트 (804개, vitest, 70 files)
gh workflow run deploy.yml      # 수동 배포
```
