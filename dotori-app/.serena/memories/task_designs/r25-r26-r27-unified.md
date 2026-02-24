# R25+R26+R27 통합 — 폰트·워딩·백엔드·디자인에셋 (5 에이전트)
> 설계일: 2026-02-24 | 교차검증 완료
> 베이스라인: build ✅ (47 pages), test ✅ (126/126), engine ✅ (79/79), lint 0, tsc ✅

---

## 교차검증 감사 — 이미 완료된 항목 (실행 불필요)

### R25 완료 (16/19 AC 충족)
| 원본 Agent | 항목 | 상태 |
|-----------|------|------|
| A1 개발용어 | FacilityCard "TO→빈자리", "수용률→정원 현황" (L134,147,306,320) | ✅ 적용됨 |
| A1 개발용어 | page.tsx "NBA 기반→이동 판단 기준" (L455), 설명문 교체 (L318) | ✅ 적용됨 |
| A1 개발용어 | landing "실시간 빈자리 변화 감지", "교사 교체 현황 알림" (L21,22) | ✅ 적용됨 |
| A2 톤통일 | waitlist 관료적→따뜻, onboarding 스킵 버튼, settings 갱신일→결제일 | ✅ grep 잔류 0건 |
| A2 톤통일 | community "입주 이전→이동", BottomTabBar "MY→마이" | ✅ 적용됨 |
| A3 폰트 | SplashScreen fontFamily 인라인 제거 → className="font-sans" | ✅ 적용됨 |
| A3 폰트 | loading.css → font-family: var(--font-sans), 0.8125rem, CSS변수 색상 | ✅ 적용됨 |
| A4 tracking | tracking-\[0.14em\] 등 5곳 → tracking-wide/wider 토큰화 | ✅ 0건 잔류 |

### R26 완료 (코드 수준 4/6 버그 수정됨)
| 원본 Agent | 항목 | 상태 |
|-----------|------|------|
| A1 P0-1 | useChatStream AbortController + signal 연결 | ✅ activeRequestRef + controller.signal |
| A1 P0-2 | 메시지 ID 충돌 → createMessageId (Date.now + sequence) | ✅ messageSequenceRef 적용 |
| A1 P1-1 | 스트림 unmount 가드 | ✅ isMountedRef + patchStreamingMessage 가드 |
| A2 P0-3 | 좋아요 에러 롤백 | ✅ originalLikeCount 복원 + isLiked 기반 rollback |
| A2 P1-2 | fetchPosts unmount 가드 | ✅ mountedRef + fetchPostsControllerRef.abort() |
| A3 P2-1 | 미매핑 actionId raw 전송 방지 | ✅ console.warn + sendMessage 제거 |

### 안전 확인 (수정 불필요)
- ✅ apiFetch: prod throw (localhost 폴백 없음)
- ✅ response envelope: `{ data: {} }` 일관
- ✅ quick_replies: snake_case + 방어적 파싱
- ✅ rate-limit: 서버 429 + 클라이언트 감지
- ✅ MapEmbed: `<div>` + Kakao SDK 방식 (iframe 아님), role="region" aria-label 적용
- ✅ SplashScreen: font-sans 적용, inline fontFamily 제거
- ✅ loading.css: CSS 변수 전환 완료
- ✅ tracking-\[\] 커스텀 값 0건

---

## 잔류 이슈 요약 — 이번 통합 실행 대상

| # | 출처 | 이슈 | 영향도 | Agent |
|---|------|------|--------|-------|
| 1 | R25 | tokens.ts:148 "TO 있음" 개발용어 잔류 | P0 | 1 |
| 2 | R25 | utils.ts:35 "TO 있음" 개발용어 잔류 | P0 | 1 |
| 3 | R25 | onboarding.spec.ts:9 테스트 텍스트 불일치 | P0 | 1 |
| 4 | R26 | ActionButton.action 필수 (네비게이션 버튼에 불필요 placeholder 강제) | P2 | 4 |
| 5 | R27 | DsButton 미활용 — 18/20 파일 직접 Catalyst Button import | P1 | 2,3 |
| 6 | R27 | brand-copy.ts 커버리지 7% (15/200+ 문자열) | P2 | 5 |

---

## SHARED_RULES (모든 에이전트 공통)

