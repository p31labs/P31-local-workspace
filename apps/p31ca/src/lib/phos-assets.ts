/**
 * P31CA PHOS Asset Library — Shared Surface Design System
 *
 * Exports ready-to-inject SVG strings and a Node/Worker CLI logger.
 * All strings are pre-trimmed with no leading/trailing whitespace.
 *
 * Usage in Astro:
 *   import { PHOS_FAMILIAR_SVG } from '../lib/phos-assets';
 *   <Fragment set:html={PHOS_FAMILIAR_SVG} />
 *
 * Usage in Node/Worker CLI:
 *   import { printPhosGreeting } from '../lib/phos-assets';
 *   printPhosGreeting('1.2.0');
 *
 * Animation notes:
 *   - PHOS_FAMILIAR_SVG: `float` and `blink` keyframes defined inline in SVG <defs>.
 *   - PHOS_LOADER_HTML:  `phos-orbit` keyframe defined in the injected <style> block.
 *     Uses SVG `transform` attribute for initial ring offsets so CSS animation
 *     does not clobber them (SVG-layer transform composes with CSS-layer animation).
 *   - Name `phos-orbit` is intentionally distinct from `phos-spin` in p31-phos-ui.mjs.
 */

// ─── 1. THE QUANTUM FAMILIAR (MASCOT) ────────────────────────────────────────
/**
 * Pixel-art PHOS mascot. 10×7 QMU grid, crispEdges rendering.
 * Coral floating sensors, emerald data body, violet core, blinking eyes.
 * Self-contained: float + blink keyframes live inside the SVG <defs>.
 */
export const PHOS_FAMILIAR_SVG = `<svg viewBox="-2 -2 14 11" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-label="PHOS familiar" role="img">
  <defs>
    <filter id="glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      @keyframes phos-familiar-float {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-0.4px); }
      }
      @keyframes phos-familiar-blink {
        0%, 88%, 100% { opacity: 1; }
        92%           { opacity: 0; }
      }
    </style>
  </defs>
  <!-- Floating sensors -->
  <g fill="#f43f5e" filter="url(#glow-heavy)"
     style="animation: phos-familiar-float 5s ease-in-out 2.5s infinite;">
    <rect x="0" y="0" width="1" height="1"/>
    <rect x="9" y="0" width="1" height="1"/>
    <rect x="1" y="1" width="1" height="1"/>
    <rect x="8" y="1" width="1" height="1"/>
  </g>
  <!-- Data body -->
  <g fill="var(--p31-teal)" filter="url(#glow-heavy)">
    <rect x="3" y="1" width="4" height="1"/>
    <rect x="1" y="2" width="8" height="1"/>
    <rect x="0" y="3" width="10" height="2"/>
    <rect x="1" y="5" width="8" height="1"/>
    <rect x="2" y="6" width="6" height="1"/>
  </g>
  <!-- Violet core -->
  <rect x="4" y="5" width="2" height="1" fill="#8b5cf6"/>
  <!-- Blinking eyes -->
  <g style="animation: phos-familiar-blink 6s infinite; transform-origin: 5px 4.5px;">
    <rect x="2" y="4" width="2" height="1" fill="#050505"/>
    <rect x="6" y="4" width="2" height="1" fill="#050505"/>
  </g>
</svg>`;

// ─── 2. THE POSNER PRISM (APP ICON) ──────────────────────────────────────────
/**
 * Ca₉(PO₄)₆ Posner cluster rendered as a geometric icon — emergent hexagon
 * with internal K₄ diagonals. Emerald palette, glass blur glow.
 * Scales cleanly from 16px favicon to full-page hero.
 */
export const POSNER_PRISM_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Posner Prism — P31 identity mark" role="img">
  <defs>
    <filter id="prismGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <!-- Ambient fill -->
  <circle cx="50" cy="50" r="30" fill="var(--p31-teal)" opacity="0.1"/>
  <g filter="url(#prismGlow)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <!-- Outer hexagon -->
    <polygon
      points="50,10 85,30 85,70 50,90 15,70 15,30"
      fill="rgba(16,185,129,0.05)" stroke="var(--p31-teal)" opacity="0.7"/>
    <!-- Front face diagonal -->
    <polygon points="50,10 85,70 15,70" fill="none" stroke="var(--p31-teal)"/>
    <!-- Rear face diagonal -->
    <polygon points="50,90 85,30 15,30" fill="none" stroke="var(--p31-teal)" opacity="0.4"/>
    <!-- K₄ centroid spokes -->
    <line x1="50" y1="10" x2="50" y2="50" stroke="var(--p31-teal)" opacity="0.8"/>
    <line x1="15" y1="70" x2="50" y2="50" stroke="var(--p31-teal)" opacity="0.8"/>
    <line x1="85" y1="70" x2="50" y2="50" stroke="var(--p31-teal)" opacity="0.8"/>
  </g>
  <!-- Centroid: coral outer, white inner -->
  <circle cx="50" cy="50" r="5" fill="#f43f5e" filter="url(#prismGlow)"/>
  <circle cx="50" cy="50" r="2" fill="#ffffff"/>
