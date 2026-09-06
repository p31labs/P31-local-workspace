/**
 * @file face — Deterministic identicon SVG seeded by a DID string.
 *
 * Ported from `packages/spaceship-earth/src/components/DIDAvatar.tsx`
 * (djb2 + LCG 5×5 symmetric grid). Extended to: (a) return an SVG *string*
 * so it can be persisted in the passport `face` field, and (b) allow an
 * optional molecular glow + single-accent treatment per P31 design tokens.
 *
 * Same DID always yields the same face. No canvas, no deps.
 */

export const FACE_PALETTE = [
  '#00FFFF', // cyan
  '#FF00FF', // magenta
  '#BF5FFF', // violet
  '#FFD700', // amber
  '#00FF88', // mint
  '#FF6B6B', // coral
  '#00ccff', // blue
  '#FF00CC', // pink
];

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function lcgNext(n: number): number {
  return (Math.imul(n, 1664525) + 1013904223) >>> 0;
}

/**
 * Build the deterministic identicon SVG string for a DID.
 * `glow` adds a soft neon glow filter (P31 molecular aesthetic).
 */
export function passportFace(did: string, opts?: { size?: number; glow?: boolean }): string {
  const size = opts?.size ?? 96;
  if (!did || did === 'UNINITIALIZED') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 5 5"><rect width="5" height="5" fill="#111"/><rect x="1" y="1" width="3" height="3" fill="none" stroke="#333" stroke-width="0.5" rx="0.2"/></svg>`;
  }

  const seed = djb2(did);
  const color = FACE_PALETTE[seed % FACE_PALETTE.length];
  const bg = '#000000';

  const cells: boolean[] = [];
  let rng = seed;
  for (let i = 0; i < 15; i++) {
    rng = lcgNext(rng);
    cells.push((rng & 0x01) === 1);
  }

  let rects = '';
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const srcCol = col <= 2 ? col : 4 - col;
      if (cells[row * 3 + srcCol]) {
        rects += `<rect x="${col}" y="${row}" width="1" height="1" fill="${color}"/>`;
      }
    }
  }

  const filter = opts?.glow
    ? `<filter id="g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.18" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    : '';
  const groupOpen = opts?.glow ? `<g filter="url(#g)">` : '';
  const groupClose = opts?.glow ? `</g>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 5 5" style="border-radius:50%;display:block;flex-shrink:0">${filter}<rect width="5" height="5" fill="${bg}"/>${groupOpen}${rects}${groupClose}</svg>`;
}

import type { CognitivePassport } from './schema';

/** Attach a freshly-derived deterministic face to a passport (idempotent). */
export function withFace(passport: CognitivePassport, opts?: { glow?: boolean }): CognitivePassport {
  return { ...passport, face: passportFace(passport.did, opts) };
}
