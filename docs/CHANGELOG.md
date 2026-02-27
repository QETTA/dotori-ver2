# Changelog — 도토리 (Dotori)

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased] — v4.0 유보통합 대응

### Planned
- **시설 데이터 확장**: 유치원 8,500개소 추가 (유치원알리미 API), 어린이집 27,387 갱신 → 총 35,887
- **5개 공공 API 연동**: 정보공개포털, 유치원알리미, 표준데이터, 행안부 인구, KOSIS
- **TO 예측 엔진**: 연령반별 잔여TO 실시간 계산 + AI 입소 확률 예측
- **전자서명 시스템**: 7종 서류 (Canvas+PDF 자체 + 모두싸인 하이브리드), 감사추적인증서
- **B2B SaaS**: 시설 대시보드 (원아모집 현황, TO 통계, 관심 부모 수), 4티어 과금
- **B2B2B/B2G**: AI바우처 화이트라벨, 지자체 라이선싱

> 상세: [STRATEGY_v4.0.md](./STRATEGY_v4.0.md)

---

## 2026-02-27 — R45~R46: DS_CARD 토큰 마이그레이션 + 문서 정합

### Changed
- R45: 7파일 15건 inline 스타일 → DS_CARD.flat 토큰 변환, `bg-dotori-950/[0.025]` 0건 달성
- R46: 운영 문서 수치 동기화 (DEPLOYMENT_RUNBOOK, MASTER_v1)

---

## 2026-02-27 — R43~R44: BrandWatermark 전체 배치

### Added
- R43: BrandWatermark 7페이지 추가 (12/18), Community DS_CARD.flat + hoverLift + tap.chip
- R44: BrandWatermark 6페이지 추가 → **18/18 앱 페이지 100%** 달성

---

## 2026-02-27 — R41~R42: Visual Polish + Landing Refactor

### Changed
- R41: 4페이지 프리미엄 폴리싱 (community/write, support, app-info, sign) — motion, AnimatePresence
- R42: 랜딩 리팩토링 502→233줄 (46% 감소), 시각 리듬 6색 교차, DarkBentoSection, Salient Pricing

---

## 2026-02-27 — R39~R40: 전자서명 폼 + 데이터 정합

### Added
- R39: DocumentFormRenderer 14종 템플릿 필드 동적 렌더 (text/date/checkbox/select)
- R40: DOC_TYPE_LABELS 6→14종 동기화, Home 퍼널 스텝 동적화

---

## 2026-02-26 — R37~R38: 전자서명 UI + SEO + Real Data

### Added
- R37: SignaturePad.tsx Canvas 터치/마우스 서명, SignaturePreview.tsx
- R37: useHomeDashboard → /api/home 실데이터 연결, PullToRefresh 실 API
- R38: 커뮤니티 상세 mock→real (use-community-detail, use-comments), 글쓰기 POST
- R38: 전자서명 6단계 위저드 + StepIndicator, LegalClausesPanel, DocumentSelector
- R38: SEO — 5 layout.tsx (landing OG, login/onboarding noindex, facility/community 동적 OG)

---

## 2026-02-26 — R35~R36: Mock→Real + Kakao+UTM + Chat Intelligence

### Changed
- R35: 7페이지 mock 데이터 제거 → API 훅 연결
- R35: seasonal-config.ts 월별 브리핑 + SeasonalBriefing 컴포넌트
- R36: utm.ts 빌더/파서, deep-link.ts, KakaoChannelButton, ShareButton, UTMTracker
- R36: keyword-registry.ts 시즌별 프롬프트 회전 → chat 퀵리플라이 동적화
- R36: 5페이지 BrandEmptyIllustration empty state 적용

---

## 2026-02-26 — R33~R34: DS Token Migration

### Changed
- R33: text-[Npx] 전면 제거, DS_TYPOGRAPHY 시맨틱 토큰 100% 채택
- R34: DS_CARD(flat/raised), DS_PAGE_HEADER, DS_SURFACE 토큰 → 27 페이지 100% 토큰 채택
- Tests: 111 → **804개** (70 test files)

---

## 2026-02-26 — CI/CD v7: Manual-Only Deploy + Infrastructure Hardening

