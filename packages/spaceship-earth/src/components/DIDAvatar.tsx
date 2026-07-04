/**
 * @file DIDAvatar — Deterministic identicon SVG from a DID string.
 *
 * Algorithm:
 *   1. djb2-hash the DID string to a 32-bit int (seed).
 *   2. LCG sequence from seed → 15 bitmask bits for a 5×5 symmetric grid
 *      (left 3 columns generated; columns 3,4 mirror columns 1,0).
 *   3. Foreground color picked from P31 neon palette using hash.
 *
 * Output: inline SVG (no canvas, no deps). Renders at any size via viewBox.
 */

const PALETTE = [
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
  return h >>> 0; // unsigned 32-bit
}

/** LCG: next(n) = (n * 1664525 + 1013904223) mod 2^32 */
function lcgNext(n: number): number {
  return (Math.imul(n, 1664525) + 1013904223) >>> 0;
}

interface DIDavatarProps {
  did: string;
  size?: number;
}

export function DIDAvatar({ did, size = 48 }: DIDavatarProps) {
  if (!did || did === 'UNINITIALIZED') {
    // Placeholder ring
    return (
      <svg width={size} height={size} viewBox="0 0 5 5" aria-hidden="true">
        <rect width="5" height="5" fill="#111" />
        <rect x="1" y="1" width="3" height="3" fill="none" stroke="#333" strokeWidth="0.5" rx="0.2" />
      </svg>
    );
  }

  const seed = djb2(did);
  const color = PALETTE[seed % PALETTE.length];
  const bg = '#000000';

  // Generate 15 bits (3 cols × 5 rows), then mirror to 5 cols
  const cells: boolean[] = [];
  let rng = seed;
  for (let i = 0; i < 15; i++) {
    rng = lcgNext(rng);
    cells.push((rng & 0x01) === 1);
  }

  // Build 5×5 grid: col 0,1,2 from cells; col 3 mirrors col 1; col 4 mirrors col 0
  const rects: JSX.Element[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const srcCol = col <= 2 ? col : 4 - col;
      const on = cells[row * 3 + srcCol];
      if (on) {
        rects.push(
          <rect key={`${row}-${col}`} x={col} y={row} width="1" height="1" fill={color} />,
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 5 5"
      aria-label="DID avatar"
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}
    >
      <rect width="5" height="5" fill={bg} />
      {rects}
    </svg>
  );
}
