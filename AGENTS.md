# AGENTS.md — Dotori V2 (Codex Agents)

## Project
- Korean childcare facility finder (어린이집 탐색)
- Next.js 16.1 + React 19 + TypeScript 5.8 strict + Tailwind CSS 4

## Output Contract (필수)
1. unified diff (applyable patch)
2. 7-line summary (max)
3. exact test command(s)
4. BLOCKED: + 3줄 (what/why/what-needed) — 막힐 때만

## Scope
- 담당 파일 외 수정 금지
- 파일 3~7개 이내 (초과 시 1줄 사유)
- 목표 1개 (bug fix + refactor 혼합 금지)

## Code Rules
- `text-[Npx]` 금지 → `text-xs/sm/base/lg/xl` Tailwind 토큰만
- `motion/react` 만 (`framer-motion` 금지)
- `color="dotori"` → CTA, `color="forest"` → Badge만, `color="amber"` → 카카오만
- touch target: `min-h-11` (44px)
- `import { BRAND } from "@/lib/brand-assets"`
- `import { DS_STATUS, DS_GLASS } from "@/lib/design-system/tokens"`
- `import { COPY } from "@/lib/brand-copy"`
- Korean UI text, English code

## Design Aesthetics (Dotori Brand)
- Tone: Warm organic — 따뜻한 육아앱, 제네릭 AI 디자인 금지
- Card: `rounded-2xl/3xl`, `shadow-sm`, `ring-1 ring-dotori-100/70`
- Motion: `motion/react` spring, `whileTap` feedback, stagger 진입
- Background: glass morphism (`DS_GLASS`), `dotori-50` tint
- Spacing: generous padding, `border-b` section divider

## Validation
- `npx tsc --noEmit` → 0 errors
- `npm test` → all pass
- `env -u NODE_ENV npm run build` → 0 errors

## Git
- 수정 후 feature branch 만들지 말 것 — main에서 직접 작업
- git root: `/home/sihu2/dotori-ver2-qetta` (CWD와 다름 주의)

## Key Paths
```
src/
├── components/dotori/     # 44 custom components
├── components/catalyst/   # 27 Headless UI (수정 금지)
├── components/ds/         # Design system wrappers (DsButton etc.)
├── lib/brand-assets.ts    # BRAND constant
├── lib/brand-copy.ts      # COPY constant (Korean strings)
├── lib/design-system/tokens.ts  # DS_STATUS, DS_GLASS
├── lib/utils.ts           # cn(), formatRelativeTime()
├── types/dotori.ts        # Core type definitions
└── models/                # 14 Mongoose models
```
