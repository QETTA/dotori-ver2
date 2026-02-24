# R26 — 백엔드·프론트 안정성 패치 (4 에이전트)
> 설계일: 2026-02-24
> 검증 베이스라인: build ✅ (47 pages), test ✅ (126/126), engine ✅ (79/79), lint 0 errors, tsc ✅

---

## 검수 결과 — 확인된 실제 버그 (우선순위 순)

| 우선 | 버그 | 파일 | 영향 |
|------|------|------|------|
| **P0-1** | 채팅 스트림 AbortController 없음 | useChatStream.ts L102 | 이탈 시 메모리 누수 + state 경고 |
| **P0-2** | 채팅 메시지 ID `Date.now()` 충돌 | useChatStream.ts L82,93 | 빠른 전송 시 메시지 소실 |
| **P0-3** | 좋아요 에러 시 낙관적 업데이트 미롤백 | community/page.tsx L213-251 | UI 불일치 |
| **P1-1** | 스트림 unmount 가드 없음 | useChatStream.ts L118+ | React state 경고 |
| **P1-2** | 커뮤니티 fetchPosts unmount 가드 없음 | community/page.tsx L157-206 | React state 경고 |
| **P2-1** | 미매핑 actionId raw 전송 | chat/page.tsx L424 | 예측 불가 UX |

### 빌드 복원 핫픽스 (이미 적용됨, 에이전트 수정 불필요)
- chat/page.tsx L393: `messages` prop 누락 → 추가됨
- blocks.ts L294: `action: "explore"` (무효 ActionType) → `"register_interest"` 복원
- recommendation.ts L41: `action: "broaden"` (무효 ActionType) → `"compare"` 복원

### 안전 확인 (수정 불필요)
- ✅ apiFetch: prod에서 throw (localhost 폴백 없음)
- ✅ response envelope: `{ data: {} }` 일관
- ✅ quick_replies: snake_case + 방어적 파싱
- ✅ rate-limit: 서버 429 + 클라이언트 감지
- ✅ `"use client"` 누락: 0건
- ✅ suppressHydrationWarning: 전부 적용됨

---

## SHARED_RULES

```
1. SCOPE 밖 파일 수정 금지.
2. API 계약(response envelope, field naming) 변경 금지.
3. ActionType 유니온 타입 변경 금지 (기존: register_interest|apply_waiting|set_alert|compare|generate_checklist|generate_report).
4. 클라이언트 라우팅은 button.id 기반 (button.action 아님). action 필드는 유효한 ActionType만.
5. 산출물: git diff + 요약 7줄 + 테스트 커맨드.
6. 빌드: env -u NODE_ENV npm run build (0 errors, 47 pages)
7. 테스트: npm test (126+ pass)
8. any 사용 금지 → unknown + 타입 가드.
9. 에러 UI: 사용자 메시지 + 복구 액션 제공.
10. framer-motion 금지 → motion/react만.
```

---

## Agent 1: 채팅 스트림 안정성 (P0-1 + P0-2 + P1-1)

```
[CONTEXT]
useChatStream.ts에서:
(1) fetch()에 AbortController가 없어 페이지 이탈 시 스트림이 계속 읽힘 → 메모리 누수.
    참고: useFacilities.ts(같은 프로젝트)에 AbortController 올바르게 적용된 패턴 존재.
(2) 메시지 ID가 `user-${Date.now()}`/`assistant-${Date.now()}`로 생성되어 1ms 내 재전송 시 충돌.
(3) 스트림 읽기 중 setMessages 호출에 unmount 가드 없음 (history fetch에는 isMounted 패턴 있음).

[GOAL]
채팅 스트림 3대 안정성 버그 수정: AbortController + 고유 ID + abort 시 graceful exit.

[NON-GOALS]
- 스트림 API 응답 포맷 변경 없음
- UI 레이아웃 변경 없음
- rate-limit 자동 재시도 (이번 스코프 아님)

[AC]
1. fetch()에 AbortController.signal 연결
2. 이전 진행 중 스트림을 abort한 후 새 스트림 시작 (중복 전송 방지)
3. 메시지 ID를 `${role}-${Date.now()}-${Math.random().toString(36).slice(2,7)}` 형식으로 충돌 방지
4. catch에서 AbortError를 별도 처리 (무시, 에러 메시지 표시 안 함)
5. abort 후에는 setMessages/setIsLoading 호출 스킵
6. useChatStream에서 cleanup 함수 반환 또는, 호출부(chat/page.tsx)에서 useEffect return으로 abort
7. npm run build 0 errors, npm test 126+ pass

[SCOPE FILES]
1. src/components/dotori/chat/useChatStream.ts — 주 수정 대상
2. src/app/(app)/chat/page.tsx — cleanup useEffect 추가만 (L393 부근, messages prop 이미 수정됨)

[구현 가이드]

### useChatStream.ts — abortControllerRef 추가
L49 뒤에:
```typescript
const abortControllerRef = useRef<AbortController | null>(null);
```

### useChatStream.ts — sendMessage 내 controller 연결
L101 (try 시작) 직전에:
```typescript
abortControllerRef.current?.abort();
const controller = new AbortController();
abortControllerRef.current = controller;
```

L102 fetch 옵션에 signal 추가:
```typescript
const response = await fetch("/api/chat/stream", {
  method: "POST",
  headers: { ... },
  body: JSON.stringify({ ... }),
  signal: controller.signal,
});
```

### useChatStream.ts — 메시지 ID 유니크화
L82: `id: \`user-${Date.now()}\`` → `id: \`user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}\``
L93: `id: \`assistant-${Date.now()}\`` → `id: \`assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}\``

