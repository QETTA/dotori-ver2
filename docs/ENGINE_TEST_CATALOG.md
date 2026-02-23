# Engine Test Catalog & Checklist

> Repo scope: QETTA/dotori-ver2 (main)  
> 목적: 엔진(Engine) 핵심 로직의 정확성/결정성/회귀 방지/플레이키 제거/운영 안정성을 테스트로 고정한다.
> 현재 누락 스냅샷: `docs/ENGINE_ERROR_GAP_REPORT_2026-02-23.md`

---

## 0. 용어/범위 정의

### Engine(엔진) 정의

- 이 문서에서 엔진은 비즈니스 규칙/도메인 로직/핵심 계산/상태 전이(워크플로우)를 수행하는 핵심 모듈이다.
- HTTP 라우트/컨트롤러/프레임워크 레이어가 아니라 핵심 규칙이 있는 레이어가 대상이다.

### 테스트 레벨

- `Engine Unit`: 순수 로직(입력 -> 출력), 외부 IO 없음
- `Engine Integration`: DB/큐/파일/외부 호출 포함(가능하면 mock/stub)
- `Engine Contract`: 엔진 반환 결과/에러 코드/상태 전이를 계약으로 고정
- `Engine Regression`: 버그 재현 -> 수정 -> 회귀 테스트로 고정
- `Engine Performance Guard`: 과도하지 않은 상한선/상대 비교로 회귀 방지(필요 시)

---

## 1. 엔진 테스트 Definition of Done (DoD)

아래 조건을 만족하면 엔진 테스트 품질 확보로 간주한다.

- [ ] 엔진 테스트가 CI에서 안정적으로 통과(플레이키 최소화)
- [ ] 랜덤/시간/외부 IO 의존이 제거되거나, 테스트에서 통제됨(결정성 확보)
- [ ] 핵심 유즈케이스별 최소 세트(정상/경계/오류/상태전이) 존재
- [ ] 중요한 버그 수정이 회귀 테스트로 고정됨
- [ ] 실패 시 원인 파악 가능한 assertion/에러 메시지 구조(진단성)
- [ ] (가능하면) 커버리지 리포트가 존재하고 증가 추세 유지

---

## 2. 테스트 안정성(플레이키 제거) 체크리스트 (P0)

### 2.1 결정성(Determinism)

- [ ] 랜덤 사용 시 시드 고정(seed)
- [ ] 시간 의존 로직은 clock/time mocking 또는 고정 시간 주입
- [ ] 타이머(setTimeout/sleep) 기반 테스트 최소화, 이벤트/조건 기반으로 대체
- [ ] 순서 비결정적 요소는 deterministic ordering 보장

### 2.2 격리(Isolation)

- [ ] 전역 상태/싱글톤/캐시 초기화 훅 제공
- [ ] 테스트 간 DB/포트/파일경로/환경변수 공유 없음
- [ ] 테스트 임시 리소스 종료 시 cleanup
- [ ] 병렬 실행 충돌 방지(고유 포트/스키마/temp dir)

### 2.3 외부 의존 통제

- [ ] 네트워크 호출은 기본 mock/stub
- [ ] DB 필요 시 test DB 또는 in-memory 대체
- [ ] 외부 API timeout/실패/재시도 시나리오 포함

### 2.4 flaky-check

- [ ] 동일 테스트 N회 반복 실행 스크립트 존재(가능하면)
- [ ] flaky 발생 시 재현 조건/원인/해결 내역 문서화

---

## 3. 엔진 유즈케이스별 필수 테스트 세트 (P1)

각 유즈케이스(예: `CalculateX`, `GeneratePlan`, `ApplyRules`, `ResolveConflicts`)마다 아래 최소 세트를 갖춘다.

### 3.1 정상(Happy Path)

- [ ] 대표 입력 1~3개 기대 결과 검증
- [ ] 출력 구조/필드/불변 조건(invariant) 검증
- [ ] 부작용(상태 변경/저장/이벤트) 발생 여부 검증

### 3.2 경계(Boundary)

- [ ] 빈 값/최소 값/최대 값
- [ ] 대용량 입력(리스트 길이/문자열 길이/payload)
- [ ] 특수문자/유니코드/이모지/한글/공백/줄바꿈
- [ ] 날짜/시간 경계(월말/윤년/타임존/DST 등 해당 시)
- [ ] 정렬/동점 처리(동일 점수/동일 우선순위)

