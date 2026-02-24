# Changelog — 도토리 (Dotori)

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## 2026-02-24 — CI/CD v2: Pre-built Image Deployment

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
