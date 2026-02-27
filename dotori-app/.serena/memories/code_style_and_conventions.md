# Code Style & Conventions

## TypeScript
- strict mode, no `any` without explicit type guard
- `as Record<string, unknown>` for unknown props inspection
- Server components by default; `"use client"` only when needed

## 색상 (매우 중요)
- **기본 브랜드**: `dotori-*` 팔레트 (50~950)
- **성공/활성**: `forest-*` (절대 green-* 금지)
- **CTA 버튼**: `color="dotori"` (Catalyst Button)
- **카카오 전용**: `color="amber"` (앱 CTA에 절대 amber 금지)
- **금지 색상**: `zinc-*`, `blue-*`, `red-*` (디자인 시스템 위반)

## 컴포넌트 패턴
- **Catalyst 컴포넌트** 내부 수정 금지 (`src/components/catalyst/`)
- **SVG 에셋**: `<img>` 태그 사용 (next/image 금지), `BRAND.*` 상수 활용
  ```tsx
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={BRAND.appIconWarm} alt="" className="h-8 w-8" />
  ```
- **Button**: `plain={true}` — boolean 리터럴만 (표현식 금지)
- **Badge**: `color="forest"` (success), `color="dotori"` (info)

## API 패턴
```typescript
export const GET = withApiHandler(async (_req, { userId }) => {
  await dbConnect();
  // ...
  return NextResponse.json({ data: ... });
}, { auth: false, rateLimiter: relaxedLimiter });
```

## 모바일 UI
- viewport: 375x812, `max-w-md mx-auto`
- 터치 타겟: 최소 44px (`min-h-11`)
- safe area: `pb-[env(safe-area-inset-bottom)]`
- 애니메이션: `motion/react` (import from 'motion/react')

## 한국어
- 모든 사용자 대면 텍스트는 한국어
- 코드·변수명은 영어

## 금지 사항
- `framer-motion` import 절대 금지
- `next/image`로 SVG 렌더링 금지
- `zinc-*` 색상 사용 금지
- `any` 타입 (타입 가드 없이) 금지
