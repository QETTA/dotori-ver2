# 도토리 (dotori) — Brand Identity & Design System
## Claude Code Reference v2.0 · February 2026

> 이 문서는 Claude Code가 도토리 앱 개발 시 참조하는 **단일 진실의 원천(Single Source of Truth)**입니다.
> 로고, 컬러, 타이포, 컴포넌트 패턴, 에셋 사용 규칙을 모두 포함합니다.

---

## 1. 브랜드 개요

### 1.1 도토리란?
- **서비스:** AI 기반 어린이집 입소 전략 앱
- **타겟:** 한국 육아맘 (25-40세)
- **핵심 가치:** "AI가 찾아주는 어린이집" — 복잡한 어린이집 입소 과정을 AI가 자동화
- **톤:** 따뜻하지만 전문적, 귀엽지만 유치하지 않음

### 1.2 브랜드 퍼스낼리티
| 축 | 위치 | 설명 |
|---|---|---|
| 따뜻함 ←→ 차가움 | 70% 따뜻함 | 육아 맥락이므로 따뜻함 우세, 하지만 AI 전문성 유지 |
| 캐주얼 ←→ 포멀 | 60% 캐주얼 | 앱은 캐주얼, B2B는 포멀 (듀얼 시스템) |
| 장난스러움 ←→ 진지함 | 55% 장난 | 캐릭터가 있지만 과하지 않은 절제 |

---

## 2. 로고 시스템

### 2.1 듀얼 심볼 체계

#### β 캐릭터 (Character) — 사용자 접점용
- 얼굴 있는 도토리 (눈, 미소, 볼터치)
- **사용처:** 앱 아이콘, 스플래시, 토리챗 아바타, 소셜미디어, 마케팅
- **단독 사용 가능** ✓

#### Corporate — B2B/공식 문서용
- 얼굴 없는 도토리 실루엣 (동일 형태, 표정만 제거)
- **사용처:** 제안서, IR, 정부 서류, 특허, 명함 앞면, 파트너 공동 브랜딩
- **⚠️ 반드시 워드마크와 함께 사용 (단독 금지)**

### 2.2 심볼 구조 스펙

```
기본 좌표계: viewBox="-40 -60 80 100" (심볼 중심 = 0,0)

Body (몸통)
  shape: ellipse
  cx: 0, cy: 6, rx: 33, ry: 31
  ratio: 1.065:1 (가로 약간 넓음 = "통통한 도토리")
  fill: radialGradient
    cx: 0.40, cy: 0.32, r: 0.60
    stop 0%:   #dab080 (밝은 베이지)
    stop 55%:  #c8956a (메인 브라운)
    stop 100%: #a87848 (어두운 브라운)

Highlight (미세 하이라이트)
  shape: ellipse
  cx: -10, cy: -4, rx: 10, ry: 14
  fill: white, opacity: 0.06
  transform: rotate(-10)

Cap (모자)
  shape: path (Quadratic Bézier)
  d: "M-31,-15 Q-31,-39 0,-41 Q31,-39 31,-15 Q18,-7 0,-7 Q-18,-7 -31,-15Z"
  fill: linearGradient
    x1: 0.1, y1: 0.1, x2: 0.9, y2: 0.9
    stop 0%:   #aa8462
    stop 100%: #7a5438

Cap Texture (모자 줄)
  line 1: "M-23,-22 Q-10,-18 0,-18 Q10,-18 23,-22"
    stroke: #8a6440, width: 0.55, opacity: 0.25
  line 2: "M-26,-27 Q-12,-22 0,-22 Q12,-22 26,-27"
    stroke: #8a6440, width: 0.4, opacity: 0.15

Stem (줄기)
  d: "M-3,-41 Q-4.5,-50 -2.5,-53.5 Q0,-55 2.5,-53.5 Q4.5,-50 3,-41"
  fill: #7a5438
  highlight: "M-0.5,-50 Q0,-47 0.5,-43" stroke: #96704a, width: 0.4, opacity: 0.25

Eyes (눈) — 캐릭터 β only
  shape: circle
  left:  cx: -9,  cy: 6, r: 2.7
  right: cx:  9,  cy: 6, r: 2.7
  fill: #4a3018

Eye Highlights (눈 하이라이트) — 캐릭터 β only
  left:  cx: -10, cy: 4.5, r: 0.9
  right: cx:   8, cy: 4.5, r: 0.9
  fill: white, opacity: 0.45

Smile (미소) — 캐릭터 β only
  d: "M-7,14 Q0,20.5 7,14"
  stroke: #4a3018, width: 1.8, linecap: round, fill: none

Blush (볼터치) — 캐릭터 β only
  left:  cx: -16, cy: 10.5, rx: 5.5, ry: 2.8
  right: cx:  16, cy: 10.5, rx: 5.5, ry: 2.8
  fill: #d4907a, opacity: 0.16
```

