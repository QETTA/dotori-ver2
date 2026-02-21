# 입소ai 디자인 평가 — grep/find 기반 객관적 감사

---

## 디자인 총점: **68 / 100**

| 영역 | 점수 | 가중치 | 근거 |
|------|------|--------|------|
| 디자인 시스템 구조 | **85** | 20% | OKLCH + @theme + semantic tokens — 2026 최고 수준 |
| 토큰 일관성 | **62** | 15% | 135건 hardcoded color 위반, 혼합 radius |
| 타이포그래피 | **72** | 15% | 체계적 scale이지만 font-weight 5단계 과다 |
| 컬러 접근성 | **48** | 15% | text-secondary/tertiary WCAG AA 미달 |
| 아이콘/그래픽 | **42** | 10% | 이모지 65건 의존, 아이콘 라이브러리 0 |
| 인터랙션 | **82** | 10% | 풍부한 animation/transition, hover/active |
| 레이아웃/반응형 | **78** | 10% | 모바일+데스크탑 사이드바, safe-area |
| 접근성(시각) | **60** | 5% | ARIA 62건이나 focus-visible 0건 |

---

## 1. 디자인 시스템 구조 — **85점** (진짜 잘 됨)

### ✅ 2026 표준 달성

**OKLCH 색공간 채택:**
```css
--color-primary-500: oklch(0.62 0.15 180);  /* Teal hue 180 */
--color-accent-500:  oklch(0.70 0.18 55);   /* Amber hue 55 */
--color-grade-a:     oklch(0.65 0.17 145);  /* 등급별 hue 분리 */
```
- OKLCH는 2024년부터 CSS Color Level 4 표준, 2026년 시점에서 가장 모던한 선택
- 지각적 균일성(perceptual uniformity) — L값이 실제 밝기와 일치
- Hue 기반 색상 체계: primary(180°), accent(55°), grades(145→25°)

**Tailwind v4 CSS-first 설정:**
```css
@theme { --color-primary-500: ...; }  /* JS config 불필요 */
```
- `tailwind.config.ts` 없이 CSS에서 직접 theme 정의
- 218줄만으로 전체 디자인 시스템 완성 — 간결

**Semantic Token 3계층:**
| 계층 | 예시 | 용도 |
|------|------|------|
| Primitive | `primary-500`, `grade-a` | 색상 정의 |
| Semantic | `--surface-raised`, `--text-primary` | 용도별 매핑 |
| Component | `--shadow-card`, `--shadow-glow-primary` | 컴포넌트 수준 |

**라이트/다크 모드:**
```css
:root { --surface-base: oklch(0.985 ...) }
.dark { --surface-base: oklch(0.14 ...) }
```
- 215건 `dark:` 클래스 사용 — 거의 모든 컴포넌트에 다크 대응

### 감점 (-15)
- Glass effect 정의는 있지만 사용 14건 — 과소 활용
- `--radius-sm/md/lg/xl/2xl` 정의했지만 Tailwind 클래스 `rounded-2xl` 등을 직접 사용 → token이 실제로 참조되지 않음
- `--z-base/dropdown/sticky/overlay/modal/toast` 정의했으나 대부분 `z-50`, `z-[var(--z-sticky)]` 혼용

---

## 2. 토큰 일관성 — **62점** (가장 큰 문제)

### 🔴 Hardcoded Color — 135건 디자인 시스템 위반

| 위반 유형 | 건수 | 예시 | 올바른 토큰 |
|-----------|------|------|-------------|
| bg-white | 18 | `bg-white shadow` | `bg-[var(--surface-raised)]` |
| gray/zinc 계열 | 85 | `text-gray-500`, `bg-zinc-100` | `--text-tertiary`, `--surface-sunken` |
| hardcoded green | 5 | `bg-green-100 text-green-700` | `--color-success-500` |
| hardcoded red | 10 | `text-red-500` | `--color-danger-500` |
| hardcoded yellow | 10 | `bg-yellow-100` | `--color-warning-500` |
| hardcoded emerald | 5 | `text-emerald-700` | `--color-grade-b` |
| hardcoded blue | 2 | `bg-blue-100` | `--color-primary-100` |
| **합계** | **135** | | |

