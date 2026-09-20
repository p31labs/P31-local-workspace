/**
 * The Loom — token resolver for Canvas 2D.
 *
 * Canvas 2D cannot parse CSS custom properties: `ctx.fillStyle = 'var(--x)'`
 * silently falls back to black. The fix is to resolve the token against a
 * painted element and read back the *used* color:
 *
 *   - `getComputedStyle(root).getPropertyValue('--x')` returns the SPECIFIED
 *     recipe (`oklch(65% 0.18 195)`, `light-dark(...)`), which is not a color.
 *   - `getComputedStyle(probe).color` — where `probe` is a real element with
 *     `color: var(--x)` — returns the USED color, which Canvas accepts.
 *
 * Resolved colors are cached and invalidated when the active theme changes
 * (a MutationObserver on `documentElement[data-theme]`) or when a presentation
 * axis flips (a MutationObserver on `.loom-shell[data-saturation|data-density]`),
 * so a theme switch re-reads the tokens instead of re-rendering stale ones.
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
  // Parent the probe inside .loom-shell so it inherits the shell's scoped
  // custom-property overrides — [data-saturation='muted'] re-roots --p31-accent,
  // [data-density] re-roots the spacing/factor tokens. Fall back to body before
  // the shell mounts; the next resolve re-parents once it does.
  const parent = document.querySelector<HTMLElement>('.loom-shell') ?? document.body;
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
  // `transparent`/`rgba(0, 0, 0, 0)` mean the token did not resolve — the
  // theme's value is absent. A literal `var(--…)` string means the environment
  // (e.g. jsdom) does not substitute custom properties in `.color`. Either way,
  // fall back to the rgb literal.
  const value = !used || used === 'transparent' || used === 'rgba(0, 0, 0, 0)' || used.includes('var(')
    ? (FALLBACKS[token as P31TokenName] ?? 'rgb(226, 232, 240)')
    : used;
  cache.set(token, value);
  return value;
}

/** Invalidate the cache when the theme attribute OR a presentation axis flips.
 *  Idempotent. */
export function watchTheme(cb?: () => void): () => void {
  const observer = new MutationObserver(() => {
    cache = new Map();
    rgbCache = new Map();
    cb?.();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const shell = document.querySelector<HTMLElement>('.loom-shell');
  if (shell) {
    observer.observe(shell, {
      attributes: true,
      attributeFilter: ['data-saturation', 'data-density', 'data-literal-labels', 'data-motion'],
    });
  }
  return () => observer.disconnect();
}

// ── RGB floats for WebGL uniforms ───────────────────────────────────────
// Shaders take colors as `vec3` uniforms, not strings. Resolve the token to
// its used color and rasterize it into a 1×1 canvas — Canvas 2D parses the
// color (including oklch) and `getImageData` returns the sRGB bytes. This is
// the same token path as Canvas 2D, so the WebGL layer inherits the theme.

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
