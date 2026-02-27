/**
 * Design System — Auto-Animate Presets
 *
 * Pre-configured animation presets for @formkit/auto-animate.
 * Usage: useAutoAnimate(autoAnimatePresets.list)
 */

import type { AutoAnimateOptions } from '@formkit/auto-animate'

/** Standard list animations (add/remove/reorder) */
const list: Partial<AutoAnimateOptions> = {
  duration: 250,
  easing: 'ease-out',
}

/** Grid layout animations (cards, tiles) */
const grid: Partial<AutoAnimateOptions> = {
  duration: 300,
  easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
}

/** Fast interactions (dropdowns, toggles) */
const fast: Partial<AutoAnimateOptions> = {
  duration: 150,
  easing: 'ease-out',
}

/** Gentle animations (modals, overlays) */
const gentle: Partial<AutoAnimateOptions> = {
  duration: 400,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
}

export const autoAnimatePresets = {
  list,
  grid,
  fast,
  gentle,
} as const
