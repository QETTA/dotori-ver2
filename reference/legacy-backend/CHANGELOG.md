# 입소ai Changelog

## v0.3.0 (2026-02-15) — Production Ready

### Sessions 13-16: Full-Stack Completion

#### 🗺️ 카카오맵 통합
- Kakao Maps SDK wrapper (로더, 컨트롤러, 제오코딩)
- 등급별 커스텀 마커 오버레이
- 지도/목록 뷰 토글, 시설 타입 필터
- 내 위치 표시 + 전체보기

#### 📡 공공데이터 + 실시간
- 공공데이터포털 어린이집 API 클라이언트 (서울 25개구)
- 일일 크론 동기화 (Vercel Cron)
- SSE 실시간 알림 스트림
- 브라우저 Push Notification 훅

#### 🔍 통합 검색
- 검색 API (시설 + 알림 통합)
- 풀스크린 검색 오버레이 (디바운스, 최근 검색)
- React Query 기반 검색 훅

#### 🛡️ 보안 + 프로덕션
- CSP (카카오맵, 토스, OpenAI 허용)
- HSTS + Permissions Policy
- Redis 기반 rate limiter (Upstash 호환)
- 환경변수 검증 (features 플래그)
- Health check API

#### 📱 UX 고도화
- 6개 페이지별 로딩 스켈레톤
- 설정 페이지 4탭 확장
- 관리자 대시보드 3탭 (개요/사용자/시스템)
- 탐색 페이지 React Query 연결
- 알림 페이지 React Query + mutations 연결

#### 🌐 SEO + 배포
- 동적 OG 이미지 생성 (Edge Runtime)
- JSON-LD 구조화 데이터 (Organization, ChildCare, FAQ)
- i18n 기초 (ko/en, 50+ 키)
- Docker Compose (PostgreSQL + Redis + App)
- Vercel 배포 설정

---

## v0.2.0 (2026-02-14) — Core Features

### Sessions 7-12: Backend + Integration

- NextAuth v5 (Kakao + Naver OAuth)
- Prisma 14 모델 스키마
- Toss Payments 결제 (confirm/cancel/webhook)
- 5-factor 확률 계산 엔진 + 8 시뮬레이션 전략
- AI 채팅 SSE 스트리밍
- E2E 테스트 20+개
- Storybook 17+개 스토리
- Docker + CI/CD

---

## v0.1.0 (2026-02-14) — MVP UI

### Sessions 1-6: Foundation

- Next.js 15 프로젝트 설정
- 디자인 시스템 (Catalyst + 커스텀 토큰)
- 30개 페이지 UI
- 43개 컴포넌트
- Zustand 3 스토어
- React Query 설정
- PWA manifest + Service Worker
- 접근성 (skip link, focus trap, announcer)
