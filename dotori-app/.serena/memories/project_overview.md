# Dotori V2 — Project Overview (2026-02-22)

## 앱 정보
한국 어린이집 찾기 MVP. 부모가 AI 채팅(토리)으로 시설 검색·비교·입소 대기 신청.

## 기술 스택
- **Framework**: Next.js 16.1 App Router + React 19 + TypeScript 5.8 strict
- **Styling**: Tailwind CSS 4 (`@theme` 커스텀 토큰), HEX color tokens
- **UI**: Catalyst UI Kit (27 Headless UI components in `src/components/catalyst/`)
- **Animation**: `motion/react` (절대 framer-motion 사용 금지)
- **DB**: MongoDB Atlas (cluster: kidsmap, db: dotori, 20,027 facilities)
- **Auth**: NextAuth v5 beta, Kakao OAuth, JWT strategy
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`)

## 디렉터리 구조
```
src/
├── app/
│   ├── (app)/           # 메인 앱 (BottomTabBar 있음)
│   │   ├── page.tsx         # 홈 대시보드
│   │   ├── chat/page.tsx    # 토리 AI 챗
│   │   ├── explore/page.tsx # 시설 탐색
│   │   ├── community/page.tsx
│   │   ├── my/page.tsx      # MY 페이지
│   │   └── facility/[id]/page.tsx
│   ├── (auth)/login/    # 카카오 로그인
│   ├── (landing)/landing/ # 랜딩
│   ├── (onboarding)/    # 온보딩
│   └── api/             # 30개 API 라우트
├── components/
│   ├── catalyst/        # 27개 Headless 컴포넌트 (수정 금지)
│   └── dotori/          # 커스텀 컴포넌트 16개+
├── lib/
│   ├── engine/          # AI 챗 엔진 (intent-classifier, response-builder)
│   └── ai/claude.ts     # Anthropic 클라이언트
└── models/              # 12개 Mongoose 모델
```

## 현재 상태 (2026-02-22)
- **빌드**: ✅ 45페이지, 0 TypeScript 에러
- **MongoDB**: dotori DB 전용 (kidsmap 레거시 DB 삭제 완료)
- **시설 데이터**: 20,027건 (경기도 주요 도시 성남/수원/고양 데이터 미수집 상태)
- **SSE 스트리밍**: `/api/chat/stream` 라우트 구현 완료
- **마크다운 렌더링**: `MarkdownText.tsx` 구현 완료

## 핵심 파일 경로
- AI 챗 라우트: `src/app/api/chat/stream/route.ts` (SSE), `src/app/api/chat/route.ts` (fallback)
- 엔진: `src/lib/engine/intent-classifier.ts`, `src/lib/engine/response-builder.ts`
- 브랜드: `src/lib/brand-assets.ts` (BRAND 상수), `public/brand/` (21개 SVG)
- 색상 토큰: `src/app/globals.css` (@theme dotori-* / forest-*)
