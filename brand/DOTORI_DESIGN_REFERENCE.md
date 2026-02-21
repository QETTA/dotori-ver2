# DOTORI_DESIGN_REFERENCE.md
# Claude Code용 디자인 레퍼런스 — 이 파일을 Claude Code 프로젝트에 포함시키세요

## 브랜드 요약
- 서비스: dotori (도토리) — AI 기반 어린이집 입소 전략 앱
- 톤: 따뜻하지만 전문적, 귀엽지만 유치하지 않음
- 로고: "살아있는 도토리" 캐릭터 (갈색 도토리 + 미소 표정)

## 컬러 토큰
```css
:root {
  /* Primary — Acorn */
  --dotori-50:  #faf7f2;
  --dotori-100: #f5ede0;
  --dotori-200: #e8d5be;
  --dotori-300: #d4b48e;
  --dotori-400: #c8956a;  /* ★ 브랜드 메인 */
  --dotori-500: #b07a4a;  /* 텍스트 안전 (AA) */
  --dotori-600: #96633a;
  --dotori-700: #7a4e30;
  --dotori-800: #5a3a24;
  --dotori-900: #2d2418;  /* ★ 다크 */

  /* Forest — 성공/성장 */
  --forest-50:  #e8f5e4;
  --forest-400: #6a9a60;
  --forest-500: #4a7a42;  /* ★ 성공 메인 */
  --forest-600: #3a6034;

  /* Semantic */
  --color-bg:        var(--dotori-50);
  --color-surface:   #ffffff;
  --color-text:      var(--dotori-900);
  --color-text-sub:  var(--dotori-800);
  --color-text-muted:#8a7a6a;
  --color-brand:     var(--dotori-400);
  --color-brand-text:var(--dotori-500);
  --color-success:   var(--forest-500);
  --color-border:    var(--dotori-200);
  --color-border-lt: #f0ebe2;

  /* App Icon Gradient */
  --icon-from: #e8b878;
  --icon-to:   #b87840;
}
```

## 폰트
```css
/* 전역 */
font-family: 'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;

/* 워드마크 전용 */
.dotori-wordmark {
  font-family: 'Plus Jakarta Sans', 'Pretendard', sans-serif;
  font-weight: 800;
  letter-spacing: -0.8px;
}

/* 태그라인 */
.dotori-tagline {
  font-weight: 400;
  letter-spacing: 1.2px;
  color: var(--dotori-500);
}
```

## 타이포 스케일
```
Display: 32px/900/-0.5px   (페이지 제목)
H1:      24px/800/-0.3px   (섹션)
H2:      20px/700/0        (카드 제목)
H3:      16px/700/0        (서브)
Body:    15px/400/0        (본문)
Body-sm: 13px/400/0        (보조)
Caption: 11px/400/0.5px    (캡션)
Label:   10px/700/1px      (배지)
```

## 간격
```
xs:4  sm:8  md:16  lg:24  xl:32  2xl:48  3xl:64
```

## 라운드
```
sm:8  md:12  lg:16  xl:20  2xl:24  full:9999
```

## 그림자
```css
--shadow-sm: 0 1px 2px rgba(45,36,24,0.04);
--shadow-md: 0 2px 8px rgba(45,36,24,0.06);
--shadow-lg: 0 4px 16px rgba(45,36,24,0.08);
--shadow-xl: 0 8px 32px rgba(45,36,24,0.10);
```

## 컴포넌트 패턴
```
Primary Button:
  bg: dotori-400 → hover: dotori-600
  text: white, radius: full, padding: 14px 28px, font: 15px/700

Secondary Button:
  bg: transparent, border: 1px dotori-200
  text: dotori-800, radius: full

Card:
  bg: white, radius: lg(16px), shadow: sm, border: none

Input:
  bg: white, border: 1.5px dotori-200, radius: md(12px)
  focus: dotori-400, padding: 12px 16px

Toast Success: bg forest-50, text forest-500
Toast Info: bg dotori-50, text dotori-800

Badge (TO알림): bg forest-500, text white, radius full

NavBar active: dotori-400 / inactive: dotori-300
```

## 모션
```css
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-exit:   cubic-bezier(0.55, 0.06, 0.68, 0.19);

/* 페이지 전환: 250ms smooth */
/* 버튼 호버: 150ms ease */
/* 카드 터치: scale(0.98) 100ms */
/* 챗 메시지: slide-up 300ms bounce */
```

## 접근성 주의
- ⚠️ dotori-400(#c8956a) 흰 배경 텍스트 금지 (3.2:1 AA Fail)
- ✓ dotori-500(#b07a4a) 사용 (4.1:1 AA Pass)
- ✓ dotori-900 on dotori-50 = 14.8:1 AAA

## 로고 에셋 (brand/ 폴더)
| 파일 | 용도 |
|------|------|
| symbol.svg | 캐릭터 아바타, 소셜 |
| symbol-corporate.svg | B2B 문서 (⚠️ 워드마크 필수) |
| symbol-mono-dark.svg | 흑백 다크 (팩스, 도장, 엠보싱) |
| symbol-mono-white.svg | 흰색 (어두운 배경, 영상 로워써드) |
| lockup-horizontal.svg | 앱 헤더, 마케팅 (EN) |
| lockup-horizontal-kr.svg | 한글 워드마크 수평 (국내 마케팅) |
| lockup-corporate.svg | 수평 Corporate (제안서, 명함) |
| lockup-stacked.svg | 스플래시, 세로 배치 (EN) |
| lockup-stacked-corporate.svg | 수직 Corporate |
| app-icon-warm.svg | ★ 앱 아이콘 메인 |
| app-icon-dark.svg | 다크모드 아이콘 |
| app-icon-simplified.svg | ≤40px 전용 |
| favicon.svg | 브라우저 탭 |
| og-image.svg | 링크 공유 미리보기 |
| social-profile-gradient.svg | 인스타/유튜브 프로필 |
| social-profile-cream.svg | 카카오/네이버 프로필 |
| email-signature.svg | 이메일 하단 시그니처 |
| watermark.svg | 문서 배경 워터마크 (6%) |
| empty-state.svg | 빈 화면 (잠자는 도토리) |
| error-state.svg | 오류 화면 (당황한 도토리) |

## 일러스트 표정 시스템
```
기본 (β):     눈=원형, 미소=위곡선    → 일반 UI
잠자기:       눈=감은곡선, Zzz         → empty-state
당황:         눈=1.5배, 물결입, 땀방울  → error-state
무표정:       눈/입 없음              → corporate
```

## 브랜드 보이스
```
톤: 따뜻+전문적. 존댓말. "~해요" "~드려요"
에러: 공감 먼저 → "아이고, 연결이 끊겼어요. 다시 시도해볼게요"
축하: "축하해요! TO가 발생했어요 🌰"
빈상태: 격려 → "아직 등록된 어린이집이 없어요. 같이 찾아볼까요?"
이모지: 🌰(시그니처) 🎉(축하) ✅(확인) 만 허용. 😭💀🔥 금지.
```

## 금지사항
- stroke/outline 추가 금지
- 그라데이션→단색 대체 금지
- 회전/기울이기/뒤집기 금지
- drop-shadow, 3D 금지
- 사진 위 직접 배치 금지 (오버레이 필수)
- dotori-400을 소형 텍스트에 사용 금지
