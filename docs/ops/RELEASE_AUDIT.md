# Release Audit Timing Policy

최종 업데이트: 2026-02-24

## 목적

- `scripts/release-audit.sh`가 누락 배포 점검 외에 배포 타이밍 이상징후를 수치로 감시하도록 표준화.
- GitHub 스케줄 감사(`.github/workflows/release-audit.yml`)에서 선택적으로 하드 실패를 유도.

## 산출 지표

- `AUDIT_BUILD_CURRENT`: 현재 활성 배포 `build_total`(초)
- `AUDIT_BUILD_P50`: 최근 성공 배포 표본 중앙값
- `AUDIT_BUILD_P90`: 최근 성공 배포 90퍼센타일
- `AUDIT_BUILD_MAX`: 최근 성공 배포 최대값
- `AUDIT_BUILD_BASELINE_MEDIAN`: 현재 배포 제외 baseline 중앙값
- `AUDIT_BUILD_BASELINE_RATIO`: `current / baseline_median`
- `AUDIT_BUILD_REGRESSION_COUNT`: 표본 중 회귀 임계치(`ratio_warn` + floor) 초과 건수
- `AUDIT_TIMING_STATUS`: `PASS | WARN | FAIL | UNKNOWN`
- `AUDIT_TIMING_REASON`: 판정 근거 코드(csv)

## 기본 임계치

- 경고: `build_total >= 180s`
- 실패: `build_total >= 240s`
- 경고: `baseline_ratio >= 1.35x` (baseline 표본 `>= 3`)
- 실패: `baseline_ratio >= 1.60x` (baseline 표본 `>= 3`)
- floor 예외: ratio 기반 실패/경고는 `build_total >= 120s`일 때만 강하게 적용

## 환경변수

- `CHECK_TIMING` (기본 `1`): timing 집계 수행 여부
- `ENFORCE_TIMING_GATE` (기본 `0`): `FAIL` status를 프로세스 실패로 승격
- `AUTO_TRIGGER_DEPLOY_ON_MISMATCH` (기본 `0`): DO 활성 배포 SHA 불일치/누락 시 `create-deployment` 자동 트리거
- `AUTO_TRIGGER_DEPLOY_RETRIES` (기본 `2`): 자동 트리거 재시도 횟수
- `SLACK_WEBHOOK_URL` (워크플로우 옵션): auto-trigger 발생 시 Slack 알림 전송
- `AUDIT_SAMPLE_SIZE` (기본 `20`): 최근 성공 배포 표본 수
- `AUDIT_BASELINE_SIZE` (기본 `5`): baseline 비교 표본 수
- `AUDIT_MIN_BASELINE_COUNT` (기본 `3`): ratio 판정 최소 표본 수
- `AUDIT_BUILD_WARN_SECONDS` (기본 `180`)
- `AUDIT_BUILD_FAIL_SECONDS` (기본 `240`)
- `AUDIT_RATIO_WARN` (기본 `1.35`)
- `AUDIT_RATIO_FAIL` (기본 `1.60`)
- `AUDIT_RATIO_FLOOR_SECONDS` (기본 `120`)

## 운영 권장

- 스케줄 감사 워크플로에서는 `ENFORCE_TIMING_GATE=1` 유지.
- 스케줄 감사 워크플로에서는 `AUTO_TRIGGER_DEPLOY_ON_MISMATCH=1`로 drift 자동 복구를 활성화.
- 로컬 수동 감사는 기본 `ENFORCE_TIMING_GATE=0`로 실행 후, 필요 시만 `1`로 승격.
