# AGENTS.md — ipsoai 자율 에이전트 규칙 (updated 2026-02-19)

## 1. 핵심 원칙
- 구현 우선. 질문보다 실행.
- 불확실하면 안전한 방향으로 결정하고 계속 진행.
- 패치는 작게, 실행은 연속적으로.
- 모바일 퍼스트 (iPhone 14 기준).

## 2. 입력 정규화
| 입력 | 의미 |
|------|------|
| `ㄱ`, `ㄱㄱ`, `go` | 다음 우선순위 작업 시작/계속 |
| `ㅇㅋ`, `ok` | 현재 플랜 유지, 계속 |
| `중단`, `stop` | 즉시 중단 |
| 짧은 한국어 | 문맥에서 의도 추론, 재질문 금지 |

## 3. 품질 게이트 (파일 변경 시)
```
typecheck → lint:changed → test:e2e:console
```
- 위 3개 통과해야 다음 작업으로 이동.
- 실패하면 수정 후 처음부터 재실행.
- `test:e2e:trend`와 `review:ai`는 세션 끝에 1회만 실행.

## 4. 우선순위 큐
1. 콘솔/런타임 에러
2. Hydration mismatch
3. 모바일 UI 깨짐
4. E2E 트렌드 드리프트
5. AI 리뷰 지적사항

## 5. 프로필 사용
| 상황 | 프로필 | 명령 |
|------|--------|------|
| 일반 코딩 | `dev` | `codex -p dev` |
| 복잡한 리팩토링/디버깅 | `deep` | `codex -p deep` |
| 코드 리뷰/검수 | `review` | `codex -p review` |

## 6. 보고 형식
변경사항 → 이유 → 잔존 리스크. 3줄 이내.

## 7. 모바일 출력 기준점(고정)
- 기준 날짜: `2026-02-12`
- 기준 성격: 글로벌 개발자/디자인 커뮤니티 모바일 UX/UI 베스트프랙티스
- 사이클 시작 선검수(항상):
```
mcp:check → test:e2e:trend:rapid
```
- 모바일 출력 검수 싸이클은 아래 순서를 기본으로 고정:
```
typecheck → lint:changed → test:e2e:console(MobileChrome) → test:e2e:trend → screenshots:all
```
- 뷰포트 정책: 모바일 전용(`MobileChrome`, iPhone 14 수준 터치 타깃 44px 이상).
- 개발 서버 정책: 로컬 `localhost:3000` 고정.

## 8. 콘솔오류 즉시 대응
- 콘솔/런타임 에러 감지 즉시 병렬 서브에이전트 모드로 전환한다.
- 병렬 분기 기준:
  - A: 라우트/UI 렌더링(Hydration 포함)
  - B: 정적 리소스/이미지/폰트/아이콘 404
  - C: API/CSP/외부 SDK 로드 실패
- 분류 결과는 `artifacts/console-classification/latest.json`에 최신 라우트 기준으로 누적 기록한다.
- 첫 실패 감지 후 즉시 패치 → 품질 게이트 재실행(`typecheck → lint:changed → test:e2e:console`).

## 9. Codex CLI 핵심역량 주기 점검
- Codex CLI: `codex-cli 0.104.0` (gpt-5.3-codex-spark)
- 사이클마다 `capability:audit:core`를 실행해 다음을 확인한다.
  - Codex 전환/실행 스크립트 존재 (`codex:safe`, `codex:batch`, `codex:tier`)
  - AI 툴 계약(`start_research`, `show_map`) 유지
  - `/api/chat` 스트리밍 계약(`text/event-stream`) 유지
- 라이브 점검이 필요하면 `capability:audit:core:live`로 강제한다.
- 라이브 강제 사이클이 필요하면 `workflow:cycle:live` 또는 `workflow:strict`를 사용한다.

## 10. 상시가동 데몬 헬스
- 데몬 heartbeat 상태는 `scripts/auto-sync-daemon.health.json`으로 관리한다.
- stale heartbeat 감지 시 `auto-sync:daemon:bg` 실행 단계에서 자동 재기동한다.

## 11. MCP/Skills 기본 스택
- MCP 기본 서버: `playwright`, `serena`, `context7` (enabled 상태 유지).
- 비활성 서버(필요 시 활성화): `greptile`, `github`.
- 워크플로우 시작 전 `npm run mcp:check`로 MCP 스택 정상 여부를 검증한다.
- 등록 skills: `codex-impl`, `design-check`, `handoff`, `review`.

## 12. Playwright 상시 동기화(백그라운드)
- 상시 sync 시작: `npm run playwright:sync:bg`
- 상태 확인: `npm run playwright:sync:status`
- 중지: `npm run playwright:sync:stop`
- 기본 정책: `18초` 주기, `localhost:3000/home` 헬스 확인 후 `test:e2e:console:rapid` 실행, 주기적으로 `mcp:check` 병행.
- rapid 감시 범위(경량): `/home`, `/community`, `/explore?view=map` (full 검증은 `test:e2e:console`에서 16개 라우트 실행).
- 헬스 프로브 타임아웃: `12000ms` (Next dev 컴파일 지연으로 인한 false skip 완화).
- rapid 실행 정책: Playwright `--retries=1` (dev 번들링 일시 노이즈 흡수, 지속 오류는 fail 유지).

## 13. 에이전트/서브에이전트 병렬 스택

### 2-에이전트 (기본)
- 병렬 시작: `npm run subagents:bg`
- 병렬 상태: `npm run subagents:status`
- 병렬 중지: `npm run subagents:stop`
- 메인 에이전트: `dev:daemon:bg` (localhost:3000 고정 dev 서버 상시 유지)
- 서브 에이전트: `playwright:sync:bg` (18초 주기 콘솔 회귀 감시)

### 5-에이전트 (풀 스택)
- 풀 시작: `npm run subagents5:bg`
- 상태 확인: `npm run subagents5:status`
- 워치 모드: `npm run subagents5:watch`
- 중지: `npm run subagents5:stop`
- 에이전트: server_guard, console_guard, trend_guard, mcp_guard, reasoning_coordinator

### 공통
- 충돌 방지: Playwright 실행은 `scripts/run-playwright-local.cjs` 락(`scripts/.playwright-run.lock`)으로 직렬화된다.

## 14. 폴리싱 청소
- 런타임 잔여물/임시 진단 파일 청소: `npm run clean:polish`
- 동작 범위:
  - 죽은 PID 파일/헬스 파일 정리
  - stale Playwright 락 정리
  - 루트 임시 biome 진단 파일 정리

## 15. 목표 플래너 운영
- 단일 기준 문서: `docs/master-execution-board.md`
- 사이클 시작 시 필수:
  - `npm run mcp:check`
  - `npm run test:e2e:trend:rapid`
- 사이클 종료 시 필수:
  - `npm run typecheck`
  - `npm run lint:changed`
  - `npm run test:e2e:console`
- 보고는 항상 `변경사항 → 이유 → 잔존 리스크` 3줄 요약으로 남긴다.
