# Dotori Multi-Agent Next Wave Ready Pack (2026-02-24)

> **Archived** — 이 문서의 토큰 마이그레이션 작업은 R33~R45에서 완료되었습니다. 현재 파이프라인은 codex-wave.sh + launch.sh v7 기반입니다. 빌드 커맨드: `npm run build` (env -u NODE_ENV 불필요).

## 0) Current Snapshot (pre-launch)
- `style-guard`: pass
- `Hardcoded className literals`: `0` across `67` files (`src/app` + `src/components/dotori`)
- Remaining style-like literals outside guard scope:
  - `src/app/(app)/community/_lib/community-constants.ts` (4)
  - `src/app/(app)/community/_lib/community-utils.ts` (2)
  - `src/app/(app)/community/_components/CommunityEmptyState.tsx` (2 SVG fill paths)
- Lint warning backlog: `src/app/(app)/my/support/page.tsx` unused `cn`
- Token registry size: `src/lib/design-system/tokens.ts` `4398` lines

## 1) Agent Topology (non-overlap)
- **Agent A — Community Lib Tokenization**
  - Files: `src/app/(app)/community/_lib/community-constants.ts`, `src/app/(app)/community/_lib/community-utils.ts`, `src/app/(app)/community/page.tsx`
  - Goal: remove utility-class string literals from `_lib`; route through `DS_SURFACE`/`DS_STATUS`.
- **Agent B — Surface/Primitive Consolidation**
  - Files: `src/components/dotori/Surface.tsx`, `src/components/dotori/*` files that still duplicate surface tone patterns (strictly no overlap with Agent A/C)
  - Goal: dedupe repeated surface/ring/tone patterns into shared token primitives.
- **Agent C — Token Registry Hygiene**
  - Files: `src/lib/design-system/tokens.ts` only
  - Goal: add missing shared aliases used by A/B, remove token name duplication, keep backward compatibility.
- **Agent D — Quality Gate + Docs**
  - Files: `scripts/check-design-system.ts`, `scripts/style-guard.sh`, `docs/uxui-next-work-plan.md`
  - Goal: tighten false-positive-free guard scope and update wave metrics/result log.

## 2) Merge Order (conflict-safe)
1. Agent C (`tokens.ts`)  
2. Agent A (community lib + page adoption)  
3. Agent B (surface primitive adopters)  
4. Agent D (guard tuning + docs)  

## 3) Agent Prompt Templates
- **A Prompt**
  - "Refactor community `_lib` style literal strings to DS tokens; no raw utility class strings left in `_lib`; keep behavior identical."
- **B Prompt**
  - "Normalize repeated surface tone/ring/bg patterns to DS token primitives; no visual regression; no file overlap with A/C."
- **C Prompt**
  - "Perform token-hygiene only in `tokens.ts`: add aliases needed by A/B, remove duplicate semantics, preserve all existing exports."
- **D Prompt**
  - "Refine style guard/check script precision and update next-wave progress docs with before/after metrics."

## 4) Hard Gates (every batch + final)
- `npm run lint:style-guard`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`

## 5) Done Criteria
- No raw utility class literals in `src/app/(app)/community/_lib/*`
- `style-guard` stays green with zero hardcoded className literals
- All four gates pass after final merge
- docs metrics updated with absolute counts and changed files

## 6) Launch Commands (one-line)
- From `dotori-app`: `npm run multi-agent:next-wave`
- Wider parallelism (6 agents/wave cap): `npm run multi-agent:next-wave:wide`
- Manual override example:
  - `WAVE_SIZE=5 CODEX_MODEL=gpt-5.3-codex npm run multi-agent:next-wave -- --wave=5 --model=gpt-5.3-codex`