```
1. SCOPE 밖 파일 수정 금지.
2. 한국어 워딩 수정 시 기존 JSX 구조/className 변경 금지 — 텍스트만 교체.
3. DsButton import: `import { DsButton } from "@/components/ds/DsButton"`.
4. DsButton 매핑: color="dotori" → DsButton (기본 variant="primary" tone="dotori" 생략 가능).
5. DsButton outline → variant="secondary", plain → variant="ghost".
6. Badge/Switch/Select 등 다른 Catalyst 컴포넌트 변경 금지.
7. ActionType 유니온: register_interest|apply_waiting|set_alert|compare|generate_checklist|generate_report.
8. 클라이언트 라우팅 = button.id 기반 (button.action 아님).
9. 산출물: git diff + 요약 7줄 + 테스트 커맨드.
10. 빌드: env -u NODE_ENV npm run build (0 errors, 47 pages)
11. 테스트: npm test (126+ pass)
12. framer-motion 금지 → motion/react만.
13. Catalyst 컴포넌트(src/components/catalyst/) 내부 수정 금지.
14. text-[Npx] 임의 픽셀값 추가 금지.
15. 톤 기준: "-세요" (존댓말) + 따뜻한 종결 ("~예요", "~거예요", "~해봐요")
```

---

## Agent 1: DS 토큰 워딩 잔류 정리 (P0, 3 files)

```
[CONTEXT]
R25 실행 후에도 tokens.ts와 utils.ts에 개발 용어 "TO 있음"이 2건 잔류.
FacilityCard/landing 등 컴포넌트는 이미 수정됐지만, 토큰 원본이 누락됨.
onboarding.spec.ts 테스트는 이미 변경된 UI("무료로 시작하기")와 불일치.

[GOAL]
R25 잔류 개발 용어 2건 정리 + 테스트 텍스트 동기화.

[NON-GOALS]
- DS_STATUS 구조 변경 없음
- 테스트 로직 변경 없음 (텍스트 매칭만)

[AC]
1. tokens.ts:148 → "TO 있음" → "빈자리 있음"
2. utils.ts:35 → "TO 있음" → "빈자리 있음"
3. onboarding.spec.ts:9 → SKIP_BUTTON_TEXT regex를 "무료로 시작하기"로 변경
4. 빌드 0 errors, 테스트 126+ pass
5. grep "TO 있음" src/ → 0 matches

[SCOPE FILES]
1. src/lib/design-system/tokens.ts — L148
2. src/lib/utils.ts — L35
3. src/__tests__/e2e/onboarding.spec.ts — L9

[REPLACEMENTS — 정확한 old→new]

### src/lib/design-system/tokens.ts
- L148: `label:  "TO 있음",` → `label:  "빈자리 있음",`

### src/lib/utils.ts
- L35: `const map = { available: "TO 있음", waiting: "대기 중", full: "마감" };`
  → `const map = { available: "빈자리 있음", waiting: "대기 중", full: "마감" };`

### src/__tests__/e2e/onboarding.spec.ts
- L9: `const SKIP_BUTTON_TEXT = /무료로 먼저 체험하기/;`
  → `const SKIP_BUTTON_TEXT = /무료로 시작하기/;`

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
grep -rn "TO 있음" src/ → 0 matches
grep -rn "먼저 체험하기" src/ → 0 matches
```

---

## Agent 2: DsButton 마이그레이션 — 앱 코어 (P1, 7 files)