### useChatStream.ts — abort 가드
스트림 while 루프 내부 시작에:
```typescript
if (controller.signal.aborted) break;
```

catch 블록 최상단에:
```typescript
if (error instanceof DOMException && error.name === "AbortError") {
  return;
}
```

setIsLoading(false) 호출 전에 abort 체크:
```typescript
if (!controller.signal.aborted) {
  setIsLoading(false);
}
```

### useChatStream.ts — cleanup 반환
```typescript
const cleanup = useCallback(() => {
  abortControllerRef.current?.abort();
}, []);

return { isLoading, sendMessage, retryLastMessage, cleanup };
```

### chat/page.tsx — cleanup 연결
L393 부근 useChatStream 호출에 cleanup 추가:
```typescript
const { isLoading, retryLastMessage, sendMessage, cleanup } = useChatStream({ ... })

useEffect(() => {
  return () => cleanup();
}, [cleanup]);
```

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
grep -n "Date\.now()" src/components/dotori/chat/useChatStream.ts
# → 2 matches (ID 생성), 각각 Math.random 접미사 포함 확인
grep -n "AbortController\|signal" src/components/dotori/chat/useChatStream.ts
# → 3+ matches
```

---

## Agent 2: 커뮤니티 상태 관리 수정 (P0-3 + P1-2)

```
[CONTEXT]
(1) toggleLike: API 에러 시 낙관적 업데이트(setLikedPosts, setPosts)를 롤백하지 않고 fetchPosts(1)만 호출.
    refetch가 완료되기 전 UI가 일관되지 않은 상태로 남음.
(2) fetchPosts: 컴포넌트 unmount 후에도 setPosts/setIsLoading 호출 → React 경고.

[GOAL]
좋아요 에러 롤백 + fetch unmount 안전성 확보.

[NON-GOALS]
- GPS 인증 플로우 변경 없음 (finally에서 isVerifying 리셋 정상 동작)
- 레이아웃 변경 없음
- API 변경 없음

[AC]
1. toggleLike catch: 낙관적 업데이트 즉시 롤백 (isLiked 기준으로 반대 동작)
2. catch에서 fetchPosts(1) 제거 (롤백으로 충분, 불필요한 refetch 제거)
3. fetchPosts에 isMounted 가드 또는 AbortController 적용
4. 기존 IntersectionObserver 무한스크롤 정상 동작
5. npm run build 0 errors, npm test 126+ pass

[SCOPE FILES]
1. src/app/(app)/community/page.tsx — L213-251 (toggleLike), L157-206 (fetchPosts)

[구현 가이드]

### toggleLike 롤백 (L240-241)

현재:
```typescript
} catch {
  fetchPosts(1)
}
```

변경:
```typescript
} catch {
  // 낙관적 업데이트 롤백
  if (isLiked) {
    // DELETE 실패 → liked 복원
    setLikedPosts((prev) => new Set(prev).add(postId))
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)),
    )
  } else {
    // POST 실패 → liked 해제
    setLikedPosts((prev) => {
      const next = new Set(prev)
      next.delete(postId)
      return next
    })
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p)),
    )
  }
}
```

### fetchPosts unmount 가드

