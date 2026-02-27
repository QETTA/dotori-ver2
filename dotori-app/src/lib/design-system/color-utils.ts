/**
 * Design System — Color Utilities (culori-based)
 *
 * WCAG contrast checking, OKLCH color manipulation, scale generation.
 * Used by design QA scripts and DS token validation.
 */

import {
  type Color,
  converter,
  formatHex,
  parse,
  wcagContrast,
} from 'culori'

const toOklchConverter = converter('oklch')
const toRgbConverter = converter('rgb')

// ── Contrast & Accessibility ──

/** Calculate WCAG 2.1 contrast ratio between two colors (1:1 to 21:1) */
export function contrastRatio(fg: string, bg: string): number {
  const fgColor = parse(fg)
  const bgColor = parse(bg)
  if (!fgColor || !bgColor) return 1
  return wcagContrast(fgColor, bgColor)
}

/** Check WCAG AA (4.5:1 normal text, 3:1 large text) */
export function meetsWcagAA(
  fg: string,
  bg: string,
  largeText = false,
): boolean {
  const ratio = contrastRatio(fg, bg)
  return largeText ? ratio >= 3 : ratio >= 4.5
}

/** Check WCAG AAA (7:1 normal text, 4.5:1 large text) */
export function meetsWcagAAA(
  fg: string,
  bg: string,
  largeText = false,
): boolean {
  const ratio = contrastRatio(fg, bg)
  return largeText ? ratio >= 4.5 : ratio >= 7
}

// ── OKLCH Manipulation ──

/** Convert any CSS color to OKLCH object */
export function toOklch(color: string) {
  const parsed = parse(color)
  if (!parsed) return null
  return toOklchConverter(parsed)
}

/** Adjust lightness (0–1 range) */
export function adjustLightness(color: string, lightness: number): string {
  const oklch = toOklch(color)
  if (!oklch) return color
  oklch.l = Math.max(0, Math.min(1, lightness))
  return formatHex(toRgbConverter(oklch)) ?? color
}

/** Adjust chroma (0–0.4 typical range) */
export function adjustChroma(color: string, chroma: number): string {
  const oklch = toOklch(color)
  if (!oklch) return color
  oklch.c = Math.max(0, chroma)
  return formatHex(toRgbConverter(oklch)) ?? color
}

/** Adjust hue (0–360) */
export function adjustHue(color: string, hue: number): string {
  const oklch = toOklch(color)
  if (!oklch) return color
  oklch.h = ((hue % 360) + 360) % 360
  return formatHex(toRgbConverter(oklch)) ?? color
}

/** Mix two colors in OKLCH space (ratio 0–1, 0 = first, 1 = second) */
export function mixColors(
  color1: string,
  color2: string,
  ratio = 0.5,
): string {
  const a = toOklch(color1)
  const b = toOklch(color2)
  if (!a || !b) return color1
  const t = Math.max(0, Math.min(1, ratio))
  const mixed: Color = {
    mode: 'oklch',
    l: a.l * (1 - t) + b.l * t,
    c: a.c * (1 - t) + b.c * t,
    h:
      a.h !== undefined && b.h !== undefined
        ? a.h * (1 - t) + b.h * t
        : a.h ?? b.h,
  }
  return formatHex(toRgbConverter(mixed)) ?? color1
}

/** Generate a color scale (array of hex strings) from a base color */
export function generateScale(
  baseColor: string,
  steps = 10,
): string[] {
  const oklch = toOklch(baseColor)
  if (!oklch) return Array(steps).fill(baseColor)
  return Array.from({ length: steps }, (_, i) => {
    const lightness = 0.97 - (i / (steps - 1)) * 0.85
    const chroma = oklch.c * (0.3 + (Math.sin((i / (steps - 1)) * Math.PI) * 0.7))
    const adjusted: Color = {
      mode: 'oklch',
      l: lightness,
      c: chroma,
      h: oklch.h,
    }
    return formatHex(toRgbConverter(adjusted)) ?? baseColor
  })
}

/** Check if a color is within the P3 gamut (wider than sRGB) */
export function isP3Gamut(color: string): boolean {
  const parsed = parse(color)
  if (!parsed) return false
  const rgb = toRgbConverter(parsed)
  if (!rgb) return false
  const { r = 0, g = 0, b = 0 } = rgb
  return r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1
}
