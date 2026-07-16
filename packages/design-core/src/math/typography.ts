/**
 * P31 typography — Perfect Fourth (1.333) modular scale.
 * Golden Ratio (1.618) reserved for hero/editorial contexts.
 *   size = BASE × RATIO^step
 */

import { BASE, RATIO, PHI } from './constants';
import { scale, round } from './scale';

const HERO_RATIO = PHI;
const UI_STEPS = [-3, -2, -1, 0, 1, 2, 3];
const HERO_STEPS = [4, 5, 6];

function fontSize(step: number): number {
  if (step >= 4) {
    const adjustedBase = round(scale(BASE, 3, RATIO), 1);
    return round(scale(adjustedBase, step - 3, HERO_RATIO), 1);
  }
  return round(scale(BASE, step, RATIO), 1);
}

export const FONT_SIZES = {
  caption: fontSize(-3),
  overline: fontSize(-2),
  label: fontSize(-1),
  body: fontSize(0),
  h4: fontSize(1),
  h3: fontSize(2),
  h2: fontSize(3),
  h1: fontSize(4),
  heroH2: fontSize(5),
  heroH1: fontSize(6),
} as const;

export const FONT_FAMILY = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
  mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;

export const TYPOGRAPHY = {
  fonts: FONT_FAMILY,
  sizes: FONT_SIZES,
  lineHeight: { tight: 1.1, snug: 1.2, normal: 1.3, relaxed: 1.5, loose: 1.6 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;
