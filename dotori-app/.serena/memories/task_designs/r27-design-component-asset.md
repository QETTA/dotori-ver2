# R27 — 디자인 컴포넌트·에셋 활용도 개선 (4 에이전트)
> 설계일: 2026-02-24
> 검증 베이스라인: build ✅ (47 pages), test ✅ (126/126), engine ✅ (79/79), lint 0 errors, tsc ✅

---

## R25/R26 교차검증 결과 요약

### R25 (폰트·워딩) — 91% 완료, 잔류 3건
| Agent | 상태 | 비고 |
|-------|------|------|
| Agent 1 (개발 용어) | ⚠️ 91% | FacilityCard·page.tsx·landing 수정완료. **잔류:** tokens.ts:148 "TO 있음", utils.ts:35 "TO 있음" |
| Agent 2 (톤 통일) | ✅ 100% | grep 잔류 0건. **테스트:** onboarding.spec.ts:9 텍스트 동기화 필요 |
| Agent 3 (폰트 시스템) | ✅ 100% | SplashScreen fontFamily 제거, loading.css CSS변수 전환 완료 |
| Agent 4 (tracking) | ✅ 100% | tracking-[ ] 커스텀값 0건 (Catalyst 제외) |

### R26 (백엔드 안정성) — 100% 완료 (코드 수준)
| Agent | 상태 | 비고 |
|-------|------|------|
| Agent 1 (스트림) | ✅ | AbortController + sequence ID + isMountedRef 적용됨 |
| Agent 2 (커뮤니티) | ✅ | toggleLike 롤백 (originalLikeCount) + fetchPosts unmount guard 적용됨 |
| Agent 3 (액션 핸들러) | ✅ | console.warn + raw sendMessage 제거됨 |
| Agent 4 (ActionType) | ❓ | optional화 미확인 (별도 체크 필요) |

### 디자인 시스템 감사 — 핵심 갭
| 갭 | 영향도 | 현황 |
|---|--------|------|
| **DsButton 미활용** | P1 | 20개 파일 중 2개만 DsButton 사용. 나머지 18개 직접 Catalyst Button import |
| **DS_STATUS "TO 있음"** | P0 | tokens.ts + utils.ts 2곳 개발 용어 잔류 |
| **brand-copy.ts 커버리지** | P2 | 15/200+ 한국어 문자열 (7% 중앙화). 4개 파일만 import |
| **MapEmbed** | ✅ 양호 | `<div>` + Kakao SDK (iframe 아님). role="region" aria-label 적용됨 |
| **Toast 접근성** | P2 | 드래그 dismiss만 있고 키보드 dismiss 없음 |
| **Catalyst Button 직접 사용** | P1 | 디자인 토큰 우회, 버튼 톤/변형 불일치 위험 |

---

## SHARED_RULES

```
1. SCOPE 밖 파일 수정 금지.
2. DsButton 마이그레이션 시 시각적 결과 100% 동일 유지 (색상, 크기, 라운딩).
3. import 경로: `import { DsButton } from "@/components/ds/DsButton"`.
4. DsButton variant 매핑: color="dotori" → variant="primary" tone="dotori" (기본값이므로 props 생략 가능).
5. DsButton outline → variant="secondary", plain → variant="ghost".
6. Badge는 DsButton 대상 아님 — Catalyst Badge 그대로 유지.
7. href가 있는 버튼: DsButton이 ButtonProps를 passthrough하므로 href 그대로 전달.
8. 산출물: git diff + 요약 7줄 + 테스트 커맨드.
9. 빌드: env -u NODE_ENV npm run build (0 errors, 47 pages)
10. 테스트: npm test (126+ pass)
11. framer-motion 금지 → motion/react만.
12. Catalyst 컴포넌트(src/components/catalyst/) 내부 수정 금지.
```

---

## Agent 1: DS 토큰 워딩 잔류 정리 (P0, R25 잔류 해소)

