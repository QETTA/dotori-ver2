# Backend Error Contract (API Error Spec)

> Repo scope: QETTA/dotori-ver2 (main)  
> 목적: 백엔드 에러 응답을 항상 동일한 포맷/코드/상태로 고정하여  
> 클라이언트 처리 단순화, 장애 분석 용이성(관측가능성), 보안(민감정보 노출 방지)을 달성한다.
> 현재 누락 스냅샷: `docs/ENGINE_ERROR_GAP_REPORT_2026-02-23.md`

---

## 0. 기본 원칙

- 에러 응답은 항상 JSON이며, 항상 동일한 최상위 스키마를 가진다.
- 서버 로그에는 충분한 디버그 정보(stack/context)를 남기되, 응답에는 민감정보를 포함하지 않는다.
- 에러 코드는 변경하지 않는 것이 원칙이며(클라이언트 계약), 추가는 가능하되 제거/의미 변경은 버전 정책을 따른다.

---

## 1. 공통 에러 응답 스키마 (고정)

### 1.1 Response Body (JSON)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "fields": [{ "path": "email", "reason": "invalid_format" }]
    },
    "requestId": "req_01HXYZ..."
  }
}
```

### 1.2 필드 정의

- `error.code` (string, 필수): `SCREAMING_SNAKE_CASE`, 아래 표준 에러 코드 목록 중 하나
- `error.message` (string, 필수): 사용자 친화적 메시지(민감정보 포함 금지)
- `error.details` (object | null, 선택): 에러별 추가 정보(코드별 details 규칙 준수)
- `error.requestId` (string, 필수): 요청 상관관계 ID(correlation), 서버가 매 요청 생성/전파

금지: 응답 body에 stack trace, 내부 파일 경로, SQL, 토큰/비번, 개인정보(필요 시 마스킹)

---

## 2. HTTP 상태코드 ↔ 에러 코드 매핑 (고정 규칙)

### 2.1 상태코드 규칙

- `4xx`: 클라이언트 원인(입력/인증/권한/리소스/충돌/레이트리밋)
- `5xx`: 서버 원인(내부 오류/의존성 장애/타임아웃)

### 2.2 표준 매핑 테이블 (기본)

| HTTP Status | error.code             | 의미                      | retryable | 기본 message 가이드     |
| ----------: | ---------------------- | ------------------------- | :-------: | ----------------------- |
|         400 | VALIDATION_ERROR       | 요청 형식/값 오류         |     N     | Invalid request         |
|         401 | UNAUTHENTICATED        | 인증 실패/토큰 누락/만료  |     N     | Authentication required |
|         403 | FORBIDDEN              | 권한 없음/접근 불가       |     N     | Access denied           |
|         404 | NOT_FOUND              | 리소스 없음               |     N     | Resource not found      |
|         409 | CONFLICT               | 상태 충돌/중복/버전 충돌  |   상황    | Conflict                |
|         413 | PAYLOAD_TOO_LARGE      | 요청 본문 과대            |     N     | Payload too large       |
|         415 | UNSUPPORTED_MEDIA_TYPE | 미지원 Content-Type 등    |     N     | Unsupported media type  |
|         422 | UNPROCESSABLE_ENTITY   | 형식은 맞지만 처리 불가   |     N     | Cannot process request  |
|         429 | RATE_LIMITED           | 요청 과다                 |     Y     | Too many requests       |
|         500 | INTERNAL_ERROR         | 내부 예외/알 수 없는 오류 |   상황    | Internal server error   |
|         502 | UPSTREAM_BAD_GATEWAY   | 업스트림 비정상 응답      |     Y     | Upstream error          |
|         503 | SERVICE_UNAVAILABLE    | 일시적 장애/점검          |     Y     | Service unavailable     |
|         504 | UPSTREAM_TIMEOUT       | 업스트림 타임아웃         |     Y     | Upstream timeout        |

`retryable`은 클라이언트 자동 재시도 고려 여부 가이드다.

---

## 3. 표준 에러 코드 목록 (고정)

### 3.1 공통 코드 (최소 세트)

- VALIDATION_ERROR
- UNAUTHENTICATED
- FORBIDDEN
- NOT_FOUND
- CONFLICT
- RATE_LIMITED
- PAYLOAD_TOO_LARGE
- UNSUPPORTED_MEDIA_TYPE
- UNPROCESSABLE_ENTITY
- INTERNAL_ERROR
- UPSTREAM_BAD_GATEWAY
- UPSTREAM_TIMEOUT
- SERVICE_UNAVAILABLE

### 3.2 도메인 코드(옵션, 확장 규칙)

도메인별 접두어를 붙여 확장한다. 예:

- ENGINE_INVALID_STATE
- ENGINE_RULE_VIOLATION
- ENGINE_RESOURCE_EXHAUSTED
- USER_ALREADY_EXISTS
- ORDER_OUT_OF_STOCK

규칙:

- 의미가 바뀌는 변경 금지
- 새 코드 추가 시 반드시:
  - 매핑 HTTP status 결정
  - `details` 스키마 정의
  - 에러 계약 테스트(Contract test) 추가

---

## 4. 코드별 details 규칙 (고정 템플릿)

### 4.1 VALIDATION_ERROR

```json
{
  "fields": [
    {
      "path": "fieldName",
      "reason": "required|invalid_format|out_of_range",
      "expected": "...",
      "received": "..."
    }
  ]
}
```

### 4.2 NOT_FOUND

```json
{
  "resource": "User|Order|...",
  "id": "..."
}
```

### 4.3 CONFLICT

```json
{
  "reason": "duplicate|version_conflict|state_conflict",
  "currentState": "...",
  "expectedState": "..."
}
```

### 4.4 RATE_LIMITED

```json
{
  "retryAfterSeconds": 10
}
```

### 4.5 UPSTREAM\_\* / SERVICE_UNAVAILABLE

```json
{
  "upstream": "service-name",
  "operation": "GET /path or logical operation",
  "hint": "timeout|bad_gateway|unavailable"
}
```

### 4.6 INTERNAL_ERROR

`details`는 기본적으로 비워도 된다.  
필요 시 requestId로 서버 로그를 조회하도록 유도하고 내부 정보를 details에 넣지 않는다.

---

## 5. 예시 응답(고정)

### 5.1 Validation Error (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "fields": [
        { "path": "email", "reason": "invalid_format" },
        {
          "path": "password",
          "reason": "out_of_range",
          "expected": ">=8",
          "received": 3
        }
      ]
    },
    "requestId": "req_01HXYZ..."
  }
}
```

