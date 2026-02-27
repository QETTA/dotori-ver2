# Dotori UX/UI 다음 작업 설계 (Next Plan)

## 1) 목표
- DS 감사 점수 분모를 `style-bearing` 파일로 고정해 점수 왜곡을 줄인다.
- 브랜드 점수는 `BRAND/COPY` 텍스트 존재가 아니라 DS 아키텍처 신호로만 평가한다.
- 다음 Wave는 잔여 `raw className literal` 0개 달성을 우선 KPI로 둔다.

## 2) 감사 모델 하드닝 (2026-02-24)
- score scope 규칙: `className 할당` 또는 `semantic color(color="dotori|forest|amber")`가 있는 파일만 점수 분모(`style-bearing`)에 포함.
- brand signal 규칙: `DS_SURFACE/DS_GLASS/DS_STATUS/DS_PROGRESS/DS_TOAST/DS_SENTIMENT/DS_FRESHNESS` + semantic color만 브랜드 점수에 반영.
- `BRAND`/`COPY` import 존재는 진단 필드로만 유지하고 브랜드 점수 산정에는 미반영.
- 보고서 메트릭 추가: `styleBearingScoreCount`, `styleBearingScoreRate`, `brandArchitectureSignalCount`, `brandArchitectureSignalRate`.
- `style-neutral` allowlist 고정: `src/app/(app)/facility/[id]/page.tsx`, `src/components/dotori/WaitlistProgressBar.tsx`
- `DS_STYLE_NEUTRAL_ENFORCE=1`에서 style-neutral 파일의 `className/semantic color` 추가를 위반으로 차단.

## 3) 최신 베이스라인 (DS_AUDIT_ALL=1)
- `examinedCount`: 67 (app pages 21 + dotori components 46)
- `scoreBaseCount`: 67, `scoreTargetCount(style-bearing)`: 65 (`src/app/(app)/facility/[id]/page.tsx`, `src/components/dotori/WaitlistProgressBar.tsx` 제외)
- `tokenScore`: 100, `brandScore(architecture)`: 100, `score`: 100
- `totalHardcodedClassLiterals`: 0
- `rawClassFreeRate`: 100% (67/67), `styleBearingScoreRate`: 97% (65/67)

## 4) 다음 Wave 실행 계획
1. `PremiumGate`의 `backdrop-saturate-110` literal은 `DS_SURFACE.PREMIUM_GATE_OVERLAY`로 이동 완료.
2. `style-bearing` 제외 2개 파일(`facility/[id]/page.tsx`, `WaitlistProgressBar.tsx`)은 style-neutral wrapper 정책으로 명시 및 강제 완료.
3. strict gate 재검증: `DS_RAW_CLASS_MAX=0`, `DS_SCORE_MIN=97`.

## 5) 품질 게이트
- `npx tsc --noEmit`
- `npm test`
- `env -u NODE_ENV npm run build`