```
[CONTEXT]
R25 실행 후에도 tokens.ts와 utils.ts에 개발 용어 "TO 있음"이 2건 잔류.
onboarding.spec.ts 테스트가 이미 변경된 UI 텍스트("무료로 시작하기")와 불일치.

[GOAL]
R25 잔류 개발 용어 2건 정리 + 테스트 텍스트 동기화.

[NON-GOALS]
- DS_STATUS 구조 변경 없음
- 테스트 로직 변경 없음 (텍스트 매칭만 수정)

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

[REPLACEMENTS]

### src/lib/design-system/tokens.ts
- L148: `label:  "TO 있음",` → `label:  "빈자리 있음",`

### src/lib/utils.ts
- L35: `available: "TO 있음"` → `available: "빈자리 있음"`

### src/__tests__/e2e/onboarding.spec.ts
- L9: `const SKIP_BUTTON_TEXT = /무료로 먼저 체험하기/;` → `const SKIP_BUTTON_TEXT = /무료로 시작하기/;`

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
grep -rn "TO 있음" src/ → 0 matches
grep -n "먼저 체험하기" src/ → 0 matches
```

---

## Agent 2: DsButton 마이그레이션 — 앱 코어 (P1)

```
[CONTEXT]
DsButton(src/components/ds/DsButton.tsx)이 디자인 토큰 래퍼로 존재하지만,
20개 파일 중 2개(page.tsx 홈, FacilityCard)만 사용.
나머지 18개는 Catalyst Button을 직접 import하여 color="dotori" 등을 전달.
DsButton을 사용하면 variant/tone이 토큰으로 관리되어 일관성 확보.

DsButton 변환 매핑:
- <Button color="dotori"> → <DsButton> (기본값: variant="primary" tone="dotori")
- <Button color="dotori" className="..."> → <DsButton className="...">
- <Button outline ...> → <DsButton variant="secondary" ...>
- <Button plain={true} ...> → <DsButton variant="ghost" ...>
- <Button href="..." color="dotori"> → <DsButton href="..." >

[GOAL]
앱 코어 경로 7개 파일에서 Catalyst Button → DsButton 마이그레이션.

[NON-GOALS]
- DsButton 자체 수정 없음
- Badge 변환 없음 (Catalyst Badge 그대로)
- Catalyst Button import가 Badge와 함께 쓰이는 곳은 Button import만 제거 (Badge import 유지)

[AC]
1. 7개 파일 모두 `import { Button }` → `import { DsButton }` 전환
2. 모든 <Button color="dotori" ...> → <DsButton ...> 변환
3. outline/plain 버튼 → variant="secondary"/"ghost" 변환
4. href, onClick, className 등 기존 props 그대로 전달
5. 시각적 결과 동일 (DsButton이 내부적으로 Catalyst Button 래핑)
6. 빌드 0 errors, 테스트 126+ pass

[SCOPE FILES]
1. src/app/(app)/my/page.tsx — L258, L462, L621, L708 (Button color="dotori" 4곳)
2. src/components/dotori/EmptyState.tsx — L223, L354, L363 (Button color="dotori" 3곳)
3. src/components/dotori/ErrorState.tsx — L96 (Button color="dotori" 1곳)
4. src/components/dotori/PremiumGate.tsx — L30 (Button color="dotori" 1곳)
5. src/components/dotori/blocks/ActionsBlock.tsx — L20-36 (Button color="dotori" + plain 각 1곳)
6. src/app/(auth)/error.tsx — L75 (Button color="dotori" 1곳)
7. src/components/dotori/chat/ChatPromptPanel.tsx — Button 사용 확인 후 변환

[변환 패턴]

### 기본 CTA (가장 흔한 패턴)
```tsx
// Before:
import { Button } from "@/components/catalyst/button"
<Button color="dotori" className="mt-4 min-h-11 w-full">텍스트</Button>

// After:
import { DsButton } from "@/components/ds/DsButton"
<DsButton className="mt-4 min-h-11 w-full">텍스트</DsButton>
```

### href 링크 버튼
```tsx
// Before:
<Button href="/my/settings" color="dotori" className="mt-4 min-h-11 w-full">설정</Button>

// After:
<DsButton href="/my/settings" className="mt-4 min-h-11 w-full">설정</DsButton>
```

### plain 버튼 (ActionsBlock)
```tsx
// Before:
<Button plain={true} onClick={...} className={...}>{btn.label}</Button>

// After:
<DsButton variant="ghost" onClick={...} className={...}>{btn.label}</DsButton>
```

### 같은 파일에 Badge도 import하는 경우
```tsx
// Before:
import { Badge, Button } from "@/components/catalyst/..."

