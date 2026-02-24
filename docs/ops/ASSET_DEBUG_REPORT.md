# Asset / Design Component "Broken" Investigation (2026-02-24)

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

### 1) CSP blocks Google Fonts (confirmed)

`dotori-app/src/app/layout.tsx` loads:
- `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans...`

But CSP in `dotori-app/next.config.ts` only allows:
- `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`
- `font-src 'self' https://cdn.jsdelivr.net`

Result:
- The Google Fonts stylesheet is blocked (style-src).
- Even if style-src is widened, the font files would still be blocked unless `font-src` allows `https://fonts.gstatic.com`.

Impact:
- Typography and any components relying on `--font-wordmark` (`Plus Jakarta Sans`) fall back to other fonts.

### 2) CSP image allowlist is narrow; dynamic remote images can be blocked (data-dependent)

Current CSP only allows images from:
- `'self' data: blob: https://k.kakaocdn.net https://img1.kakaocdn.net https://*.daumcdn.net`

Several UI surfaces render DB-provided URLs directly via `<img src={...}>`, for example:
- Facility hero image: `facility.images[0]` via `getFacilityImage()` and `<img src={facilityImageUrl}>`
- Premium photos gallery: `<img src={photo}>`
- User avatar: `<img src={user.image}>`

If these URLs point to hosts outside the allowlist (e.g. `example.com`, `pstatic.net`, `googleusercontent.com`, etc), browsers will block them under CSP and the UI will show broken images.

## Non-Causes (Ruled Out)

### Brand assets missing from Docker image (not observed)

Although repo root `.dockerignore` excludes the repo root `brand/` directory, production brand SVGs are present:
- Brand assets exist under `dotori-app/public/brand/*.svg`.
- The deployed runtime serves `/brand/dotori-symbol.svg` successfully.

## Next Actions (Fix Options)

1. Fix fonts:
   - Add `https://fonts.googleapis.com` to `style-src`.
   - Add `https://fonts.gstatic.com` to `font-src`.
2. Fix remote images:
   - Either expand `img-src` allowlist to include the actual photo/avatar hostnames in use, or proxy/normalize images so they originate from a controlled domain.
3. Add a debugging harness:
   - Extend Playwright screenshot scripts to log `requestfailed` + `response.status >= 400` for `resourceType === 'image'` to enumerate blocked/404 asset URLs.