### 3.3 오류(Error Path)

- [ ] 잘못된 입력 타입/형식/범위(Validation)
- [ ] 리소스 없음(Not Found)
- [ ] 충돌(Conflict)/중복 요청/멱등성 위반
- [ ] 권한/상태 불가(Forbidden/Invalid State)
- [ ] 내부 오류 -> 표준 에러 코드 매핑 확인

규칙: 추가하는 테스트의 최소 30%는 오류 경로를 다룬다.

### 3.4 상태 전이(State Transition) / 멱등성(Idempotency)

- [ ] 초기 -> 중간 -> 완료(또는 실패) 전이 검증
- [ ] 동일 요청 반복 시 결과 안정성(멱등 필요 시)
- [ ] 재시도(retry) 시 중복 처리/중복 저장 방지

### 3.5 동시성/레이스(해당 시)

- [ ] 동일 자원 동시 업데이트 시 일관성 보장
- [ ] 락/트랜잭션/버전필드(낙관적 락) 의도대로 동작

---

## 4. 테스트 데이터 전략(중복 제거)

- [ ] fixtures: 정적 테스트 데이터(파일/상수)
- [ ] builders/factories: 유즈케이스별 입력 생성기(기본값 + override)
- [ ] golden outputs: 결정적 출력 고정(필요 시)
- [ ] snapshot 과용 금지(변경 비용 큰 영역에만)

---

## 5. 케이스 카탈로그(추적 가능한 ID 체계)

### 5.1 ID 규칙

- 형식: `ENG-{CATEGORY}-{NNN}`
- CATEGORY 예:
  - `VAL` (validation)
  - `OK` (happy path)
  - `BND` (boundary)
  - `ERR` (error mapping)
  - `ST` (state transition)
  - `CONC` (concurrency)
  - `PERF` (performance guard)
  - `REG` (regression)

### 5.2 케이스 카탈로그 표(템플릿)

아래 표를 유즈케이스 단위로 복제해서 채운다.

#### Usecase: `<USECASE_NAME>`

- 위치: `<path/to/engine/module>`
- 설명: <무슨 일을 하는지 1~2줄>
- 입력: <핵심 입력 요약>
- 출력/불변조건: <invariants>
- 부작용: <DB write / event / cache 등>

| Case ID      | Priority | Scenario            | Input Variants | Expected            | Notes/Fixtures       |
| ------------ | -------: | ------------------- | -------------- | ------------------- | -------------------- |
| ENG-OK-001   |       P1 | 대표 입력 정상 동작 | 기본 입력      | 기대 결과 A         | builder: makeX()     |
| ENG-BND-001  |       P1 | 빈 값/최소값        | empty/min      | 오류 또는 기본 처리 | details 확인         |
| ENG-VAL-001  |       P0 | 형식 오류           | invalid type   | VALIDATION_ERROR    | error contract 준수  |
| ENG-ERR-001  |       P0 | 내부 예외 매핑      | throws         | INTERNAL_ERROR      | stack 응답 노출 금지 |
| ENG-ST-001   |       P1 | 상태 전이           | init -> done   | 전이 규칙 유지      | state machine        |
| ENG-CONC-001 |       P2 | 동시 업데이트       | 2 parallel     | 일관성 유지         | race 재현            |
| ENG-REG-001  |       P0 | 버그 #<id> 회귀     | repro input    | 재발 방지           | 링크/이슈            |

---

## 6. 엔진 테스트 필수 커맨드 문서화 항목

- [ ] 엔진 테스트 실행: `npm run test:engine`
- [ ] 전체 테스트: `npm run test`
- [ ] flaky-check: `npm run test:engine:flaky` (가능하면)
- [ ] 커버리지: `npm run test:engine:cov` (가능하면)
- [ ] CI one-shot: `npm run ci` (또는 `make ci` / `scripts/ci.sh`)

---

## 7. 체크리스트(리뷰 시 사용)

- [ ] 새 테스트는 결정적이다(시간/랜덤/IO 통제)
- [ ] 오류 경로 테스트가 충분하다(>=30%)
- [ ] 회귀 테스트가 포함되어 있다(버그 수정 시)
- [ ] 테스트 유틸/빌더가 정리되어 중복이 줄었다
- [ ] 실패 시 메시지가 원인 파악에 도움 된다
- [ ] 로컬과 CI 커맨드가 동일하다