useEffect에서 fetchPosts를 호출하는 부분(L206-211 부근)에 isMounted 패턴 적용:
```typescript
useEffect(() => {
  let isMounted = true
  const load = async () => {
    // fetchPosts 내부 로직 인라인 또는
    // fetchPosts에 signal 파라미터 추가
    if (isMounted) {
      fetchPosts(1)
    }
  }
  load()
  return () => { isMounted = false }
}, [fetchPosts])
```

또는 fetchPosts에 AbortController 파라미터 추가하는 방식도 가능.
(구체적 구현은 에이전트 재량 — AC 충족이면 OK)

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
# 수동: 좋아요 → 네트워크 차단 → 좋아요 상태 원복 확인
```

---

## Agent 3: 클라이언트 액션 핸들러 방어 (P2-1)

```
[CONTEXT]
chat/page.tsx handleBlockAction (L390-427)에서:
- actionRoutes[actionId]로 네비게이션 체크
- quickActionMap[actionId]로 채팅 메시지 체크
- 둘 다 매칭 안 되면 L424에서 sendMessage(actionId) → raw 문자열 전송

이러면 미정의 actionId("unknown_type")가 토리챗에 그대로 전송되어 예측 불가 응답.

[GOAL]
미매핑 액션을 안전하게 처리 + 엔진 액션 정합성 테스트 추가.

[NON-GOALS]
- quickActionMap/actionRoutes 확장 없음
- 새 액션 타입 추가 없음
- UI 변경 없음

[AC]
1. handleBlockAction L424: raw sendMessage(actionId) → console.warn + 무시 (또는 사용자 toast)
2. 엔진 블록 테스트: 모든 응답 블록 button.id가 클라이언트에서 처리 가능한 값인지 테스트
3. npm run build 0 errors, npm test 126+ pass

[SCOPE FILES]
1. src/app/(app)/chat/page.tsx — L419-424
2. src/__tests__/engine-action-consistency.test.ts — 이미 존재 (1 test), 보강

[구현 가이드]

### chat/page.tsx L419-424

현재:
```typescript
if (quickActionMap[actionId]) {
  sendMessage(quickActionMap[actionId])
  return
}

sendMessage(actionId)
```

변경:
```typescript
if (quickActionMap[actionId]) {
  sendMessage(quickActionMap[actionId])
  return
}

// 미매핑 액션: raw 문자열 전송 방지
if (process.env.NODE_ENV === 'development') {
  console.warn(`[chat] Unmapped block action: "${actionId}"`)
}
```

### engine-action-consistency.test.ts 보강

기존 파일에 테스트 케이스 추가:
```typescript
it('all engine response button ids should be client-mappable', () => {
  const clientKnownIds = new Set([
    // actionRoutes (navigation)
    'explore', 'waitlist', 'interests', 'community', 'settings', 'login', 'import',
    // quickActionMap (chat messages)
    'recommend', 'compare', 'strategy', 'generate_report', 'generate_checklist', 'checklist', 'broaden',
    // special
    'retry',
  ])

  // 엔진에서 생성 가능한 button id 목록 (blocks.ts + recommendation.ts에서 추출)
  const engineButtonIds = ['recommend', 'compare', 'strategy', 'explore', 'checklist', 'broaden']

  for (const id of engineButtonIds) {
    expect(
      clientKnownIds.has(id),
      `Engine button id "${id}" is not mapped in client`
    ).toBe(true)
  }
})
```

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
npx vitest run src/__tests__/engine-action-consistency.test.ts
```

---

## Agent 4: ActionType 아키텍처 정리 + 네비게이션 타입 분리 (P2 구조)

```
[CONTEXT]
현재 ActionButton.action 필드는 ActionType(쓰기 액션)으로 타입 제한됨.
하지만 실제 버튼 중 일부는 순수 네비게이션 용도(explore→/explore).
클라이언트는 button.id로 라우팅하므로 action 필드를 무시하지만,
엔진에서 의미 없는 값("register_interest")을 넣어야 하는 불일치.

해결: ActionButton.action을 optional로 만들거나 NavigationType을 추가.

[GOAL]
네비게이션 전용 버튼이 의미 있는 action 값을 강제당하지 않도록 타입 정리.

[NON-GOALS]
- 클라이언트 라우팅 로직 변경 없음 (button.id 기반 유지)
- API 계약 변경 없음