</svg>`;

// ─── 3. QUANTUM FLUCTUATION LOADER ───────────────────────────────────────────
/**
 * Three-ring orbital loader in QMU palette (sky/violet/emerald).
 * Requires Tailwind classes on the wrapper div.
 * Each ring has its own duration; rings 2 + 3 are pre-rotated via SVG
 * `transform` attribute so CSS animation does not clobber the offset.
 * Keyframe name `phos-orbit` is distinct from the existing `phos-spin`
 * border-spinner defined in p31-phos-ui.mjs.
 */
export const PHOS_LOADER_HTML = `<div class="relative w-20 h-20" role="status" aria-label="Loading">
  <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full"
       xmlns="http://www.w3.org/2000/svg">
    <!-- Ring 1: sky, no initial rotation -->
    <ellipse cx="50" cy="50" rx="40" ry="12"
      fill="none" stroke="#0ea5e9" stroke-width="2" opacity="0.6"
      style="animation: phos-orbit 3s linear infinite; transform-origin: 50px 50px;"/>
    <!-- Ring 2: violet, 60° offset via SVG transform -->
    <g transform="rotate(60 50 50)">
      <ellipse cx="50" cy="50" rx="40" ry="12"
        fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.6"
        style="animation: phos-orbit 4s linear infinite reverse; transform-origin: 50px 50px;"/>
    </g>
    <!-- Ring 3: emerald, 120° offset via SVG transform -->
    <g transform="rotate(120 50 50)">
      <ellipse cx="50" cy="50" rx="40" ry="12"
        fill="none" stroke="var(--p31-teal)" stroke-width="2" opacity="0.6"
        style="animation: phos-orbit 5s linear infinite; transform-origin: 50px 50px;"/>
    </g>
    <!-- Core: coral outer, white inner -->
    <circle cx="50" cy="50" r="6" fill="#f43f5e"/>
    <circle cx="50" cy="50" r="2" fill="#fff"/>
  </svg>
  <style>
    @keyframes phos-orbit { 100% { transform: rotate(360deg); } }
  </style>
</div>`;

// ─── 4. CLI LOGGER & AVATAR ───────────────────────────────────────────────────
/**
 * Prints the PHOS Agent welcome sequence to stdout.
 * Works in Node.js and Cloudflare Workers (where console.log is available).
 * ANSI escape codes render in most terminals; degrade gracefully where not.
 */
export function printPhosGreeting(version: string): void {
  const c = '\x1b[38;2;244;63;94m';   // coral  (#f43f5e)
  const e = '\x1b[38;2;16;185;129m';  // emerald (var(--p31-teal))
  const p = '\x1b[38;2;139;92;246m';  // violet  (#8b5cf6)
  const d = '\x1b[38;2;6;78;59m';     // dim emerald
  const r = '\x1b[0m';                // reset

  const avatar = [
    `        ${e}⬡${r}`,
    `      ${d}/${r}   ${d}\\${r}`,
    `    ${c}✧${r} ${d}-${r} ${p}◈${r} ${d}-${r} ${c}✧${r}`,
    `      ${d}\\${r}   ${d}/${r}`,
    `        ${e}⬡${r}`,
  ].join('\n');

  console.log(avatar);
  console.log(`\x1b[1mPHOS Familiar\x1b[0m \x1b[90mv${version}\x1b[0m`);
}

// ─── Re-exports for convenience ───────────────────────────────────────────────
export type PhosAssetKey = 'familiar' | 'prism' | 'loader';

/** Returns the requested SVG/HTML string by semantic key. */
export function getPhosAsset(key: PhosAssetKey): string {
  const assets: Record<PhosAssetKey, string> = {
    familiar: PHOS_FAMILIAR_SVG,
    prism:    POSNER_PRISM_SVG,
    loader:   PHOS_LOADER_HTML,
  };
  return assets[key];
}
