# Asset / Design Component "Broken" Investigation (2026-02-24, 최종 정리 2026-02-26)

## Scope

This report documents why images / design assets look "broken" in production for Dotori.

## Observations (Repro Evidence)

- Deployed site returns a strict CSP header (configured in `dotori-app/next.config.ts`).
- Running Playwright console capture against production logs repeated CSP violations:
  - `Loading the stylesheet 'https://fonts.googleapis.com/...Plus+Jakarta+Sans...' violates ... style-src ...` (blocked).
- Static brand SVGs are served correctly from production:
  - `GET /brand/dotori-symbol.svg` returns `200`.
  - `GET /brand/assets/svg/dotori-symbol.svg` returns `404` (this path does not exist).

## Root Causes

### 1) CSP blocks Google Fonts — ✅ RESOLVED (2026-02-26)

`dotori-app/src/app/layout.tsx` loads:
- `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans...`

**Fix applied** in `dotori-app/next.config.ts`:
- `style-src` now includes `https://fonts.googleapis.com`
- `font-src` now includes `https://fonts.gstatic.com`

### 2) CSP image allowlist — ✅ NO CURRENT VIOLATION (2026-02-26 audit)

Current CSP allows images from:
- `'self' data: blob: https://k.kakaocdn.net https://img1.kakaocdn.net https://*.daumcdn.net https://*.googleusercontent.com`

**DB image audit result (2026-02-26):**
- `facility.images[]`: seed data sets empty arrays; no enrichment populates images
- `premiumProfile.photos[]`: admin API only; no entries yet
- User avatars: Kakao OAuth → `k.kakaocdn.net` (already allowed)
- **Conclusion: 0 CSP violations in current data**

**Future risk**: If admin enters premium photos from non-Kakao domains, CSP will block them. Add domains to `img-src` and `next.config.ts remotePatterns` as needed.

## Non-Causes (Ruled Out)

### Brand assets missing from Docker image (not observed)

Although repo root `.dockerignore` excludes the repo root `brand/` directory, production brand SVGs are present:
- Brand assets exist under `dotori-app/public/brand/*.svg`.
- The deployed runtime serves `/brand/dotori-symbol.svg` successfully.

## Resolution Status

| Issue | Status | Date |
|-------|--------|------|
| Google Fonts CSP blocked | ✅ Resolved | 2026-02-26 |
| Remote images CSP blocked | ✅ No current violation | 2026-02-26 |
| Brand SVGs missing | ✅ Not an issue | 2026-02-24 |

**최종 상태 (2026-02-26)**: 모든 이슈 해결 완료. 향후 프리미엄 시설 사진(non-Kakao 도메인) 추가 시 CSP `img-src` 확장 필요.