```
[CONTEXT]
DsButton(src/components/ds/DsButton.tsx)이 디자인 토큰 래퍼로 존재하지만,
20개 파일 중 2개(page.tsx 홈, FacilityCard)만 사용.
나머지 18개는 Catalyst Button을 직접 import → 토큰 레이어 우회.
DsButton 사용으로 variant/tone 일관성 확보.

DsButton 내부: Catalyst Button을 래핑. Props passthrough(href, onClick, className 등).
variant="primary"(기본) → color 자동, variant="secondary" → outline, variant="ghost" → plain.

[GOAL]
앱 코어 경로 7개 파일에서 Catalyst Button → DsButton 마이그레이션.

[NON-GOALS]
- DsButton 자체 수정 없음
- Badge 변환 없음 (Catalyst Badge 그대로)
- 시각적 변경 없음

[AC]
1. 7개 파일에서 `import { Button } from "@/components/catalyst/button"` 제거
2. `import { DsButton } from "@/components/ds/DsButton"` 추가
3. <Button color="dotori" ...> → <DsButton ...> (기본값이므로 color prop 생략)
4. <Button plain={true} ...> → <DsButton variant="ghost" ...>
5. <Button outline ...> → <DsButton variant="secondary" ...>
6. href, onClick, className, type 등 기존 props 그대로 전달
7. 같은 파일에 Badge도 import하면 Badge import는 유지
8. 빌드 0 errors, 테스트 126+ pass

[SCOPE FILES]
1. src/app/(app)/my/page.tsx — L258, L462, L621, L708 (4곳 color="dotori")
2. src/components/dotori/EmptyState.tsx — L223, L354, L363 (3곳 color="dotori")
3. src/components/dotori/ErrorState.tsx — L96 (1곳 color="dotori")
4. src/components/dotori/PremiumGate.tsx — L30 (1곳 color="dotori")
5. src/components/dotori/blocks/ActionsBlock.tsx — L29-31 color="dotori" + L20-23 plain (2곳)
6. src/app/(auth)/error.tsx — L75 (1곳 color="dotori")
7. src/components/dotori/chat/ChatPromptPanel.tsx — Button 사용 확인 후 변환

[변환 패턴 — 3가지]

### 패턴 A: 기본 CTA (가장 흔함)
```tsx
// Before:
import { Button } from "@/components/catalyst/button"
<Button color="dotori" className="mt-4 min-h-11 w-full">텍스트</Button>

// After:
import { DsButton } from "@/components/ds/DsButton"
<DsButton className="mt-4 min-h-11 w-full">텍스트</DsButton>
```

### 패턴 B: href 링크 버튼
```tsx
// Before:
<Button href="/my/settings" color="dotori" className="mt-4 min-h-11 w-full">설정</Button>

// After:
<DsButton href="/my/settings" className="mt-4 min-h-11 w-full">설정</DsButton>
```

### 패턴 C: plain/outline 변형 (ActionsBlock)
```tsx
// Before:
<Button plain={true} onClick={...} className={...}>{label}</Button>
<Button color="dotori" onClick={...} className={...}>{label}</Button>

// After:
<DsButton variant="ghost" onClick={...} className={...}>{label}</DsButton>
<DsButton onClick={...} className={...}>{label}</DsButton>
```

### Badge 동시 import 시
```tsx
// Before:
import { Badge, Button } from "@/components/catalyst/button"
// → 만약 같은 파일에서 Badge를 catalyst/badge에서 따로 import하면:

// After:
import { Badge } from "@/components/catalyst/badge"
import { DsButton } from "@/components/ds/DsButton"
```

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
grep -rn 'from "@/components/catalyst/button"' src/app/\(app\)/my/page.tsx → 0
grep -rn 'from "@/components/catalyst/button"' src/components/dotori/EmptyState.tsx → 0
grep -rn 'from "@/components/catalyst/button"' src/components/dotori/blocks/ActionsBlock.tsx → 0
```

---

## Agent 3: DsButton 마이그레이션 — 탐색·커뮤니티·온보딩 (P1, 6 files)

```
[CONTEXT]
Agent 2에서 코어 경로 마이그레이션 완료 후, 탐색·커뮤니티·시설·온보딩 경로를 변환.
변환 패턴은 Agent 2와 동일 (패턴 A/B/C).

[GOAL]
탐색·커뮤니티·온보딩 6개 파일에서 Catalyst Button → DsButton 마이그레이션.

[NON-GOALS]
- Agent 2 스코프 파일 수정 금지
- form control (Select, Input 등) 변경 없음
- 시각적 변경 없음

[AC]
1. 6개 파일에서 Button import → DsButton import 전환
2. color="dotori" 버튼 전부 DsButton으로 변환
3. outline/plain 버튼 variant 매핑 적용
4. href, onClick, type="submit" 등 기존 props 유지
5. 빌드 0 errors, 테스트 126+ pass

[SCOPE FILES]
1. src/components/dotori/explore/ExploreResultList.tsx — L238, L258, L285 (3곳)
2. src/components/dotori/explore/ExploreSearchHeader.tsx — L230 (1곳)
3. src/app/(app)/community/[id]/page.tsx — L313, L323 (2곳)
4. src/app/(app)/community/write/page.tsx — L181 (1곳)
5. src/components/dotori/facility/FacilityContactSection.tsx — L365, L378 (2곳)
6. src/app/(onboarding)/onboarding/page.tsx — L821, L845 (2곳)

[주의]
- onboarding/page.tsx L845: Skip 버튼이 outline이면 variant="secondary"
- FacilityContactSection: 전화/주소 버튼은 href 또는 onClick → 그대로 전달
- community/write/page.tsx: form 제출 버튼이면 type="submit" 유지
- ExploreResultList: 여러 곳에 color="dotori" → 모두 DsButton으로 변환

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
grep -rn 'from "@/components/catalyst/button"' src/components/dotori/explore/ → 0
grep -rn 'from "@/components/catalyst/button"' src/app/\(onboarding\)/ → 0
grep -rn 'from "@/components/catalyst/button"' src/components/dotori/facility/ → 0
```