### 5.2 Unauthenticated (401)

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "details": null,
    "requestId": "req_01HXYZ..."
  }
}
```

### 5.3 Forbidden (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied",
    "details": null,
    "requestId": "req_01HXYZ..."
  }
}
```

### 5.4 Not Found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { "resource": "User", "id": "123" },
    "requestId": "req_01HXYZ..."
  }
}
```

### 5.5 Conflict (409)

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Conflict",
    "details": {
      "reason": "version_conflict",
      "currentState": "v5",
      "expectedState": "v4"
    },
    "requestId": "req_01HXYZ..."
  }
}
```

### 5.6 Rate Limited (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": { "retryAfterSeconds": 10 },
    "requestId": "req_01HXYZ..."
  }
}
```

### 5.7 Internal Error (500)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error",
    "details": null,
    "requestId": "req_01HXYZ..."
  }
}
```

---

## 6. 서버 구현 규칙(필수)

### 6.1 중앙 에러 핸들러(또는 공통 예외 처리)

- 모든 예외는 중앙에서 잡아 위 스키마로 변환한다.
- 예상 가능한 도메인 에러는 INTERNAL_ERROR로 뭉개지 않고 적절한 4xx/422로 매핑한다.
- requestId를 항상 생성/전파한다(로그/응답/필요 시 헤더).

### 6.2 로깅 규칙

모든 에러 로그에:

- requestId
- error.code
- route/operation
- 서버 내부 stack trace
- 가능하면 userId/tenantId (민감정보 아닌 범위)

민감정보 마스킹:

- Authorization 헤더/토큰/비번/주민번호/카드번호 등 로그 금지(또는 마스킹)

---

## 7. 계약 테스트(권장/강제에 가까움)

최소 테스트 항목:

- [ ] VALIDATION_ERROR가 `400` + `fields` 형태로 내려온다.
- [ ] 인증 실패는 `401/UNAUTHENTICATED`
- [ ] 권한 실패는 `403/FORBIDDEN`
- [ ] 리소스 없음은 `404/NOT_FOUND`
- [ ] 내부 예외는 `500/INTERNAL_ERROR` + 민감정보 미노출
- [ ] `requestId`가 항상 존재한다.

---

## 8. 변경 정책(버전/호환성)

- `error.code` 의미 변경 금지
- 새 `error.code` 추가는 허용(문서/테스트/매핑 필수)
- 필요 시 API 버전별로 에러 계약도 버전화한다(`v1`/`v2`)
