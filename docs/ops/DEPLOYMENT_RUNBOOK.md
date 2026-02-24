# Dotori 배포 Runbook (운영)

최종 업데이트: 2026-02-24

## 1) 배포 모드

- 자동 배포: `main` push → `.github/workflows/ci.yml`
- 긴급 수동 배포: `dotori-app/scripts/deploy-do-local-fast.sh` (NPM: `npm run deploy:do:local`)
- PR 미리보기: `.github/workflows/preview.yml`

## 2) 배포 시작 전 필수 체크

### GitHub

- 시크릿
  - `DIGITALOCEAN_ACCESS_TOKEN` (필수)
  - `ANTHROPIC_API_KEY` (선택: Claude 리뷰 워크플로우)
  - `CLAUDE_CODE_OAUTH_TOKEN` (선택)
- 변수
  - `NEXT_PUBLIC_KAKAO_JS_KEY`
  - `NEXT_PUBLIC_KAKAO_KEY`
  - `NEXT_PUBLIC_KAKAO_MAP_KEY`
  - `NEXT_PUBLIC_KAKAO_CHANNEL_ID`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_MAPBOX_TOKEN`
  - `NEXT_PUBLIC_MAPBOX_STYLE`
  - `NEXT_PUBLIC_TOSS_CLIENT_KEY`

### DigitalOcean

- `doctl` 인증 완료
- 타깃 앱: `29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2`
- 레지스트리: `registry.digitalocean.com/dotori/web`
- 앱 런타임 envs:
  - `AUTH_SECRET`
  - `NEXTAUTH_URL`
  - `AUTH_KAKAO_ID`
  - `AUTH_KAKAO_SECRET`
  - `KAKAO_REST_API_KEY`
  - `MONGODB_URI`
  - `MONGODB_DB_NAME`
  - `ANTHROPIC_API_KEY`
  - `PUBLIC_DATA_API_KEY`
  - `CHILDCARE_PORTAL_KEY`
  - `CRON_SECRET`

## 3) 배포 준비 실행

```bash
cd /home/sihu2/dotori-ver2-qetta/dotori-app
bash scripts/deploy-readiness.sh
```

환경별 운영 URL까지 바로 확인하려면:

```bash
APP_URL=https://dotori-app-pwyc9.ondigitalocean.app bash scripts/deploy-readiness.sh
```

### 실행 구성 요소

1. `npm run ci:preflight` (lint + typecheck + test)
2. `env -u NODE_ENV npm run build` (선택: `SKIP_BUILD=1`로 생략 가능)
3. `APP_URL` 지정 시 `/api/health` + `/api/health/deep` 확인
4. `doctl apps get` 로 현재 배포 URL 확인

## 4) 자동 배포 체크포인트

- 변경 감지: `dotori-app/**`, `.do/app.yaml`, `.github/workflows/ci.yml`
- 변경 없음: `detect` 단계에서 `needs_deploy=false`, 배포 건너뛰기
- CI 통과:
  - `npm ci`
  - `npm run ci:preflight`
- 이미지 빌드: `sha-<commit>` 태그로 DOCR push
- 배포: `.do/app.yaml`의 `image.tag`를 SHA로 교체 후 `doctl apps update --wait`
- 배포 성공 조건:
  - `/api/health` 200
  - `/api/health/deep` 200

## 5) 수동 배포(긴급)

```bash
cd /home/sihu2/dotori-ver2-qetta/dotori-app
npm run deploy:do:local

# 빌드/검증 건너뛰기(긴급):
SKIP_PRECHECK=1 npm run deploy:do:local
```

## 6) 롤백

- 실패 배포 직후:
  1. 직전 정상 `sha-<commit>` 태그 확인
  2. `.do/app.yaml` 또는 `.do/app.deploy.yaml`의 `tag:`를 이전 SHA로 변경
  3. `doctl apps update <APP_ID> --spec <spec-file> --wait`
  4. 배포 후 `/api/health` 및 `/api/health/deep` 재검증

## 7) 멀티 에이전트 배포 DB 이슈(`/api/health/deep 500/503`) 원인 후보 + 점검 순서

운영 우선 순위: 원인 단일화 → 공통화 → 복구.

### 원인 후보
- `MONGODB_URI`, `MONGODB_DB_NAME` 값 누락/오타/시크릿 타입(SECRET) 손상
- 배포 중 일부 인스턴스만 이전 버전/이전 환경변수를 가진 상태로 운영 트래픽을 받는 혼합 라우팅
- Atlas 네트워크 접근(allowlist) 또는 VNet/방화벽으로 현재 App Platform egress 차단
- DB 사용자 비밀번호/역할 변경, DB 명 변경, 커넥션 TTL 초과·일시 접속 불안정
- URI 특수문자 미이스케이프(패스워드 포함) 또는 클라이언트 버전/TLS 호환성 이슈

### 점검 순서 (운영에서 수행 가능)
```bash
APP="29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2"
APP_URL="https://dotori-app-pwyc9.ondigitalocean.app"

# 1) 실패 형태 확인: 20회 연속 호출로 인스턴스별 편차(성공/실패 혼재) 확인
for i in $(seq 1 20); do curl -s "$APP_URL/api/health/deep" | sed -n '1,2p'; sleep 1; done

# 2) 최신 런타임 로그에서 DB 에러, 연결 문자열, 인증 에러 원인 확인
doctl apps logs "$APP" --type run --tail 300

# 3) 운영 스펙 env 존재/이름/타입 확인(공유 스펙의 MONGODB_* 키)
doctl apps spec get "$APP" | sed -n '/envs:/,/alerts:/p' | sed -n '/MONGODB_URI/,+8p'

# 4) 배포 직전/직후 버전 교체 이력 확인(롤링 충돌 여부)
doctl apps deployments list "$APP" --output json
```

### 복구 방향
- `/api/health`가 200인데 `/api/health/deep`만 실패면 DB 계층만 재배포/롤백 대상으로 제한
- 시크릿만 재설정할 때는 값-키 구분을 정확히 해서 `MONGODB_URI`만 업데이트하거나 전체 동기화를 수행:
  ```bash
  cd /home/sihu2/dotori-ver2-qetta/dotori-app
  # 1) MONGODB_URI 단일 키 갱신(권장)
  NEW_URI="$(sed -n '80p' .env.local | cut -d'=' -f2-)"
  ./scripts/do-env-update.sh "$APP" MONGODB_URI "$NEW_URI"
  doctl apps create-deployment "$APP" --wait

  # 2) 다른 값까지 같이 갱신해야 할 때 (참고: .env.local 자체를 입력값으로 전달)
  ./scripts/do-env-sync.sh "$APP" .env.local
  doctl apps create-deployment "$APP" --wait
  ```
- 동기화 후에도 `bad auth`가 반복되면 Atlas에서 DB 사용자 비밀번호 재설정 → `.env.local` 갱신 → `do-env-update.sh` 재실행
- 주의: `.env` 값이 `MONGODB_URI=mongodb...` 형태로 입력되면 앱에서 `mongodb://` 접두사가 깨져 `Invalid scheme`이 발생할 수 있음
- 긴급시 가장 마지막 정상 배포로 롤백 후 DNS/모니터링 임계치 완화 및 공지

## 8) 배포 후 확인

- PR/CI/수동 배포 모두 아래 API 응답 확인
  - `GET /api/health`
  - `GET /api/health/deep`
- 주요 화면 Smoke
  - `/`
  - `/explore`
  - `/api/health`
- 실패 징후 대응
  - `doctl apps get <APP_ID>` 상태 확인
  - `/api/health/deep` 로그에서 DB 커넥션 에러 체크
  - 필요 시 즉시 롤백 절차로 전환
