/**
 * 색상 정밀 유틸리티 — culori 기반
 *
 * WCAG 명도대비, OKLCH 조작, P3 gamut 감지, 색상 스케일 생성.
 * 디자인 전문가의 초 미세 작업을 위한 프로그래매틱 색상 도구.
 */
import {
  converter,
  formatHex,
  interpolate,
  wcagContrast,
  type Color,
} from 'culori'

/* ─── 컨버터 ─── */
const toOklchConverter = converter('oklch')
const toP3Converter = converter('p3')
const toRgbConverter = converter('rgb')

/* ─── 브랜드 팔레트 (globals.css @theme 동기) ─── */
export const brandPalette = {
  dotori: {
    50: '#faf7f2',
    100: '#f5ede0',
    200: '#e8d5be',
    300: '#d4b48e',
    400: '#c8956a',
    500: '#b07a4a',
    600: '#96633a',
    700: '#7a4e30',
    800: '#5a3a24',
    900: '#2d2418',
    950: '#1a1510',
  },
  forest: {
    50: '#e8f5e4',
    100: '#c8e4c0',
    200: '#a0d098',
    300: '#78bc70',
    400: '#6a9a60',
    500: '#4a7a42',
    600: '#3a6034',
    700: '#2e4c2a',
    800: '#223820',
    900: '#162416',
  },
} as const

/* ─── WCAG 명도대비 ─── */

/** WCAG 2.1 명도대비 비율 (1~21) */
export function contrastRatio(fg: string, bg: string): number {
  return wcagContrast(fg, bg)
}

/** WCAG AA 기준 통과 여부 (일반 4.5:1, 대형 텍스트 3:1) */
export function meetsWcagAA(
  fg: string,
  bg: string,
  largeText = false,
): boolean {
  const ratio = contrastRatio(fg, bg)
  return largeText ? ratio >= 3 : ratio >= 4.5
}

/** WCAG AAA 기준 통과 여부 (일반 7:1, 대형 텍스트 4.5:1) */
export function meetsWcagAAA(
  fg: string,
  bg: string,
  largeText = false,
): boolean {
  const ratio = contrastRatio(fg, bg)
  return largeText ? ratio >= 4.5 : ratio >= 7
}

/* ─── OKLCH 변환 & 조작 ─── */

/** HEX → OKLCH 변환 */
export function toOklch(hex: string) {
  const oklch = toOklchConverter(hex)
  if (!oklch) return null
  return { l: oklch.l, c: oklch.c, h: oklch.h ?? 0 }
}

/** 명도(Lightness) 미세 조정 — delta: -1.0 ~ +1.0 */
export function adjustLightness(color: string, delta: number): string {
  const oklch = toOklchConverter(color)
  if (!oklch) return color
  oklch.l = Math.max(0, Math.min(1, oklch.l + delta))
  return formatHex(oklch) ?? color
}

/** 채도(Chroma) 미세 조정 — delta: -0.4 ~ +0.4 */
export function adjustChroma(color: string, delta: number): string {
  const oklch = toOklchConverter(color)
  if (!oklch) return color
  oklch.c = Math.max(0, Math.min(0.4, oklch.c + delta))
  return formatHex(oklch) ?? color
}

/** 색상(Hue) 미세 조정 — delta: 도 단위 */
export function adjustHue(color: string, delta: number): string {
  const oklch = toOklchConverter(color)
  if (!oklch) return color
  oklch.h = ((oklch.h ?? 0) + delta) % 360
  if (oklch.h < 0) oklch.h += 360
  return formatHex(oklch) ?? color
}

/* ─── 색상 보간 & 믹싱 ─── */

/** OKLCH 공간에서 두 색상 보간 (ratio: 0.0 ~ 1.0) */
export function mixColors(
  colorA: string,
  colorB: string,
  ratio = 0.5,
): string {
  const interp = interpolate([colorA, colorB], 'oklch')
  const result = interp(ratio)
  return formatHex(result) ?? colorA
}

/* ─── 스케일 생성 ─── */

/** 기준색에서 50~950 스케일 자동 생성 (11단계) */
export function generateScale(
  baseHex: string,
  steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
): Record<number, string> {
  const oklch = toOklchConverter(baseHex)
  if (!oklch) return {}

  const baseL = oklch.l
  const baseC = oklch.c
  const baseH = oklch.h ?? 0

  const scale: Record<number, string> = {}

  for (const step of steps) {
    // 400~500 = 기준, 50 = 매우 밝음, 950 = 매우 어두움
    const t = (step - 500) / 500 // -0.9 ~ +0.9
    const l = Math.max(0, Math.min(1, baseL - t * 0.45))
    const c = Math.max(0, baseC * (1 - Math.abs(t) * 0.3))

    const result: Color = { mode: 'oklch', l, c, h: baseH }
    scale[step] = formatHex(result) ?? baseHex
  }

  return scale
}

/* ─── P3 gamut ─── */

/** P3 색역 범위 내 색상인지 확인 */
export function isP3Gamut(color: string): boolean {
  const p3 = toP3Converter(color)
  if (!p3) return false
  return p3.r >= 0 && p3.r <= 1 && p3.g >= 0 && p3.g <= 1 && p3.b >= 0 && p3.b <= 1
}

/** sRGB 색역 범위 내 색상인지 확인 */
export function isSRGBGamut(color: string): boolean {
  const rgb = toRgbConverter(color)
  if (!rgb) return false
  return rgb.r >= 0 && rgb.r <= 1 && rgb.g >= 0 && rgb.g <= 1 && rgb.b >= 0 && rgb.b <= 1
}

/* ─── HEX 변환 유틸리티 ─── */

/** 임의 culori 색상 → HEX 문자열 */
export function toHex(color: string): string {
  return formatHex(color) ?? color
}