### 2.3 사이즈 적응 규칙

| 렌더 사이즈 | 버전 | 변경사항 |
|------------|------|---------|
| ≥48px | Full | 모든 레이어 (텍스처, 볼터치, 하이라이트) |
| 32–47px | Simplified | 볼터치 제거, 눈 r×1.3, 미소 sw×1.4 |
| 24–31px | Simplified+ | + 모자 텍스처 제거, 줄기 하이라이트 제거 |
| 16–23px | Favicon | 줄기 제거, 눈 r×2, 미소 sw×2.5, 배경 radius 증가 |

### 2.4 워드마크

```
영문 (Primary):
  font: 'Plus Jakarta Sans'
  weight: 800
  letter-spacing: -0.8px
  text: "dotori"

한글 (Official Alt):
  font: 'Pretendard' (fallback: 'Noto Sans KR')
  weight: 900
  letter-spacing: -0.5px
  text: "도토리"

태그라인:
  font: 'Pretendard' (fallback: 'Noto Sans KR')
  weight: 400
  letter-spacing: 1.2px
  text: "AI 어린이집 입소 전략"
```

### 2.5 록업 (Lockup) 규칙

```
수평 록업:
  [심볼] — gap: 심볼 너비의 20% — [워드마크 + 태그라인]

수직 록업:
  [심볼]
  gap: 심볼 높이의 15%
  [워드마크]
  [태그라인]

Safe Zone: 심볼 높이의 25% 사방 여백
최소 사이즈: 심볼 단독 16px / 수평 록업 120px / 수직 록업 100px
```

---

## 3. 컬러 시스템

### 3.1 Acorn 팔레트 (Primary)

```css
--dotori-50:  #faf7f2;  /* Cream — 배경, 스플래시 */
--dotori-100: #f5ede0;  /* 라이트 서피스 */
--dotori-200: #e8d5be;  /* 보더, 디바이더 */
--dotori-300: #d4b48e;  /* 비활성 텍스트 */
--dotori-400: #c8956a;  /* ★ 브랜드 메인 — 버튼, 강조 */
--dotori-500: #b07a4a;  /* 텍스트에 안전한 브랜드색 (AA 통과) */
--dotori-600: #96633a;  /* 호버 상태 */
--dotori-700: #7a4e30;  /* 액티브 상태 */
--dotori-800: #5a3a24;  /* 서브 텍스트 */
--dotori-900: #2d2418;  /* ★ 다크 — 메인 텍스트, 다크 배경 */
```

### 3.2 Cap 팔레트 (Secondary)

```css
--cap-light:   #d4a878;
--cap-mid:     #a07050;
--cap-dark:    #7a5438;
--cap-texture: #8a6440;
```

### 3.3 Forest 팔레트 (Accent — 성공/성장)