---

## Agent 4: ActionType 아키텍처 정리 (P2, 4 files — R26 잔류)

```
[CONTEXT]
현재 ActionButton.action은 필수 필드(ActionType).
하지만 네비게이션 전용 버튼(id: "explore", "broaden")은 순수 라우팅 용도로
의미 없는 placeholder("register_interest", "compare")를 넣어야 하는 불일치.
클라이언트는 button.id로 라우팅하므로 action 필드를 무시함 (ChatBubble.tsx L176).

현재 types/dotori.ts:
```typescript
export interface ActionButton {
  id: string;
  label: string;
  action: ActionType;        // ← 필수. 네비게이션 버튼에 불필요
  variant: "solid" | "outline";
  icon?: string;
}
```

[GOAL]
네비게이션 전용 버튼이 의미 없는 action을 강제당하지 않도록 타입 정리.

[NON-GOALS]
- 클라이언트 라우팅 로직 변경 없음 (button.id 기반 유지)
- API 계약 변경 없음
- ActionType 유니온 확장/축소 없음

[AC]
1. ActionButton.action을 optional (`action?: ActionType`)로 변경
2. 네비게이션 전용 버튼(blocks.ts "explore", recommendation.ts "broaden")에서 action 제거
3. response-shape.ts sanitizeActionType 호출부에서 optional 허용
4. 엔진 테스트 79개 전부 통과
5. npm run build 0 errors, npm test 126+ pass

[SCOPE FILES]
1. src/types/dotori.ts — L177-183 (ActionButton interface)
2. src/lib/engine/response-builder/blocks.ts — L291-296 (explore 버튼)
3. src/lib/engine/response-builder/recommendation.ts — L38-43 (broaden 버튼)
4. src/lib/chat/response-shape.ts — L244-253 (sanitizeActionType 호출부)

[REPLACEMENTS]

### src/types/dotori.ts L177-183
```typescript
// Before:
export interface ActionButton {
  id: string;
  label: string;
  action: ActionType;
  variant: "solid" | "outline";
  icon?: string;
}

// After:
export interface ActionButton {
  id: string;
  label: string;
  action?: ActionType;
  variant: "solid" | "outline";
  icon?: string;
}
```

### src/lib/engine/response-builder/blocks.ts L291-296
```typescript
// Before:
{
  id: "explore",
  label: "시설 탐색하기",
  action: "register_interest",
  variant: "outline",
}

// After:
{
  id: "explore",
  label: "시설 탐색하기",
  variant: "outline",
}
```

### src/lib/engine/response-builder/recommendation.ts L38-43
```typescript
// Before:
{
  id: "broaden",
  label: "전체 검색",
  action: "compare",
  variant: "outline",
}

// After:
{
  id: "broaden",
  label: "전체 검색",
  variant: "outline",
}
```

### src/lib/chat/response-shape.ts L244-253
```typescript
// Before:
buttons.push({
  id: asString(buttonRecord.id) || `action-${index}`,
  label: asString(buttonRecord.label) || "버튼",
  action: sanitizeActionType(buttonRecord.action),
  variant: ...,
  icon: asString(buttonRecord.icon),
});

// After:
const action = buttonRecord.action != null
  ? sanitizeActionType(buttonRecord.action)
  : undefined;
buttons.push({
  id: asString(buttonRecord.id) || `action-${index}`,
  label: asString(buttonRecord.label) || "버튼",
  ...(action != null && { action }),
  variant: ...,
  icon: asString(buttonRecord.icon),
});
```

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
npm run test:engine  # 79 pass
```