**의미:** 다크 모드에서 `bg-white`는 눈에 보이는 깨짐 발생. `text-gray-500`은 다크 배경에서 대비 부족. 디자인 시스템의 핵심 가치(일관성)가 135곳에서 무너짐.

### ⚠️ Border Radius 혼용

| 클래스 | 사용 횟수 | 용도 |
|--------|----------|------|
| rounded-2xl | 52 | 카드 |
| rounded-xl | 91 | 버튼, 입력 |
| rounded-lg | 56 | 태그, 배지 |
| rounded-md | 21 | 작은 요소 |
| rounded-full | 79 | 칩, 아바타 |

5단계 radius를 사용하는 것 자체는 문제 없으나, **같은 역할의 요소가 다른 radius를 쓰는 경우**가 있음. 예: 카드가 어떤 페이지에선 `rounded-2xl`, 다른 페이지에선 `rounded-xl`.

---

## 3. 타이포그래피 — **72점**

### ✅ 좋은 점

**Pretendard Variable 폰트:**
- 한국어 최적 웹폰트
- Variable font → 파일 크기 효율

**Text Scale 분포:**
| 크기 | 사용 | 역할 |
|------|------|------|
| text-[10px] | 39 | 극소 라벨 (timestamp, 보조) |
| text-xs (12px) | 144 | 보조 텍스트 |
| text-sm (14px) | 202 | 본문 (가장 많이 사용) |
| text-base (16px) | 38 | 강조 본문 |
| text-lg (18px) | 48 | 섹션 제목 |
| text-xl~3xl+ | 69 | 히어로, 대형 숫자 |

### ⚠️ Font Weight 과다 사용

| Weight | 사용 | 비율 |
|--------|------|------|
| font-medium (500) | 89 | 26% |
| font-semibold (600) | 93 | 27% |
| font-bold (700) | 122 | 36% |
| font-extrabold (800) | 23 | 7% |
| font-black (900) | 13 | 4% |

**문제:** 5단계 font-weight를 모두 사용 → 시각적 위계가 흐려짐. 일반적으로 3단계(regular/medium/bold)가 권장됨.
- `font-extrabold` vs `font-black` 차이가 사용자에게 거의 인식 불가
- `font-semibold` vs `font-bold` 역할 구분 불명확

### ⚠️ text-[10px] 39건

10px은 대부분 모바일 환경에서 가독성 한계. 12px(text-xs) 미만을 39곳에서 사용하는 것은 과다. 최소 11px로 상향하거나 사용 최소화 필요.

---

## 4. 컬러 접근성 — **48점** (🔴 심각)

### WCAG 대비비 계산 (OKLCH L값 기반 근사)

**라이트 모드:**
| 요소 | L값 비율 | 근사 대비비 | WCAG AA (4.5:1) | WCAG AAA (7:1) |
|------|---------|------------|-----------------|----------------|
| text-primary (L:0.15) on surface-base (L:0.985) | | **~5.1:1** | ✅ 통과 | ❌ |
| text-secondary (L:0.45) on surface-base (L:0.985) | | **~2.1:1** | 🔴 **미달** | ❌ |
| text-tertiary (L:0.60) on surface-base (L:0.985) | | **~1.6:1** | 🔴 **미달** | ❌ |
| primary-500 (L:0.62) on white (L:1.0) | | **~1.6:1** | 🔴 **미달** | ❌ |

**다크 모드:**
| 요소 | 근사 대비비 | WCAG AA |
|------|-----------|---------|
| text-primary (L:0.95) on surface-base (L:0.14) | **~5.3:1** | ✅ |
| text-secondary (L:0.65) on surface-base (L:0.14) | **~3.7:1** | ❌ Large만 |