```css
--forest-50:  #e8f5e4;  /* 성공 배경 */
--forest-100: #c8e4c0;
--forest-400: #6a9a60;  /* 성공 아이콘 */
--forest-500: #4a7a42;  /* ★ 성공 메인 — TO 알림, 확인 */
--forest-600: #3a6034;  /* 호버 */
```

### 3.4 Semantic Colors

```css
--color-bg-primary:    var(--dotori-50);   /* #faf7f2 */
--color-bg-surface:    #ffffff;
--color-bg-dark:       var(--dotori-900);  /* #2d2418 */
--color-text-primary:  var(--dotori-900);  /* #2d2418 */
--color-text-secondary: var(--dotori-800); /* #5a3a24 */
--color-text-muted:    #8a7a6a;
--color-brand:         var(--dotori-400);  /* #c8956a */
--color-brand-safe:    var(--dotori-500);  /* #b07a4a — AA 통과 */
--color-success:       var(--forest-500);  /* #4a7a42 */
--color-blush:         #d4907a;
--color-border:        var(--dotori-200);  /* #e8d5be */
--color-border-light:  #f0ebe2;
```

### 3.5 앱 아이콘 그라데이션

```css
/* 워밍 버전 (v2 확정) */
--icon-gradient-from: #e8b878;  /* 좌상단 */
--icon-gradient-to:   #b87840;  /* 우하단 */

/* 역상 심볼 (아이콘 위의 도토리) */
--icon-body:    #f5e8d8;
--icon-cap:     #e8cdb0;
--icon-eyes:    #a07858;
--icon-texture: #d4b898;
```

### 3.6 WCAG 접근성 명암비

| 조합 | 비율 | 등급 | 용도 |
|------|:----:|:----:|------|
| a900 on a50 | 14.8:1 | AAA ✓ | 메인 텍스트 |
| a900 on white | 15.2:1 | AAA ✓ | 카드 내 텍스트 |
| a500 on white | 4.1:1 | AA ✓ | 브랜드 텍스트 (14px+ bold) |
| a400 on a900 | 4.7:1 | AA ✓ | 다크모드 강조 |
| a100 on a900 | 11.2:1 | AAA ✓ | 다크모드 텍스트 |
| ⚠️ a400 on white | 3.2:1 | Fail | 텍스트 금지 → a500 대체 |

### 3.7 CMYK / Pantone (인쇄용)

| HEX | CMYK | Pantone 근사 | 용도 |
|-----|------|-------------|------|
| #c8956a | C:0 M:32 Y:52 K:22 | 722C | 브랜드 메인 |
| #aa8462 | C:0 M:28 Y:48 K:33 | 4655C | 모자 밝은 |
| #7a5438 | C:0 M:38 Y:58 K:52 | 7568C | 모자 어두운 |
| #2d2418 | C:0 M:22 Y:40 K:82 | Black 7C | 다크 |
| #4a7a42 | C:55 M:0 Y:60 K:38 | 364C | Forest |

---

## 4. 타이포그래피

### 4.1 폰트 스택

```css
/* 전역 */
font-family: 'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;

/* 워드마크 전용 */
font-family: 'Plus Jakarta Sans', 'Pretendard', 'Noto Sans KR', sans-serif;
```

### 4.2 Type Scale

```css
--text-display:  32px / 900 / -0.5px;  /* 페이지 제목 */
--text-h1:       24px / 800 / -0.3px;  /* 섹션 제목 */
--text-h2:       20px / 700 / 0;       /* 카드 제목 */
--text-h3:       16px / 700 / 0;       /* 서브 제목 */
--text-body:     15px / 400 / 0;       /* 본문 */
--text-body-sm:  13px / 400 / 0;       /* 보조 본문 */
--text-caption:  11px / 400 / 0.5px;   /* 캡션 */
--text-label:    10px / 700 / 1px;     /* 라벨, 배지 */
```

---

## 5. 앱 디자인 토큰

### 5.1 Spacing

