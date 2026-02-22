# Changelog — 도토리 (Dotori)

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

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

---

> Template origin: Tailwind Plus (2025-12-18 initial release)