[AC]
1. ActionButton.action을 optional(`action?: ActionType`)로 변경
2. 네비게이션 전용 버튼(id: "explore", "broaden")에서 action 필드 제거
3. response-shape.ts sanitizeActionType에서 action 없는 버튼 허용
4. 기존 엔진 테스트 79개 전부 통과
5. npm run build 0 errors, npm test 126+ pass

[SCOPE FILES]
1. src/types/dotori.ts — L178-181 (ActionButton interface)
2. src/lib/engine/response-builder/blocks.ts — L291-296 (explore 버튼)
3. src/lib/engine/response-builder/recommendation.ts — L38-43 (broaden 버튼)
4. src/lib/chat/response-shape.ts — L247 (sanitizeActionType 호출부)

[구현 가이드]

### types/dotori.ts — ActionButton.action optional화
```typescript
// 현재:
export interface ActionButton {
  id: string;
  label: string;
  action: ActionType;
  variant?: "primary" | "outline" | "ghost";
}

// 변경:
export interface ActionButton {
  id: string;
  label: string;
  action?: ActionType;
  variant?: "primary" | "outline" | "ghost";
}
```

### blocks.ts — 네비게이션 버튼 action 제거
L291-296:
```typescript
// 현재:
{
  id: "explore",
  label: "시설 탐색하기",
  action: "register_interest",  // 의미 없는 placeholder
  variant: "outline",
}

// 변경:
{
  id: "explore",
  label: "시설 탐색하기",
  variant: "outline",
}
```

### recommendation.ts — broaden 버튼 action 제거
L38-43:
```typescript
// 현재:
{
  id: "broaden",
  label: "전체 검색",
  action: "compare",  // 의미 없는 placeholder
  variant: "outline",
}

// 변경:
{
  id: "broaden",
  label: "전체 검색",
  variant: "outline",
}
```

### response-shape.ts — action optional 허용
L247 부근 sanitizeActionType 호출을 optional chaining으로:
```typescript
// 현재:
action: sanitizeActionType(buttonRecord.action),

// 변경:
...(buttonRecord.action != null && { action: sanitizeActionType(buttonRecord.action) }),
```

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
npm run test:engine  # 79 pass
npx vitest run src/__tests__/engine-action-consistency.test.ts
# 검증: ActionButton에 action이 없는 버튼도 빌드/테스트 통과
```

---

## 빌드 검증 (wave 완료 후)

```bash
cd /home/sihu2/dotori-ver2-qetta/dotori-app

# 전체 게이트
env -u NODE_ENV npm run build    # 47 pages, 0 errors
npm test                          # 126+ pass
npm run test:engine               # 79 pass
npm run lint                      # 0 errors
npm run typecheck                 # 0 errors

# 특정 검증
grep -n "Date\.now()\"" src/components/dotori/chat/useChatStream.ts
# → 0 matches (랜덤 접미사 포함으로 변경됨)

grep -n "AbortController" src/components/dotori/chat/useChatStream.ts
# → 1+ matches

grep -n "sendMessage(actionId)" src/app/\(app\)/chat/page.tsx
# → 0 matches (raw fallback 제거됨)
```

---

## 에이전트 파일 소유권 + 실행 순서

| Agent | 파일 | 우선순위 |
|-------|------|---------|
| **1** | useChatStream.ts, chat/page.tsx (cleanup만) | P0 |
| **2** | community/page.tsx | P0 |
| **3** | chat/page.tsx (handleBlockAction만), engine-action-consistency.test.ts | P2 |
| **4** | types/dotori.ts, blocks.ts, recommendation.ts, response-shape.ts | P2 |

### 실행 순서 (의존성 기반)

```
Wave 1 (병렬): Agent 1 + Agent 2
  → 파일 충돌 없음, 각각 useChatStream.ts / community/page.tsx 담당
  → tsc 검증

Wave 2 (순차): Agent 4 → Agent 3
  → Agent 4가 ActionButton 타입 변경 → Agent 3이 변경된 타입 기준으로 테스트 작성
  → Agent 3은 chat/page.tsx L424만 수정 (Agent 1의 cleanup useEffect와 100줄+ 떨어짐)
  → tsc + 전체 테스트 검증
```

```bash
# codex-wave.sh 사용 시:
./scripts/codex-wave.sh /tmp/r26-tasks.txt --wave=2
# Wave 1: Agent 1, 2 → tsc → Wave 2: Agent 4, 3 → full test
```
