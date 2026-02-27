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

// ── DS Token Contrast Validation ──

/** DS color hex values for validation */
const DS_COLORS = {
  'dotori-50': '#faf5ef',
  'dotori-100': '#f0e4d5',
  'dotori-300': '#d4b896',
  'dotori-400': '#c8956a',
  'dotori-500': '#b07a4a',
  'dotori-700': '#7a5232',
  'dotori-900': '#3d2919',
  'dotori-950': '#261a10',
  'forest-500': '#4a7a42',
  'forest-700': '#355d2f',
  'amber-400': '#d4a030',
  'amber-500': '#b8892a',
  white: '#ffffff',
  black: '#000000',
} as const

/** DS_TEXT token pairs to validate */
const DS_TEXT_PAIRS: Array<{ name: string; fg: string; bg: string; large?: boolean }> = [
  { name: 'primary/white', fg: DS_COLORS['dotori-900'], bg: DS_COLORS.white },
  { name: 'secondary/white', fg: DS_COLORS['dotori-700'], bg: DS_COLORS.white },
  { name: 'muted/white', fg: DS_COLORS['dotori-500'], bg: DS_COLORS.white },
  { name: 'primary-dark/950', fg: DS_COLORS['dotori-50'], bg: DS_COLORS['dotori-950'] },
  { name: 'secondary-dark/950', fg: DS_COLORS['dotori-300'], bg: DS_COLORS['dotori-950'] },
  { name: 'inverse/dotori-500', fg: DS_COLORS.white, bg: DS_COLORS['dotori-500'] },
  { name: 'forest/white', fg: DS_COLORS['forest-500'], bg: DS_COLORS.white, large: true },
]

/** Validate all DS_TEXT token combinations for WCAG AA compliance */
export function validateDsContrast(): Array<{
  name: string
  ratio: number
  passes: boolean
}> {
  return DS_TEXT_PAIRS.map(({ name, fg, bg, large }) => {
    const ratio = contrastRatio(fg, bg)
    return { name, ratio: Math.round(ratio * 100) / 100, passes: meetsWcagAA(fg, bg, large) }
  })
}

/** Auto-fix contrast by adjusting OKLCH lightness until WCAG AA met */
export function autoFixContrast(
  fg: string,
  bg: string,
  largeText = false,
): string {
  if (meetsWcagAA(fg, bg, largeText)) return fg
  const targetRatio = largeText ? 3 : 4.5
  const bgOklch = toOklch(bg)
  const fgOklch = toOklch(fg)
  if (!bgOklch || !fgOklch) return fg

  const isDarkBg = bgOklch.l < 0.5
  const step = isDarkBg ? 0.02 : -0.02
  let current = fgOklch.l

  for (let i = 0; i < 40; i++) {
    current += step
    if (current < 0 || current > 1) break
    const candidate = adjustLightness(fg, current)
    if (contrastRatio(candidate, bg) >= targetRatio) return candidate
  }
  return fg
}

/** Map a capacity ratio (0–1) to a semantic color: forest → amber → danger */
export function getCapacityColor(ratio: number): string {
  if (ratio <= 0.5) return DS_COLORS['forest-500']
  if (ratio <= 0.8) {
    return mixColors(DS_COLORS['forest-500'], DS_COLORS['amber-500'], (ratio - 0.5) / 0.3)
  }
  if (ratio <= 0.95) {
    return mixColors(DS_COLORS['amber-500'], '#dc2626', (ratio - 0.8) / 0.15)
  }
  return '#dc2626'
}
