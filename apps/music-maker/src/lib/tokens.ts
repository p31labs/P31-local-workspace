/**
 * The music maker — token resolver for Canvas 2D / WebGL.
 *
 * Copy of the Loom's apps/loom/src/lib/tokens.ts pattern, verbatim in
 * behavior (the same probe-element trick: getComputedStyle(probe).color reads
 * the USED color so Canvas/WebGL get a parseable string; the 1×1 canvas
 * rasterizes oklch into sRGB bytes for shader uniforms). This is the color
 * contract the build prompt's §5.3 demands: no hex/rgb/oklch literals in the
 * scene files — every color comes from a `--p31-*` token through here.
 */

import type { P31TokenName } from '@p31/canon/tokens';

const FALLBACKS: Partial<Record<P31TokenName, string>> = {
  '--p31-accent': 'rgb(0, 240, 255)',
  '--p31-accent-green': 'rgb(52, 211, 153)',
  '--p31-accent-gold': 'rgb(251, 191, 36)',
  '--p31-accent-red': 'rgb(251, 113, 133)',
  '--p31-text': 'rgb(226, 232, 240)',
  '--p31-text-tertiary': 'rgb(100, 116, 139)',
  '--p31-glass-border': 'rgba(255, 255, 255, 0.1)',
};

let probe: HTMLSpanElement | null = null;
let cache = new Map<string, string>();

function getProbe(): HTMLSpanElement {
  if (!probe) {
    probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:absolute;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;';
  }
  const parent = document.body;
  if (probe.parentElement !== parent) parent.appendChild(probe);
  return probe;
}

/** Resolve one token to a Canvas-usable color string. */
export function resolveToken(token: string): string {
  const hit = cache.get(token);
  if (hit !== undefined) return hit;

  const el = getProbe();
  el.style.color = `var(${token})`;
  const used = getComputedStyle(el).color;
  const value = !used || used === 'transparent' || used === 'rgba(0, 0, 0, 0)' || used.includes('var(')
    ? (FALLBACKS[token as P31TokenName] ?? 'rgb(226, 232, 240)')
    : used;
  cache.set(token, value);
  return value;
}

let scratch: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;
let rgbCache = new Map<string, [number, number, number]>();

/** Resolve one token to normalized sRGB floats [r, g, b] ∈ [0,1]. */
export function resolveTokenRgb(token: string): [number, number, number] {
  const hit = rgbCache.get(token);
  if (hit) return hit;

  if (!scratch) {
    scratch = document.createElement('canvas');
    scratch.width = 1;
    scratch.height = 1;
    scratchCtx = scratch.getContext('2d', { willReadFrequently: true });
  }
  const ctx = scratchCtx;
  if (!ctx) return [0.88, 0.91, 0.95];

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = resolveToken(token);
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  const rgb: [number, number, number] = [d[0] / 255, d[1] / 255, d[2] / 255];
  rgbCache.set(token, rgb);
  return rgb;
}