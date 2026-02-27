# Dotori App

## Standard Commands (Local = CI)

```bash
# install
npm ci

# one-shot quality gate (format:check -> lint -> typecheck -> test -> build:ci)
npm run ci

# fast validation (no build, 배포 전 사전 검증용)
npm run ci:preflight

# split commands
npm run format
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:engine
npm run test:e2e
npm run build

# UX/UI auto guard (console + screenshot + scroll audit)
# dev server must be up (ex: npm run dev:3002)
BASE_URL=http://127.0.0.1:3002 npm run ux:guard

# mobile screenshot vision guard (default: 60 routes, early+settled capture)
BASE_URL=http://127.0.0.1:3002 npm run screenshot

# smoke run
SCREENSHOT_ROUTE_LIMIT=20 BASE_URL=http://127.0.0.1:3002 npm run screenshot

# strict early-frame gate
SCREENSHOT_ENFORCE_EARLY=1 BASE_URL=http://127.0.0.1:3002 npm run screenshot

# navigation retry guard (timeout/route flake 대응)
SCREENSHOT_NAV_RETRIES=2 SCREENSHOT_NAV_TIMEOUT_MS=30000 SCREENSHOT_MAX_ROUTE_FAILURES=0 BASE_URL=http://127.0.0.1:3002 npm run screenshot

# visual quality retry guard (blank/washout 프레임 자동 재캡처)
SCREENSHOT_QUALITY_RETRY_COUNT=2 SCREENSHOT_QUALITY_RETRY_WAIT_MS=1500 BASE_URL=http://127.0.0.1:3002 npm run screenshot

# Chrome Dev channel 콘솔 가드
BASE_URL=http://127.0.0.1:3002 npm run check-console:chrome

# ㄱㄱ trigger cycle (style-guard -> tsc -> test -> check-console -> screenshot)
npm run gg:trigger

# ㄱㄱ fast cycle (20 routes)
npm run gg:trigger:fast

# ㄱㄱ auto cycle (자가성장 route limit, 20~60)
npm run gg:trigger:auto

# ㄱㄱ adaptive cycle (auto + orchestration)
npm run gg:trigger:adaptive

# ㄱㄱ stable cycle (재현성 우선, 학습/오케스트레이션 OFF)
BASE_URL=http://127.0.0.1:3002 npm run gg:trigger:stable

# self-growth reset (학습 상태 초기화 후 실행)
npm run gg:trigger:reset

# self-growth off (고정값 실행)
npm run gg:trigger:growth-off

# options
GG_START_SERVER=1 npm run gg:trigger:fast
GG_MULTI_AGENT=1 npm run gg:trigger
GG_RUN_UX_GUARD=1 npm run gg:trigger
GG_RUN_CONSOLE_GUARD=1 npm run gg:trigger
GG_CONSOLE_BROWSER=chromium GG_CONSOLE_CHANNEL=chrome npm run gg:trigger
GG_CONSOLE_CHANNEL=none npm run gg:trigger
GG_SELF_GROWTH=0 npm run gg:trigger
GG_SELF_GROWTH_RESET=1 npm run gg:trigger
GG_STATE_FILE=/tmp/dotori-gg-trigger/self-growth.env npm run gg:trigger
GG_ROUTE_LIMIT_STEP=10 npm run gg:trigger:auto
GG_MIN_ROUTE_LIMIT=20 GG_MAX_ROUTE_LIMIT=60 npm run gg:trigger:auto
GG_MIN_QUALITY_RETRY_COUNT=1 GG_MAX_QUALITY_RETRY_COUNT=3 npm run gg:trigger:auto
GG_MIN_QUALITY_RETRY_WAIT_MS=700 GG_MAX_QUALITY_RETRY_WAIT_MS=3000 npm run gg:trigger:auto
GG_ADAPTIVE_ORCHESTRATION=0 npm run gg:trigger:auto
GG_AUTO_MULTI_AGENT_MIN_ROUTE_LIMIT=50 GG_AUTO_MULTI_AGENT_MIN_STREAK=2 npm run gg:trigger:auto
GG_AUTO_UX_GUARD_MIN_ROUTE_LIMIT=40 GG_AUTO_UX_GUARD_MIN_STREAK=1 npm run gg:trigger:auto
CHECK_CONSOLE_IGNORE_TRANSIENT_NETWORK_ERRORS=0 BASE_URL=http://127.0.0.1:3002 npm run screenshot
```

## DigitalOcean Deploy (Source Mode)

### 배포 방식

- **수동 배포 전용**: `gh workflow run deploy.yml` (workflow_dispatch)
- main push는 CI만 실행 (lint + typecheck + test), 자동 배포 없음
- CI에서 `doctl apps update --spec` 및 Docker/DOCR 배포 로직은 금지

```bash
# 수동 배포 트리거 (권장)
gh workflow run deploy.yml -R QETTA/dotori-ver2

# 최근 실행 확인
gh run list -R QETTA/dotori-ver2 --limit 10
```

### 수동 배포(긴급 CLI)

```bash
cd /home/sihu2129/dotori-ver2/dotori-app
export DO_APP_ID=29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
npm run deploy:do:source

# preflight 생략
RUN_PREFLIGHT=0 npm run deploy:do:source
```

### 배포 전 준비 Runbook

```bash
cd /home/sihu2129/dotori-ver2/dotori-app
export DO_APP_ID=29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
bash scripts/deploy-readiness.sh

# 운영 URL 기반 사전 체크
APP_URL=https://dotori-app-pwyc9.ondigitalocean.app bash scripts/deploy-readiness.sh
```

### 롤백

- 이전 정상 커밋으로 `git revert` 후 `main`에 푸시 → `gh workflow run deploy.yml` 수동 트리거
- 상세 절차: `../docs/ops/DEPLOYMENT_RUNBOOK.md`

## Development

```bash
npm run dev
# or
npm run dev:3002
```

## Docs

- Engine test catalog: `../docs/ENGINE_TEST_CATALOG.md`
- Backend error contract: `../docs/ERROR_CONTRACT.md`
- Business plan: `../docs/ops/BUSINESS_PLAN.md`
- CI: `../.github/workflows/ci.yml`, Deploy: `../.github/workflows/deploy.yml`

## Engine Test Reliability

```bash
# engine tests only
npm run test:engine

# engine coverage (thresholds: lines 60, functions 70, statements 60, branches 45)
npm run test:engine:coverage

# flaky check (default 5 runs, override with REPEAT)
npm run test:engine:flaky
REPEAT=10 npm run test:engine:flaky
```

## Backend Error Contract

- 기본 API 에러 응답은 `{ error, code }` 형식을 사용합니다.
- 채팅 쿼터 초과는 `{ error: "quota_exceeded", code: "FORBIDDEN", message, details }`를 반환합니다.
- `details.limitType`은 `guest | monthly`, `details.limit`은 적용된 제한 횟수입니다.
- 모든 API 응답 헤더에 `X-Request-Id`가 포함됩니다.

## Environment Notes

- 로컬 `npm run build`는 `.env.local`의 환경 변수를 요구합니다.