// After:
import { Badge } from "@/components/catalyst/badge"
import { DsButton } from "@/components/ds/DsButton"
// Badge는 그대로 유지, Button만 DsButton으로 전환
```

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
# 검증: 각 파일에서 Catalyst Button import 제거됨 (Badge 제외)
grep -rn 'from "@/components/catalyst/button"' src/app/\(app\)/my/page.tsx → 0 matches
grep -rn 'from "@/components/catalyst/button"' src/components/dotori/EmptyState.tsx → 0 matches
grep -rn 'from "@/components/catalyst/button"' src/components/dotori/blocks/ActionsBlock.tsx → 0 matches
```

---

## Agent 3: DsButton 마이그레이션 — 탐색·커뮤니티 (P1)

```
[CONTEXT]
Agent 2에서 앱 코어 경로를 마이그레이션. 이 에이전트는 탐색(explore), 커뮤니티(community),
시설 상세(facility), 온보딩(onboarding) 경로의 Catalyst Button을 DsButton으로 변환.
변환 패턴은 Agent 2와 동일.

[GOAL]
탐색·커뮤니티·온보딩 경로 6개 파일에서 Catalyst Button → DsButton 마이그레이션.

[NON-GOALS]
- Agent 2 스코프 파일 수정 금지
- Badge/Switch/Select 등 다른 Catalyst 컴포넌트 변경 없음
- 버튼이 아닌 form control은 대상 아님

[AC]
1. 6개 파일 모두 Button import → DsButton import 전환
2. color="dotori" 버튼 모두 DsButton으로 변환
3. outline/plain 버튼 variant 매핑 적용
4. 시각적 결과 동일
5. 빌드 0 errors, 테스트 126+ pass

[SCOPE FILES]
1. src/components/dotori/explore/ExploreResultList.tsx — L238, L258, L285 (3곳)
2. src/components/dotori/explore/ExploreSearchHeader.tsx — L230 (1곳)
3. src/app/(app)/community/[id]/page.tsx — L313, L323 (2곳)
4. src/app/(app)/community/write/page.tsx — L181 (1곳)
5. src/components/dotori/facility/FacilityContactSection.tsx — L365, L378 (2곳)
6. src/app/(onboarding)/onboarding/page.tsx — L821, L845 (2곳)

[변환 규칙]
Agent 2 SHARED_RULES 동일 적용.

추가 주의:
- onboarding/page.tsx는 L821 Skip 버튼이 outline일 수 있음 → variant="secondary" 확인
- FacilityContactSection에서 전화/주소 버튼은 href 또는 onClick 포함 → 그대로 전달
- community/[id]/page.tsx에서 댓글 작성 등 form 제출 버튼은 type="submit" 유지

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
grep -rn 'from "@/components/catalyst/button"' src/components/dotori/explore/ → 0 matches
grep -rn 'from "@/components/catalyst/button"' src/app/\(onboarding\)/ → 0 matches
```

---

## Agent 4: brand-copy.ts 커버리지 확대 (P2)