### Changed
- **자동 배포 완전 제거**: ci.yml에서 deploy job 삭제, main push는 CI만 실행
- **deploy.yml 신설**: workflow_dispatch 수동 전용, CI 게이트 + 스펙 검증 + SHA 중복 체크
- release-audit.yml: hourly → daily (09:15 UTC), `AUTO_TRIGGER_DEPLOY_ON_MISMATCH=0`
- Dockerfile v3: `--mount=type=cache,target=/root/.npm` 캐시 마운트, 미사용 ARG 4개 제거
- app.yaml v4: `initial_delay_seconds: 30`, `period_seconds: 15`, NEXT_PUBLIC_* `RUN_AND_BUILD_TIME`
- 운영 문서 전체 갱신: 경로/배포 모드/test count 정합

---

## 2026-02-24 — CI/CD v6.1: Timing Gate + Release Audit Metrics

### Changed
- deploy job timing 진단에 하드 게이트 판정 추가:
  - `build_total >= 240s` 또는 baseline ratio `>= 1.60x` 시 `fail`
  - ratio 기반 실패는 `build_total >= 120s` floor 예외 적용
- timing 출력값을 `gate_status/gate_reason`으로 노출하고 후속 step에서 실패 승격
- `scripts/release-audit.sh` 확장:
  - `build_total` 집계(`P50/P90/MAX`, regression_count, baseline ratio) 계산
  - `PASS/WARN/FAIL/UNKNOWN` status 및 reason 코드 출력
  - `ENFORCE_TIMING_GATE=1`일 때 `FAIL` status를 워크플로 실패로 처리
- `docs/ops/RELEASE_AUDIT.md` 신설, 임계치/환경변수/운영 정책 문서화

---

## 2026-02-24 — CI/CD v6: DigitalOcean Source-Only Hardening

### Changed
- CI/CD 배포 경로를 source 빌드 단일 경로로 고정 (`doctl apps create-deployment`)
- Docker build 병목 완화: deps stage 중복 설치 제거, `npm ci --prefer-offline`
- 배포 단계 개선: `get-deployment` phase polling, 타임아웃, 진행 로그
- `doctl` 호출 hang 방지용 per-call timeout
- 중복 배포 방지: active SHA == target SHA 시 스킵
- 배포 타이밍 진단: baseline median, regression warning, 하드 게이트
- 배포 가드: `doctl apps update --spec` 금지, source 모드 검증

### Removed
- 레거시 배포 설정 파일 및 스크립트 잔재 삭제

---

## 2026-02-24 — CI/CD v2: Pre-built Image Deployment (Legacy / Retired)

> ⚠️ 운영 금지: 아래 내용은 히스토리 기록용이며, 현재 운영 파이프라인은 상단의 `CI/CD v7` (수동 전용)이다.

### Changed
- CI/CD 파이프라인 근본 재설계: `detect → ci → docker → deploy`
- DO Dockerfile 풀빌드(~15분) → **DOCR pre-built 이미지 배포(~3분)**
- `ci.yml`: test+build 2job → 단일 `ci` job (`ci:preflight`, npm ci 1회)
- 변경 감지 `detect` job 추가 (앱 소스 변경 시만 배포 트리거)

### Added
- **DOCR 레지스트리** `dotori` (sgp1) 생성 — `registry.digitalocean.com/dotori/web`
- Docker `build-push-action` + GHA BuildKit 레이어 캐시 (`type=gha,mode=max`)
- Dockerfile ARG로 NEXT_PUBLIC_* 빌드타임 주입
- 이미지 태그: `latest` + `sha-<commit>`

### Improved
- Dockerfile 3레이어 분리: config(거의 불변) → public(가끔) → src(자주)
- `.dockerignore`: 테스트/스크립트/lint설정 등 불필요 파일 전면 제외
- `app.yaml`: Dockerfile 빌드 → DOCR 이미지 기반, BUILD_TIME env 제거 (이미지에 번들링)
- Health check: `failure_threshold` 5→3, `initial_delay` 15→10초 (이미지 pull이므로 빠름)

---

## 2026-02-24 — R23: haiku 분석 + frontend-design 기반 P0 UX 개선

