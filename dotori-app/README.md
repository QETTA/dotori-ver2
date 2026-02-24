# Dotori App

## Standard Commands (Local = CI)

```bash
# install
npm ci

# one-shot quality gate (format:check -> lint -> typecheck -> test -> build:ci)
npm run ci

# fast validation (no build, CI/CD v2에서 Docker가 빌드 담당)
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
```

## DigitalOcean Auto Deploy — CI/CD v2 (DOCR Pre-built Image)

### 배포 흐름 (2026-02-24~)

```
main push → detect(변경감지) → ci(lint+test) → docker(GHA캐시빌드→DOCR push) → deploy(이미지pull)
```

- **PR 생성/업데이트**: `PR Preview` 워크플로우가 자동으로 Preview URL을 배포하고, PR 코멘트에 URL/헬스체크를 남깁니다.
- **`main` 푸시**: `CI/CD` 워크플로우가 앱 소스 변경을 감지하고, `ci:preflight` 통과 후 Docker 이미지를 빌드하여 **DOCR**(`registry.digitalocean.com/dotori/web`)에 push합니다. DO App Platform은 pre-built 이미지를 pull하여 배포합니다.
- **패치 배포**: src만 변경 시 deps 레이어 캐시 히트 → **~3분** (기존 DO 풀빌드 ~15분)
- **변경 감지**: 앱 소스/Dockerfile/설정 변경 시만 배포. 테스트/스크립트/문서만 변경 시 배포 스킵.

```bash
# repo root에서 최근 실행 확인
gh run list -R QETTA/dotori-ver2 --limit 10

# 특정 워크플로우 실행 추적
gh run watch <run-id> -R QETTA/dotori-ver2

# PR 체크 상태 요약
gh pr checks <pr-number> -R QETTA/dotori-ver2

# 수동 배포 (긴급 시)
doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
```

### 로컬 작업 즉시 반영 배포 (Root Cause Fix)

`main` 자동배포만 쓰면, 로컬에서만 수정된 변경은 배포에 반영되지 않습니다.  
아래 커맨드는 로컬 코드를 직접 이미지로 빌드하고 App Spec에 이미지 태그를 주입해 즉시 배포합니다.

```bash
# dotori-app 디렉터리에서 실행
npm run deploy:do:local

# 빠른 강제 배포 (검증 스킵)
SKIP_PRECHECK=1 npm run deploy:do:local
```

- Flow: `local build -> DOCR push -> app spec patch(image tag) -> doctl update -> health check`
- 기본 앱 ID: `29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2`
- 필요 조건: `doctl auth`, `docker daemon running`

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
- CI/CD & infra: `../.github/workflows/ci.yml`

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

- CI 빌드는 Docker 내에서 실행되며 `SKIP_ENV_VALIDATION=1` + `NEXT_PUBLIC_*` build-args로 주입됩니다.
- 로컬 `npm run build`는 `.env.local`의 환경 변수를 요구합니다.
