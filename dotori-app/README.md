# Dotori App

## Standard Commands (Local = CI)

```bash
# install
npm ci

# one-shot quality gate (format:check -> lint -> typecheck -> test -> build:ci)
npm run ci

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

## Development

```bash
npm run dev
# or
npm run dev:3002
```

## Docs

- Engine test catalog: `../docs/ENGINE_TEST_CATALOG.md`
- Backend error contract: `../docs/ERROR_CONTRACT.md`

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

- CI 빌드는 `npm run build:ci`를 사용하며 내부에서 `SKIP_ENV_VALIDATION=1`로 실행됩니다.
- 운영 배포용 `npm run build`는 실제 환경 변수를 요구할 수 있습니다.