### Changed
- 7 에이전트 병렬 실행, frontend-design 스킬 기반 디자인 씽킹 적용
- 모바일 UX P0 이슈 전면 수정

---

## 2026-02-23 — R22: 모바일 UX/UI 전면 개선

### Changed
- 11 에이전트 병렬 실행, 49 파일 수정
- SourceChip spring crash 수정 (랜딩 백지 해결)
- NODE_ENV prerender crash 해결 (env -u NODE_ENV)
- 디자인 시스템 토큰 도입 (DS_TYPOGRAPHY, DS_GLASS 등)
- 파이프라인 v7: wave 빌드 + codex-wave.sh + haiku QA 위임
- Tests: 106 → **111개** (16 files)

---

## 2026-02-22 — R17: 모바일 UX 폴리싱 + 스크립트 정비

### Changed
- 11 에이전트, 모바일 전 페이지 UI 폴리싱
- codex-wave.sh 도입 (MCP 직렬 우회, CLI 병렬 배치)

---

## 2026-02-22 — R14: 불일치 해소 + 대규모 최적화 파이프라인

### Added
- R14 전용 병렬 런처 `dotori-app/scripts/launch-r14.sh`
- R14 에이전트 소유권 맵 업데이트 (`.serena/memories/agent_task_registry.md`)

### Changed
- R13 보안 중심 태스크에서 R14 구조/토큰/콘솔 안정화 중심 파이프라인으로 전환
- `ㄱ` 실행 시 머지 순서와 파일 충돌 방지 규칙을 R14 기준으로 재정의

### Quality Gate
- 완료 기준 명시: 콘솔 오류 0, lint/build 통과, Catalyst 수정 금지

---

## 2026-02-22 — R13: Opus P0~P2 보안+품질 수정

### Security (P0)
- users/me: `plan` 필드 자가변경 차단
- subscriptions: admin 전용 제한
- chat/stream: 서버측 IP 기반 게스트 사용량 추적
- CLAUDE.md: 시크릿 값 제거

### Security (P1)
- admin API: 세션 인증 + CRON_SECRET 복합 인증
- middleware: rate limit 메모리 누수 정리
- response-builder: `$text` 검색 입력 새니타이즈

### Fixed
- nba-engine: non-null assertion 8곳 → null guard
- page.tsx + waitlist: `!` assertion → `?.` 교체
- waitlist API: body 이중 파싱 제거
- alerts API: 비프리미엄 알림 로직 개선
- 중복 테스트 파일 병합 → Tests: 50 → **55개**

---

## 2026-02-22 — R12: 탐색/시설/랜딩 폴리싱

### Added
- E2E 테스트: `home.spec.ts`
- 엔진 테스트 10개 추가

### Changed
- explore/facility/landing 페이지 폴리싱
- Tests: 40 → **50개**

---

## 2026-02-22 — R11: 혼란 제거 + 간소화

### Changed
- 홈 페이지: 1,300줄 → 260줄 대폭 간소화
- ESLint 경고 전부 해결 (0 warnings)
- chat `sendMessage` → `useCallback` 전환

### Fixed
- Skeleton.tsx `'use client'` 누락 SSR 크래시
- page.tsx TypeScript null narrowing
- Tests: 34 → **40개**

---

## 2026-02-21 — R9: 프리미엄 모델 + 테스트

### Added
- Premium 기능 전체 구현 (PREMIUM_SPEC 6개 태스크)
- intent-classifier, nba-engine 유닛 테스트
- E2E 테스트 (chat, explore, onboarding)

---

## 2026-02-20 — R8: 수익화 퍼널

### Added
- 채팅 쿼터 (게스트 3회, 무료 10회/월, 프리미엄 무제한)
- 구독 API, PremiumGate, UsageCounter, 랜딩 B2C/B2B

---

## 2026-02-19 — R5: GPS/지도 + 커뮤니티

### Added
- GPS 시설 탐색, 카카오 지도, 커뮤니티 게시판, 온보딩

---

## 2026-02-18 — R1~R3: 초기 구축

### Added
- Next.js + TypeScript + Tailwind CSS + MongoDB Atlas
- 카카오 OAuth, 토리챗 AI, 시설 탐색, 대기 신청
- Catalyst UI Kit, DigitalOcean 배포