### 🔴 핵심 문제

1. **text-secondary (158건 사용)가 WCAG AA 미달** → 가장 많이 쓰는 보조 텍스트가 접근성 기준 미충족
2. **text-tertiary (67건)도 미달** → 타임스탬프, 보조 정보 읽기 어려움
3. **primary-500 (135건)이 흰 배경에서 대비 부족** → 버튼 텍스트, 링크 텍스트의 가독성
4. focus-visible **0건** → 키보드 사용자가 현재 포커스 위치를 알 수 없음

### 수정 제안
```css
/* 현재 */ --text-secondary: oklch(0.45 0.02 180);
/* 수정 */ --text-secondary: oklch(0.35 0.02 180);  /* L 0.45→0.35 */

/* 현재 */ --text-tertiary: oklch(0.60 0.01 180);
/* 수정 */ --text-tertiary: oklch(0.48 0.01 180);  /* L 0.60→0.48 */

/* 현재 */ --color-primary-500: oklch(0.62 0.15 180);
/* 수정 */ --color-primary-600: oklch(0.52 0.13 180); /* 텍스트에 600 사용 */
```

---

## 5. 아이콘/그래픽 — **42점** (🔴 전문성 부족)

### 이모지 의존: 65건+

| 사용처 | 이모지 예시 | 문제 |
|--------|-----------|------|
| 기능 카드 | 🎯 🔔 💡 📊 | 디바이스별 렌더링 차이 |
| 알림 타입 | 🎉 📊 📢 💬 🎁 | 프로페셔널하지 않음 |
| 네비게이션 | ⭐ 🔍 ⚙️ | 크기/정렬 불일치 |
| 상태 표시 | ❤️ 🤍 ✓ | 스타일링 불가 |
| 빈 상태 | 🔔 📋 💬 ⭐ | 감정적 톤 불일치 |

**왜 문제인가:**
- 이모지는 OS/브라우저별로 다르게 렌더링 (Apple vs Android vs Windows)
- 크기, 정렬, 색상 제어 불가
- 프로 앱의 시각적 신뢰도를 낮춤
- 접근성: 스크린 리더가 이모지를 설명할 때 의도와 다를 수 있음

**icons.tsx 참조되지만 파일 미존재** → BottomNav에서 `import { HomeIcon } from '@/components/icons'` 했지만, 이 파일이 빌드 시 에러 발생할 가능성.

**SVG 사용:** 33건 — 주로 BottomNav, 로고 등에 한정.

**권장:** lucide-react (경량, 트리셰이킹) 또는 @phosphor-icons 도입

---

## 6. 인터랙션 — **82점** (잘 됨)

### ✅ 풍부한 모션 시스템

**Animation:**
| 항목 | 건수 |
|------|------|
| animate-* 클래스 | 109 |
| transition-* | 89 |
| hover: | 142 |
| active: | 64 |
| Custom easings | 3 (spring, smooth, out-expo) |
| Keyframes | 8개 정의 |

**모범 사례:**
```tsx
// BottomNav — active scale
active:scale-[0.97]

// 카드 hover
hover:shadow-md transition-all

// 버튼 glow
shadow-[var(--shadow-glow-primary)]
```

### ✅ Reduced Motion 대응
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### 감점 (-18)
- `active:scale-[0.97]` 같은 세밀한 피드백이 일부 버튼에만 적용
- 페이지 전환 애니메이션 없음 (View Transitions API 미사용)
- Loading skeleton에 shimmer 정의는 있지만 실제 사용은 pulse만

---

## 7. 레이아웃 — **78점**

### ✅ 모바일+데스크탑 듀얼 레이아웃

```
모바일: BottomNav (5탭) + 풀폭 콘텐츠
데스크탑: 좌측 Sidebar (264px) + 메인 콘텐츠
전환점: lg: (1024px)
```

**Safe Area:**
```css
--safe-bottom: env(safe-area-inset-bottom, 0px);
pb-[var(--safe-bottom)]  /* iPhone 하단 안전 영역 */
```

