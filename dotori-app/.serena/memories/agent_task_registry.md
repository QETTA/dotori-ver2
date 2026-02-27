# 에이전트 파일 소유권 맵 (R51 기준)

## 현재 상태 (2026-02-27)
- **완료 라운드**: R1~R51, 160+ 에이전트
- **빌드**: 20 pages, 0 TS errors, 804 tests (70 files)
- **파이프라인 v8**: codex-wave.sh (CLI 병렬) + launch.sh v7 (워크트리 격리)

## 공통 파일 (에이전트 수정 금지)
- src/app/globals.css — Claude Code만 수정
- src/app/layout.tsx — Claude Code만 수정
- src/lib/motion.ts — Claude Code만 수정 (animation presets)
- src/lib/design-system/* — Claude Code만 수정
- src/lib/brand-assets.ts — Claude Code만 수정
- src/components/catalyst/* — 절대 수정 금지
- src/types/* — 로직 파일, 공유 소유

## 파일 소유권 규칙
- **1 파일 = 1 에이전트** (agent_task_registry.md에 명시)
- **라운드별 설계**: task_designs/rN.md에 에이전트별 파일 배정
- **MERGE_ORDER**: 인프라/보안 먼저, UI/테스트 마지막