```css
--space-xs:  4px;
--space-sm:  8px;
--space-md:  16px;
--space-lg:  24px;
--space-xl:  32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

### 5.2 Border Radius

```css
--radius-sm:   8px;   /* 칩, 배지 */
--radius-md:   12px;  /* 입력 필드 */
--radius-lg:   16px;  /* 카드 */
--radius-xl:   20px;  /* 모달 */
--radius-2xl:  24px;  /* 바텀시트 */
--radius-full: 9999px; /* 버튼, 태그 */
```

### 5.3 Shadow

```css
--shadow-sm:  0 1px 2px rgba(45, 36, 24, 0.04);
--shadow-md:  0 2px 8px rgba(45, 36, 24, 0.06);
--shadow-lg:  0 4px 16px rgba(45, 36, 24, 0.08);
--shadow-xl:  0 8px 32px rgba(45, 36, 24, 0.10);
```

### 5.4 주요 컴포넌트 패턴

```
Primary Button:
  bg: var(--dotori-400)  →  hover: var(--dotori-600)
  text: white
  radius: var(--radius-full)
  padding: 14px 28px
  font: 15px / 700

Secondary Button:
  bg: transparent
  border: 1px solid var(--dotori-200)
  text: var(--dotori-800)
  radius: var(--radius-full)

Card:
  bg: white
  radius: var(--radius-lg)
  shadow: var(--shadow-sm)
  border: none (또는 1px solid var(--color-border-light))

Input:
  bg: white
  border: 1.5px solid var(--dotori-200)
  radius: var(--radius-md)
  focus-border: var(--dotori-400)
  padding: 12px 16px

Toast / Alert:
  success: bg var(--forest-50), text var(--forest-500)
  info: bg var(--dotori-50), text var(--dotori-800)

Badge (TO 알림):
  bg: var(--forest-500)
  text: white
  radius: var(--radius-full)
  font: var(--text-label)

Navigation Bar:
  bg: white (light) / var(--dotori-900) (dark)
  active-icon: var(--dotori-400)
  inactive-icon: var(--dotori-300)
```

---

## 6. 모션

### 6.1 이징 곡선

```css
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);  /* 등장 */
--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94); /* 일반 전환 */
--ease-exit:   cubic-bezier(0.55, 0.06, 0.68, 0.19); /* 퇴장 */
```

### 6.2 스플래시 타임라인

```
0ms     — 크림 배경 즉시
200ms   — 심볼 bounce in (scale 0.4→1, opacity 0→1)
500ms   — 눈 fade in
650ms   — 미소 fade in
750ms   — 볼터치 fade in
900ms   — 워드마크 slide up
1200ms  — 완성. breathing 시작
~3000ms — 앱 준비 완료 시 전체 fade out (400ms)
```

### 6.3 일반 전환

```css
/* 페이지 전환 */
transition: opacity 250ms var(--ease-smooth), transform 250ms var(--ease-smooth);

/* 버튼 호버 */
transition: background-color 150ms ease, transform 100ms ease;

/* 카드 터치 */
transform: scale(0.98); transition: 100ms ease;

