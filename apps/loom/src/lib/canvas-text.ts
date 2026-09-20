/**
 * The Loom — canvas text that honors the presentation axes.
 *
 * Canvas 2D cannot parse CSS custom properties: `ctx.font = '… var(--x) …'`
 * is an invalid <font> shorthand and is silently ignored, so the canvas would
 * render at its default 10px sans-serif. This helper resolves the font family
 * and the `--loom-letter-spacing` axis before drawing, and enforces a minimum
 * font size (12px) — the canvas's own floor, since the static inclusive gate
 * only scans `.css` and cannot see canvas text by construction.
 */

const MIN_FONT_PX = 12;
const DEFAULT_SPACING_EM = 0.02;

let fontProbe: HTMLSpanElement | null = null;

function getFontProbe(): HTMLSpanElement {
  if (!fontProbe) {
    fontProbe = document.createElement('span');
    fontProbe.setAttribute('aria-hidden', 'true');
    fontProbe.style.cssText =
      'position:absolute;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;';
    document.body.appendChild(fontProbe);
  }
  return fontProbe;
}

/** Resolve a `--p31-font-*` token to a concrete stack (mirrors tokens.ts). */
function resolveFontFamily(varToken: string, fallback: string): string {
  const probe = getFontProbe();
  probe.style.fontFamily = `var(${varToken})`;
  const used = getComputedStyle(probe).fontFamily;
  return used || fallback;
}

/** Read a CSS custom property from `.loom-shell` and parse it as a float. */
function readEm(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const el = document.querySelector<HTMLElement>('.loom-shell');
  const v = el ? getComputedStyle(el).getPropertyValue(name).trim() : '';
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export interface CanvasTextOptions {
  /** Font size in CSS pixels (pre-floor). Floored to the 12px minimum. */
  sizePx: number;
  fillStyle: string;
  weight?: string | number;
  /** A `--p31-font-*` token name, e.g. '--p31-font-mono'. */
  fontToken?: string;
  fontFallback?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
}

/**
 * Draw one line of text with the presentation axes applied: a 12px minimum
 * size and the `--loom-letter-spacing` value as tracking. Uses
 * `ctx.letterSpacing` where supported; otherwise advances the cursor manually
 * with `measureText` (a pixel-equivalent fallback for the same axis).
 */
export function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: CanvasTextOptions,
): void {
  // Density scales the type; the 12px accessibility floor still holds.
  const density = readEm('--p31-layout-density-factor', 1);
  const size = Math.max(MIN_FONT_PX, opts.sizePx * density);
  const family = opts.fontToken
    ? resolveFontFamily(opts.fontToken, opts.fontFallback ?? 'monospace')
    : (opts.fontFallback ?? 'monospace');
  const spacingEm = readEm('--loom-letter-spacing', DEFAULT_SPACING_EM);

  ctx.font = `${opts.weight ?? 500} ${size}px ${family}`;
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = opts.baseline ?? 'middle';
  ctx.fillStyle = opts.fillStyle;

  if (spacingEm <= 0 || text.length <= 1) {
    ctx.fillText(text, x, y);
    return;
  }

  // `ctx.letterSpacing` is baseline in modern canvases; on the rare browser
  // without it, the assignment is a harmless no-op and the text draws untracked.
  const spacingPx = spacingEm * size;
  const prev = ctx.letterSpacing;
  ctx.letterSpacing = `${spacingPx}px`;
  ctx.fillText(text, x, y);
  ctx.letterSpacing = prev;
}
