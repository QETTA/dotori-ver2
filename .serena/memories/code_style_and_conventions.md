# Code Style & Conventions — Dotori V2

## TypeScript
- strict mode, no `any` (필수)
- 타입은 `src/types/dotori.ts`에 중앙 관리
- interface 우선 (type alias는 union/intersection만)

## React / Next.js
- App Router (src/app/)
- Server Components 기본, 클라이언트는 `'use client'` 명시
- `motion/react` 사용 (framer-motion 직접 import 금지)

## 스타일링
- Tailwind CSS v4 + Headless UI v2.2 + Catalyst UI Kit (27 components)
- Mobile-first: 375×812 기준, max-w-md
- 터치 타겟 최소 44px
- 시맨틱 스케일만 사용 (`text-[Npx]` 금지)
- 브랜드 색상:
  - `color="dotori"` → CTA 브라운
  - `color="forest"` → Badge 전용 (Button 금지)
  - `color="amber"` → 카카오 전용 (앱 CTA 금지)

## 파일 구조
- 컴포넌트: PascalCase (`FacilityCard.tsx`)
- 유틸: camelCase (`formatDate.ts`)
- API: `src/app/api/[resource]/route.ts`
- 모델: `src/models/[Model].ts`

## 테스트
- vitest + React Testing Library
- `__tests__/` 디렉토리 또는 `.test.ts` suffix
- 테스트 파일은 컴포넌트와 동일 디렉토리

## 용어 규칙 (유보통합 대응)
- "어린이집" 단독 → "어린이집·유치원" 병기 (사용자 대면 텍스트)
- 내부 코드/모델: "시설" 약칭 사용 가능 (Facility 모델 유지)
- SEO 키워드에 "유치원", "유치원이동", "영유아시설" 포함 필수
- AI 인텐트 분류기: 유치원 키워드 커버리지 유지

## Git
- main 브랜치 직접 작업
- 커밋 메시지: `type(scope): description` (conventional commits)
- feature branch는 즉시 main merge 후 삭제