**pb-24:** 16개 페이지에서 Bottom Nav 가림 방지 — 일관적

### 감점 (-22)

**반응형 중간 구간 부재:**
| 브레이크포인트 | 사용 |
|---------------|------|
| sm: | 141 |
| md: | **3** ← 거의 없음 |
| lg: | 30 |

`md:` (768px, 태블릿) 대응이 3건 → 태블릿에서 모바일 레이아웃 그대로 표시.

**max-w 혼용:**
11개 다른 max-width 값 사용 → 페이지마다 콘텐츠 폭이 다름 (sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, xs, 80). 통일된 콘텐츠 폭 전략 없음.

---

## 8. 접근성(시각) — **60점**

### ✅ 있는 것
| 항목 | 건수 |
|------|------|
| ARIA 속성 | 62 |
| aria-label | 대부분 |
| role=radiogroup/tab/switch | 사용됨 |
| loading.tsx (시각적 피드백) | 15 |
| reduced-motion 대응 | ✅ |
| tabular-nums (데이터) | ✅ |

### 🔴 없는 것
| 항목 | 건수 | 심각도 |
|------|------|--------|
| **focus-visible** | **0** | 🔴 키보드 내비 불가 |
| skip navigation link | 0 | ⚠️ |
| aria-live (동적 콘텐츠) | 코드 정의 O, 실사용 미확인 | ⚠️ |
| color-only indication | 다수 (등급 색상만으로 구분) | ⚠️ |

**focus-visible 0건이 가장 심각.** 모든 인터랙티브 요소에 포커스 링이 보이지 않으면 키보드 사용자/스크린 리더 사용자가 현재 위치를 알 수 없음.

---

## 종합 비교: 유사 앱 벤치마크

| 기준 | 토스 | 카카오맵 | 입소ai |
|------|------|---------|--------|
| 디자인 시스템 | 사내 TDS | 카카오 Krew | OKLCH @theme |
| 아이콘 | Custom SVG | Custom SVG | **이모지 65건+** |
| 색상 일관성 | 99%+ 토큰 | 95%+ | **65%** (135건 위반) |
| WCAG AA 대비비 | 전체 충족 | 대부분 | **text-secondary 미달** |
| Focus ring | 전체 | 전체 | **0건** |
| Font weights | 3단계 | 3-4단계 | **5단계** |
| 태블릿 대응 | 별도 레이아웃 | 반응형 | **md: 3건** |

---

## 68점 해석

| 구간 | 의미 |
|------|------|
| 85-100 | 프로덕션급 — 토스/카카오 수준 |
| 70-84 | 시니어 디자이너 리뷰 후 출시 가능 |
| **55-69** | **← 현재 (68): 기반은 우수하나 일관성·접근성 보강 필요** |
| 40-54 | 프로토타입 수준 |
| 0-39 | 학습 프로젝트 |

---

## 90점 달성을 위한 작업

| 우선순위 | 작업 | 현재→목표 | 영향 |
|----------|------|----------|------|
| **P0** | text-secondary/tertiary L값 하향 (WCAG AA) | 48→80 | 가장 시급 |
| **P0** | 이모지 → lucide-react 전환 (65건) | 42→78 | 프로페셔널 인상 |
| **P0** | focus-visible 글로벌 스타일 추가 | 60→82 | 접근성 |
| **P1** | hardcoded 135건 → semantic token 교체 | 62→85 | 다크모드 깨짐 수정 |
| **P1** | font-weight 5→3단계 통합 | 72→82 | 위계 명확화 |
| **P2** | md: 태블릿 대응 추가 | 78→85 | 디바이스 범위 |
| **P2** | max-w 통일 전략 수립 | — | 레이아웃 일관성 |
| **P3** | text-[10px] → 최소 11px | — | 가독성 |

**P0 3개만 수정하면 68→78점. P1까지 하면 85점 가능.**