/* 토리챗 메시지 등장 */
animation: slide-up 300ms var(--ease-bounce);
```

---

## 7. 에셋 목록 & 사용 치트시트

### 7.1 SVG 에셋

| 파일 | 유형 | 용도 | 제약 |
|------|------|------|------|
| `dotori-symbol.svg` | CHAR | 토리챗 아바타, 소셜 프로필 | 단독 OK |
| `dotori-symbol-corporate.svg` | CORP | 제안서·IR 심볼 | ⚠️ 워드마크 필수 |
| `dotori-symbol-mono-dark.svg` | MONO | 흑백 (팩스, 도장, 엠보싱) | 단색 #2d2418 |
| `dotori-symbol-mono-white.svg` | MONO | 흰색 (어두운 배경, 영상) | 단색 white |
| `dotori-lockup-horizontal.svg` | CHAR | 스플래시, 헤더, 마케팅 | — |
| `dotori-lockup-horizontal-kr.svg` | CHAR | 한글 워드마크 수평 (국내 마케팅) | — |
| `dotori-lockup-corporate.svg` | CORP | 제안서, 명함 앞면 | — |
| `dotori-lockup-stacked.svg` | CHAR | 스플래시, 세로 배치 | — |
| `dotori-lockup-stacked-corporate.svg` | CORP | 포멀 세로 배치 | — |
| `dotori-app-icon-warm.svg` | WARM | 앱 아이콘 (메인) | 512px export |
| `dotori-app-icon-dark.svg` | CHAR | 앱 아이콘 다크 | Android 다크테마 |
| `dotori-app-icon-simplified.svg` | SIMPLE | ≤40px 전용 | 파비콘, 탭바 |
| `dotori-app-icon-legacy.svg` | LEGACY | v1 기본 아이콘 | 참고용. warm 사용 권장 |
| `dotori-favicon.svg` | SIMPLE | 브라우저 탭 파비콘 | 32×32 export |
| `dotori-og-image.svg` | — | OG Image 링크 미리보기 | 1200×630 export |
| `dotori-social-profile-gradient.svg` | SOCIAL | 인스타/유튜브 | 원형 |
| `dotori-social-profile-cream.svg` | SOCIAL | 카카오/네이버 | 원형 |
| `dotori-email-signature.svg` | UTIL | 이메일 시그니처 | — |
| `dotori-watermark.svg` | UTIL | 문서 워터마크 | opacity 6% |
| `dotori-empty-state.svg` | ILLUST | 빈 화면 (잠자는 도토리) | — |
| `dotori-error-state.svg` | ILLUST | 오류 화면 (당황한 도토리) | — |

### 7.2 결정 플로차트

```
사용자가 보는 화면인가?
  ├─ YES → 캐릭터 β (CHAR) 사용
  └─ NO (비즈니스 문서) → Corporate (CORP) + 워드마크

렌더 사이즈가 40px 이하인가?
  ├─ YES → Simplified (SIMPLE) 사용
  └─ NO → Full 사용

앱 아이콘인가?
  ├─ YES → dotori-app-icon-warm.svg (밝은 모드)
  │        dotori-app-icon-dark.svg (다크 모드)
  └─ NO → 상황별 선택

인쇄물인가?
  ├─ YES → CMYK 값 사용 (섹션 3.7 참조)
  └─ NO → RGB/HEX 사용