---

## Agent 5: brand-copy.ts 커버리지 확대 (P2, 5 files)

```
[CONTEXT]
brand-copy.ts에 현재 15개 문자열(auth 12개, global 3개)만 중앙화 → 7%.
4개 파일만 brand-copy.ts import (error.tsx 2개, global-error.tsx, login/page.tsx).
EmptyState/ErrorState는 variant별 5~8개 한국어 문자열을 하드코딩.
BottomTabBar 탭 라벨 5개도 분산.

[GOAL]
brand-copy.ts에 emptyState·errorState·navigation·chat 네임스페이스 추가,
해당 컴포넌트에서 copy import로 교체 → 커버리지 7% → 25%+.

[NON-GOALS]
- 전체 200개 문자열 중앙화 아님 (1차 확대)
- 레이아웃/스타일 변경 없음
- i18n/번역 시스템 도입 아님
- Agent 2가 DsButton으로 변환한 import는 건드리지 않음 (텍스트 prop만 수정)

[AC]
1. brand-copy.ts에 emptyState, errorState, navigation, chat 네임스페이스 추가
2. EmptyState.tsx variant별 하드코딩 제목·설명·버튼 라벨 → copy 참조
3. ErrorState.tsx 하드코딩 제목·설명 → copy 참조
4. BottomTabBar.tsx 탭 라벨 5개 → copy.navigation.tabs 참조
5. ChatPromptPanel.tsx placeholder/suggestion → copy.chat 참조
6. 빌드 0 errors, 테스트 126+ pass
7. grep 'from "@/lib/brand-copy"' src/ → 8+ files

[SCOPE FILES]
1. src/lib/brand-copy.ts — 네임스페이스 확장
2. src/components/dotori/EmptyState.tsx — 문자열 → copy 참조
3. src/components/dotori/ErrorState.tsx — 문자열 → copy 참조
4. src/components/dotori/BottomTabBar.tsx — 탭 라벨 → copy 참조
5. src/components/dotori/chat/ChatPromptPanel.tsx — placeholder → copy 참조

[구현 가이드]

### brand-copy.ts 확장
기존 copy 객체에 신규 네임스페이스 추가:
```typescript
export const copy = {
  auth: { ... },    // 기존 유지
  global: { ... },  // 기존 유지

  emptyState: {
    community: {
      title: "아직 게시글이 없어요",
      description: "이동 고민을 먼저 공유해볼까요?",
      action: "첫 글 쓰기",
    },
    waitlist: {
      title: "대기 신청이 없어요",
      description: "관심 어린이집에 대기 신청해보세요",
      action: "시설 탐색하기",
    },
    interests: {
      title: "관심 시설이 없어요",
      description: "마음에 드는 어린이집을 저장해보세요",
      action: "시설 탐색하기",
    },
    notifications: {
      title: "새로운 알림이 없어요",
      description: "빈자리나 관심 시설 소식이 오면 알려드릴게요",
    },
    search: {
      title: "검색 결과가 없어요",
      description: "다른 조건으로 검색해보세요",
      action: "전체 보기",
    },
  },

  errorState: {
    network: {
      title: "연결이 불안정해요",
      description: "네트워크 상태를 확인하고 다시 시도해주세요",
      action: "다시 시도",
    },
    generic: {
      title: "문제가 발생했어요",
      description: "잠시 후 다시 시도해주세요",
      action: "다시 시도",
    },
  },

  navigation: {
    tabs: {
      home: "홈",
      explore: "탐색",
      chat: "토리챗",
      community: "커뮤니티",
      my: "마이",
    },
  },

  chat: {
    placeholder: "어린이집 고민을 말씀해주세요",
    suggestions: [
      "우리 동네 추천해줘",
      "국공립 비교해줘",
      "입소 전략 짜줘",
    ],
  },
} as const;
```

### EmptyState.tsx, ErrorState.tsx
하드코딩된 variant별 텍스트를 `copy.emptyState[variant]` / `copy.errorState[variant]` 참조로 교체.
- 각 파일 상단에 `import { copy } from "@/lib/brand-copy"` 추가
- 문자열 리터럴 → `copy.emptyState.community.title` 형태로 변경
- JSX 구조/className은 절대 변경 금지

### BottomTabBar.tsx
탭 label 배열의 하드코딩 → `copy.navigation.tabs` 참조.
- `label: '홈'` → `label: copy.navigation.tabs.home`

### ChatPromptPanel.tsx
placeholder/suggestion → `copy.chat` 참조.
- 실제 문자열 확인 후 매핑 (하드코딩된 것만 교체, 동적 생성 텍스트 제외)

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
grep -c 'from "@/lib/brand-copy"' src/**/*.tsx → 8+
```

