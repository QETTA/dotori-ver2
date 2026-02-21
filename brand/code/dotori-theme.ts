// dotori-theme.ts — Tailwind CSS 테마 확장
// Next.js 프로젝트의 tailwind.config.ts에 merge하세요

const dotoriTheme = {
  colors: {
    dotori: {
      50:  '#faf7f2',
      100: '#f5ede0',
      200: '#e8d5be',
      300: '#d4b48e',
      400: '#c8956a', // ★ 브랜드 메인
      500: '#b07a4a', // 텍스트 안전 (AA)
      600: '#96633a',
      700: '#7a4e30',
      800: '#5a3a24',
      900: '#2d2418', // ★ 다크
    },
    forest: {
      50:  '#e8f5e4',
      100: '#c8e4c0',
      400: '#6a9a60',
      500: '#4a7a42', // ★ 성공 메인
      600: '#3a6034',
    },
    cap: {
      light: '#d4a878',
      mid:   '#a07050',
      dark:  '#7a5438',
    },
    blush: '#d4907a',
  },
  fontFamily: {
    sans: ['Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'sans-serif'],
    wordmark: ['Plus Jakarta Sans', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
  },
  fontSize: {
    display: ['32px', { lineHeight: '1.3', fontWeight: '900', letterSpacing: '-0.5px' }],
    h1:      ['24px', { lineHeight: '1.35', fontWeight: '800', letterSpacing: '-0.3px' }],
    h2:      ['20px', { lineHeight: '1.4', fontWeight: '700' }],
    h3:      ['16px', { lineHeight: '1.5', fontWeight: '700' }],
    body:    ['15px', { lineHeight: '1.6', fontWeight: '400' }],
    'body-sm': ['13px', { lineHeight: '1.6', fontWeight: '400' }],
    caption: ['11px', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0.5px' }],
    label:   ['10px', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '1px' }],
  },
  borderRadius: {
    sm:   '8px',
    md:   '12px',
    lg:   '16px',
    xl:   '20px',
    '2xl': '24px',
    full: '9999px',
  },
  boxShadow: {
    sm: '0 1px 2px rgba(45, 36, 24, 0.04)',
    md: '0 2px 8px rgba(45, 36, 24, 0.06)',
    lg: '0 4px 16px rgba(45, 36, 24, 0.08)',
    xl: '0 8px 32px rgba(45, 36, 24, 0.10)',
  },
} as const;

export default dotoriTheme;

/*
 * tailwind.config.ts에서 사용:
 *
 * import dotoriTheme from './dotori-theme';
 *
 * export default {
 *   theme: {
 *     extend: {
 *       colors: dotoriTheme.colors,
 *       fontFamily: dotoriTheme.fontFamily,
 *       fontSize: dotoriTheme.fontSize,
 *       borderRadius: dotoriTheme.borderRadius,
 *       boxShadow: dotoriTheme.boxShadow,
 *     },
 *   },
 * };
 *
 * 사용 예:
 *   <button className="bg-dotori-400 hover:bg-dotori-600 text-white rounded-full px-7 py-3.5 font-bold">
 *   <div className="bg-dotori-50 text-dotori-900 shadow-sm rounded-lg p-4">
 *   <span className="text-forest-500 bg-forest-50 rounded-full px-3 py-1 text-label">TO 발생</span>
 */