```
[CONTEXT]
brand-copy.ts에 현재 15개 문자열만 중앙화됨 (auth.login 7개, auth.error 4개, auth.errors 3개, global 1개).
전체 200+ 한국어 문자열 중 7%만 커버.
4개 파일만 brand-copy.ts import.

핵심 미중앙화 영역:
- EmptyState.tsx: variant별 제목/설명 5+개 하드코딩
- ErrorState.tsx: variant별 제목/설명 3+개 하드코딩
- BottomTabBar.tsx: 탭 라벨 5개 하드코딩
- ChatPromptPanel.tsx: placeholder/suggestion 텍스트 하드코딩
- Toast 관련 메시지: 컴포넌트별 분산

[GOAL]
brand-copy.ts에 EmptyState/ErrorState/BottomTabBar/채팅 프리셋 문자열을 추가하여
커버리지를 7% → 25%+ 확대. 기존 구조(copy 객체) 확장.

[NON-GOALS]
- 전체 200개 문자열 중앙화 아님 (단계적 확대 1차)
- 컴포넌트 레이아웃/스타일 변경 없음
- 번역/i18n 시스템 도입 아님

[AC]
1. brand-copy.ts에 `emptyState`, `errorState`, `navigation`, `chat` 네임스페이스 추가
2. EmptyState.tsx에서 하드코딩된 variant별 제목·설명·버튼 라벨을 copy import로 교체
3. ErrorState.tsx에서 하드코딩된 제목·설명을 copy import로 교체
4. BottomTabBar.tsx 탭 라벨 5개를 copy.navigation.tabs 참조로 교체
5. 빌드 0 errors, 테스트 126+ pass
6. grep 'from "@/lib/brand-copy"' src/ → 8+ files (기존 4 + 신규 4)

[SCOPE FILES]
1. src/lib/brand-copy.ts — 네임스페이스 확장
2. src/components/dotori/EmptyState.tsx — 하드코딩 문자열 → copy 참조
3. src/components/dotori/ErrorState.tsx — 하드코딩 문자열 → copy 참조
4. src/components/dotori/BottomTabBar.tsx — 탭 라벨 → copy 참조
5. src/components/dotori/chat/ChatPromptPanel.tsx — placeholder/suggestion → copy 참조

[구현 가이드]

### brand-copy.ts 확장
기존 copy 객체에 추가:
```typescript
export const copy = {
  auth: { ... },  // 기존 유지
  global: { ... }, // 기존 유지

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

### EmptyState.tsx
하드코딩된 variant별 텍스트를 `copy.emptyState[variant]` 참조로 교체.
예: `title="아직 게시글이 없어요"` → `title={copy.emptyState.community.title}`

### BottomTabBar.tsx
탭 label 배열의 하드코딩 문자열을 `copy.navigation.tabs` 참조로 교체.
예: `label: '홈'` → `label: copy.navigation.tabs.home`

[TEST PLAN]
env -u NODE_ENV npm run build && npm test
grep -c 'from "@/lib/brand-copy"' src/**/*.tsx → 8+ files
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

# R25 잔류 해소 검증
grep -rn "TO 있음" src/ → 0 matches
grep -rn "먼저 체험하기" src/ → 0 matches

# DsButton 마이그레이션 검증
grep -rn 'from "@/components/catalyst/button"' src/ | grep -v catalyst/ | grep -v ds/DsButton
# → 잔류 0건 예상 (DsButton.tsx 내부의 정당한 import 제외)

# brand-copy.ts 커버리지
grep -c 'from "@/lib/brand-copy"' src/**/*.tsx
# → 8+ files
```

---

## 에이전트 파일 소유권

| Agent | 파일 | 우선순위 |
|-------|------|---------|
| **1** | tokens.ts, utils.ts, onboarding.spec.ts | P0 |
| **2** | my/page.tsx, EmptyState.tsx, ErrorState.tsx, PremiumGate.tsx, ActionsBlock.tsx, error.tsx, ChatPromptPanel.tsx | P1 |
| **3** | ExploreResultList.tsx, ExploreSearchHeader.tsx, community/[id]/page.tsx, write/page.tsx, FacilityContactSection.tsx, onboarding/page.tsx | P1 |
| **4** | brand-copy.ts, EmptyState.tsx(copy만), ErrorState.tsx(copy만), BottomTabBar.tsx, ChatPromptPanel.tsx(copy만) | P2 |

**충돌 주의**: Agent 2와 Agent 4가 EmptyState.tsx, ErrorState.tsx, ChatPromptPanel.tsx 공유.
- Agent 2: `import { Button } → import { DsButton }` (import 라인 + JSX 태그만)
- Agent 4: 문자열 리터럴 → `copy.*` 참조 (텍스트 prop 값만)
→ **Agent 2 먼저 실행 → Agent 4는 Agent 2 완료 후 실행** (import 충돌 방지)

---

## 실행 순서

```
Wave 1 (병렬): Agent 1 + Agent 2 + Agent 3
  → Agent 1: 토큰 파일만 (충돌 없음)
  → Agent 2: 앱 코어 컴포넌트 (충돌 없음)
  → Agent 3: 탐색·커뮤니티 컴포넌트 (충돌 없음)
  → tsc 검증

Wave 2 (순차): Agent 4
  → Agent 2의 EmptyState/ErrorState DsButton 적용 완료 후
  → brand-copy.ts 확장 + 문자열 참조 교체
  → 전체 테스트 검증
```

```bash
# codex-wave.sh 사용 시:
./scripts/codex-wave.sh /tmp/r27-tasks.txt --wave=3
# Wave 1: Agent 1, 2, 3 → tsc → Wave 2: Agent 4 → full test
```