```

---

## 8. 금지 사항

```
❌ 검정 아웃라인(stroke) 추가
❌ 그라데이션을 단색으로 대체
❌ 심볼 회전/기울이기/뒤집기
❌ Drop shadow 추가
❌ 3D 효과
❌ 워드마크-심볼 간격 임의 변경
❌ 복잡한 패턴/사진 위 직접 배치 (반투명 오버레이 필수)
❌ 얼굴 표정 변형 (눈 크기, 미소 곡선 = 고정값)
❌ Corporate 심볼 단독 사용 (워드마크 동반 필수)
❌ 캐릭터 β와 Corporate 같은 문서에 혼용
❌ 다른 캐릭터와 나란히 배치 (세계관 충돌)
❌ a400(#c8956a)을 작은 텍스트에 사용 (AA 미달 → a500 대체)
```

---

## 9. 소셜 미디어 가이드

| 플랫폼 | 프로필 형태 | 배경 | 심볼 |
|--------|-----------|------|------|
| Instagram | 원형 마스크 | 그라데이션 (#e8b878→#b87840) | 역상 (크림톤) |
| 카카오 채널 | 원형 마스크 | 크림 (#faf7f2) | 풀컬러 (그라데이션) |
| 네이버 블로그 | 원형 마스크 | 다크 (#1a1a2e) | 풀컬러 |
| YouTube | 정사각 라운드 | 그라데이션 | 역상 |

---

## 10. 공동 브랜딩

```
규칙:
  - Corporate 심볼만 사용 (캐릭터 β 금지)
  - × 기호 또는 간격(심볼 너비 2배)으로 분리
  - 양쪽 로고 높이 동일
  - 도토리가 항상 왼쪽(1순위)

  [dotori logo] × [Partner logo]
```

---

## 11. 브랜드 보이스 & 톤

### 11.1 커뮤니케이션 원칙

```
따뜻하지만 전문적:
  ✓ "우리 아이에게 딱 맞는 어린이집을 찾아볼게요"
  ✗ "AI가 최적의 어린이집을 매칭합니다" (너무 기계적)
  ✗ "아이 어린이집 찾는 거 도와줄게~" (너무 캐주얼)

신뢰를 주되 과장하지 않기:
  ✓ "TO 발생 확률을 예측해드려요"
  ✗ "100% 입소를 보장합니다" (과장)

공감 먼저, 정보 다음:
  ✓ "대기 순번이 밀렸군요. 다른 좋은 선택지가 있어요."
  ✗ "대기 순번: 47번. 다른 어린이집 목록:" (무감정)
```

### 11.2 UI 문구 톤

```
일반 안내:  존댓말 + 부드러운 종결 ("~해요", "~드려요")
에러:      공감 + 해결책 ("아이고, 연결이 끊겼어요. 다시 시도해볼게요")
축하:      감탄 + 이모지 절제 ("축하해요! TO가 발생했어요 🌰")
경고:      명확하지만 공손 ("이 정보는 실시간이 아닐 수 있어요")
빈 상태:   격려 ("아직 등록된 어린이집이 없어요. 같이 찾아볼까요?")
```

### 11.3 이모지 사용

```
허용: 🌰 (도토리 = 브랜드 시그니처), 🎉 (축하), ✅ (확인)
절제: 👶, 🏫, 📋 (상황에 따라)
금지: 😭, 💀, 🔥, 😱 (과격/공포), 🤖 (AI감 너무 강조)
```

---

## 12. 일러스트레이션 시스템

### 11.1 표정 변형 (4종만 허용)

```
기본 (β):     눈=원형, 미소=위곡선, 볼터치=16%  → 일반 UI, 마케팅
잠자기 (empty): 눈=감은곡선, 입=미세곡선, Zzz      → 빈화면, 검색0건
당황 (error):   눈=1.5배, 입=물결선, 땀방울, ?       → 404, 서버오류
무표정 (corp):  눈/입 없음                           → B2B 문서
```

### 11.2 앱 내 사용

```
빈 리스트:     empty-state.svg + "아직 등록된 어린이집이 없어요"
검색 0건:     empty-state.svg + "검색 결과가 없어요"
네트워크 오류: error-state.svg + "인터넷 연결을 확인해주세요"
서버 오류:     error-state.svg + "잠시 후 다시 시도해주세요"
404:          error-state.svg + "페이지를 찾을 수 없어요"
```

---

## 13. 버전 이력

| 버전 | 날짜 | 변경 |
|------|------|------|
| v1.0 | 2026-02-19 | 초기 5개 컨셉 |
| v1.5 | 2026-02-19 | 2개 압축 (A캐릭터 / B쉴드) |
| v1.8 | 2026-02-19 | A의 β 변형 확정 |
| v2.0 | 2026-02-20 | 16건 보완. Corporate, Simplified, 접근성, CMYK, 모션, 폰트 스택 |
| v2.2 | 2026-02-20 | 교차검수. SVG ID fix, 폰트 통일, +8 에셋(mono/kr/email/watermark/illust) |

---

*이 문서는 /brand/DOTORI_DESIGN_SYSTEM.md 로 Git에 보관합니다.*
*모든 에셋은 /brand/assets/ 하위에 위치합니다.*