---

## 빌드 검증 (전체 wave 완료 후)

```bash
cd /home/sihu2/dotori-ver2-qetta/dotori-app

# ─── 전체 게이트 ───
env -u NODE_ENV npm run build    # 47 pages, 0 errors
npm test                          # 126+ pass
npm run test:engine               # 79 pass
npm run lint                      # 0 errors
npm run typecheck                 # 0 errors

# ─── R25 잔류 해소 ───
grep -rn "TO 있음" src/
# → 0 matches

grep -rn "먼저 체험하기" src/
# → 0 matches

# ─── DsButton 마이그레이션 ───
grep -rn 'from "@/components/catalyst/button"' src/ | grep -v 'catalyst/' | grep -v 'ds/DsButton'
# → 잔류 최소화 (waitlist, interests, notifications, login 등 미대상 파일만 잔류 가능)

# ─── brand-copy.ts ───
grep -c 'from "@/lib/brand-copy"' src/**/*.tsx
# → 8+ files

# ─── ActionType optional ───
grep -n "action?: ActionType" src/types/dotori.ts
# → 1 match (L180)
```

---

## 에이전트 파일 소유권 + 실행 순서

| Agent | 파일 | 우선순위 |
|-------|------|---------|
| **1** | tokens.ts, utils.ts, onboarding.spec.ts | P0 |
| **2** | my/page.tsx, EmptyState.tsx, ErrorState.tsx, PremiumGate.tsx, ActionsBlock.tsx, (auth)/error.tsx, ChatPromptPanel.tsx | P1 |
| **3** | ExploreResultList.tsx, ExploreSearchHeader.tsx, community/[id]/page.tsx, write/page.tsx, FacilityContactSection.tsx, onboarding/page.tsx | P1 |
| **4** | types/dotori.ts, blocks.ts, recommendation.ts, response-shape.ts | P2 |
| **5** | brand-copy.ts, EmptyState.tsx(copy), ErrorState.tsx(copy), BottomTabBar.tsx, ChatPromptPanel.tsx(copy) | P2 |

### 충돌 매트릭스

| 파일 | Agent 2 | Agent 5 | 충돌 영역 |
|------|---------|---------|-----------|
| EmptyState.tsx | import 변경 + JSX 태그 | 문자열 prop 값 | **낮음** (다른 라인) |
| ErrorState.tsx | import 변경 + JSX 태그 | 문자열 prop 값 | **낮음** |
| ChatPromptPanel.tsx | import 변경 + JSX 태그 | 문자열 prop 값 | **낮음** |

→ Agent 2가 import/태그 변경, Agent 5가 텍스트 prop 교체 — 안전하지만 순차 권장.

### 실행 순서

```
Wave 1 (병렬, 파일 충돌 0): Agent 1 + Agent 2 + Agent 3
  Agent 1: tokens.ts, utils.ts, onboarding.spec.ts
  Agent 2: my/page.tsx, EmptyState.tsx, ErrorState.tsx, PremiumGate.tsx, ActionsBlock.tsx, error.tsx, ChatPromptPanel.tsx
  Agent 3: ExploreResultList.tsx, ExploreSearchHeader.tsx, community/[id], write/page.tsx, FacilityContactSection.tsx, onboarding/page.tsx
  → tsc 검증

Wave 2 (순차): Agent 4 → Agent 5
  Agent 4: types/dotori.ts, blocks.ts, recommendation.ts, response-shape.ts
  → tsc 검증
  Agent 5: brand-copy.ts, EmptyState.tsx(텍스트), ErrorState.tsx(텍스트), BottomTabBar.tsx, ChatPromptPanel.tsx(텍스트)
  → 전체 테스트
```

```bash
# codex-wave.sh:
./scripts/codex-wave.sh /tmp/r25-r26-r27-unified.txt --wave=3
# Wave 1: Agent 1,2,3 → tsc → Wave 2: Agent 4,5 → full test
```
