# 도토리 (Dotori) 프로젝트 개요

## 현재 상태 (2026-02-22, Round 5 완료)

- **45 pages**, 0 TypeScript errors, 빌드 성공
- **MongoDB**: 20,027 시설 (17개 시도), Atlas `dotori` DB
- **DO 배포**: DigitalOcean App Platform
- **완료 라운드**: R1(12) + R2(12) + R3(12) + R5(11) = 47 에이전트

## 앱 포지셔닝
- **핵심 가치**: AI 기반 어린이집 이동(전원) 전략 어시스턴트
- **주 타겟**: 3월 반편성/교사 변경/시설 불만으로 이동 고민 중인 부모
- **차별화**: 토리챗 AI + 20,027 실시간 DB + 이동 절차 가이드

## 수익화 구조 (2026 현실적 계획)
- **B2B 파트너 플랜**: 어린이집 월 3~5만원 (상단 노출 + 설명회 예약)
- **B2C 프리미엄**: 부모 월 1,900원 (빈자리 즉시 알림)
- **데이터 판매**: 지자체 보육 트렌드 리포트
- **랜딩에 이미 "어린이집 파트너 플랜" 섹션 존재**

## 기술 스택
- Next.js 16.1 (App Router) + React 19 + TypeScript 5.8 strict
- Tailwind CSS 4, motion/react (NEVER framer-motion)
- Mongoose 8.14 + MongoDB Atlas
- NextAuth v5, Kakao OAuth
- Anthropic Claude API (토리챗 엔진)

## 주요 API
- `/api/chat/stream` — 토리챗 SSE 스트리밍 (Claude Sonnet 4.6)
- `/api/facilities` — 시설 검색/필터
- `/api/waitlist` — 대기 신청
- `/api/community/posts` — 익명 게시판
- `/api/health` — liveness (DB 없음)
- `/api/health/deep` — deep check (DB ping)

## 디렉토리 구조
```
src/
├── app/(app)/          # 메인 앱 (BottomTabBar 있음)
│   ├── page.tsx        # 홈
│   ├── chat/           # 토리챗
│   ├── explore/        # 시설 탐색 (GPS 기능 포함)
│   ├── community/      # 이웃 (익명 게시판)
│   ├── facility/[id]/  # 시설 상세
│   └── my/             # MY 페이지
├── app/(auth)/login/   # 로그인 (카카오)
├── app/(onboarding)/   # 온보딩 (슬라이더 UX)
├── app/(landing)/      # 랜딩 (파트너 플랜 포함)
├── lib/engine/         # 토리챗 엔진
│   ├── intent-classifier.ts  # 전원/이동/반편성 키워드 분류
│   ├── response-builder.ts   # 인텐트별 응답 생성
│   └── nba-engine.ts         # NBA (Next Best Action)
└── lib/ai/claude.ts    # Anthropic API 래퍼
```

## 환경 변수
- `MONGODB_URI` — MongoDB Atlas
- `AUTH_SECRET`, `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET`
- `ANTHROPIC_API_KEY` — Claude API
- `NEXT_PUBLIC_KAKAO_MAP_KEY` — 카카오맵
- `AI_MODEL` — 기본값 `claude-sonnet-4-6`

## DigitalOcean 배포
- App ID: `29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2`
- health_check: `/api/health`
- 환경변수 변경: `scripts/do-env-update.sh` 사용 필수

## 브랜드 색상
- `dotori-400`: #c8956a (버튼/강조)
- `dotori-500`: #b07a4a (WCAG AA 안전)
- `forest-500`: #4a7a42 (성공/입소 가능)
- `color="amber"` → 카카오 전용, 앱 CTA에 사용 금지
